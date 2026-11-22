import { WorkerAssignment } from './WorkerAssignment';
import { suggestService } from './serviceNote';
import { useState } from 'react';
import { View } from 'react-native';
import { ClipboardCheck } from 'lucide-react-native';
import { otherProviders, type partnerInbox } from '../../domain/referrals';
import { projects } from '../partnerships/ledger';
import type { Appointment, Category, ReferralAssignment } from '../../domain/types';
import { newId, now, useDemo } from '../../state/Demo';
import { Disclosure } from '../../ui/Disclosure';
import { Segments } from '../../ui/Segments';
import { SelectionRow, ToggleRow } from '../../ui/SelectionRows';
import { Btn, Card, Copy, Field, color, wrap } from '../../ui/kit';
import { listWords, partnerName } from '../matching/directory';
import {
  AppointmentDetails,
  AssignmentHistory,
  ConversationLink,
  ReferralDetails,
  SharedWith,
  needName,
} from './ReferralDetails';

type Ticket = ReturnType<typeof partnerInbox>[number];
type Action = 'delivery' | 'schedule' | 'handoff' | 'decline';

function Delivery({
  assignment,
  categories,
  close,
}: {
  assignment: ReferralAssignment;
  categories: Category[];
  close: () => void;
}) {
  const { run } = useDemo();
  const [selected, setSelected] = useState(categories[0]);
  const [note, setNote] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [link, setLink] = useState(assignment.partnerId === 'winter-team');
  const category = categories.includes(selected) ? selected : categories[0];
  const eligible = projects.find((p) => p.providerId === assignment.partnerId && p.category === category);
  return (
    <View style={{ gap: 6 }}>
      <Field label="Worker note (optional)" multiline value={note} change={(value) => { setNote(value); setReviewed(false); setSuggestion(''); }} placeholder="Dropped off the coats today. Ride still needed." />
      {!!note.trim() && <>
        <Btn label="Suggest service from note" secondary onPress={() => {
          const matches = suggestService(note, categories);
          if (matches.length !== 1) {
            setSuggestion('Choose one completed service below, then confirm your selection.');
          } else {
            setSelected(matches[0]);
            setSuggestion('Suggested ' + needName(matches[0]) + '. Review the service and program before confirming.');
          }
          setReviewed(true);
        }} />
        {!!suggestion && <Copy>{suggestion}</Copy>}
      </>}
      <Copy kind="small">Provider · {partnerName(assignment.partnerId)}</Copy>
      <Copy kind="strong">Service delivered{categories.length === 1 ? ' · ' + category : ''}</Copy>
      {categories.length > 1 && (
        <Segments options={categories} value={category} onChange={setSelected} label={needName} />
      )}
      {eligible && (
        <ToggleRow label={`Count toward ${eligible.name}`} value={link} onChange={setLink} />
      )}
      <View style={wrap}>
        <Btn
          label="Record completed service"
          disabled={!!note.trim() && !reviewed}
          onPress={async () => {
            await run({
              type: 'complete',
              id: assignment.id,
              partnerId: assignment.partnerId,
              category,
              programId: link ? eligible?.programId : undefined,
              at: now(),
            });
            close();
          }}
        />
        <Btn label="Cancel" quiet onPress={close} />
      </View>
    </View>
  );
}

