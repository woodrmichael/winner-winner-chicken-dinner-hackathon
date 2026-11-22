import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TextInput, View, type ScrollView } from 'react-native';
import { LockKeyhole, Send } from 'lucide-react-native';
import { referralMessageLimit } from '../../shared/workspace';
import { actionableNeeds } from '../../domain/referrals';
import { newId, useDemo } from '../../state/Demo';
import { Btn, Card, Copy, Page, color, row } from '../../ui/kit';
import { BackButton } from '../../ui/BackButton';
import { SelectMenu } from '../../ui/SelectMenu';
import { partnerName } from '../matching/directory';
import { PartnerReferralMoreActions, PartnerReferralSummary, PartnerReferralTimeline } from './PartnerReferral';
import { formatActivityTime, partnerRequestTitle, RequestTimeline } from './ReferralDetails';
import { ResidentReferral } from './ResidentReferral';

function PrivateThread({ assignmentId, partnerId }: { assignmentId: string; partnerId: string }) {
  const { shared, run, state } = useDemo();
  const messages = shared.data?.messages?.filter((message) => message.assignmentId === assignmentId) ?? [];
  const [draft, setDraft] = useState('');
  const attempt = useRef<{ messageId: string; body: string } | undefined>(undefined);
  const body = draft.trim();

  return (
    <View style={{ gap: 12 }}>
      <View style={[row, { gap: 6 }]}>
        <LockKeyhole size={14} color={color.muted} />
        <Copy kind="small" tint={color.muted} style={{ flex: 1 }}>Private · {partnerName(state.partners, partnerId)}</Copy>
      </View>
      {messages.length ? <View style={{ gap: 8 }}>
        {messages.map((message) => (
          <View key={message.id} style={{ gap: 3, maxWidth: '86%', alignSelf: message.sentByYou ? 'flex-end' : 'flex-start' }}>
            {!message.sentByYou && <Copy kind="small" tint={color.muted} style={{ paddingLeft: 10 }}>{message.sender}</Copy>}
            <View style={{
              paddingVertical: 9, paddingHorizontal: 13, borderRadius: 17,
              borderBottomRightRadius: message.sentByYou ? 5 : 17,
              borderBottomLeftRadius: message.sentByYou ? 17 : 5,
              backgroundColor: message.sentByYou ? color.pine : color.paper,
              borderWidth: message.sentByYou ? 0 : 1, borderColor: color.line,
            }}>
              <Copy tint={message.sentByYou ? color.paper : color.ink}>{message.body}</Copy>
            </View>
            <Copy kind="small" tint={color.muted} style={{ paddingHorizontal: 5,
              alignSelf: message.sentByYou ? 'flex-end' : 'flex-start' }}>{formatActivityTime(message.at)}</Copy>
          </View>
        ))}
      </View> : (
        <Copy kind="small" tint={color.muted} style={{ paddingVertical: 8 }}>No messages yet.</Copy>
      )}
      <View style={{ gap: 6 }}>
        {body.length > referralMessageLimit && <Copy tint={color.rust}>Use {referralMessageLimit} characters or fewer.</Copy>}
        <View style={[row, { alignItems: 'flex-end', gap: 7 }]}>
          <TextInput accessibilityLabel="Private message" placeholder="Write a message"
            placeholderTextColor={color.muted} value={draft} onChangeText={setDraft} multiline
            style={{ flex: 1, minWidth: 0, minHeight: 44, maxHeight: 110, borderRadius: 20, borderWidth: 1,
              borderColor: color.line, backgroundColor: color.bg, color: color.ink, paddingHorizontal: 14,
              paddingVertical: 10, fontSize: 16 }} />
          <Btn label="Send private message" icon={Send} iconOnly celebrate
            disabled={!body || body.length > referralMessageLimit}
            onPress={async () => {
              if (attempt.current?.body !== body) attempt.current = { messageId: newId(), body };
              await run({ type: 'send-referral-message', assignmentId, ...attempt.current });
              attempt.current = undefined;
              setDraft((current) => current.trim() === body ? '' : current);
            }} />
        </View>
      </View>
    </View>
  );
}

export default function ReferralConversation() {
  const { id, focus } = useLocalSearchParams<{ id: string; focus?: string }>();
  const { shared, state } = useDemo();
  const router = useRouter();
  const back = <BackButton label={shared.data?.account.kind === 'worker' ? 'Back to Inbox' : 'Back to Activity'}
    onPress={() => router.navigate('/activity')} />;
  const referral = shared.data?.referrals.find((entry) => entry.assignments.some((assignment) => assignment.id === id));
  const ticket = shared.data?.inbox.find((entry) => entry.assignment.id === id);
  const assignment = ticket?.assignment ?? referral?.assignments.find((entry) => entry.id === id);
  const [threadId, setThreadId] = useState<string>();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const jumpedToMessages = useRef<string | undefined>(undefined);
  const [messagesOffset, setMessagesOffset] = useState<{ id: string; y: number }>();

  useEffect(() => {
    if (focus !== 'messages') {
      jumpedToMessages.current = undefined;
      return;
    }
    if (!id || !messagesOffset || messagesOffset.id !== id || jumpedToMessages.current === id) return;
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: messagesOffset.y - 10, animated: false });
      jumpedToMessages.current = id;
    });
    return () => cancelAnimationFrame(frame);
  }, [focus, id, messagesOffset]);

  if (!assignment) {
    return (
      <Page title="Referral unavailable" back={back}>
        <Card>
          <Copy>{shared.data ? 'This referral is unavailable to your account.' : 'Sign in to open this referral.'}</Copy>
          {!shared.data && <Btn label="Open Settings" onPress={() => router.navigate('/settings')} />}
        </Card>
      </Page>
    );
  }

  const assignments = referral?.assignments ?? [assignment];
  const thread = assignments.find((item) => item.id === threadId) ?? assignment;
  return (
    <Page title={ticket ? partnerRequestTitle(ticket) : `${partnerName(state.partners, assignment.partnerId)} referral`}
      back={back} scrollRef={scrollRef}>
      {ticket && <>
        <PartnerReferralSummary ticket={ticket} />
        <PartnerReferralTimeline key={assignment.id} ticket={ticket} />
      </>}
      {referral && <>
        <ResidentReferral key={`referral:${referral.id}`} referral={referral} />
        <RequestTimeline assignments={assignments} services={referral.services}
          upcoming={assignments.filter((item) => actionableNeeds(referral, item).length > 0)} />
      </>}
      <View key={`messages:${assignment.id}`} onLayout={({ nativeEvent }) => {
        const y = nativeEvent.layout.y;
        setMessagesOffset((previous) => previous?.id === assignment.id && previous.y === y ? previous : { id: assignment.id, y });
      }}>
        <Card>
          <View accessibilityRole="header"><Copy kind="title">Messages</Copy></View>
          {assignments.length > 1 && <SelectMenu label="Message recipient" value={thread.id}
            options={assignments.map((item) => ({ value: item.id, label: partnerName(state.partners, item.partnerId) }))}
            onChange={setThreadId} />}
          <PrivateThread key={`thread:${shared.data?.account.id}:${thread.id}`} assignmentId={thread.id} partnerId={thread.partnerId} />
        </Card>
      </View>
      {ticket && <PartnerReferralMoreActions key={`actions:${assignment.id}`} ticket={ticket} />}
    </Page>
  );
}
