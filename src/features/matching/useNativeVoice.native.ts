import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { requestRecordingPermissionsAsync, useAudioStream } from 'expo-audio';
import { useDemo } from '../../state/Demo';
import type { NativeVoice, VoiceCaptureOptions, VoicePhase } from './voiceCapture';

type Capture = {
  socket?: WebSocket;
  phase: VoicePhase;
  original: string;
  transcript: string;
  timer?: ReturnType<typeof setTimeout>;
};

function mono24k(data: ArrayBuffer, sampleRate: number, channels: number) {
  if (sampleRate === 24000 && channels === 1) return data;
  const input = new Int16Array(data);
  const frames = Math.floor(input.length / channels);
  const output = new Int16Array(Math.floor(frames * 24000 / sampleRate));
  const mix = (frame: number) => {
    let sum = 0;
    for (let channel = 0; channel < channels; channel++) sum += input[frame * channels + channel];
    return sum / channels;
  };
  for (let i = 0; i < output.length; i++) {
    const position = i * sampleRate / 24000;
    const frame = Math.floor(position);
    const weight = position - frame;
    output[i] = mix(frame) * (1 - weight) + mix(Math.min(frame + 1, frames - 1)) * weight;
  }
  return output.buffer;
}

export function useNativeVoice({ value, update, setListening, setFeedback }: VoiceCaptureOptions): NativeVoice {
  const { shared } = useDemo();
  const [phase, setPhase] = useState<VoicePhase>();
  const current = useRef<Capture | null>(null);
  const { stream } = useAudioStream({
    sampleRate: 24000,
    channels: 1,
    encoding: 'int16',
    onBuffer: ({ data, sampleRate, channels }) => {
      const capture = current.current;
      if (capture?.phase === 'recording' && capture.socket?.readyState === WebSocket.OPEN) {
        capture.socket.send(mono24k(data, sampleRate, channels));
      }
    },
  });

  function finish(capture: Capture, message?: string) {
    if (current.current !== capture) return;
    current.current = null;
    clearTimeout(capture.timer);
    if (stream.isStreaming) stream.stop();
    capture.socket?.close();
    setPhase(undefined);
    setListening(false);
    if (message) setFeedback(message);
  }

  useEffect(() => {
    const background = AppState.addEventListener('change', (status) => {
      if (status === 'background' && current.current) finish(current.current);
    });
    return () => {
      background.remove();
      const capture = current.current;
      if (!capture) return;
      current.current = null;
      clearTimeout(capture.timer);
      capture.socket?.close();
      if (stream.isStreaming) stream.stop();
    };
    // The audio stream and React state setters stay stable during a request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  async function start(capture: Capture) {
    const socket = await shared.openTranscription();
    if (current.current !== capture) {
      socket.close();
      return;
    }
    capture.socket = socket;
    capture.timer = setTimeout(() => finish(capture, 'Live transcription took too long to connect.'), 13_000);
    socket.onerror = () => finish(capture, 'The transcription connection failed.');
    socket.onclose = () => finish(capture, 'The transcription connection ended. Review the text already received.');
    socket.onmessage = ({ data }) => {
      if (current.current !== capture) return;
      try {
        const event = JSON.parse(String(data));
        if (event.type === 'ready' && capture.phase === 'connecting') {
          clearTimeout(capture.timer);
          void record(capture).catch(() => finish(capture, 'Could not start the microphone.'));
        } else if (event.type === 'finishing') {
          capture.phase = 'finishing';
          setPhase('finishing');
          if (stream.isStreaming) stream.stop();
        } else if (event.type === 'delta' && typeof event.text === 'string') {
          capture.transcript += event.text;
          update([capture.original, capture.transcript.trim()].filter(Boolean).join(' '));
        } else if (event.type === 'complete' && typeof event.transcript === 'string') {
          update([capture.original, event.transcript.trim()].filter(Boolean).join(' '));
          finish(capture);
        } else if (event.type === 'error' && typeof event.message === 'string') {
          finish(capture, event.message);
        }
      } catch {
        finish(capture, 'The transcription connection returned an invalid response.');
      }
    };
  }

  async function record(capture: Capture) {
    const permission = await requestRecordingPermissionsAsync();
    if (current.current !== capture) return;
    if (!permission.granted) {
      finish(capture, 'Allow microphone access in your phone settings to record.');
      return;
    }
    await stream.start();
    if (current.current !== capture) {
      if (stream.isStreaming) stream.stop();
      return;
    }
    capture.phase = 'recording';
    setPhase('recording');
  }

  function toggle() {
    const capture = current.current;
    if (capture) {
      if (capture.phase === 'recording' && capture.socket?.readyState === WebSocket.OPEN) {
        capture.phase = 'finishing';
        setPhase('finishing');
        if (stream.isStreaming) stream.stop();
        capture.socket.send('stop');
        capture.timer = setTimeout(() => finish(capture, 'Review the text already received.'), 12_000);
      } else if (capture.phase === 'connecting') {
        finish(capture);
      }
      return;
    }
    const next: Capture = { phase: 'connecting', original: value.trimEnd(), transcript: '' };
    current.current = next;
    setFeedback('');
    setPhase('connecting');
    setListening(true);
    void start(next).catch((error: unknown) => finish(next,
      error instanceof Error ? error.message : 'Live transcription could not start.'));
  }

  return { phase, toggle };
}
