import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { View } from 'react-native';
import { applyCommand, isCommunityCommand } from '../domain/model';
import { residentId, seedState, withDemoSamples } from '../domain/seed';
import type { Command, DemoState, OfferReply } from '../domain/types';
import { Btn, Copy } from '../ui/kit';
import { decode, storageKey } from './persistence';
import { isWorkspaceCommand } from '../shared/workspace';
import { useSharedWorkspace } from './sharedWorkspace';

type DemoContext = {
  state: DemoState;
  shared: ReturnType<typeof useSharedWorkspace>;
  run: (cmd: Command) => Promise<void>;
  partnerId: string;
  setPartnerId: (id: string) => void;
  role: 'Resident' | 'Partner' | 'Moderator';
  setRole: (role: 'Resident' | 'Partner' | 'Moderator') => void;
  offerReplyFrom: OfferReply['from'];
  setOfferReplyFrom: (from: OfferReply['from']) => void;
};
const Context = createContext<DemoContext | null>(null);
export const newId = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
export const now = () => new Date().toISOString();

export function DemoProvider({ children }: PropsWithChildren) {
  const shared = useSharedWorkspace();
  const [state, setState] = useState<DemoState>();
  const current = useRef<DemoState | undefined>(undefined);
  const writes = useRef(Promise.resolve());
  const [error, setError] = useState('');
  const [role, setRole] = useState<'Resident' | 'Partner' | 'Moderator'>('Resident');
  const [partnerId, setPartnerId] = useState('winter-team');
  const [offerReplyFrom, setOfferReplyFrom] = useState<OfferReply['from']>('resident');
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        const value = raw === null ? seedState() : withDemoSamples(decode(raw));
        if (active) {
          current.current = value;
          setState(value);
        }
      })
      .catch(() => {
        if (active) setError('Your workspace couldn’t be opened. Reset it to start again.');
      });
    return () => {
      active = false;
    };
  }, []);
  const save = useCallback((cmd?: Parameters<typeof applyCommand>[1]) => {
    const next = writes.current.then(async () => {
      const value = cmd && current.current ? applyCommand(
        current.current,
        cmd,
        role === 'Moderator' ? 'moderator' : residentId,
      ) : seedState();
      if (value !== current.current) await AsyncStorage.setItem(storageKey, JSON.stringify(value));
      current.current = value;
      setState(value);
      setError('');
    });
    writes.current = next.catch(() => {});
    return next;
  }, [role]);
  async function reset() {
    await save();
    setRole('Resident');
    setPartnerId('winter-team');
    setOfferReplyFrom('resident');
  }
  if (!state)
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <Copy>{error || 'Opening the community board…'}</Copy>
        {error ? <Btn label="Reset workspace" onPress={reset} /> : null}
      </View>
    );
  return (
    <Context.Provider
      value={{
        state: shared.enabled ? {
          ...state,
          posts: shared.data?.posts ?? state.posts,
          community: shared.data?.community ?? state.community,
          referrals: [],
        } : state,
        shared,
        run: (cmd) => {
          if (shared.enabled && (isCommunityCommand(cmd) || isWorkspaceCommand(cmd))) return shared.run(cmd);
          if (isWorkspaceCommand(cmd)) return Promise.reject(new Error('Open the shared workspace first.'));
          return save(cmd);
        },
        role: shared.enabled
          ? shared.data?.account.moderator
            ? 'Moderator'
            : shared.data?.account.kind === 'worker'
              ? 'Partner'
              : 'Resident'
          : role,
        setRole,
        partnerId: shared.enabled ? shared.data?.account.membership?.partnerId ?? '' : partnerId,
        setPartnerId,
        offerReplyFrom,
        setOfferReplyFrom,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useDemo() {
  const context = useContext(Context);
  if (!context) throw new Error('DemoProvider is required');
  return context;
}
