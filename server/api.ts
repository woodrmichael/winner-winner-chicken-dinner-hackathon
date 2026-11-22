import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { type Account } from '../src/shared/workspace';
import { publicLibrariesPath } from '../src/shared/publicLibraries';
import { reportingMonth } from '../src/features/impact/report';
import { object, parseCommand } from './commands';
import { WorkspaceError } from '../src/shared/referralAccess';
import { createPublicLibraryCache } from './public-map';
import { createTranscriptionService } from './transcription';
import { createSponsorGateway, createSponsorPayments } from './sponsor-payments';
import {
  applyAccountCommand,
  isOrganizer,
  snapshot,
  type StoredAccount,
  type Workspace,
} from '../src/shared/workspaceModel';

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

async function rawBody(request: IncomingMessage, limit = 20_000): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw new WorkspaceError(413, 'Request is too large.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function body(request: IncomingMessage): Promise<unknown> {
  const raw = await rawBody(request);
  try {
    return JSON.parse(raw.toString('utf8'));
  } catch {
    throw new WorkspaceError(400, 'Invalid request.');
  }
}

function json(response: ServerResponse, status: number, value: unknown) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
}

export function createApi(initial: Workspace, persist: (workspace: Workspace) => void,
  transcription = createTranscriptionService(), sponsorGateway = createSponsorGateway()) {
  let workspace = initial;
  let revision = 0;
  const sessions = new Map<string, { accountId: string; expires: number; cacheId: string }>();
  const attempts = new Map<string, { count: number; expires: number }>();
  const getPublicLibraries = createPublicLibraryCache();
  function save(updated: Workspace) {
    if (updated === workspace) return;
    persist(updated);
    workspace = updated;
    revision += 1;
  }
  function view(account: StoredAccount, now?: Date) {
    const data = snapshot(workspace, account, revision, now);
    if (sponsorPayments && isOrganizer(account)) {
      data.sponsorPayments = { active: (workspace.sponsorCheckouts ?? []).map(({ sessionId, pledgeId, cents }) => ({ sessionId, pledgeId, cents })) };
    }
    return data;
  }
  const sponsorPayments = sponsorGateway && createSponsorPayments(sponsorGateway, () => workspace, save);

  const server = createServer(async (request, response) => {
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
      if (request.url === '/sponsorship/stripe/webhook' && request.method === 'POST') {
        if (!sponsorPayments) throw new WorkspaceError(503, 'Online payments are unavailable.');
        const signature = request.headers['stripe-signature'];
        if (typeof signature !== 'string') throw new WorkspaceError(400, 'Stripe signature is required.');
        sponsorPayments.webhook(await rawBody(request, 128_000), signature);
        json(response, 200, { received: true });
        return;
      }
      if (request.method === 'GET' && (request.url === '/sponsorship/return?result=received' || request.url === '/sponsorship/return?result=cancelled')) {
        const title = request.url.endsWith('received') ? 'Payment submitted' : 'Checkout closed';
        const caption = request.url.endsWith('received')
          ? 'ComForce Connect records your sponsorship after Stripe confirms payment.'
          : 'You can return to the sponsorship payment link when you’re ready.';
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'none'" });
        response.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title} · ComForce Connect</title><main><h1>${title}</h1><p>${caption}</p></main></html>`);
        return;
      }
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
        json(response, 200, { token, workspace: view(account) });
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
      } else if (request.url === '/sponsorship/checkout' && request.method === 'POST') {
        if (!sponsorPayments) throw new WorkspaceError(503, 'Online payments are unavailable.');
        const { pledgeId, cents } = object(await body(request));
        const checkout = await sponsorPayments.checkout(account, pledgeId, cents);
        json(response, 200, { ...checkout, workspace: view(account) });
      } else if (request.url === '/transcription/session' && request.method === 'POST') {
        if (account.kind !== 'resident') throw new WorkspaceError(403, 'Open a resident account to dictate a request.');
        json(response, 200, transcription.issue(account.id,
          () => sessions.get(token) === session && session.expires > Date.now()));
      } else if (request.url === '/workspace' && request.method === 'GET') {
        const now = new Date();
        const etag = '"' + session.cacheId + '-' + revision + '-' + reportingMonth(now) + '"';
        response.setHeader('ETag', etag);
        if (request.headers['if-none-match']?.split(',').some((tag) => tag.trim() === etag)) {
          response.writeHead(304).end();
        } else {
          json(response, 200, view(account, now));
        }
      } else if (request.url === '/commands' && request.method === 'POST') {
        const cmd = parseCommand(command, account.details);
        let updated: Workspace;
        try {
          updated = applyAccountCommand(workspace, account, cmd);
        } catch (error) {
          if (!(error instanceof Error) || error instanceof WorkspaceError) throw error;
          throw new WorkspaceError(409, error.message);
        }
        save(updated);
        json(response, 200, view(workspace.accounts.find(({ id }) => id === account.id)!));
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
  transcription.attach(server);
  return server;
}
