import { useDemo } from '../../state/Demo';
import { supportBook } from './ledger';

export function useSupport() {
  const { state, shared, role, partnerId } = useDemo();
  const membership = shared.data?.account.membership;
  const coordinator = shared.enabled
    ? membership?.admin && membership.status === 'approved' && membership.partnerId === 'winter-team'
    : role === 'Moderator' || (role === 'Partner' && partnerId === 'winter-team');
  const book = shared.enabled ? shared.data?.support : supportBook(state.supportEntries);
  return { book, coordinator: !!coordinator };
}
