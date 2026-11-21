import { profile } from '../../domain/seed';
import { neighborhoods, type CommunityCommand, type DemoState, type Post } from '../../domain/types';

export const residentAuthor = `${profile.firstName} (you)`;

type CommunityEvent = { when: string; where: string; bring: string; volunteers: number };

export const communityEvents = new Map<string, CommunityEvent>([
  [
    'drive',
    {
      when: 'Saturday, November 21 · 10 am',
      where: 'Moody Park',
      bring: 'Bring a clean winter coat if you’re donating. If you’re picking one up, just bring yourself.',
      volunteers: 8,
    },
  ],
]);

export function communityFeed(state: DemoState, view: 'board' | 'groups') {
  return state.posts.filter((post) =>
    view === 'board' ? !post.group : !!post.group && state.community.groups.includes(post.group),
  );
}

function membership<T>(items: T[], item: T, joined: boolean): T[] {
  if (items.includes(item) === joined) return items;
  return joined ? [...items, item] : items.filter((entry) => entry !== item);
}

export function applyCommunityCommand(state: DemoState, cmd: CommunityCommand): DemoState {
  const { community } = state;
  switch (cmd.type) {
    case 'post': {
      if (!cmd.title.trim() || !cmd.body.trim()) throw new Error('Add a title and a description.');
      if (state.posts.some((post) => post.id === cmd.id)) return state;
      if (cmd.group && !community.groups.includes(cmd.group)) {
        throw new Error('Join the group before posting.');
      }
      const post: Post = {
        id: cmd.id,
        kind: cmd.group ? 'Update' : 'Offer',
        author: residentAuthor,
        title: cmd.title.trim(),
        body: cmd.body.trim(),
        date: cmd.at,
        ...(cmd.group ? { group: cmd.group } : {}),
      };
      return { ...state, posts: [post, ...state.posts] };
    }
    case 'reply': {
      if (community.replies.some((reply) => reply.id === cmd.id)) return state;
      if (!state.posts.some((post) => post.id === cmd.postId && post.kind === 'Offer')) {
        throw new Error('Choose an offer to reply to.');
      }
      const { id, postId, from, at } = cmd;
      const body = cmd.body.trim();
      if (!body) throw new Error('Write a reply before posting.');
      return {
        ...state,
        community: { ...community, replies: [...community.replies, { id, postId, from, at, body }] },
      };
    }
    case 'event-rsvp': {
      if (
        !communityEvents.has(cmd.postId) ||
        !state.posts.some((post) => post.id === cmd.postId && post.kind === 'Event')
      ) {
        throw new Error('This event is unavailable.');
      }
      const joinedEvents = membership(community.joinedEvents, cmd.postId, cmd.joined);
      return joinedEvents === community.joinedEvents
        ? state
        : { ...state, community: { ...community, joinedEvents } };
    }
    case 'group-membership': {
      if (!neighborhoods.includes(cmd.group)) throw new Error('Choose a neighborhood group.');
      const groups = membership(community.groups, cmd.group, cmd.joined);
      return groups === community.groups ? state : { ...state, community: { ...community, groups } };
    }
  }
}
