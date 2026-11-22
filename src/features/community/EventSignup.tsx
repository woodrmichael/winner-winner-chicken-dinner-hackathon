import { useRouter } from 'expo-router';
import { Check, UsersRound } from 'lucide-react-native';
import { View, type ViewStyle } from 'react-native';
import { useDemo } from '../../state/Demo';
import { Btn, Copy, color, row, wrap } from '../../ui/kit';
import { useSupport } from '../partnerships/useSupport';
import { funding } from '../partnerships/ledger';
import { communityEvents } from './model';
import { SavePostButton } from './SavePostButton';

const footer: ViewStyle = { ...wrap, justifyContent: 'flex-end' };

export function EventSignup({ postId, feed = false, controls = true }: {
  postId: string;
  feed?: boolean;
  controls?: boolean;
}) {
  const { state, shared, run } = useDemo();
  const router = useRouter();
  const { book } = useSupport();
  const event = communityEvents.get(postId);
  if (!event) return null;
  const drive = postId === 'drive';
  const volunteers = shared.data?.volunteers;
  const signup = volunteers?.signup;
  const joined = drive ? !!signup : state.community.joinedEvents.includes(postId);
  const teamPlaces = funding(book?.pledges.filter((pledge) => pledge.project === postId) ?? []).volunteers;
  const tracked = drive ? volunteers?.summary.signups ?? 0 : Number(joined);
  const joinedCount = event.volunteers + tracked + teamPlaces;
  const resident = shared.data?.account.kind === 'resident';

  return (
      <View style={feed ? footer : wrap}>
        <View style={[row, { gap: 14 }]}>
          <View style={[row, { gap: 5 }]}>
            <UsersRound size={16} color={color.muted} />
            <Copy kind="small" tint={color.muted}>{joinedCount} joined</Copy>
          </View>
          {feed && <SavePostButton postId={postId} />}
        </View>
        {controls && resident && (joined ? <Btn label={feed ? 'Joined' : 'Cancel signup'}
          icon={feed ? Check : undefined} secondary accessibilityHint={feed ? 'Cancels your signup' : undefined}
          disabled={drive && signup?.minutes !== undefined}
          onPress={() => drive ? run({ type: 'cancel-volunteer' }) : run({ type: 'event-rsvp', postId, joined: false })} />
          : drive ? <Btn label="Choose a role" secondary accessibilityHint="Opens the event’s volunteer roles"
            onPress={() => router.push({ pathname: '/community-post/[id]', params: { id: postId, from: 'community', focus: 'volunteer' } })} />
          : <Btn label="Join event" secondary celebrate
            onPress={() => run({ type: 'event-rsvp', postId, joined: true })} />)}
      </View>
  );
}
