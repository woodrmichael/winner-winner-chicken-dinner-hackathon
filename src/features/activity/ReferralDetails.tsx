import type { PropsWithChildren } from 'react';
import { CalendarDays, Check, Clock3, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { categories, type Appointment, type Category, type ReferralAssignment, type Service } from '../../domain/types';
import type { partnerInbox } from '../../domain/referrals';
import { Card, Copy, color, row } from '../../ui/kit';
import { listWords, partnerName } from '../matching/directory';

const localStamp = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
const appointmentStamp = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function needName(category: Category) {
  return category === 'Other' ? 'Other help' : category;
}

export function partnerRequestTitle({ assignment, outstanding, services }: ReturnType<typeof partnerInbox>[number]) {
  const requested = categories.filter((category) => assignment.category === category
    || outstanding.includes(category) || !!assignment.declines[category]
    || services.some((service) => service.category === category));
  return listWords(requested.map(needName)) || 'Service request';
}

export function formatActivityTime(at: string) {
  return localStamp.format(new Date(at));
}

export function SharedWith({ assignment }: { assignment: ReferralAssignment }) {
  return (
    <Copy kind="small" tint={color.muted}>
      Shared details · {Object.values(assignment.shared).join(' · ') || 'None selected'}
    </Copy>
  );
}

export function ReferralDetails({
  outstanding,
  withdrawn = [],
}: {
  outstanding: Category[];
  withdrawn?: Category[];
}) {
  return (
    <View style={{ gap: 6 }}>
      {outstanding.length > 0 && (
        <Copy kind="strong">Outstanding · {listWords(outstanding.map(needName))}</Copy>
      )}
      {withdrawn.length > 0 && (
        <Copy kind="small">Withdrawn · {listWords(withdrawn.map(needName))}</Copy>
      )}
    </View>
  );
}

export function RequestStatus({ status }: { status: string }) {
  return <View style={{ alignSelf: 'flex-start', backgroundColor: color.pale, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
    <Copy kind="small" tint={color.pine}>{status}</Copy>
  </View>;
}

function TimelineEntry({ icon: Icon, continues, emphasized = false, children }: PropsWithChildren<{
  icon: LucideIcon; continues: boolean; emphasized?: boolean;
}>) {
  return <View style={[row, { alignItems: 'stretch' }]}>
    <View style={{ width: 24, alignItems: 'center' }}>
      <View style={{ borderRadius: 12, width: 24, height: 24, backgroundColor: emphasized ? color.pine : color.pale,
        alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={14} color={emphasized ? color.paper : color.pine} />
      </View>
      {continues && <View style={{ width: 2, flex: 1, backgroundColor: color.line }} />}
    </View>
    <View style={{ flex: 1, minWidth: 0, gap: 3, paddingTop: 2, paddingBottom: continues ? 14 : 0 }}>
      {children}
    </View>
  </View>;
}

export function RequestTimeline({ assignments, services, upcoming, currentPartnerId, children }: PropsWithChildren<{
  assignments: ReferralAssignment[]; services: Service[]; upcoming: ReferralAssignment[]; currentPartnerId?: string;
}>) {
  const provider = (id: string) => id === currentPartnerId ? '' : partnerName(id);
  const steps = assignments.flatMap((assignment, index) => [
    { id: assignment.id + ':sent', at: assignment.sentAt,
      title: index === 0 ? 'Request sent' : 'Request forwarded', detail: provider(assignment.partnerId) },
    ...(assignment.acceptedAt ? [{ id: assignment.id + ':accepted', at: assignment.acceptedAt,
      title: 'Referral accepted', detail: provider(assignment.partnerId) }] : []),
    ...Object.entries(assignment.declines).map(([category, decline]) => ({
      id: assignment.id + ':' + category, at: decline.at,
      title: needName(category as Category) + ' declined', detail: decline.reason,
    })),
  ]).concat(services.filter((service) => !service.voidedAt).map((service) => ({
    id: service.id, at: service.deliveredAt, title: needName(service.category) + ' delivered', detail: provider(service.providerId),
  }))).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const appointments = upcoming.filter((assignment) => assignment.appointment);

  return <Card>
    <View accessibilityRole="header"><Copy kind="title">Request timeline</Copy></View>
    <View>
      {steps.map((step, index) => <TimelineEntry key={step.id} icon={Check}
        continues={index < steps.length - 1 || appointments.length > 0 || !!children}>
        <Copy kind="strong">{step.title}</Copy>
        <Copy kind="small" tint={color.muted}>{[formatActivityTime(step.at), step.detail].filter(Boolean).join(' · ')}</Copy>
      </TimelineEntry>)}
      {appointments.map((assignment, index) => <TimelineEntry key={assignment.id} icon={CalendarDays}
        continues={index < appointments.length - 1 || !!children}>
        <AppointmentDetails appointment={assignment.appointment!} />
      </TimelineEntry>)}
      {children && <TimelineEntry icon={Clock3} emphasized continues={false}>{children}</TimelineEntry>}
    </View>
  </Card>;
}

function AppointmentDetails({ appointment }: { appointment: Appointment }) {
  return (
    <View style={{ gap: 4 }}>
      <Copy kind="strong">Pickup scheduled</Copy>
      <Copy kind="small" tint={color.muted}>
        {appointmentStamp.format(new Date(appointment.date + 'T' + appointment.time + ':00Z'))}{' '}
        Milwaukee time
      </Copy>
      {appointment.instructions ? <Copy>{appointment.instructions}</Copy> : null}
    </View>
  );
}
