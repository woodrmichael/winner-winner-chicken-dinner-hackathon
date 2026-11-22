import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import type { partnerInbox } from '../../domain/referrals';
import { Segments } from '../../ui/Segments';
import { SelectMenu } from '../../ui/SelectMenu';
import { Btn, Card, Copy, color, row, wrap } from '../../ui/kit';
import { tapFeedback } from '../../ui/feedback';
import { formatActivityTime, partnerRequestTitle, RequestStatus } from './ReferralDetails';

type Ticket = ReturnType<typeof partnerInbox>[number];
const queues = ['New', 'In progress', 'History'] as const;
const scopes = [{ value: 'team', label: 'Team' }, { value: 'mine', label: 'Assigned to me' }] as const;
const pageSize = 8;
const empty = {
  New: 'New requests will appear here when a resident sends a referral to your organization.',
  'In progress': 'Accepted requests appear here while services are being coordinated.',
  History: 'Completed, declined and closed requests will appear here.',
};

export function PartnerInbox({ tickets, organization, workerId }: {
  tickets: Ticket[];
  organization: string;
  workerId: string;
}) {
  const router = useRouter();
  const [scope, setScope] = useState<(typeof scopes)[number]['value']>('team');
  const [queue, setQueue] = useState<(typeof queues)[number]>('New');
  const [limit, setLimit] = useState(pageSize);
  const scoped = scope === 'mine' ? tickets.filter(({ assignment }) => assignment.assignedWorker?.id === workerId) : tickets;
  const cases = scoped.filter(({ status }) => {
    if (queue === 'New') return status === 'Sent';
    if (queue === 'In progress') return status === 'Accepted';
    return status !== 'Sent' && status !== 'Accepted';
  });

  return <View style={{ gap: 12 }}>
    <View style={[wrap, { justifyContent: 'space-between' }]}>
      <Copy kind="strong" style={{ flexShrink: 1 }}>{organization}</Copy>
      <SelectMenu label="Inbox scope" options={scopes} value={scope} appearance="pill"
        onChange={(next) => { setScope(next); setLimit(pageSize); }} />
    </View>
    <Segments options={queues} value={queue} label={(value) => value}
      onChange={(next) => { setQueue(next); setLimit(pageSize); }} />
    {cases.length ? <>
      <Copy kind="small" tint={color.muted} style={{ paddingHorizontal: 3 }}>
        {cases.length} {cases.length === 1 ? 'request' : 'requests'}
      </Copy>
      <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
        {cases.slice(0, limit).map((ticket, index) => {
          const { assignment } = ticket;
          const title = partnerRequestTitle(ticket);
          const timestamp = formatActivityTime(assignment.sentAt);
          const context = [assignment.shared.neighborhood, assignment.assignedWorker?.name].filter(Boolean).join(' · ');
          return <Pressable key={assignment.id} accessibilityRole="button"
            accessibilityLabel={[title, assignment.message, context, timestamp, queue === 'History' ? ticket.status : ''].filter(Boolean).join('. ')}
            onPress={() => {
              tapFeedback();
              router.push({ pathname: '/activity/referral/[id]', params: { id: assignment.id } });
            }}
            style={({ pressed }) => [row, {
              paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: index ? 1 : 0,
              borderColor: color.line, backgroundColor: pressed ? color.pale : color.paper,
            }]}
          >
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <View style={[wrap, { justifyContent: 'space-between', rowGap: 3 }]}>
                <Copy kind="strong" style={{ flexShrink: 1 }}>{title}</Copy>
                <Copy kind="small" tint={color.muted}>{timestamp}</Copy>
              </View>
              <Copy tint={color.muted} numberOfLines={2}>{assignment.message}</Copy>
              {(context || queue === 'History') && <View style={wrap}>
                {context ? <Copy kind="small" tint={color.muted}>{context}</Copy> : null}
                {queue === 'History' && <RequestStatus status={ticket.status} />}
              </View>}
            </View>
            <ChevronRight size={17} color={color.pine} />
          </Pressable>;
        })}
      </Card>
      {cases.length > limit && <Btn label="Show more requests" secondary onPress={() => setLimit(limit + pageSize)} />}
    </> : <Card>
      <Copy kind="strong">{scope === 'mine' ? 'No requests assigned to you here' : 'No requests in this queue'}</Copy>
      <Copy tint={color.muted}>{scope === 'mine' ? 'Switch to Team to see your organization’s requests.' : empty[queue]}</Copy>
    </Card>}
  </View>;
}
