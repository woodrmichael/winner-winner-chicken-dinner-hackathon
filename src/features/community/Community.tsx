import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ArrowRight, CalendarDays, HandHeart, MapPin, Plus, Search, Shirt } from 'lucide-react-native';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { now, useDemo } from '../../state/Demo';
import { Btn, Card, Copy, Field, Page, color, row, wrap } from '../../ui/kit';
import { SelectMenu } from '../../ui/SelectMenu';
import { tapFeedback } from '../../ui/feedback';
import { neighborhoods, type Post } from '../../domain/types';
import { communityEvents, communityFeed, type CommunityView } from './model';
import { PostTimestamp } from './PostTimestamp';
import { postPhoto } from './postPhotos';
import { EventSignup } from './EventSignup';
import { SavePostButton } from './SavePostButton';

type FeedFilter = 'all' | Post['kind'] | 'groups' | 'saved';
const publicFilters: { value: FeedFilter; label: string }[] = [
  { value: 'all', label: 'All posts' },
  { value: 'Event', label: 'Events' },
  { value: 'Offer', label: 'Offers' },
  { value: 'Update', label: 'Updates' },
];
const personalFilters = [
  ...publicFilters,
  { value: 'groups', label: 'My groups' },
  { value: 'saved', label: 'Saved' },
] satisfies typeof publicFilters;

