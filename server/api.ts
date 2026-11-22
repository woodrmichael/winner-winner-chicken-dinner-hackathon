import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { isWorkspaceCommand, type Account } from '../src/shared/workspace';
import { publicLibrariesPath } from '../src/shared/publicLibraries';
import { reportingMonth } from '../src/features/impact/report';
import { object, parseCommand } from './commands';
import { WorkspaceError } from './referral-access';
import { applySharedSupport, applySharedCommunity, applySharedReferral, applyWorkspaceCommand, snapshot, type StoredAccount, type Workspace } from './workspace';
import { isCommunityCommand } from '../src/domain/model';
import { createPublicLibraryCache } from './public-map';

const lifetime = 8 * 60 * 60 * 1000;
const dummyHash = '00000000000000000000000000000000:' + '0'.repeat(64);

export function withPassword(account: Account, password: string): StoredAccount {
  const salt = randomBytes(16).toString('hex');
  return { ...account, passwordHash: `${salt}:${scryptSync(password, salt, 32).toString('hex')}` };
}

function checkPassword(password: string, hash: string) {
  const [salt, derived] = hash.split(':');
  return timingSafeEqual(scryptSync(password, salt, 32), Buffer.from(derived, 'hex'));
}

async function body(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 20_000) throw new WorkspaceError(413, 'Request is too large.');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new WorkspaceError(400, 'Invalid request.');
  }
}

function json(response: ServerResponse, status: number, value: unknown) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
}

export function createApi(initial: Workspace, persist: (workspace: Workspace) => void) {
  let workspace = initial;
  let revision = 0;
  const sessions = new Map<string, { accountId: string; expires: number; cacheId: string }>();
  const attempts = new Map<string, { count: number; expires: number }>();
  const getPublicLibraries = createPublicLibraryCache();

  return createServer(async (request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, If-None-Match');
    response.setHeader('Access-Control-Expose-Headers', 'ETag');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    response.setHeader('Cache-Control', 'no-store');
    if (request.method === 'OPTIONS') {
      response.writeHead(204).end();
      return;
    }

    try {
      if (request.url === publicLibrariesPath && request.method === 'GET') {
        const libraries = await getPublicLibraries();
        response.setHeader('Cache-Control', 'public, max-age=300');
        json(response, 200, libraries);
        return;
      }

      if (request.url === '/session' && request.method === 'POST') {
        const { username, password } = object(await body(request));
        const now = Date.now();
        for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
        for (const [key, value] of sessions) if (value.expires <= now) sessions.delete(key);
        const ip = request.socket.remoteAddress ?? '';
        const attempt = attempts.get(ip) ?? { count: 0, expires: now + 60_000 };
        if (attempt.count >= 12) throw new WorkspaceError(429, 'Too many sign-in attempts. Try again in a minute.');
        if (typeof username !== 'string' || typeof password !== 'string' || password.length > 128 || username.length > 80) {
          throw new WorkspaceError(400, 'Enter a username and password.');
        }
        const account = workspace.accounts.find(({ id }) => id === username.trim().toLowerCase());
        if (!checkPassword(password, account?.passwordHash ?? dummyHash) || !account) {
          attempts.set(ip, { ...attempt, count: attempt.count + 1 });
          throw new WorkspaceError(401, 'Username or password is incorrect.');
        }
        const token = randomBytes(32).toString('hex');
        sessions.set(token, { accountId: account.id, expires: now + lifetime, cacheId: randomBytes(12).toString('hex') });
        json(response, 200, { token, workspace: snapshot(workspace, account, revision) });
        return;
      }

      // Read and validate the command body before using the current account and workspace.
      const command = request.url === '/commands' && request.method === 'POST'
        ? await body(request)
        : undefined;
      const token = request.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
      const session = token ? sessions.get(token) : undefined;
      const account = session && session.expires > Date.now()
        ? workspace.accounts.find(({ id }) => id === session.accountId)
        : undefined;
      if (!token || !session || !account) throw new WorkspaceError(401, 'Sign in to open your workspace.');
      if (request.url === '/session' && request.method === 'DELETE') {
        sessions.delete(token);
        json(response, 200, {});
      } else if (request.url === '/workspace' && request.method === 'GET') {
        const now = new Date();
        const etag = '"' + session.cacheId + '-' + revision + '-' + reportingMonth(now) + '"';
        response.setHeader('ETag', etag);
        if (request.headers['if-none-match']?.split(',').some((tag) => tag.trim() === etag)) {
          response.writeHead(304).end();
        } else {
          json(response, 200, snapshot(workspace, account, revision, now));
        }
      } else if (request.url === '/commands' && request.method === 'POST') {
        const cmd = parseCommand(command, account.details);
        let updated: Workspace;
        try {
          updated = cmd.type === 'partnership' ? applySharedSupport(workspace, account, cmd.entry) : isCommunityCommand(cmd)
            ? applySharedCommunity(workspace, account, cmd)
            : isWorkspaceCommand(cmd)
              ? applyWorkspaceCommand(workspace, account, cmd)
              : applySharedReferral(workspace, account, cmd);
        } catch (error) {
          if (!(error instanceof Error) || error instanceof WorkspaceError) throw error;
          throw new WorkspaceError(409, error.message);
        }
        if (updated !== workspace) {
          persist(updated);
          workspace = updated;
          revision += 1;
        }
        json(response, 200, snapshot(workspace, workspace.accounts.find(({ id }) => id === account.id)!, revision));
      } else {
        throw new WorkspaceError(404, 'Endpoint unavailable.');
      }
    } catch (error) {
      if (error instanceof WorkspaceError) {
        json(response, error.status, { error: error.message });
      } else {
        console.error('Workspace API error', error instanceof Error ? error.name : 'Unknown error');
        json(response, 500, { error: 'The workspace could not save or load. Try again.' });
      }
    }
  });
}
