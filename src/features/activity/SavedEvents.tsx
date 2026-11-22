import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { View } from 'react-native';
import { useDemo } from '../../state/Demo';
import { Btn, Card, Copy, color } from '../../ui/kit';
import { communityEvents, communityFeed } from '../community/model';

export function SavedEvents() {
  const router = useRouter();
  const { state } = useDemo();
  const events = communityFeed(state, 'saved').flatMap((post) => {
    const event = post.kind === 'Event' ? communityEvents.get(post.id) : undefined;
    return event ? [{ post, event }] : [];
  });
  if (!events.length) return null;

  return (
    <Card>
      <View accessibilityRole="header"><Copy kind="title">Saved events</Copy></View>
      {events.map(({ post, event }) => (
        <View key={post.id} style={{ borderTopWidth: 1, borderColor: color.line, paddingTop: 4 }}>
          <Btn label={post.title} icon={ArrowRight} quiet onPress={() => router.push({
            pathname: '/community-post/[id]', params: { id: post.id, from: 'activity' },
          })} />
          <Copy kind="small" tint={color.muted}>{event.when} · {event.venue.name}</Copy>
        </View>
      ))}
    </Card>
  );
}
