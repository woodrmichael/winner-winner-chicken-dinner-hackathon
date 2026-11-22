import { useRouter } from 'expo-router';
import { View } from 'react-native';
import type { Appointment, Category, ReferralAssignment, Service } from '../../domain/types';
import { Btn, Copy, color } from '../../ui/kit';
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

export function formatActivityTime(at: string) {
  return localStamp.format(new Date(at));
}

export function ConversationLink({ assignment }: { assignment: ReferralAssignment }) {
  const router = useRouter();
  return (
    <Btn
      label={`Open private conversation · ${partnerName(assignment.partnerId)}`}
      secondary
      onPress={() => router.push({ pathname: '/activity/referral/[id]', params: { id: assignment.id, focus: 'messages' } })}
    />
  );
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
  services,
  withdrawn = [],
}: {
  outstanding: Category[];
  services: Service[];
  withdrawn?: Category[];
}) {
  return (
    <View style={{ gap: 6 }}>
      {outstanding.length > 0 && (
        <Copy kind="strong">Outstanding · {listWords(outstanding.map(needName))}</Copy>
      )}
      {services.map((service) => (
        <Copy kind="small" key={service.assignmentId + ':' + service.category}>
          {service.category} delivered by {partnerName(service.providerId)} ·{' '}
          {localStamp.format(new Date(service.deliveredAt))}
        </Copy>
      ))}
      {withdrawn.length > 0 && (
        <Copy kind="small">Withdrawn · {listWords(withdrawn.map(needName))}</Copy>
      )}
    </View>
  );
}

export function AssignmentHistory({ assignment }: { assignment: ReferralAssignment }) {
  return (
    <View style={{ gap: 4 }}>
      <Copy kind="small">Sent · {localStamp.format(new Date(assignment.sentAt))}</Copy>
      {assignment.acceptedAt && (
        <Copy kind="small">Accepted · {localStamp.format(new Date(assignment.acceptedAt))}</Copy>
      )}
      {Object.entries(assignment.declines).map(([category, decline]) => (
        <View key={category} style={{ gap: 2 }}>
          <Copy kind="strong">{needName(category as Category)} declined</Copy>
          <Copy>{decline.reason}</Copy>
        </View>
      ))}
    </View>
  );
}

export function AppointmentDetails({ appointment }: { appointment: Appointment }) {
  return (
    <View style={{ gap: 4, borderLeftWidth: 3, borderColor: color.pine, paddingLeft: 12 }}>
      <Copy kind="strong">Pickup or visit</Copy>
      <Copy>
        {appointmentStamp.format(new Date(appointment.date + 'T' + appointment.time + ':00Z'))}{' '}
        Milwaukee time
      </Copy>
      {appointment.instructions ? <Copy>{appointment.instructions}</Copy> : null}
    </View>
  );
}
