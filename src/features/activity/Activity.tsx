import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { partnerInbox, residentTimeline } from '../../domain/referrals';
import { useDemo } from '../../state/Demo';
import { Btn, Card, Copy, Page, color } from '../../ui/kit';
import { partnerName } from '../matching/directory';
import { PartnerReferral } from './PartnerReferral';
import { ResidentReferral } from './ResidentReferral';

const inboxSections = [
  { title: 'Awaiting response', statuses: ['Sent'] },
  { title: 'Accepted cases', statuses: ['Accepted'] },
  { title: 'Completed history', statuses: ['Completed', 'Declined', 'Closed'] },
];

function PartnerTickets({ tickets }: { tickets: ReturnType<typeof partnerInbox> }) {
  const [openTicket, setOpenTicket] = useState('');
  if (!tickets.length) {
    return (
      <Card>
        <Copy kind="title">No referrals for this partner</Copy>
      </Card>
    );
  }

  return inboxSections.map((section) => {
    const cases = tickets.filter((ticket) => section.statuses.includes(ticket.status));
    if (!cases.length) return null;

    return (
      <View key={section.title} style={{ gap: 12 }}>
        <View accessible accessibilityRole="header">
          <Copy kind="strong">{section.title}</Copy>
        </View>
        {cases.map((ticket) => (
          <PartnerReferral
            key={ticket.assignment.id}
            ticket={ticket}
            expanded={openTicket === ticket.assignment.id}
            onToggle={() =>
              setOpenTicket(openTicket === ticket.assignment.id ? '' : ticket.assignment.id)
            }
          />
        ))}
      </View>
    );
  });
}

export default function Activity() {
  const { state, role, partnerId } = useDemo();
  const router = useRouter();
  const residentTickets = role === 'Resident' ? residentTimeline(state) : [];
  return (
    <Page title={role === 'Partner' ? 'Partner inbox' : 'Referral activity'}>
      {role === 'Partner' && (
        <Copy kind="strong" tint={color.muted}>
          {partnerName(partnerId)}
        </Copy>
      )}
      {role === 'Partner' ? (
        <PartnerTickets key={partnerId} tickets={partnerInbox(state, partnerId)} />
      ) : residentTickets.length ? (
        residentTickets.map((ticket) => <ResidentReferral key={ticket.id} referral={ticket} />)
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
