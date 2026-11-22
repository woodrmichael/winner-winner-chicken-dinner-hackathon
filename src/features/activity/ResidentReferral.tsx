import { useState } from 'react';
import { View } from 'react-native';
import {
  actionableNeeds,
  currentAssignment,
  otherProviders,
  outstandingNeeds,
  pendingHandoffs,
  status,
} from '../../domain/referrals';
import type { Category, Handoff, Referral } from '../../domain/types';
import { newId, now, useDemo } from '../../state/Demo';
import { SelectionRow } from '../../ui/SelectionRows';
import { Btn, Card, Copy, Field, color, wrap } from '../../ui/kit';
import { partnerName } from '../matching/directory';
import { ShareDetails, type ShareKey } from '../matching/ShareDetails';
import {
  AppointmentDetails,
  AssignmentHistory,
  ConversationLink,
  ReferralDetails,
  SharedWith,
  needName,
} from './ReferralDetails';

function HandoffReview({ referralId, proposal }: { referralId: string; proposal: Handoff }) {
  const { run } = useDemo();
  const [sharing, setSharing] = useState<ShareKey[]>([]);
  return (
    <View style={{ gap: 8 }}>
      <Copy kind="strong">Suggested partner for {needName(proposal.category).toLowerCase()}</Copy>
      <Copy>{partnerName(proposal.partnerId)}</Copy>
      <Copy kind="small" tint={color.muted}>
        Message to the suggested partner
      </Copy>
      <Copy>{proposal.reason}</Copy>
      <ShareDetails selected={sharing} onChange={setSharing} />
      <View style={wrap}>
        <Btn
          label="Approve and send"
          onPress={() =>
            run({
              type: 'respond-handoff',
              id: referralId,
              handoffId: proposal.id,
              response: 'approve',
              share: sharing,
              at: now(),
            })
          }
        />
        <Btn
          label="Decline handoff"
          secondary
          onPress={() =>
            run({
              type: 'respond-handoff',
              id: referralId,
              handoffId: proposal.id,
              response: 'decline',
            })
          }
        />
      </View>
    </View>
  );
}

function DeclinedNeed({
  referralId,
  partnerId,
  category,
}: {
  referralId: string;
  partnerId: string;
  category: Category;
}) {
  const { run, state } = useDemo();
  const [action, setAction] = useState<'seek' | 'withdraw' | null>(null);
  const options = otherProviders(partnerId, category, state.partners);
  const [recipientId, setRecipient] = useState(options[0]?.id);
  const [message, setMessage] = useState('');
  const [sharing, setSharing] = useState<ShareKey[]>([]);
  return (
    <View style={{ gap: 8 }}>
      <Copy kind="strong">{needName(category)} still needed</Copy>
      {action === 'seek' && (
        <>
          <View accessibilityRole="radiogroup" accessibilityLabel="Choose another partner">
            {options.map(({ id, name }) => (
              <SelectionRow
                key={id}
                label={name}
                selected={recipientId === id}
                onPress={() => setRecipient(id)}
              />
            ))}
          </View>
          <Field label="Message to share" multiline value={message} change={setMessage} />
          <ShareDetails selected={sharing} onChange={setSharing} />
          <View style={wrap}>
            <Btn
              label="Send to partner"
              disabled={!recipientId || !message.trim()}
              onPress={() =>
                recipientId &&
                run({
                  type: 'seek-provider',
                  id: referralId,
                  assignmentId: newId(),
                  recipientId,
                  category,
                  message,
                  share: sharing,
                  at: now(),
                })
              }
            />
            <Btn label="Cancel" secondary onPress={() => setAction(null)} />
          </View>
        </>
      )}
      {action === 'withdraw' && (
        <>
          <Copy>Remove {needName(category).toLowerCase()} from the help you still need?</Copy>
          <View style={wrap}>
            <Btn
              label="Confirm withdrawal"
              onPress={() => run({ type: 'withdraw-need', id: referralId, category })}
            />
            <Btn label="Keep need open" secondary onPress={() => setAction(null)} />
          </View>
        </>
      )}
      {!action && (
        <View style={wrap}>
          {options.length > 0 && (
            <Btn label="Seek another partner" secondary onPress={() => setAction('seek')} />
          )}
          <Btn label="Withdraw need" secondary onPress={() => setAction('withdraw')} />
        </View>
      )}
    </View>
  );
}

const detailSection = { borderTopWidth: 1, borderColor: color.line, paddingTop: 12, gap: 8 };

export function ResidentReferral({
  referral,
  showConversationLinks = false,
}: {
  referral: Referral;
  showConversationLinks?: boolean;
}) {
  const [initial, ...additional] = referral.assignments;
  const outstanding = outstandingNeeds(referral);
  const proposals = pendingHandoffs(referral);
  return (
    <Card>
      <View style={[wrap, { justifyContent: 'space-between' }]}>
        <Copy kind="title">{partnerName(initial.partnerId)}</Copy>
        <Copy kind="strong" tint={color.pine}>
          {status(referral)}
        </Copy>
      </View>
      <Copy>{initial.message}</Copy>
      <SharedWith assignment={initial} />
      <ReferralDetails
        outstanding={outstanding}
        services={referral.services}
        withdrawn={referral.withdrawn}
      />
      <AssignmentHistory assignment={initial} />
      {initial.appointment && actionableNeeds(referral, initial).length > 0 && (
        <AppointmentDetails appointment={initial.appointment} />
      )}
      {showConversationLinks && <ConversationLink assignment={initial} />}
      {additional.map((assignment) => (
        <View key={assignment.id} style={detailSection}>
          <Copy kind="strong">
            {partnerName(assignment.partnerId)} · {needName(assignment.category!)}
          </Copy>
          <Copy>{assignment.message}</Copy>
          <SharedWith assignment={assignment} />
          <AssignmentHistory assignment={assignment} />
          {assignment.appointment && actionableNeeds(referral, assignment).length > 0 && (
            <AppointmentDetails appointment={assignment.appointment} />
          )}
          {showConversationLinks && <ConversationLink assignment={assignment} />}
        </View>
      ))}
      {proposals.map((proposal) => (
        <View key={proposal.id} style={detailSection}>
          <HandoffReview referralId={referral.id} proposal={proposal} />
        </View>
      ))}
      {outstanding.map((category) => {
        const assignment = currentAssignment(referral, category);
        if (!assignment.declines[category]) return null;
        return (
          <View key={assignment.id + ':' + category} style={detailSection}>
            <DeclinedNeed
              referralId={referral.id}
              partnerId={assignment.partnerId}
              category={category}
            />
          </View>
        );
      })}
    </Card>
  );
}
