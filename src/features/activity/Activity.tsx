import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { ClipboardCheck, RotateCcw } from 'lucide-react-native';
import { partnerInbox, residentTimeline, status } from '../../domain/model';
import { SelectionRow, ToggleRow } from '../../ui/SelectionRows';
import { Segments } from '../../ui/Segments';
import { program } from '../../domain/seed';
import type { Category, Referral } from '../../domain/types';
import { directory, partnerName } from '../matching/directory';
import { now, useDemo } from '../../state/Demo';
import { Btn, Card, Copy, Page, color, wrap } from '../../ui/kit';

function stamp(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
function Ticket({
  ticket,
  partnerView,
}: {
  ticket: Omit<Referral, 'residentId'>;
  partnerView: boolean;
}) {
  const { run } = useDemo();
  const provider = directory.find((p) => p.id === ticket.partnerId)!;
  const [category, select] = useState<Category>(
    provider.categories.find((n) => ticket.needs.includes(n)) ?? provider.categories[0],
  );
  const [link, setLink] = useState(true);
  const eligible = provider.id === program.providerId && category === 'Clothing';
  return (
    <Card>
      <View style={[wrap, { justifyContent: 'space-between' }]}>
        <Copy kind="label" tint={color.pine}>
          PRIVATE REFERRAL
        </Copy>
        <Copy kind="strong" tint={color.pine}>
          {status(ticket)}
        </Copy>
      </View>
      <Copy kind="title">{provider.name}</Copy>
      <Copy>{ticket.message}</Copy>
      <Copy kind="small" tint={color.muted}>
        Shared details · {Object.values(ticket.shared).join(' · ') || 'None selected'}
      </Copy>
      <View style={{ paddingLeft: 12, borderLeftWidth: 3, borderColor: color.pine, gap: 4 }}>
        <Copy kind="small">Sent · {stamp(ticket.sentAt)}</Copy>
        {ticket.acceptedAt && <Copy kind="small">Accepted · {stamp(ticket.acceptedAt)}</Copy>}
        {ticket.service && (
          <Copy kind="small">
            {ticket.service.category} delivered by {partnerName(ticket.service.providerId)} ·{' '}
            {stamp(ticket.service.deliveredAt)}
          </Copy>
        )}
      </View>
      {partnerView && !ticket.acceptedAt && (
        <Btn
          label="Accept referral"
          onPress={() => run({ type: 'accept', id: ticket.id, partnerId: provider.id, at: now() })}
        />
      )}
      {partnerView && ticket.acceptedAt && !ticket.service && (
        <>
          <Copy kind="strong">Service delivered</Copy>
          {provider.categories.length > 1 ? (
            <Segments
              options={provider.categories}
              value={category}
              onChange={select}
              label={(item) => item}
            />
          ) : (
            <Copy>{category}</Copy>
          )}
          {eligible && (
            <ToggleRow label="Count toward Winter essentials" value={link} onChange={setLink} />
          )}
          <Btn
            label="Record completed service"
            icon={ClipboardCheck}
            onPress={() =>
              run({
                type: 'complete',
                id: ticket.id,
                partnerId: provider.id,
                category,
                programId: eligible && link ? program.id : undefined,
                at: now(),
              })
            }
          />
        </>
      )}
    </Card>
  );
}
export default function Activity() {
  const { state, role, setRole, partnerId, setPartnerId, reset } = useDemo();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const tickets = role === 'Resident' ? residentTimeline(state) : partnerInbox(state, partnerId);
  return (
    <Page title="Referral activity">
      <Segments
        options={['Resident', 'Partner'] as const}
        value={role}
        onChange={setRole}
        label={(r) => r + ' view'}
      />
      {role === 'Partner' && (
        <Card>
          <Copy kind="strong">Partner inbox</Copy>
          <View accessibilityRole="radiogroup" accessibilityLabel="Partner inbox">
            {directory.map((partner) => (
              <SelectionRow
                key={partner.id}
                label={partner.name}
                selected={partnerId === partner.id}
                onPress={() => setPartnerId(partner.id)}
              />
            ))}
          </View>
        </Card>
      )}
      {tickets.length ? (
        tickets.map((t) => <Ticket key={t.id} ticket={t} partnerView={role === 'Partner'} />)
      ) : (
        <Card>
          <Copy kind="title">Your requests will appear here</Copy>
          <Copy>Follow a private referral from the first message to a completed service.</Copy>
          <Btn label="Ask for help" onPress={() => router.push('/ask')} />
        </Card>
      )}
      <View style={{ gap: 8 }}>
        {confirm && (
          <Copy>
            Reset this workspace? This removes your posts and referral changes on this device.
          </Copy>
        )}
        <View style={wrap}>
          <Btn
            label={confirm ? 'Confirm reset' : 'Reset workspace'}
            icon={RotateCcw}
            secondary
            onPress={async () => {
              if (confirm) {
                await reset();
                setConfirm(false);
                router.replace('/');
              } else setConfirm(true);
            }}
          />
          {confirm && <Btn label="Keep changes" secondary onPress={() => setConfirm(false)} />}
        </View>
      </View>
    </Page>
  );
}