function Schedule({ assignment, close }: { assignment: ReferralAssignment; close: () => void }) {
  const { run } = useDemo();
  const [appointment, setAppointment] = useState<Appointment>(
    assignment.appointment ?? { date: '', time: '', instructions: '' },
  );
  function update(field: keyof Appointment, value: string) {
    setAppointment((current) => ({ ...current, [field]: value }));
  }
  async function save(value: Appointment | null) {
    await run({
      type: 'schedule',
      id: assignment.id,
      partnerId: assignment.partnerId,
      appointment: value,
    });
    close();
  }
  return (
    <View style={{ gap: 8 }}>
      <Copy kind="strong">
        {assignment.appointment ? 'Reschedule pickup or visit' : 'Schedule pickup or visit'}
      </Copy>
      <Copy kind="small" tint={color.muted}>
        Enter the date and time in Milwaukee time.
      </Copy>
      <Field
        label="Date (YYYY-MM-DD)"
        value={appointment.date}
        change={(value) => update('date', value)}
      />
      <Field
        label="Time (HH:MM, 24-hour)"
        value={appointment.time}
        change={(value) => update('time', value)}
      />
      <Field
        label="Instructions (optional)"
        multiline
        value={appointment.instructions}
        change={(value) => update('instructions', value)}
        placeholder="Use the side entrance"
      />
      <View style={wrap}>
        <Btn
          label="Save appointment"
          disabled={!appointment.date.trim() || !appointment.time.trim()}
          onPress={() =>
            save({ ...appointment, date: appointment.date.trim(), time: appointment.time.trim() })
          }
        />
        <Btn label="Cancel" secondary onPress={close} />
        {assignment.appointment && (
          <Btn label="Remove appointment" secondary onPress={() => save(null)} />
        )}
      </View>
    </View>
  );
}

function ProviderResponse({
  assignment,
  action,
  categories,
  close,
}: {
  assignment: ReferralAssignment;
  action: 'handoff' | 'decline';
  categories: Category[];
  close: () => void;
}) {
  const { run, state } = useDemo();
  const [selected, setSelected] = useState(categories[0]);
  const [recipient, setRecipient] = useState('');
  const [reason, setReason] = useState('');
  const category = categories.includes(selected) ? selected : categories[0];
  const handoff = action === 'handoff';
  const options = handoff ? otherProviders(assignment.partnerId, category, state.partners) : [];
  const recipientId = options.some(({ id }) => id === recipient) ? recipient : options[0]?.id;
  async function save() {
    const target = { id: assignment.id, partnerId: assignment.partnerId, category, reason };
    if (handoff) {
      if (!recipientId) return;
      await run({ ...target, type: 'propose-handoff', handoffId: newId(), recipientId });
    } else {
      await run({ ...target, type: 'decline-service', at: now() });
    }
    close();
  }
  return (
    <View style={{ gap: 8 }}>
      <Copy kind="strong">{handoff ? 'Suggest another partner' : 'Decline a need'}</Copy>
      {categories.length > 1 ? (
        <Segments options={categories} value={category} onChange={setSelected} label={needName} />
      ) : (
        <Copy>{needName(category)}</Copy>
      )}
      {handoff && (
        <View accessibilityRole="radiogroup" accessibilityLabel="Recipient">
          {options.map(({ id, name }) => (
            <SelectionRow
              key={id}
              label={name}
              selected={id === recipientId}
              onPress={() => setRecipient(id)}
            />
          ))}
        </View>
      )}
      <Field label="Reason" multiline value={reason} change={setReason} />
      {handoff && (
        <Copy kind="small" tint={color.muted}>
          The resident reviews this reason before sharing it with the recipient.
        </Copy>
      )}
      <View style={wrap}>
        <Btn
          label={handoff ? 'Send proposal to resident' : 'Decline this need'}
          disabled={!reason.trim() || (handoff && !recipientId)}
          onPress={save}
        />
        <Btn label="Cancel" secondary onPress={close} />
      </View>
    </View>
  );
}

