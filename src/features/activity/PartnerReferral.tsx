import { WorkerAssignment } from './WorkerAssignment';
import { suggestService } from './serviceNote';
import { useState } from 'react';
import { View } from 'react-native';
import { CalendarDays, ClipboardCheck, LockKeyhole } from 'lucide-react-native';
import { otherProviders, type partnerInbox } from '../../domain/referrals';
import { projects } from '../partnerships/ledger';
import type { Appointment, Category, ReferralAssignment } from '../../domain/types';
import { newId, now, useDemo } from '../../state/Demo';
import { Disclosure } from '../../ui/Disclosure';
import { Segments } from '../../ui/Segments';
import { SelectionRow, ToggleRow } from '../../ui/SelectionRows';
import { Btn, Card, Copy, Field, color, row, wrap } from '../../ui/kit';
import { listWords, partnerName } from '../matching/directory';
import {
  ReferralDetails,
  RequestTimeline,
  RequestStatus,
  needName,
} from './ReferralDetails';

type Ticket = ReturnType<typeof partnerInbox>[number];
type FollowUp = 'handoff' | 'decline';

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
    <View style={{ gap: 8 }}>
      <Copy kind="strong">Service delivered{categories.length === 1 ? ' · ' + needName(category) : ''}</Copy>
      {categories.length > 1 && (
        <Segments options={categories} value={category} onChange={setSelected} label={needName} />
      )}
      {eligible && (
        <ToggleRow label={`Count toward ${eligible.name}`} value={link} onChange={setLink} />
      )}
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
      <View style={wrap}>
        <Btn
          label="Record completed service"
          celebrate
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
          celebrate
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
  action: FollowUp;
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

export function PartnerReferralSummary({ ticket }: { ticket: Ticket }) {
  const { assignment } = ticket;
  const sharedDetails = [
    { label: 'First name', value: assignment.shared.firstName },
    { label: 'Contact number', value: assignment.shared.callback },
    { label: 'Neighborhood', value: assignment.shared.neighborhood },
  ].filter(({ value }) => value);

  return (
    <Card>
      <View style={[wrap, { justifyContent: 'space-between' }]}>
        <View style={[row, { gap: 6 }]}>
          <LockKeyhole size={14} color={color.muted} />
          <Copy kind="small" tint={color.muted}>Private request</Copy>
        </View>
        <RequestStatus status={ticket.status} />
      </View>
      <Copy kind="strong">Resident’s request</Copy>
      <Copy>{assignment.message}</Copy>
      {!!sharedDetails.length && <View style={{ gap: 4, borderTopWidth: 1, borderColor: color.line, paddingTop: 8 }}>
        {sharedDetails.map(({ label, value }) => <View key={label} style={[wrap, { justifyContent: 'space-between' }]}>
          <Copy kind="small" tint={color.muted}>{label}</Copy><Copy kind="small">{value}</Copy>
        </View>)}
      </View>}
      <ReferralDetails outstanding={ticket.outstanding} />
      {ticket.routed.map(({ category, partnerId }) => (
        <Copy key={category} kind="small">
          {needName(category)} with {partnerName(partnerId)}
        </Copy>
      ))}
      {ticket.proposedCategories.length > 0 && (
        <Copy kind="small">
          Awaiting resident approval · {listWords(ticket.proposedCategories.map(needName))}
        </Copy>
      )}
    </Card>
  );
}

export function PartnerReferralTimeline({ ticket }: { ticket: Ticket }) {
  const { run } = useDemo();
  const [action, setAction] = useState<'delivery' | 'schedule' | null>(null);
  const { assignment } = ticket;
  const canSchedule = !!assignment.acceptedAt && ticket.actionable.length > 0;
  const canDeliver = !!assignment.acceptedAt && ticket.deliverable.length > 0;
  const canShowAction = { delivery: canDeliver, schedule: canSchedule };
  const activeAction = action && canShowAction[action] ? action : null;
  const close = () => setAction(null);
  const hasActions = ticket.canRespond || canDeliver || canSchedule;
  const actionTitle = ticket.canRespond ? 'Awaiting acceptance' : canDeliver ? 'Delivery pending' : 'Manage pickup or visit';

  return <RequestTimeline assignments={[assignment]} upcoming={ticket.actionable.length ? [assignment] : []}
    services={ticket.services} currentPartnerId={assignment.partnerId}>
    {hasActions && <View style={{ gap: 8 }}>
      <Copy kind="strong">{actionTitle}</Copy>
      {!activeAction && ticket.canRespond && (
        <Btn
          label="Accept referral"
          celebrate
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
      {!activeAction && (canDeliver || canSchedule) && <View style={wrap}>
            {canDeliver && (
              <Btn label="Record delivery" icon={ClipboardCheck} onPress={() => setAction('delivery')} />
            )}
            {canSchedule && (
              <Btn label={assignment.appointment ? 'Reschedule pickup or visit' : 'Schedule pickup or visit'}
                icon={CalendarDays} secondary onPress={() => setAction('schedule')} />
            )}
          </View>}
    </View>}
  </RequestTimeline>;
}

export function PartnerReferralMoreActions({ ticket }: { ticket: Ticket }) {
  const { state } = useDemo();
  const [expanded, setExpanded] = useState(false);
  const [action, setAction] = useState<FollowUp | null>(null);
  const { assignment } = ticket;
  const accepted = ticket.status === 'Accepted';
  const handoffCategories = ticket.handoffCategories.filter(
    (category) => otherProviders(assignment.partnerId, category, state.partners).length > 0,
  );
  if (!accepted && !handoffCategories.length && !ticket.actionable.length) return null;
  const categories = action === 'handoff' ? handoffCategories : ticket.actionable;
  return <Card style={{ paddingVertical: 3 }}>
    <Disclosure label="More actions" expanded={expanded} onToggle={() => setExpanded(!expanded)}>
      <View style={{ gap: 8, paddingBottom: 12 }}>
        {action && categories.length ? <ProviderResponse key={action} assignment={assignment}
          action={action} categories={categories} close={() => setAction(null)} /> : <>
          {accepted && <WorkerAssignment key={assignment.assignedWorker?.id ?? 'unassigned'} assignment={assignment} />}
          {!!handoffCategories.length && <Btn label="Suggest another partner" quiet onPress={() => setAction('handoff')} />}
          {!!ticket.actionable.length && <Btn label="Decline a need" quiet onPress={() => setAction('decline')} />}
        </>}
      </View>
    </Disclosure>
  </Card>;
}
