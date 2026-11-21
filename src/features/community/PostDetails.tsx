import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import type { Post } from '../../domain/types';
import { newId, now, useDemo } from '../../state/Demo';
import { residentId } from '../../domain/seed';
import { Btn, Card, Copy, Field, Page, color, row } from '../../ui/kit';
import { communityEvents, residentAuthor } from './model';
import { PostTimestamp } from './PostTimestamp';
import { SavePostButton } from './SavePostButton';
import { projects, funding } from '../partnerships/ledger';
import { ProjectFunding } from '../partnerships/ProjectFunding';
import { useSupport } from '../partnerships/useSupport';
import { VolunteerOptions } from '../volunteer/Volunteer';

function OfferThread({ post }: { post: Post }) {
  const { state, run, offerReplyFrom: from } = useDemo();
  const [body, setBody] = useState('');
  const replies = state.community.replies.filter((reply) => reply.postId === post.id);
  const readerName = post.author === residentAuthor ? 'Jordan' : residentAuthor;

  return (
    <Card>
      <Copy kind="title">Offer replies</Copy>
      {replies.length === 0 && <Copy tint={color.muted}>No replies yet.</Copy>}
      {replies.map((reply) => (
        <View
          key={reply.id}
          style={{ gap: 4, borderTopWidth: 1, borderColor: color.line, paddingTop: 10 }}
        >
          <Copy kind="strong">
            {reply.from === 'author' ? `${post.author} · Offer author` : readerName}
          </Copy>
          <Copy>{reply.body}</Copy>
        </View>
      ))}
      <Copy kind="small" tint={color.muted}>
        Replying as {from === 'author' ? post.author : readerName}
      </Copy>
      <Field label="Public reply" value={body} change={setBody} multiline />
      <Btn
        label="Post reply"
        disabled={!body.trim()}
        onPress={async () => {
          await run({ type: 'reply', id: newId(), postId: post.id, from, body, at: now() });
          setBody('');
        }}
      />
    </Card>
  );
}

function EventDetails({ postId }: { postId: string }) {
  const { state, run, shared } = useDemo();
  const router = useRouter();
  const { book } = useSupport();
  const project = projects.find((p) => p.id === postId);
  const teamPlaces = funding(book?.pledges.filter((p) => p.project === postId) ?? []).volunteers;
  const event = communityEvents.get(postId);
  if (!event) return null;
  const joined = state.community.joinedEvents.includes(postId);
  const sharedDrive = shared.enabled && postId === 'drive';

  return (
    <>
      <Card>
        <Copy kind="title">Event details</Copy>
        <Copy kind="strong">When</Copy>
        <Copy>{event.when}</Copy>
        <Copy kind="strong">Where</Copy>
        <Copy>{event.where}</Copy>
        <Copy kind="strong">What to bring</Copy>
        <Copy>{event.bring}</Copy>
        {!sharedDrive && (
          <>
            <View accessibilityLiveRegion="polite" style={{ gap: 4 }}>
              <Copy kind="strong">{event.volunteers + Number(joined) + teamPlaces} volunteers</Copy>
              {joined && <Copy tint={color.pine}>You’ve joined this event.</Copy>}
            </View>
            <Btn
              label={joined ? 'Cancel signup' : 'Join event'}
              secondary={joined}
              onPress={() => run({ type: 'event-rsvp', postId, joined: !joined })}
            />
          </>
        )}
      </Card>
      {project && <Card>
        <Copy kind="title">Help sponsor this event</Copy>
        <Copy>Organized by {project.organizer}</Copy>
        {book && <ProjectFunding goal={project.goal} pledges={book.pledges.filter((p) => p.project === project.id)} />}
        <Copy>{project.supplies}</Copy>
        <Copy>{teamPlaces} volunteer places confirmed through businesses</Copy>
        <Btn label="Pledge support" stretch onPress={() => router.push({ pathname: '/partnerships', params: { project: project.id, action: 'offer' } })} />
        <Btn label="Team inquiries and project details" quiet onPress={() => router.push({ pathname: '/partnerships', params: { project: project.id } })} />
      </Card>}
      {sharedDrive && <VolunteerOptions openSettings={() => router.navigate('/settings')} />}
    </>
  );
}

export default function PostDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { state, role, run, shared } = useDemo();
  const post = state.posts.find((item) =>
    item.id === id &&
    !item.group &&
    (role === 'Moderator' || item.status !== 'hidden'));
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(post?.title ?? '');
  const [body, setBody] = useState(post?.body ?? '');
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const back = <Btn label="Back to Community" secondary onPress={() => router.navigate('/')} />;
  const actorId = shared.data?.account.id ?? residentId;
  const isAuthor = !!post?.authorId && post.authorId === actorId;
  const status = post?.status ?? 'active';

  return (
    <Page title={post?.title ?? 'Post unavailable'} right={back}>
      {post && (
        <>
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
            {post.kind === 'Offer' && role === 'Resident' && (
              <View style={{ gap: 8, marginTop: 8 }}>
                <Field label="Report reason" value={reason} change={setReason} multiline />
                <Btn label="Report post" secondary disabled={!reason.trim()} onPress={async () => {
                  await run({
                    type: 'report-post',
                    id: newId(),
                    postId: post.id,
                    reporterId: actorId,
                    reason,
                    at: now(),
                  });
                  setReason('');
                  setFeedback('Report submitted for moderator review.');
                }} />
              </View>
            )}
            {feedback ? <Copy kind="small" tint={color.pine}>{feedback}</Copy> : null}
          </Card>
          {post.kind === 'Offer' && <OfferThread key={post.id} post={post} />}
          {post.kind === 'Event' && <EventDetails postId={post.id} />}
        </>
      )}
    </Page>
  );
}
