import { useRef, useState, type ComponentRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, type ScrollView, type LayoutChangeEvent } from 'react-native';
import { Image } from 'expo-image';
import type { Post } from '../../domain/types';
import { newId, now, useDemo } from '../../state/Demo';
import { residentId } from '../../domain/seed';
import { Btn, Card, Copy, Field, Page, color, row } from '../../ui/kit';
import { BackButton } from '../../ui/BackButton';
import { communityEvents, residentAuthor } from './model';
import { PostTimestamp } from './PostTimestamp';
import { postPhoto } from './postPhotos';
import { SavePostButton } from './SavePostButton';
import { projects, funding } from '../partnerships/ledger';
import { ProjectFunding } from '../partnerships/ProjectFunding';
import { useSupport } from '../partnerships/useSupport';
import { Disclosure } from '../../ui/Disclosure';
import { EventSignup } from './EventSignup';
import { VolunteerOptions } from '../volunteer/Volunteer';
import VenueMap from '../map/VenueMap';

function OfferThread({ post }: { post: Post }) {
  const { state, run, shared } = useDemo();
  const [body, setBody] = useState('');
  const replies = state.community.replies.filter((reply) => reply.postId === post.id);
  const readerName = post.author === residentAuthor ? 'Jordan' : residentAuthor;
  const account = shared.data?.account;
  const from = account && post.authorId === account.id ? 'author' : 'resident';

  return (
    <Card>
      <Copy kind="title">Replies</Copy>
      {replies.length === 0 && <Copy tint={color.muted}>No replies yet.</Copy>}
      {replies.map((reply) => (
        <View
          key={reply.id}
          style={{ gap: 4, borderTopWidth: 1, borderColor: color.line, paddingTop: 10 }}
        >
          <Copy kind="strong">
            {reply.authorName ?? (reply.from === 'author' ? post.author : readerName)}
            {reply.from === 'author' ? ' · Offer author' : ''}
          </Copy>
          <Copy>{reply.body}</Copy>
        </View>
      ))}
      {account && <>
      <Field label="Public reply" value={body} change={setBody} multiline />
      <Btn
        label="Post reply"
        disabled={!body.trim()}
        onPress={async () => {
          await run({ type: 'reply', id: newId(), postId: post.id, from, body, at: now() });
          setBody('');
        }}
      />
      </>}
    </Card>
  );
}

function EventDetails({ postId, onVolunteerLayout }: { postId: string; onVolunteerLayout?: (event: LayoutChangeEvent) => void }) {
  const router = useRouter();
  const { book, coordinator } = useSupport();
  const project = projects.find((p) => p.id === postId);
  const teamPlaces = funding(book?.pledges.filter((p) => p.project === postId) ?? []).volunteers;
  const event = communityEvents.get(postId);
  if (!event) return null;
  const sharedDrive = postId === 'drive';
  const { venue } = event;

  return (
    <>
      <Card>
        <Copy kind="strong">{event.when}</Copy>
        <View style={{ gap: 3 }}>
          <Copy kind="strong">{venue.name}</Copy>
          <Copy kind="small" tint={color.muted}>{venue.address}</Copy>
        </View>
        <EventSignup postId={postId} controls={!sharedDrive} />
        <VenueMap name={venue.name} />
        <View style={{ gap: 3 }}>
          <Copy kind="strong">What to bring</Copy>
          <Copy>{event.bring}</Copy>
        </View>
      </Card>
      {sharedDrive && <View onLayout={onVolunteerLayout} style={{ gap: 16 }}>
        <VolunteerOptions openSettings={() => router.navigate('/settings')} />
      </View>}
      {project && <Card>
        <Copy kind="title">Project support</Copy>
        <Copy>Organized by {project.organizer}</Copy>
        {book && <ProjectFunding goal={project.goal} pledges={book.pledges.filter((p) => p.project === project.id)} />}
        <Copy>{project.supplies}</Copy>
        <Copy>{teamPlaces} volunteer places confirmed through businesses</Copy>
        {coordinator && sharedDrive ? (
          <Btn label="Manage project support" secondary onPress={() => router.push({
            pathname: '/partnerships', params: { project: project.id, action: 'coordinator' },
          })} />
        ) : <Btn label="See sponsorship options" secondary onPress={() => router.push({
          pathname: '/partnerships', params: { project: project.id },
        })} />}
      </Card>}
    </>
  );
}

