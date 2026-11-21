import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import type { Post } from '../../domain/types';
import { newId, now, useDemo } from '../../state/Demo';
import { Btn, Card, Copy, Field, Page, color, row } from '../../ui/kit';
import { communityEvents, residentAuthor } from './model';
import { PostTimestamp } from './PostTimestamp';
import { SavePostButton } from './SavePostButton';
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
              <Copy kind="strong">{event.volunteers + Number(joined)} volunteers</Copy>
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
      {sharedDrive && <VolunteerOptions openSettings={() => router.navigate('/settings')} />}
    </>
  );
}

export default function PostDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { state } = useDemo();
  const post = state.posts.find((item) => item.id === id && !item.group);
  const back = <Btn label="Back to Community" secondary onPress={() => router.navigate('/')} />;

  return (
    <Page title={post?.title ?? 'Post unavailable'} right={back}>
      {post && (
        <>
          <Card>
            <Copy kind="small" tint={color.muted}>{post.author}</Copy>
            <Copy>{post.body}</Copy>
            <View style={row}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <PostTimestamp date={post.date} />
              </View>
              <SavePostButton postId={post.id} />
            </View>
          </Card>
          {post.kind === 'Offer' && <OfferThread key={post.id} post={post} />}
          {post.kind === 'Event' && <EventDetails postId={post.id} />}
        </>
      )}
    </Page>
  );
}
