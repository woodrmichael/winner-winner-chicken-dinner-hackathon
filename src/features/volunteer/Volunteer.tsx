import { funding } from '../partnerships/ledger';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { program } from '../../domain/seed';
import type { VolunteerRole, VolunteerView } from '../../shared/workspace';
import { useDemo } from '../../state/Demo';
import { Btn, Card, Copy, Field, color } from '../../ui/kit';
import { communityEvents } from '../community/model';
import { partnerName } from '../matching/directory';

function duration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return [hours ? `${hours} ${hours === 1 ? 'hour' : 'hours'}` : '', remaining ? `${remaining} min` : '']
    .filter(Boolean).join(' ') || '0 hours';
}

function RoleEditor({ role }: { role: VolunteerRole }) {
  const { run } = useDemo();
  const [capacity, setCapacity] = useState(String(role.capacity));
  const [instructions, setInstructions] = useState(role.instructions);
  const count = Number(capacity);
  return (
    <View style={{ gap: 8 }}>
      <Field label={`${role.name} capacity`} value={capacity} change={setCapacity} />
      <Field label={`${role.name} instructions`} value={instructions} change={setInstructions} multiline />
      <Btn label={`Save ${role.name.toLowerCase()} settings`} secondary
        disabled={!Number.isInteger(count) || count < 1 || count > 100 || !instructions.trim()}
        onPress={() => run({ type: 'update-volunteer-role', roleId: role.id, capacity: count, instructions })} />
    </View>
  );
}

function Attendance({ signup, roleName }: { signup: VolunteerView['roster'][number]; roleName: string }) {
  const { run } = useDemo();
  const [minutes, setMinutes] = useState(signup.minutes === undefined ? '' : String(signup.minutes));
  const count = Number(minutes);
  return (
    <View style={{ gap: 6, borderTopWidth: 1, borderTopColor: color.line, paddingTop: 10 }}>
      <Copy kind="strong">{signup.name} · {roleName}</Copy>
      <Copy kind="small">{signup.minutes === undefined ? 'Attendance pending' : signup.minutes > 0
        ? `${duration(signup.minutes)} confirmed` : 'Did not attend'}</Copy>
      <Field label={`Minutes worked by ${signup.name}`} value={minutes} change={setMinutes} placeholder="Use 0 for a no-show" />
      <Btn label={`Record attendance for ${signup.name}`}
        disabled={!minutes.trim() || !Number.isInteger(count) || count < 0 || count > 1440}
        onPress={() => run({ type: 'record-attendance', accountId: signup.accountId, minutes: count })} />
    </View>
  );
}

export function VolunteerOptions({ openSettings }: { openSettings: () => void }) {
  const { shared, run } = useDemo();
  if (!shared.data) {
    return (
      <Card>
        <Copy kind="title">Volunteer at the winter drive</Copy>
        <Copy>Sign in to see open roles and reserve a place.</Copy>
        <Btn label="Open Settings" onPress={openSettings} />
      </Card>
    );
  }

  const { account, volunteers } = shared.data;
  const { roles, signup, roster, summary } = volunteers;
  const membership = account.membership;
  const organizer = membership?.admin && membership.status === 'approved' && membership.partnerId === program.providerId;
  return (
    <>
      <Card>
        <Copy kind="title">Volunteer roles</Copy>
        {roles.map((role) => {
          const reserved = signup?.roleId === role.id;
          const full = role.reserved >= role.capacity;
          return (
            <View key={role.id} style={{ gap: 6 }}>
              <Copy kind="strong">{role.name}</Copy>
              <Copy>{role.reserved} of {role.capacity} filled{full ? ' · Full' : ''}</Copy>
              <Copy>{role.instructions}</Copy>
              {reserved ? (
                <>
                  <Copy kind="strong" tint={color.pine}>You’re signed up</Copy>
                  {signup.minutes === undefined && <Btn label="Cancel volunteer signup" secondary
                    onPress={() => run({ type: 'cancel-volunteer' })} />}
                </>
              ) : !signup && (
                <Btn label={`Reserve ${role.name.toLowerCase()}`} disabled={full}
                  onPress={() => run({ type: 'reserve-volunteer', roleId: role.id })} />
              )}
              {organizer && <RoleEditor role={role} />}
            </View>
          );
        })}
      </Card>
      <Card>
        <Copy kind="title">Volunteer project summary</Copy>
        <Copy>Staffing commitments: {summary.signups + funding(shared.data.support.pledges.filter((p) => p.project === 'drive')).volunteers}</Copy>
        <Copy>Individual sign-ups: {summary.signups}</Copy>
        <Copy>Participants: {summary.participants}</Copy>
        <Copy>Contributed time: {duration(summary.minutes)}</Copy>
      </Card>
      {organizer && (
        <Card>
          <Copy kind="title">Record attendance</Copy>
          {!roster.length && <Copy>No volunteers have signed up yet.</Copy>}
          {roster.map((entry) => (
            <Attendance key={entry.accountId} signup={entry}
              roleName={roles.find(({ id }) => id === entry.roleId)?.name ?? 'Volunteer'} />
          ))}
        </Card>
      )}
    </>
  );
}

export function VolunteerActivity() {
  const { shared, run } = useDemo();
  const current = shared.data;
  const signup = current?.volunteers.signup;
  const role = current?.volunteers.roles.find(({ id }) => id === signup?.roleId);
  if (!current || !signup || !role) return null;
  const event = communityEvents.get('drive')!;

  return (
    <Card>
      <Copy kind="title">Winter essentials drive</Copy>
      <Copy kind="strong">{role.name}</Copy>
      <Copy>{event.when} · {event.where}</Copy>
      <Copy>{role.instructions}</Copy>
      {signup.minutes === undefined ? (
        <Btn label="Cancel volunteer signup" secondary onPress={() => run({ type: 'cancel-volunteer' })} />
      ) : signup.minutes > 0 ? (
        <>
          <Copy kind="strong">Confirmed volunteer service</Copy>
          <Text selectable style={{ color: color.ink, fontSize: 15, lineHeight: 22 }}>
            {current.account.name} volunteered for {duration(signup.minutes)} in {role.name.toLowerCase()} at the Winter essentials drive on {event.when}. Hours confirmed by {partnerName(program.providerId)}.
          </Text>
          <Copy kind="small" tint={color.muted}>Copy this confirmation for an eligible employer volunteer grant request.</Copy>
        </>
      ) : <Copy>Organizer recorded a no-show.</Copy>}
    </Card>
  );
}
