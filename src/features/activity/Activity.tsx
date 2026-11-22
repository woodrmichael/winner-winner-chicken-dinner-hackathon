import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Segments } from '../../ui/Segments';
import { partnerInbox, residentTimeline } from '../../domain/referrals';
import { useDemo } from '../../state/Demo';
import { Disclosure } from '../../ui/Disclosure';
import { Btn, Card, Copy, Page, color } from '../../ui/kit';
import { ActivityUpdates } from './ActivityUpdates';
import { partnerName } from '../matching/directory';
import { PartnerReferral } from './PartnerReferral';
import { ResidentReferral } from './ResidentReferral';
import { VolunteerActivity } from '../volunteer/Volunteer';

const inboxSections = [
  { title: 'Awaiting response', statuses: ['Sent'] },
  { title: 'Accepted cases', statuses: ['Accepted'] },
  { title: 'Completed history', statuses: ['Completed', 'Declined', 'Closed'] },
];

function PartnerTickets({ tickets }: { tickets: ReturnType<typeof partnerInbox> }) {
  const { shared } = useDemo();
  const [scope, setScope] = useState<'Team' | 'Assigned to me'>('Team');
  const [openTicket, setOpenTicket] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  if (!tickets.length) {
    return (
      <Card>
        <Copy kind="title">No referrals for this partner</Copy>
      </Card>
    );
  }

  const visible = scope === 'Assigned to me' ? tickets.filter((t) => t.assignment.assignedWorker?.id === shared.data?.account.id) : tickets;
  return <>
    {shared.enabled && <Segments options={['Team', 'Assigned to me'] as const} value={scope} onChange={setScope} label={(v) => v} />}
    {!visible.length && <Copy>No referrals assigned to you.</Copy>}
    {inboxSections.map((section) => {
    const cases = visible.filter((ticket) => section.statuses.includes(ticket.status));
    if (!cases.length) return null;
    const rows = cases.map((ticket) => (
      <PartnerReferral
        key={ticket.assignment.id}
        ticket={ticket}
        expanded={openTicket === ticket.assignment.id}
        onToggle={() =>
          setOpenTicket(openTicket === ticket.assignment.id ? '' : ticket.assignment.id)
        }
      />
    ));
    if (section.title === 'Completed history') {
      return (
        <Card key={section.title}>
          <Disclosure
            label={section.title}
            detail={`${cases.length} referrals`}
            expanded={showHistory}
            onToggle={() => setShowHistory(!showHistory)}
          >
            <View style={{ gap: 12 }}>{rows}</View>
          </Disclosure>
        </Card>
      );
    }

    return (
      <View key={section.title} style={{ gap: 12 }}>
        <View accessible accessibilityRole="header">
          <Copy kind="strong">{section.title}</Copy>
        </View>
        {rows}
      </View>
    );
  })}</>;
}

export default function Activity() {
  const { state, role, partnerId, shared } = useDemo();
  const router = useRouter();
  const account = shared.data?.account;
  const partnerView = shared.enabled ? account?.kind === 'worker' : role === 'Partner';
  const residentTickets = shared.enabled ? shared.data?.referrals ?? [] : residentTimeline(state);
  const workerWaiting = account?.kind === 'worker' && account.membership?.status !== 'approved';
  const organization = partnerView && partnerId ? partnerName(partnerId) : undefined;
  const identity = [account?.name, organization].filter(Boolean).join(' · ');
  if (shared.enabled && !account) {
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
      {identity ? (
        <Copy kind="strong" tint={color.muted}>
          {identity}
        </Copy>
      ) : null}
      <VolunteerActivity />
      {shared.connectionError ? <Copy>{shared.connectionError}</Copy> : null}
      {shared.data && !workerWaiting && <ActivityUpdates updates={shared.data.updates ?? []} />}
      {workerWaiting ? (
        <Card>
          <Copy>{account.membership ? 'Your organization membership is awaiting approval.' : 'Request an organization membership to open its inbox.'}</Copy>
          <Btn label="Open Settings" onPress={() => router.navigate('/settings')} />
        </Card>
      ) : partnerView ? (
        <PartnerTickets key={partnerId} tickets={shared.enabled ? shared.data?.inbox ?? [] : partnerInbox(state, partnerId)} />
      ) : residentTickets.length ? (
        residentTickets.map((ticket) => (
          <ResidentReferral key={ticket.id} referral={ticket} showConversationLinks={shared.enabled} />
        ))
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
