import { useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { referralMessageLimit } from '../../shared/workspace';
import { newId, useDemo } from '../../state/Demo';
import { Btn, Card, Copy, Field, Page, color } from '../../ui/kit';
import { partnerName } from '../matching/directory';
import { PartnerReferralDetails } from './PartnerReferral';
import { formatActivityTime } from './ReferralDetails';
import { ResidentReferral } from './ResidentReferral';

function PrivateThread({ assignmentId, partnerId }: { assignmentId: string; partnerId: string }) {
  const { shared, run } = useDemo();
  const messages = shared.data?.messages?.filter((message) => message.assignmentId === assignmentId) ?? [];
  const [draft, setDraft] = useState('');
  const attempt = useRef<{ messageId: string; body: string } | undefined>(undefined);
  const body = draft.trim();

  return (
    <Card>
      <Copy kind="title">Private conversation</Copy>
      <Copy kind="small" tint={color.muted}>Visible to the resident and approved workers at {partnerName(partnerId)}.</Copy>
      {!messages.length && <Copy>No messages yet.</Copy>}
      {messages.map((message) => (
        <View key={message.id} style={{ gap: 4, padding: 10, borderRadius: 10, backgroundColor: message.sentByYou ? color.pale : color.sand }}>
          <Copy kind="strong">{message.sentByYou ? 'You' : message.sender}</Copy>
          <Copy>{message.body}</Copy>
          <Copy kind="small" tint={color.muted}>{formatActivityTime(message.at)}</Copy>
        </View>
      ))}
      <Field label="Private message" value={draft} change={setDraft} multiline />
      {body.length > referralMessageLimit && <Copy tint={color.rust}>Use {referralMessageLimit} characters or fewer.</Copy>}
      <Btn
        label="Send private message"
        disabled={!body || body.length > referralMessageLimit}
        onPress={async () => {
          if (attempt.current?.body !== body) attempt.current = { messageId: newId(), body };
          await run({ type: 'send-referral-message', assignmentId, ...attempt.current });
          attempt.current = undefined;
          setDraft((current) => current.trim() === body ? '' : current);
        }}
      />
    </Card>
  );
}

export default function ReferralConversation() {
  const { id, focus } = useLocalSearchParams<{ id: string; focus?: string }>();
  const { shared } = useDemo();
  const router = useRouter();
  const back = <Btn label="Back to Activity" secondary onPress={() => router.navigate('/activity')} />;
  const referral = shared.data?.referrals.find((entry) => entry.assignments.some((assignment) => assignment.id === id));
  const ticket = shared.data?.inbox.find((entry) => entry.assignment.id === id);
  const assignment = ticket?.assignment ?? referral?.assignments.find((entry) => entry.id === id);

  if (!assignment) {
    return (
      <Page title="Referral unavailable" right={back}>
        <Card>
          <Copy>{shared.data ? 'This referral is unavailable to your account.' : 'Sign in to open this referral.'}</Copy>
          {!shared.data && <Btn label="Open Settings" onPress={() => router.navigate('/settings')} />}
        </Card>
      </Page>
    );
  }

  const thread = (
    <PrivateThread key={`thread:${assignment.id}`} assignmentId={assignment.id} partnerId={assignment.partnerId} />
  );
  return (
    <Page title={`${partnerName(assignment.partnerId)} referral`} right={back}>
      {focus === 'messages' && thread}
      {ticket && <Card><PartnerReferralDetails key={assignment.id} ticket={ticket} /></Card>}
      {referral && <ResidentReferral key={`referral:${referral.id}`} referral={referral} />}
      {focus !== 'messages' && thread}
    </Page>
  );
}
