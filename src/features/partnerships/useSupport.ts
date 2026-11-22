import { useDemo } from '../../state/Demo';

export function useSupport() {
  const { shared } = useDemo();
  const membership = shared.data?.account.membership;
  const coordinator = membership?.admin && membership.status === 'approved' && membership.partnerId === 'winter-team';
  const book = shared.data?.support;
  return { book, coordinator: !!coordinator };
}
