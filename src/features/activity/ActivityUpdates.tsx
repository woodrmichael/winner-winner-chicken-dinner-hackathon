import { useRouter } from 'expo-router';
import { View } from 'react-native';
import type { ActivityUpdate } from '../../shared/workspace';
import { useDemo } from '../../state/Demo';
import { Btn, Card, Copy, color } from '../../ui/kit';
import { partnerName } from '../matching/directory';
import { formatActivityTime } from './ReferralDetails';

const labels: Record<ActivityUpdate['kind'], string> = {
  'new-referral': 'new referral',
  accepted: 'referral acceptance',
  reply: 'private reply',
  'proposed-handoff': 'proposed handoff',
};

export function ActivityUpdates({ updates }: { updates: ActivityUpdate[] }) {
  const { run } = useDemo();
  const router = useRouter();
  const unread = updates.filter((update) => !update.read);
  const recent = [...unread, ...updates.filter((update) => update.read).slice(0, 3)];

  return (
    <Card>
      <Copy kind="title">Updates</Copy>
      <View accessibilityLiveRegion="polite">
        <Copy tint={unread.length ? color.pine : color.muted}>
          {unread.length === 0 ? 'No unread updates' : `${unread.length} unread ${unread.length === 1 ? 'update' : 'updates'}`}
        </Copy>
      </View>
      {recent.map((update) => (
        <View key={update.id} style={{ gap: 5, paddingTop: 8, borderTopWidth: 1, borderColor: color.line }}>
          <Copy kind="small" tint={color.muted}>{formatActivityTime(update.at)} · {update.read ? 'Read' : 'Unread'}</Copy>
          <Btn
            label={`Open ${update.read ? '' : 'unread '}${labels[update.kind]} · ${partnerName(update.partnerId)}`}
            secondary
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
    </Card>
  );
}
