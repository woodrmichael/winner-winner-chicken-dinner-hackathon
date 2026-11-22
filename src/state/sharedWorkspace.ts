import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type {
  CommunityCommand,
  DirectoryCommand,
  ReferralCommand,
  WorkspaceCommand,
} from '../domain/types';
import { withResponse, workspaceApiUrl } from '../shared/http';
import type { SharedSnapshot } from '../shared/workspace';

class ApiError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<{ data: T; etag: string | null } | null> {
  try {
    return await withResponse(workspaceApiUrl + path, {
      ...options,
      headers: {
        ...options.headers,
        ...(options.body && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    }, 8000, async (response) => {
      if (response.status === 304) return null;
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new ApiError(response.status, body.error ?? 'The workspace is unavailable.');
      }
      return { data: await response.json() as T, etag: response.headers.get('ETag') };
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error('Can’t reach the shared workspace. Check that the server is running.');
  }
}

export function useSharedWorkspace() {
  const [data, setData] = useState<SharedSnapshot>();
  const [connectionError, setConnectionError] = useState('');
  const token = useRef<string | undefined>(undefined);
  const revision = useRef(-1);
  const cacheTag = useRef<string | null>(null);

  function receive(session: string, workspace: SharedSnapshot, etag: string | null) {
    if (token.current !== session || workspace.revision < revision.current) return;
    revision.current = workspace.revision;
    cacheTag.current = etag;
    setData(workspace);
    setConnectionError('');
  }

  function handleError(error: unknown, session: string) {
    if (token.current !== session) return;
    if (error instanceof ApiError && error.status === 401) {
      token.current = undefined;
      cacheTag.current = null;
      setData(undefined);
      setConnectionError('Your session expired. Sign in again.');
    } else if (!(error instanceof ApiError) || error.status >= 500) {
      setConnectionError(error instanceof Error ? error.message : 'The workspace is unavailable.');
    }
  }

  useEffect(() => {
    if (!workspaceApiUrl) return;
    let busy = false;
    let foreground = AppState.currentState !== 'background' && AppState.currentState !== 'inactive';
    async function poll() {
      const session = token.current;
      if (!session || busy || !foreground) return;
      busy = true;
      try {
        const response = await request<SharedSnapshot>('/workspace', {
          headers: cacheTag.current ? { 'If-None-Match': cacheTag.current } : undefined,
        }, session);
        if (response) receive(session, response.data, response.etag);
        else if (session === token.current) setConnectionError('');
      } catch (error) {
        handleError(error, session);
      } finally {
        busy = false;
      }
    }
    const subscription = AppState.addEventListener('change', (status) => {
      foreground = status === 'active';
      if (foreground) void poll();
    });
    const interval = setInterval(poll, 2000);
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  async function signIn(username: string, password: string) {
    const result = await request<{ token: string; workspace: SharedSnapshot }>('/session', {
      method: 'POST', body: JSON.stringify({ username, password }),
    });
    if (!result) throw new Error('The workspace could not start a session.');
    token.current = result.data.token;
    revision.current = -1;
    receive(result.data.token, result.data.workspace, null);
  }

  async function signOut() {
    const session = token.current;
    token.current = undefined;
    cacheTag.current = null;
    setData(undefined);
    setConnectionError('');
    if (session) await request('/session', { method: 'DELETE' }, session).catch(() => {});
  }

  async function run(
    command:
      | CommunityCommand
      | ReferralCommand
      | WorkspaceCommand
      | DirectoryCommand
      | import('../features/partnerships/ledger').SupportCommand,
  ) {
    const session = token.current;
    if (!session) throw new Error('Sign in through Settings to use the shared workspace.');
    try {
      const response = await request<SharedSnapshot>('/commands', {
        method: 'POST', body: JSON.stringify(command),
      }, session);
      if (response) receive(session, response.data, null);
    } catch (error) {
      handleError(error, session);
      throw error;
    }
  }

  async function openTranscription() {
    const session = token.current;
    if (!workspaceApiUrl || !session) throw new Error('Live transcription is unavailable in this workspace.');
    const result = await request<{ protocol: string }>('/transcription/session', { method: 'POST' }, session);
    if (!result || token.current !== session) throw new Error('The transcription session could not start.');
    return new WebSocket(workspaceApiUrl.replace(/^http/, 'ws') + '/transcription', result.data.protocol);
  }

  return { enabled: !!workspaceApiUrl, data, connectionError, signIn, signOut, run, openTranscription };
}