export function PartnerReferralDetails({ ticket }: { ticket: Ticket }) {
  const { run, state } = useDemo();
  const [action, setAction] = useState<Action | null>(null);
  const [more, setMore] = useState(false);
  const { assignment } = ticket;
  const canSchedule = !!assignment.acceptedAt && ticket.actionable.length > 0;
  const handoffCategories = ticket.handoffCategories.filter(
    (category) => otherProviders(assignment.partnerId, category, state.partners).length > 0,
  );
  const canShowAction = {
    delivery: !!assignment.acceptedAt && ticket.deliverable.length > 0,
    schedule: canSchedule,
    handoff: handoffCategories.length > 0,
    decline: ticket.actionable.length > 0,
  };
  const activeAction = action && canShowAction[action] ? action : null;
  const close = () => setAction(null);

  return (
    <View style={{ gap: 10 }}>
      <Copy>{assignment.message}</Copy>
      {(ticket.status === 'Closed' || ticket.status === 'Declined') && (
        <Copy kind="strong" tint={color.pine}>
          {ticket.status}
        </Copy>
      )}
      <SharedWith assignment={assignment} />
      <ReferralDetails outstanding={ticket.outstanding} services={ticket.services} />
      {ticket.routed.map(({ category, partnerId }) => (
        <Copy key={category} kind="small">
          {needName(category)} with {partnerName(partnerId)}
        </Copy>
      ))}
      <AssignmentHistory assignment={assignment} />
      {ticket.status === 'Accepted' && <WorkerAssignment key={assignment.assignedWorker?.id ?? 'unassigned'} assignment={assignment} />}
      {assignment.appointment && ticket.actionable.length > 0 && (
        <AppointmentDetails appointment={assignment.appointment} />
      )}
      {ticket.proposedCategories.length > 0 && (
        <Copy kind="small">
          Awaiting resident approval · {listWords(ticket.proposedCategories.map(needName))}
        </Copy>
      )}
      {!activeAction && ticket.canRespond && (
        <Btn
          label="Accept referral"
          onPress={() =>
            run({
              type: 'accept',
              id: assignment.id,
              partnerId: assignment.partnerId,
              at: now(),
            })
          }
        />
      )}
      {activeAction === 'delivery' && (
        <Delivery assignment={assignment} categories={ticket.deliverable} close={close} />
      )}
      {activeAction === 'schedule' && <Schedule assignment={assignment} close={close} />}
      {activeAction === 'handoff' && (
        <ProviderResponse
          key="handoff"
          assignment={assignment}
          action="handoff"
          categories={handoffCategories}
          close={close}
        />
      )}
      {activeAction === 'decline' && (
        <ProviderResponse
          key="decline"
          assignment={assignment}
          action="decline"
          categories={ticket.actionable}
          close={close}
        />
      )}
      {!activeAction && (
        <>
          {canShowAction.delivery && (
            <Btn
              label="Record delivery"
              icon={ClipboardCheck}
              onPress={() => setAction('delivery')}
            />
          )}
          {(canSchedule || canShowAction.handoff || canShowAction.decline) && (
            <Disclosure label="More actions" expanded={more} onToggle={() => setMore(!more)}>
              {canSchedule && (
                <Btn
                  label={assignment.appointment ? 'Reschedule' : 'Schedule pickup or visit'}
                  quiet
                  onPress={() => setAction('schedule')}
                />
              )}
              {canShowAction.handoff && (
                <Btn label="Suggest another partner" quiet onPress={() => setAction('handoff')} />
              )}
              {canShowAction.decline && (
                <Btn label="Decline a need" quiet onPress={() => setAction('decline')} />
              )}
            </Disclosure>
          )}
        </>
      )}
    </View>
  );
}

export function PartnerReferral({
  ticket,
  expanded,
  onToggle,
}: {
  ticket: Ticket;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { shared } = useDemo();
  const title = ticket.outstanding.length
    ? listWords(ticket.outstanding.map(needName))
    : listWords(ticket.services.map(({ category }) => needName(category))) || ticket.status;
  return (
    <Card style={{ paddingVertical: 10 }}>
      <Disclosure
        label={title}
        detail={[ticket.assignment.assignedWorker && 'Assigned to ' + ticket.assignment.assignedWorker.name, expanded ? undefined : ticket.assignment.message].filter(Boolean).join(' · ') || undefined}
        expanded={expanded}
        onToggle={onToggle}
      >
        <PartnerReferralDetails ticket={ticket} />
        {shared.enabled && <ConversationLink assignment={ticket.assignment} />}
      </Disclosure>
    </Card>
  );
}
