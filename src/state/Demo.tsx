import { createContext, useContext, type PropsWithChildren } from 'react';
import { View } from 'react-native';
import type { DemoState } from '../domain/types';
import { seedState } from '../domain/seed';
import { Btn, Copy } from '../ui/kit';
import { workspaceApiUrl } from '../shared/http';
import { useLocalWorkspace, type LocalRole } from './localWorkspace';
import { useSharedWorkspace } from './sharedWorkspace';

type DemoContext = {
  state: DemoState;
  shared: Omit<ReturnType<typeof useSharedWorkspace>, 'enabled'>;
  run: ReturnType<typeof useSharedWorkspace>['run'];
  localProfile?: { role: LocalRole; selectRole: (role: LocalRole) => void };
  partnerId: string;
  role: LocalRole | 'Moderator';
};
const Context = createContext<DemoContext | null>(null);
const publicSeed = seedState();
export { newId } from '../shared/id';
export const now = () => new Date().toISOString();

export function DemoProvider({ children }: PropsWithChildren) {
  const remote = useSharedWorkspace();
  const local = useLocalWorkspace(!workspaceApiUrl);
  const shared = remote.enabled ? remote : { ...remote, data: local.data, run: local.run };
  const account = shared.data?.account;
  if (!remote.enabled && !account) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <Copy>{local.error || 'Opening the community board…'}</Copy>
        {local.error ? <Btn label="Reset workspace" onPress={local.reset} /> : null}
      </View>
    );
  }

  return (
    <Context.Provider value={{
      state: {
        version: 2,
        posts: shared.data?.posts ?? publicSeed.posts,
        community: shared.data?.community ?? publicSeed.community,
        partners: shared.data?.partners ?? publicSeed.partners,
        referrals: [],
      },
      shared,
      run: shared.run,
      localProfile: remote.enabled ? undefined : { role: local.role, selectRole: local.selectRole },
      role: account?.moderator ? 'Moderator' : account?.kind === 'worker' ? 'Partner' : 'Resident',
      partnerId: account?.membership?.partnerId ?? '',
    }}>
      {children}
    </Context.Provider>
  );
}

export function useDemo() {
  const context = useContext(Context);
  if (!context) throw new Error('DemoProvider is required');
  return context;
}
