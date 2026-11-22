import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import { residentId, seedState, withDemoSamples } from '../domain/seed';
import type { Command } from '../domain/types';
import {
  applyAccountCommand,
  createWorkspace,
  demoAccounts,
  restoreCommunication,
  sampleResidentAccount,
  snapshot,
  type StoredWorkspace,
  type Workspace,
} from '../shared/workspaceModel';
import { decode, storageKey } from './persistence';

export const localProfiles = {
  Resident: demoAccounts.find(({ id }) => id === sampleResidentAccount)!,
  Partner: { ...demoAccounts.find(({ id }) => id === 'organizer')!, moderator: false },
};
export type LocalRole = keyof typeof localProfiles;
const accounts = Object.values(localProfiles);

export function useLocalWorkspace(enabled: boolean) {
  const [role, selectRole] = useState<LocalRole>('Resident');
  const [workspace, setWorkspace] = useState<Workspace>();
  const current = useRef<Workspace | undefined>(undefined);
  const writes = useRef(Promise.resolve());
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (!active) return;
        const demo = raw === null ? seedState(sampleResidentAccount) :
          withDemoSamples(decode(raw), sampleResidentAccount);
        const initial = createWorkspace(accounts, demo);
        const referrals = demo.referrals.map((referral) => referral.residentId === residentId
          ? { ...referral, residentId: sampleResidentAccount }
          : referral);
        const stored = raw === null ? undefined : JSON.parse(raw) as Partial<StoredWorkspace>;
        const value = restoreCommunication({
          ...initial,
          referrals,
          posts: demo.posts.map((post) => post.authorId === sampleResidentAccount && post.author === 'Alex (you)'
            ? { ...post, author: localProfiles.Resident.name }
            : post),
          roles: stored?.roles ?? initial.roles,
          signups: stored?.signups ?? (demo.community.joinedEvents.includes('drive')
            ? [{ accountId: sampleResidentAccount, roleId: 'sorting' }]
            : initial.signups),
          communication: stored?.communication,
        });
        current.current = value;
        setWorkspace(value);
      })
      .catch(() => {
        if (active) setError('Your workspace couldn’t be opened. Reset it to start again.');
      });
    return () => { active = false; };
  }, [enabled]);

  function write(command?: Command) {
    const account = localProfiles[role];
    const next = writes.current.then(async () => {
      const previous = current.current;
      if (command && !previous) throw new Error('Your workspace is still opening.');
      if (command && account.kind === 'worker' &&
        (command.type === 'post' || command.type === 'save-post' || command.type === 'group-membership' ||
          command.type === 'event-rsvp' || command.type === 'reserve-volunteer')) {
        throw new Error('Open the resident profile to use this action.');
      }
      const value = command && previous
        ? applyAccountCommand(previous, account, command)
        : createWorkspace(accounts);
      if (value === previous) return;
      const { accounts: _accounts, ...stored } = value;
      await AsyncStorage.setItem(storageKey, JSON.stringify({ version: 2, ...stored }));
      current.current = value;
      setWorkspace(value);
      setError('');
    });
    writes.current = next.catch(() => {});
    return next;
  }

  const data = useMemo(() => workspace && snapshot(workspace, localProfiles[role], 0), [workspace, role]);
  return { role, selectRole, data, error, run: write, reset: () => write() };
}
