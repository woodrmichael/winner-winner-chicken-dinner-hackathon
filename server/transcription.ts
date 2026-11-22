import { randomBytes } from 'node:crypto';
import type { Server } from 'node:http';
import WebSocket, { WebSocketServer } from 'ws';
import { WorkspaceError } from '../src/shared/referralAccess';

const path = '/transcription';
const sampleRate = 24000;
const maxSeconds = 60;
const maxBytes = sampleRate * 2 * maxSeconds;
const connectingMessage = 'Live transcription could not connect. Try again or type your request.';

export function createTranscriptionService(
  connect = process.env.OPENAI_API_KEY?.trim()
    ? () => new WebSocket('wss://api.openai.com/v1/realtime?intent=transcription', {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY?.trim()}` },
      })
    : null,
) {
  const tickets = new Map<string, { accountId: string; expires: number; authorized: () => boolean }>();
  const attempts = new Map<string, { count: number; expires: number }>();
  const active = new Set<string>();

  function issue(accountId: string, authorized: () => boolean) {
    if (!connect) throw new WorkspaceError(503, 'Live transcription is unavailable.');
    const now = Date.now();
    for (const [id, ticket] of tickets) if (ticket.expires <= now) tickets.delete(id);
    const attempt = attempts.get(accountId);
    if (active.has(accountId) || (attempt && attempt.expires > now && attempt.count >= 5)) {
      throw new WorkspaceError(429, 'Wait a moment before starting another recording.');
    }
    attempts.set(accountId, attempt && attempt.expires > now
      ? { ...attempt, count: attempt.count + 1 }
      : { count: 1, expires: now + 60_000 });
    const protocol = 'voice.' + randomBytes(24).toString('hex');
    tickets.set(protocol, { accountId, expires: now + 60_000, authorized });
    return { protocol };
  }

  function attach(server: Server) {
    if (!connect) return;
    const relay = new WebSocketServer({ noServer: true, maxPayload: 65_536 });
    server.on('upgrade', (request, socket, head) => {
      const protocol = request.headers['sec-websocket-protocol'];
      const ticket = protocol ? tickets.get(protocol) : undefined;
      if (request.url !== path || !protocol || !ticket || ticket.expires <= Date.now() ||
        !ticket.authorized() || active.has(ticket.accountId)) {
        socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
        return;
      }
      tickets.delete(protocol);
      relay.handleUpgrade(request, socket, head, (client) => {
        active.add(ticket.accountId);
        client.once('close', () => active.delete(ticket.accountId));
        try {
          relayAudio(client, connect(), ticket.authorized);
        } catch {
          client.close(1011, connectingMessage);
        }
      });
    });
  }

  return { issue, attach };
}

function relayAudio(client: WebSocket, upstream: WebSocket, authorized: () => boolean) {
  let phase: 'starting' | 'recording' | 'finishing' | 'closed' = 'starting';
  let bytes = 0;
  let timer: ReturnType<typeof setTimeout>;
  const send = (payload: object) => {
    if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(payload));
  };
  const forward = (payload: object) => upstream.send(JSON.stringify(payload));

  function finish(message?: string) {
    if (phase === 'closed') return;
    phase = 'closed';
    clearTimeout(timer);
    if (message) send({ type: 'error', message });
    client.close();
    if (upstream.readyState !== WebSocket.CLOSED) upstream.close();
  }

  function commit() {
    if (phase !== 'recording') return;
    if (bytes < sampleRate / 5) {
      send({ type: 'complete', transcript: '' });
      finish();
      return;
    }
    phase = 'finishing';
    clearTimeout(timer);
    send({ type: 'finishing' });
    forward({ type: 'input_audio_buffer.commit' });
    timer = setTimeout(() => finish('The final transcript took too long. Review the text already received.'), 10_000);
  }

  timer = setTimeout(() => finish(connectingMessage), 10_000);
  upstream.on('open', () => forward({
    type: 'session.update',
    session: {
      type: 'transcription',
      audio: { input: {
        format: { type: 'audio/pcm', rate: sampleRate },
        transcription: { model: 'gpt-live-transcribe' },
        turn_detection: null,
      } },
    },
  }));
  upstream.on('message', (raw) => {
    try {
      const event = JSON.parse(raw.toString());
      if (event.type === 'session.updated' && phase === 'starting') {
        phase = 'recording';
        clearTimeout(timer);
        timer = setTimeout(commit, maxSeconds * 1000);
        send({ type: 'ready' });
      } else if (event.type === 'conversation.item.input_audio_transcription.delta' && typeof event.delta === 'string') {
        send({ type: 'delta', text: event.delta });
      } else if (event.type === 'conversation.item.input_audio_transcription.completed' && typeof event.transcript === 'string') {
        send({ type: 'complete', transcript: event.transcript });
        finish();
      } else if (event.type === 'error' || event.type === 'conversation.item.input_audio_transcription.failed') {
        finish(connectingMessage);
      }
    } catch {
      finish(connectingMessage);
    }
  });
  client.on('message', (raw, binary) => {
    if (!authorized()) {
      finish('Your session expired. Sign in again to record.');
      return;
    }
    if (phase !== 'recording') return;
    if (!binary) {
      if (raw.toString() === 'stop') commit();
      return;
    }
    const audio = Array.isArray(raw) ? Buffer.concat(raw) : Buffer.from(raw as ArrayBuffer);
    if (!audio.length || audio.length % 2) return;
    if (bytes + audio.length > maxBytes) {
      commit();
      return;
    }
    if (upstream.readyState !== WebSocket.OPEN || upstream.bufferedAmount > 384_000) {
      finish('The transcription connection could not keep up. Review the text already received.');
      return;
    }
    bytes += audio.length;
    forward({ type: 'input_audio_buffer.append', audio: audio.toString('base64') });
  });
  upstream.on('error', () => finish(connectingMessage));
  upstream.on('close', () => finish(connectingMessage));
  client.on('error', () => finish());
  client.on('close', () => finish());
}