function Bulletin({ post, wide }: { post: Post; wide: boolean }) {
  const router = useRouter();
  const featured = post.id === 'drive';
  const event = post.kind === 'Event' ? communityEvents.get(post.id) : undefined;
  const photo = postPhoto(post.id);
  function openPost() {
    router.push({ pathname: '/community-post/[id]', params: { id: post.id, from: 'community' } });
  }

  const image = photo && (
    <View style={wide && featured ? { width: '43%', minHeight: 200 } : { height: featured ? 198 : 152 }}>
      <Image source={photo.source} accessibilityLabel={photo.description}
        contentFit="cover" cachePolicy="memory-disk" transition={0}
        style={{ width: '100%', height: '100%' }} />
    </View>
  );
  const contents = (
    <View style={{ flex: wide ? 1 : undefined, padding: 17, paddingBottom: 9, gap: 7 }}>
      <View style={wrap}>
        {post.kind === 'Event' ? <CalendarDays size={15} color={color.pine} />
          : post.kind === 'Offer' ? <Shirt size={15} color={color.pine} />
          : <HandHeart size={15} color={color.pine} />}
        <Copy kind="label" tint={color.pine}>{post.group ?? post.kind.toUpperCase()}</Copy>
        {post.kind === 'Offer' && post.status === 'fulfilled' &&
          <Copy kind="label" tint={color.rust}>FULFILLED</Copy>}
        <Copy kind="small" tint={color.muted}>{post.author}</Copy>
      </View>
      <Copy kind="title" style={featured ? { fontSize: 26 } : undefined}>{post.title}</Copy>
      <Copy>{post.body}</Copy>
      {event ? <View style={wrap}>
        <MapPin size={15} color={color.muted} />
        <Copy kind="small" tint={color.muted}>{event.venue.name} · {event.when}</Copy>
      </View> : <PostTimestamp date={post.date} />}
    </View>
  );
  return (
    <Card style={{ padding: 0, gap: 0, overflow: 'hidden', flex: wide && !featured ? 1 : undefined }}>
      {event ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Open ${post.title}`}
          onPress={() => { tapFeedback(); openPost(); }}
          style={({ pressed }) => ({
            flex: wide ? 1 : undefined,
            flexDirection: wide && featured ? 'row' : 'column',
            opacity: pressed ? 0.82 : 1,
          })}>
          {image}
          {contents}
        </Pressable>
      ) : <>{image}{contents}</>}
      <View style={{ paddingHorizontal: 17, paddingBottom: 12 }}>
        {event ? <EventSignup postId={post.id} feed /> : (
          <View style={[wrap, { justifyContent: 'flex-end' }]}>
            <SavePostButton postId={post.id} />
            {post.kind === 'Offer' && <Btn label="View offer" icon={ArrowRight} secondary onPress={openPost} />}
          </View>
        )}
      </View>
    </Card>
  );
}

function GroupDirectory() {
  const router = useRouter();
  const { state, run } = useDemo();
  return (
    <Card>
      <Copy kind="title">Neighborhood groups</Copy>
      {neighborhoods.map((group) => {
        const joined = state.community.groups.includes(group);
        return (
          <View key={group} style={{ gap: 6 }}>
            <Copy kind="strong">
              {group}{joined ? ' · Joined' : ''}
            </Copy>
            <View style={wrap}>
              {joined && (
                <Btn
                  label={`Post to ${group}`}
                  onPress={() => router.push({ pathname: '/offer', params: { group } })}
                />
              )}
              <Btn
                label={`${joined ? 'Leave' : 'Join'} ${group}`}
                secondary
                onPress={() => run({ type: 'group-membership', group, joined: !joined })}
              />
            </View>
          </View>
        );
      })}
    </Card>
  );
}

function ModerationQueue() {
  const { state, run, shared } = useDemo();
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const reportedIds = [...new Set(
    state.community.reports
      .filter((report) => state.posts.some((post) => post.id === report.postId && post.status !== 'hidden'))
      .map((report) => report.postId),
  )];
  const moderatorId = shared.data?.account.id ?? 'moderator';
  return (
    <Card>
      <Copy kind="title">Moderation queue</Copy>
      {reportedIds.length === 0 && <Copy tint={color.muted}>No reported posts awaiting review.</Copy>}
      {reportedIds.map((postId) => {
        const post = state.posts.find((entry) => entry.id === postId);
        const reports = state.community.reports.filter((report) => report.postId === postId);
        if (!post) return null;
        return (
          <View key={postId} style={{ gap: 6, borderTopWidth: 1, borderColor: color.line, paddingTop: 10 }}>
            <Copy kind="strong">{post.title}</Copy>
            <Copy>{post.body}</Copy>
            {reports.map((report) => (
              <Copy key={report.id} kind="small" tint={color.muted}>
                Report: {report.reason}
              </Copy>
            ))}
            <Field
              label="Moderation reason"
              value={reasons[postId] ?? ''}
              change={(value) => setReasons((current) => ({ ...current, [postId]: value }))}
              multiline
            />
            <Btn
              label="Hide post"
              secondary
              disabled={!(reasons[postId] ?? '').trim()}
              onPress={() => run({
                type: 'hide-post',
                postId,
                moderatorId,
                reason: reasons[postId],
                at: now(),
              })}
            />
          </View>
        );
      })}
    </Card>
  );
}

export default function Community({ view }: { view?: string }) {
  const router = useRouter();
  const { state, shared, role } = useDemo();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const partner = shared.data?.account.kind === 'worker';
  const options = partner ? publicFilters : personalFilters;
  const filter = options.find(({ value }) => value === view)?.value ?? 'all';
  const activeView: CommunityView = filter === 'groups' || filter === 'saved' ? filter : 'board';
  const accountId = shared.data?.account.id ?? '';
  const [searches, setSearches] = useState<Record<string, { query: string; open: boolean }>>({});
  const { query, open: showSearch } = searches[accountId] ?? { query: '', open: false };
  function updateSearch(next: string, open: boolean) {
    setSearches((current) => ({ ...current, [accountId]: { query: next, open } }));
  }
  const searching = !!query.trim();
  const posts = communityFeed(state, activeView, query).filter(
    (post) => activeView !== 'board' || filter === 'all' || post.kind === filter,
  ).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  const emptyFeed = {
    board: 'No posts in this category yet.',
    groups: state.community.groups.length ? 'No posts in your groups yet.' : 'Join a neighborhood group to see its posts here.',
    saved: 'Save a post to find it here later.',
  };
  const postRows = posts.reduce<Post[][]>((rows, post) => {
    const last = rows.at(-1);
    if (wide && post.id !== 'drive' && last?.length === 1 && last[0].id !== 'drive') {
      last.push(post);
    } else {
      rows.push([post]);
    }
    return rows;
  }, []);
  const actions = (
    <View style={wrap}>
      {partner ? (
        <Btn label="Open inbox" icon={ArrowRight} secondary onPress={() => router.navigate('/activity')} />
      ) : (
        <>
          <Btn label="Ask for help" icon={HandHeart} onPress={() => router.push('/ask')} />
          <Btn label="Post an offer" quiet icon={Plus} onPress={() => router.push('/offer')} />
        </>
      )}
    </View>
  );

  return (
    <Page title="Community" right={actions}>
      {role === 'Moderator' && <ModerationQueue />}
      <View style={[row, { justifyContent: 'space-between' }]}>
        <SelectMenu label="Filter posts" value={filter} options={options} appearance="pill" align="start"
          onChange={(next) => router.setParams({ view: next })} />
        <Btn label={showSearch ? 'Close search' : 'Search posts'} icon={Search} quiet
          onPress={() => updateSearch(showSearch ? '' : query, !showSearch)} />
      </View>
      {showSearch && <Field label="Search posts" value={query} change={(text) => updateSearch(text, true)} placeholder="Coats, winter drive, pantry" />}
      {activeView === 'groups' && !searching && <GroupDirectory />}
      {postRows.map(([post, next]) => !wide || post.id === 'drive' ? (
        <Bulletin key={post.id} post={post} wide={wide} />
      ) : (
        <View key={post.id} style={{ flexDirection: 'row', gap: 14 }}>
          <Bulletin post={post} wide />
          {next ? <Bulletin post={next} wide /> : <View style={{ flex: 1 }} />}
        </View>
      ))}
      {!posts.length && <View accessibilityLiveRegion="polite">
        <Copy tint={color.muted}>{searching ? 'No posts match your search.' : emptyFeed[activeView]}</Copy>
      </View>}
    </Page>
  );
}
