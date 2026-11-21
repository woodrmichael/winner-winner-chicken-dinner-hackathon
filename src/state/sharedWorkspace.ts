import { useEffect, useRef, useState } from 'react';
import type { CommunityCommand, ReferralCommand, WorkspaceCommand } from '../domain/types';
import type { SharedSnapshot } from '../shared/workspace';

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');

class ApiError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let response: Response;
  try {
    response = await fetch(apiUrl + path, {
      ...options,
      headers: {
        ...(options.body && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      signal: controller.signal,
    });
  } catch {
    throw new Error('Can’t reach the shared workspace. Check that the server is running.');
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body.error ?? 'The workspace is unavailable.');
  }
  return response.json();
}

export function useSharedWorkspace() {
  const [data, setData] = useState<SharedSnapshot>();
  const [connectionError, setConnectionError] = useState('');
  const token = useRef<string | undefined>(undefined);

  function receive(session: string, workspace: SharedSnapshot) {
    if (token.current !== session) return;
    setData((previous) => (
      token.current === session && (!previous || workspace.revision >= previous.revision) ? workspace : previous
    ));
    setConnectionError('');
  }

  function handleError(error: unknown, session: string) {
    if (token.current !== session) return;
    if (error instanceof ApiError && error.status === 401) {
      token.current = undefined;
      setData(undefined);
      setConnectionError('Your session expired. Sign in again.');
    } else if (!(error instanceof ApiError) || error.status >= 500) {
      setConnectionError(error instanceof Error ? error.message : 'The workspace is unavailable.');
    }
  }

  useEffect(() => {
    if (!apiUrl) return;
    let busy = false;
    const interval = setInterval(async () => {
      const session = token.current;
      if (!session || busy) return;
      busy = true;
      try {
        receive(session, await request<SharedSnapshot>('/workspace', {}, session));
      } catch (error) {
        handleError(error, session);
      } finally {
        busy = false;
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  async function signIn(username: string, password: string) {
    const result = await request<{ token: string; workspace: SharedSnapshot }>('/session', {
      method: 'POST', body: JSON.stringify({ username, password }),
    });
    token.current = result.token;
    setData(result.workspace);
    setConnectionError('');
  }

  async function signOut() {
    const session = token.current;
    token.current = undefined;
    setData(undefined);
    setConnectionError('');
    if (session) await request('/session', { method: 'DELETE' }, session).catch(() => {});
  }

  async function run(command: CommunityCommand | ReferralCommand | WorkspaceCommand) {
    const session = token.current;
    if (!session) throw new Error('Sign in through Settings to use the shared workspace.');
    try {
      receive(session, await request<SharedSnapshot>('/commands', {
        method: 'POST', body: JSON.stringify(command),
      }, session));
    } catch (error) {
      handleError(error, session);
      throw error;
    }
  }

  return { enabled: !!apiUrl, data, connectionError, signIn, signOut, run };
}
