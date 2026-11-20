import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ArrowUpRight, CalendarDays, HandHeart, MapPin, Plus, Shirt } from 'lucide-react-native';
import { Image, View } from 'react-native';
import { useDemo } from '../../state/Demo';
import { impact, residentTimeline } from '../../domain/model';
import { Btn, Card, Columns, Copy, Page, color, row, wrap } from '../../ui/kit';
import { Segments } from '../../ui/Segments';
import type { Post } from '../../domain/types';

function Bulletin({ post }: { post: Post }) {
  const featured = post.id === 'drive';
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      {featured && (
        <View style={{ height: 204 }}>
          <Image
            source={require('../../../assets/clothing-rack.jpg')}
            accessibilityLabel="Coats and clothing on a rack"
            resizeMode="cover"
            style={{ width: '100%', height: '100%' }}
          />
          <View
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 12,
              paddingVertical: 6,
              alignItems: 'center',
              borderRadius: 12,
            }}
          >
            <Copy kind="label" tint={color.rust}>
              NOV
            </Copy>
            <Copy kind="title" style={{ lineHeight: 29 }}>
              21
            </Copy>
          </View>
        </View>
      )}
      <View style={{ padding: 17, gap: 7 }}>
        <View style={row}>
          {post.kind === 'Event' ? (
            <CalendarDays size={15} color={color.pine} />
          ) : post.kind === 'Offer' ? (
            <Shirt size={15} color={color.pine} />
          ) : (
            <HandHeart size={15} color={color.pine} />
          )}
          <Copy kind="label" tint={color.pine}>
            {post.kind.toUpperCase()}
          </Copy>
          <Copy kind="small" tint={color.muted}>
            · {post.author}
          </Copy>
        </View>
        <Copy kind="title" style={{ fontSize: 25 }}>
          {post.title}
        </Copy>
        <Copy>{post.body}</Copy>
        {featured && (
          <View style={row}>
            <MapPin size={15} color={color.muted} />
            <Copy kind="small" tint={color.muted}>
              Moody Park · Saturday, 10 am
            </Copy>
          </View>
        )}
      </View>
    </Card>
  );
}
export default function Community() {
  const router = useRouter();
  const { state } = useDemo();
  const [filter, setFilter] = useState<'All' | Post['kind']>('All');
  const active = residentTimeline(state).filter((ticket) => !ticket.service).length;
  const actions = (
    <View style={wrap}>
      <Btn label="Ask for help" icon={HandHeart} onPress={() => router.push('/ask')} />
      <Btn label="Post an offer" secondary icon={Plus} onPress={() => router.push('/offer')} />
    </View>
  );
  const stats = impact(state);
  return (
    <Page title="Community" right={actions}>
      <Columns
        main={
          <>
            <Segments
              options={['All', 'Event', 'Offer', 'Update'] as const}
              value={filter}
              onChange={setFilter}
              label={(item) => (item === 'All' ? 'All posts' : item + 's')}
            />
            {state.posts
              .filter((p) => filter === 'All' || p.kind === filter)
              .map((post) => (
                <Bulletin key={post.id} post={post} />
              ))}
          </>
        }
        side={
          <>
            <Card>
              <HandHeart color={color.pine} size={24} />
              <Copy kind="title">Your referrals</Copy>
              <Copy tint={color.muted}>
                {active === 0
                  ? 'No active referrals'
                  : active + (active === 1 ? ' active referral' : ' active referrals')}
              </Copy>
              <Btn label="View activity" secondary onPress={() => router.navigate('/activity')} />
            </Card>
            <Card>
              <Copy kind="label" tint={color.pine}>
                COMMUNITY IMPACT
              </Copy>
              <Copy kind="title" style={{ fontSize: 42, lineHeight: 48 }}>
                {stats.delivered}
              </Copy>
              <Copy>Services delivered by partners</Copy>
              <Btn
                label="See impact"
                icon={ArrowUpRight}
                secondary
                onPress={() => router.navigate('/impact')}
              />
            </Card>
          </>
        }
      />
    </Page>
  );
}
