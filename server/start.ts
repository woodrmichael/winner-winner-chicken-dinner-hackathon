import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { seedState, withDemoReferrals } from '../src/domain/seed';
import { decode } from '../src/state/persistence';
import { createApi, withPassword } from './api';
import { createWorkspace, demoAccounts, restoreCommunication, sampleResidentAccount, type StoredWorkspace, type Workspace } from '../src/shared/workspaceModel';

const path = resolve(process.env.COMFORCE_API_DATA ?? '.comforce/workspace.json');
const host = process.env.COMFORCE_API_HOST ?? '127.0.0.1';
const port = Number(process.env.COMFORCE_API_PORT ?? '8787');

function save(workspace: Workspace) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path + '.tmp', JSON.stringify(workspace), { mode: 0o600 });
  renameSync(path + '.tmp', path);
}

function load(): Workspace {
  if (existsSync(path)) {
    const stored = JSON.parse(readFileSync(path, 'utf8')) as StoredWorkspace;
    const { referrals } = decode(JSON.stringify({ ...seedState(), referrals: stored.referrals }));
    return restoreCommunication({ ...stored, referrals: withDemoReferrals(referrals, sampleResidentAccount) });
  }
  const credentials = demoAccounts.map((account) => ({ account, password: randomBytes(12).toString('base64url') }));
  const workspace = createWorkspace(credentials.map(({ account, password }) => withPassword(account, password)));
  save(workspace);
  console.log('Save these sample account passwords. They are printed only when a workspace is first created.');
  for (const { account, password } of credentials) console.log(`${account.id.padEnd(14)} ${password}`);
  return workspace;
}

createApi(load(), save).listen(port, host, () => console.log(`ComForce API listening on http://${host}:${port}`));
