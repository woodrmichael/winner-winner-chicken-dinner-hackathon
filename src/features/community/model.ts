import { profile, residentId } from '../../domain/seed';
import { communityEvents } from '../../domain/demoCommunity';
import { neighborhoods, type CommunityCommand, type DemoState, type Post } from '../../domain/types';

export const residentAuthor = `${profile.firstName} (you)`;

export { communityEvents };

export type CommunityView = 'board' | 'groups' | 'saved';

function canSeePost(state: DemoState, post: Post) {
  return post.status !== 'hidden' && (!post.group || state.community.groups.includes(post.group));
}

export function communityFeed(state: DemoState, view: CommunityView, query = '') {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return state.posts.filter((post) => {
    if (!canSeePost(state, post)) return false;
    if (view === 'board' && post.group) return false;
    if (view === 'groups' && !post.group) return false;
    if (view === 'saved' && !state.community.savedPostIds.includes(post.id)) return false;

    const text = `${post.title} ${post.body}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });
}

export function postStatus(post: Post) {
  return post.status ?? 'active';
}

function membership<T>(items: T[], item: T, joined: boolean): T[] {
  if (items.includes(item) === joined) return items;
  return joined ? [...items, item] : items.filter((entry) => entry !== item);
}

export function applyCommunityCommand(
  state: DemoState,
  cmd: CommunityCommand,
  actorId = residentId,
): DemoState {
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
        authorId: actorId,
        title: cmd.title.trim(),
        body: cmd.body.trim(),
        date: cmd.at,
        status: 'active',
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
    case 'save-post': {
      const post = state.posts.find((entry) => entry.id === cmd.postId);
      if (!post || (cmd.saved && !canSeePost(state, post))) {
        throw new Error('This post is unavailable.');
      }
      const savedPostIds = membership(community.savedPostIds, cmd.postId, cmd.saved);
      return savedPostIds === community.savedPostIds
        ? state
        : { ...state, community: { ...community, savedPostIds } };
    }
    case 'edit-post': {
      const post = state.posts.find((entry) => entry.id === cmd.postId);
      if (!post || post.kind !== 'Offer') throw new Error('This offer is unavailable.');
      if ((post.authorId ?? residentId) !== actorId || cmd.authorId !== actorId) {
        throw new Error('Only the original author can edit this offer.');
      }
      if (post.status === 'hidden') throw new Error('Hidden offers cannot be edited.');
      if (!cmd.title.trim() || !cmd.body.trim()) throw new Error('Add a title and a description.');
      if (post.title === cmd.title.trim() && post.body === cmd.body.trim()) return state;
      return {
        ...state,
        posts: state.posts.map((entry) => entry.id === post.id
          ? { ...entry, title: cmd.title.trim(), body: cmd.body.trim() }
          : entry),
      };
    }
    case 'close-post': {
      const post = state.posts.find((entry) => entry.id === cmd.postId);
      if (!post || post.kind !== 'Offer') throw new Error('This offer is unavailable.');
      if ((post.authorId ?? residentId) !== actorId || cmd.authorId !== actorId) {
        throw new Error('Only the original author can close this offer.');
      }
      if (post.status === 'hidden') throw new Error('Hidden offers cannot be changed.');
      if (post.status === 'fulfilled') return state;
      return { ...state, posts: state.posts.map((entry) =>
        entry.id === post.id ? { ...entry, status: 'fulfilled' } : entry) };
    }
    case 'report-post': {
      const post = state.posts.find((entry) => entry.id === cmd.postId);
      if (!post || post.status === 'hidden') throw new Error('This post is unavailable.');
      if (!cmd.reason.trim()) throw new Error('Add a reason for the report.');
      if (community.reports.some((report) =>
        report.postId === cmd.postId && report.reporterId === actorId)) return state;
      return {
        ...state,
        community: {
          ...community,
          reports: [...community.reports, {
            id: cmd.id,
            postId: cmd.postId,
            reporterId: cmd.reporterId === actorId ? cmd.reporterId : actorId,
            reason: cmd.reason.trim(),
            at: cmd.at,
          }],
        },
      };
    }
    case 'hide-post': {
      if (cmd.moderatorId !== actorId ||
        (actorId === residentId && cmd.moderatorId === residentId)) {
        throw new Error('Moderator access is required.');
      }
      const post = state.posts.find((entry) => entry.id === cmd.postId);
      if (!post) throw new Error('This post is unavailable.');
      if (!community.reports.some((report) => report.postId === cmd.postId)) {
        throw new Error('Only a reported post can be hidden.');
      }
      if (!cmd.reason.trim()) throw new Error('Add a moderation reason.');
      if (post.status === 'hidden') return state;
      return {
        ...state,
        posts: state.posts.map((entry) => entry.id === post.id
          ? { ...entry, status: 'hidden' }
          : entry),
        community: {
          ...community,
          moderation: [...community.moderation, {
            postId: cmd.postId,
            moderatorId: actorId,
            reason: cmd.reason.trim(),
            at: cmd.at,
          }],
        },
      };
    }
  }
}
