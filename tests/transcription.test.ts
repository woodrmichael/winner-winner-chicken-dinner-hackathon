import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import WebSocket, { WebSocketServer } from 'ws';
import { createApi, withPassword } from '../server/api';
import { createTranscriptionService } from '../server/transcription';
import { createWorkspace, demoAccounts } from '../src/shared/workspaceModel';

test('voice sessions require a resident and relay partial and final transcripts', async (t) => {
  const source = new WebSocketServer({ host: '127.0.0.1', port: 0 });
  t.after(() => {
    for (const client of source.clients) client.terminate();
    source.close();
  });
  await once(source, 'listening');
  source.on('connection', (socket) => {
    socket.on('message', (raw) => {
      const event = JSON.parse(raw.toString());
      if (event.type === 'session.update') {
        assert.equal(event.session.audio.input.transcription.model, 'gpt-live-transcribe');
        assert.equal(event.session.audio.input.format.rate, 24000);
        socket.send(JSON.stringify({ type: 'session.updated' }));
      } else if (event.type === 'input_audio_buffer.append') {
        assert.equal(Buffer.from(event.audio, 'base64').length, 4800);
        socket.send(JSON.stringify({ type: 'conversation.item.input_audio_transcription.delta', delta: 'I need coats' }));
      } else if (event.type === 'input_audio_buffer.commit') {
        socket.send(JSON.stringify({ type: 'conversation.item.input_audio_transcription.completed', transcript: 'I need coats.' }));
      }
    });
  });

  const accounts = demoAccounts.filter(({ id }) => id === 'alex' || id === 'organizer')
    .map((account) => withPassword(account, 'test-password'));
  const relay = createTranscriptionService(() => new WebSocket('ws://127.0.0.1:' + (source.address() as AddressInfo).port));
  const api = createApi(createWorkspace(accounts), () => {}, relay).listen(0, '127.0.0.1');
  t.after(() => { api.close(); });
  await once(api, 'listening');
  const url = 'http://127.0.0.1:' + (api.address() as AddressInfo).port;
  async function signIn(username: string) {
    const response = await fetch(url + '/session', {
      method: 'POST',
      body: JSON.stringify({ username, password: 'test-password' }),
    });
    assert.equal(response.status, 200);
    return (await response.json() as { token: string }).token;
  }
  function ticket(token?: string) {
    return fetch(url + '/transcription/session', {
      method: 'POST',
      headers: token ? { Authorization: 'Bearer ' + token } : {},
    });
  }

  assert.equal((await ticket()).status, 401);
  assert.equal((await ticket(await signIn('organizer'))).status, 403);
  const result = await ticket(await signIn('alex'));
  assert.equal(result.status, 200);
  const { protocol } = await result.json() as { protocol: string };
  const socket = new WebSocket(url.replace('http:', 'ws:') + '/transcription', protocol);
  t.after(() => socket.terminate());
  const messages: object[] = [];
  await new Promise<void>((resolve, reject) => {
    socket.on('error', reject);
    socket.on('close', (code) => code === 1000 || messages.some((e) => 'transcript' in e)
      ? resolve() : reject(new Error('Voice socket closed before completion.')));
    socket.on('message', (raw) => {
      const event = JSON.parse(raw.toString());
      messages.push(event);
      if (event.type === 'ready') socket.send(Buffer.alloc(4800));
      if (event.type === 'delta') socket.send('stop');
    });
  });
  assert.deepEqual(messages, [
    { type: 'ready' }, { type: 'delta', text: 'I need coats' },
    { type: 'finishing' }, { type: 'complete', transcript: 'I need coats.' },
  ]);
  const reused = new WebSocket(url.replace('http:', 'ws:') + '/transcription', protocol);
  await new Promise<void>((resolve, reject) => {
    reused.on('open', () => { reused.close(); reject(new Error('A transcription ticket was reused.')); });
    reused.on('error', (error: Error) => {
      if (error.message.includes('403')) resolve();
      else reject(error);
    });
  });
});

test('voice session is unavailable when no provider is configured', () => {
  const service = createTranscriptionService(null);
  assert.throws(() => service.issue('alex', () => true), /Live transcription is unavailable/);
});
