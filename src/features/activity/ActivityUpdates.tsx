import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import type { ActivityUpdate } from '../../shared/workspace';
import { useDemo } from '../../state/Demo';
import { Btn, Card, Copy, color } from '../../ui/kit';
import { Disclosure } from '../../ui/Disclosure';
import { partnerName } from '../matching/directory';
import { formatActivityTime } from './ReferralDetails';

const labels: Record<ActivityUpdate['kind'], string> = {
  'new-referral': 'New request',
  accepted: 'Request accepted',
  reply: 'New message',
  'proposed-handoff': 'New partner suggested',
};

export function ActivityUpdates({ updates, compact = false }: { updates: ActivityUpdate[]; compact?: boolean }) {
  const { run, state } = useDemo();
  const router = useRouter();
  const [expanded, setExpanded] = useState<boolean>();
  const unread = updates.filter((update) => !update.read);
  if (!updates.length) return null;
  const open = expanded ?? (!compact && unread.length > 0);
  const recent = [...unread, ...updates.filter((update) => update.read).slice(0, 3)];

  return (
    <Card style={compact ? { paddingVertical: 3 } : undefined}>
      <Disclosure label="Referral updates"
        detail={unread.length ? `${unread.length} unread` : 'Recent updates'}
        expanded={open}
        onToggle={() => setExpanded(!open)}
      >
      <View style={{ gap: 8 }}>
      {recent.map((update) => (
        <View key={update.id} style={{ gap: 5, paddingTop: 8, borderTopWidth: 1, borderColor: color.line }}>
          <Copy kind="small" tint={color.muted}>{formatActivityTime(update.at)} · {update.read ? 'Read' : 'Unread'}</Copy>
          <Btn
            label={`${labels[update.kind]} · ${partnerName(state.partners, update.partnerId)}`}
            quiet
            onPress={async () => {
              if (!update.read) await run({ type: 'mark-activity-read', updateId: update.id });
              router.push({
                pathname: '/activity/referral/[id]',
                params: { id: update.assignmentId, focus: update.kind === 'reply' ? 'messages' : 'details' },
              });
            }}
          />
        </View>
      ))}
      </View>
      </Disclosure>
    </Card>
  );
}
