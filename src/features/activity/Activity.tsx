import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { outstandingNeeds, status } from '../../domain/referrals';
import { useDemo } from '../../state/Demo';
import { Btn, Card, Copy, Page, color, wrap } from '../../ui/kit';
import { ActivityUpdates } from './ActivityUpdates';
import { listWords, partnerName } from '../matching/directory';
import { formatActivityTime, needName, RequestStatus } from './ReferralDetails';
import { SavedEvents } from './SavedEvents';
import { VolunteerActivity } from '../volunteer/Volunteer';
import { PartnerInbox } from './PartnerInbox';

function RequestCard({ id, title, message, state, date }: {
  id: string; title: string; message: string; state: string; date: string;
}) {
  const router = useRouter();
  return <Card>
    <View style={[wrap, { justifyContent: 'space-between' }]}>
      <Copy kind="strong">{title}</Copy>
      <RequestStatus status={state} />
    </View>
    <Copy numberOfLines={2}>{message}</Copy>
    <View style={[wrap, { justifyContent: 'space-between' }]}>
      <Copy kind="small" tint={color.muted}>{formatActivityTime(date)}</Copy>
      <Btn label="View request" secondary onPress={() => router.push({
        pathname: '/activity/referral/[id]', params: { id },
      })} />
    </View>
  </Card>;
}

export default function Activity() {
  const { partnerId, shared, state } = useDemo();
  const router = useRouter();
  const account = shared.data?.account;
  const partnerView = account?.kind === 'worker';
  const residentTickets = shared.data?.referrals ?? [];
  const workerWaiting = account?.kind === 'worker' && account.membership?.status !== 'approved';
  if (!account) {
    return (
      <Page title="Activity">
        <Card>
          <Copy>Sign in to see your referrals and volunteer signups.</Copy>
          <Btn label="Open Settings" onPress={() => router.navigate('/settings')} />
        </Card>
      </Page>
    );
  }
  return (
    <Page title={partnerView && !workerWaiting ? 'Partner inbox' : 'Activity'}>
      <VolunteerActivity />
      {shared.connectionError ? <Copy>{shared.connectionError}</Copy> : null}
      {shared.data && !workerWaiting && <ActivityUpdates updates={shared.data.updates ?? []} compact={partnerView} />}
      {account.kind === 'resident' && <SavedEvents />}
      {workerWaiting ? (
        <Card>
          <Copy>{account.membership ? 'Your organization membership is awaiting approval.' : 'Request an organization membership to open its inbox.'}</Copy>
          <Btn label="Open Settings" onPress={() => router.navigate('/settings')} />
        </Card>
      ) : partnerView ? (
        <PartnerInbox key={account.id + ':' + partnerId} tickets={shared.data?.inbox ?? []}
          organization={partnerName(state.partners, partnerId)} workerId={account.id} />
      ) : residentTickets.length ? (
        <>
        <View accessibilityRole="header"><Copy kind="title">Your requests</Copy></View>
        {residentTickets.map((ticket) => (
          <RequestCard key={ticket.id} id={ticket.assignments[0].id}
            title={partnerName(state.partners, ticket.assignments[0].partnerId)}
            message={listWords(outstandingNeeds(ticket).map(needName)) || ticket.assignments[0].message}
            state={status(ticket)} date={ticket.sentAt} />
        ))}
        </>
      ) : (
        <Card>
          <Copy kind="title">Your requests will appear here</Copy>
          <Copy>Follow a private referral from the first message to a completed service.</Copy>
          <Btn label="Ask for help" onPress={() => router.push('/ask')} />
        </Card>
      )}
    </Page>
  );
}
