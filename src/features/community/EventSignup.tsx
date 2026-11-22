import { useState } from 'react';
import { UsersRound } from 'lucide-react-native';
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
  const { book } = useSupport();
  const [chooseRole, setChooseRole] = useState(false);
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
    <View style={{ gap: 8 }}>
      <View style={feed ? footer : wrap}>
        <View style={[row, { gap: 14 }]}>
          <View style={[row, { gap: 5 }]}>
            <UsersRound size={16} color={color.muted} />
            <Copy kind="small" tint={color.muted}>{joinedCount} joined</Copy>
          </View>
          {feed && <SavePostButton postId={postId} />}
        </View>
        {controls && resident && (drive ? (
          joined ? <Copy kind="strong" tint={color.pine}>Joined</Copy> :
            <Btn label={chooseRole ? 'Close volunteer roles' : 'Join event'} secondary
              onPress={() => setChooseRole(!chooseRole)} />
        ) : <Btn label={joined ? 'Cancel signup' : 'Join event'} secondary celebrate
          onPress={() => run({ type: 'event-rsvp', postId, joined: !joined })} />)}
      </View>
      {controls && drive && resident && !joined && chooseRole && volunteers?.roles.map((role) => (
        <View key={role.id} style={[wrap, { justifyContent: 'space-between', borderTopWidth: 1, borderColor: color.line }]}>
          <Copy kind="small">{role.name} ({role.reserved}/{role.capacity})</Copy>
          <Btn label={`Reserve ${role.name.toLowerCase()}`} quiet disabled={role.reserved >= role.capacity} celebrate
            onPress={async () => {
              await run({ type: 'reserve-volunteer', roleId: role.id });
              setChooseRole(false);
            }} />
        </View>
      ))}
    </View>
  );
}
