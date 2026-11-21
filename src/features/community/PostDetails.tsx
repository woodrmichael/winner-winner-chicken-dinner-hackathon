import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import type { OfferReply, Post } from '../../domain/types';
import { newId, now, useDemo } from '../../state/Demo';
import { Btn, Card, Copy, Field, Page, color } from '../../ui/kit';
import { Segments } from '../../ui/Segments';
import { communityEvents, residentAuthor } from './model';
import { PostTimestamp } from './PostTimestamp';

function OfferThread({ post }: { post: Post }) {
  const { state, run } = useDemo();
  const [from, setFrom] = useState<OfferReply['from']>('resident');
  const [body, setBody] = useState('');
  const replies = state.community.replies.filter((reply) => reply.postId === post.id);
  const readerName = post.author === residentAuthor ? 'Jordan (demo resident)' : residentAuthor;

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
        Switch views to try both sides of the thread in this demo.
      </Copy>
      <Segments
        options={['resident', 'author'] as const}
        value={from}
        onChange={setFrom}
        label={(option) => (option === 'author' ? 'Offer author' : 'Resident')}
      />
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
  const { state, run } = useDemo();
  const event = communityEvents.get(postId);
  if (!event) return null;
  const joined = state.community.joinedEvents.includes(postId);

  return (
    <Card>
      <Copy kind="title">Event details</Copy>
      <Copy kind="strong">When</Copy>
      <Copy>{event.when}</Copy>
      <Copy kind="strong">Where</Copy>
      <Copy>{event.where}</Copy>
      <Copy kind="strong">What to bring</Copy>
      <Copy>{event.bring}</Copy>
      <View accessibilityLiveRegion="polite" style={{ gap: 4 }}>
        <Copy kind="strong">{event.volunteers + Number(joined)} volunteers</Copy>
        {joined && <Copy tint={color.pine}>You’ve joined this event.</Copy>}
      </View>
      <Btn
        label={joined ? 'Cancel signup' : 'Join event'}
        secondary={joined}
        onPress={() => run({ type: 'event-rsvp', postId, joined: !joined })}
      />
    </Card>
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
            <PostTimestamp date={post.date} />
          </Card>
          {post.kind === 'Offer' && <OfferThread key={post.id} post={post} />}
          {post.kind === 'Event' && <EventDetails postId={post.id} />}
        </>
      )}
    </Page>
  );
}