export default function PostDetails() {
  const { id, from, focus } = useLocalSearchParams<{ id: string; from?: string; focus?: string }>();
  const router = useRouter();
  const { state, role, run, shared } = useDemo();
  const post = state.posts.find((item) =>
    item.id === id &&
    !item.group &&
    (role === 'Moderator' || item.status !== 'hidden'));
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(post?.title ?? '');
  const [body, setBody] = useState(post?.body ?? '');
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const jumped = useRef(false);

  function jumpToRoles({ nativeEvent }: LayoutChangeEvent) {
    if (focus !== 'volunteer' || jumped.current) return;
    jumped.current = true;
    const offset = nativeEvent.layout.y;
    requestAnimationFrame(() => scroll.current?.scrollTo({ y: Math.max(0, offset - 12), animated: false }));
  }
  const origin = from === 'map' ? { path: '/map', title: 'Map' } as const
    : from === 'activity' ? { path: '/activity', title: 'Activity' } as const
    : { path: '/', title: 'Community' } as const;
  const back = <BackButton
    label={`Back to ${origin.title}`}
    onPress={() => {
      if (from && router.canGoBack()) router.back();
      else router.navigate(origin.path);
    }}
  />;
  const actorId = shared.data?.account.id ?? residentId;
  const isAuthor = !!post?.authorId && post.authorId === actorId;
  const status = post?.status ?? 'active';
  const photo = post ? postPhoto(post.id, true) : undefined;

  return (
    <Page title={post?.title ?? 'Post unavailable'} back={back} scrollRef={scroll}>
      {post && (
        <>
          {photo && <Image source={photo.source} accessibilityLabel={photo.description}
            contentFit="cover" cachePolicy="memory-disk" loading="eager" transition={0}
            style={{ width: '100%', height: 184, borderRadius: 15 }} />}
          <Card>
            <Copy kind="small" tint={color.muted}>{post.author}</Copy>
            {post.kind === 'Offer' && (
              <Copy kind="label" tint={status === 'fulfilled' ? color.rust : color.pine}>
                {status === 'fulfilled' ? 'FULFILLED' : 'AVAILABLE'}
              </Copy>
            )}
            {editing ? (
              <View style={{ gap: 8 }}>
                <Field label="Offer title" value={title} change={setTitle} />
                <Field label="Description" value={body} change={setBody} multiline />
              </View>
            ) : (
              <Copy>{post.body}</Copy>
            )}
            <View style={row}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <PostTimestamp date={post.date} />
              </View>
              <SavePostButton postId={post.id} />
            </View>
            {post.kind === 'Offer' && isAuthor && role === 'Resident' && (
              <View style={[row, { flexWrap: 'wrap', gap: 8 }]}>
                {editing ? (
                  <>
                    <Btn label="Save changes" disabled={!title.trim() || !body.trim()} onPress={async () => {
                      await run({ type: 'edit-post', postId: post.id, authorId: actorId, title, body });
                      setEditing(false);
                      setFeedback('Offer updated.');
                    }} />
                    <Btn label="Cancel" secondary onPress={() => {
                      setTitle(post.title);
                      setBody(post.body);
                      setEditing(false);
                    }} />
                  </>
                ) : (
                  <Btn label="Edit offer" secondary onPress={() => setEditing(true)} />
                )}
                {status !== 'fulfilled' && (
                  <Btn label="Mark fulfilled" secondary onPress={async () => {
                    await run({ type: 'close-post', postId: post.id, authorId: actorId });
                    setFeedback('Offer marked fulfilled.');
                  }} />
                )}
              </View>
            )}
            {feedback ? <Copy kind="small" tint={color.pine}>{feedback}</Copy> : null}
          </Card>
          {post.kind === 'Offer' && <OfferThread key={`${post.id}:${actorId}`} post={post} />}
          {post.kind === 'Offer' && role === 'Resident' && (
            <Card>
              <Disclosure label="Report offer" expanded={reportOpen} onToggle={() => setReportOpen(!reportOpen)}>
                <Field label="Report reason" value={reason} change={setReason} multiline />
                <Btn label="Submit report" secondary disabled={!reason.trim()} onPress={async () => {
                  await run({
                    type: 'report-post', id: newId(), postId: post.id, reporterId: actorId, reason, at: now(),
                  });
                  setReason('');
                  setReportOpen(false);
                  setReported(true);
                }} />
              </Disclosure>
              {reported && <Copy kind="small" tint={color.pine}>Report submitted for moderator review.</Copy>}
            </Card>
          )}
          {post.kind === 'Event' && <EventDetails postId={post.id} onVolunteerLayout={focus === 'volunteer' ? jumpToRoles : undefined} />}
        </>
      )}
    </Page>
  );
}
