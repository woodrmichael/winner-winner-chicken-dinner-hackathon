import assert from 'node:assert/strict';
import test from 'node:test';
import { applyCommand, impact } from '../src/domain/model';
import { seedState } from '../src/domain/seed';
import type { Command } from '../src/domain/types';
import { communityFeed } from '../src/features/community/model';
import { decode } from '../src/state/persistence';

const at = '2026-11-21T18:00:00Z';
const reopen = (state: ReturnType<typeof seedState>) => decode(JSON.stringify(state));

test('upgrading a saved workspace preserves existing public offers and private referrals', () => {
  const initial = seedState();
  const { posts, referrals, version } = applyCommand(initial, {
    type: 'post', id: 'older-offer', title: 'Warm socks', body: 'Pickup Saturday', at,
  });
  const upgraded = decode(JSON.stringify({ posts, referrals, version }));
  assert.deepEqual(communityFeed(upgraded, 'board'), posts.filter(({ group }) => !group));
  assert.deepEqual(upgraded.referrals, referrals);
  assert.deepEqual(upgraded.community, initial.community);
});

test('existing community snapshots gain bookmarks without losing signups or memberships', () => {
  const olderCommunity = { joinedEvents: ['drive'], groups: ['Harambee'], replies: [] };
  const upgraded = decode(JSON.stringify({ ...seedState(), community: olderCommunity }));
  assert.deepEqual(upgraded.community, {
    ...olderCommunity,
    savedPostIds: [],
    reports: [],
    moderation: [],
  });
});

test('saving an event adds it to Saved after reload and removing the bookmark clears it', () => {
  const save: Command = { type: 'save-post', postId: 'drive', saved: true };
  const saved = reopen(applyCommand(seedState(), save));
  assert.deepEqual(communityFeed(saved, 'saved').map((post) => post.id), ['drive']);
  assert.equal(applyCommand(saved, save), saved);
  assert.deepEqual(communityFeed(reopen(applyCommand(saved, { ...save, saved: false })), 'saved'), []);
  assert.throws(() => applyCommand(saved, { ...save, postId: 'seed-winter' }), /unavailable/);
});

test('search matches title and body across case and spacing within the selected feed', () => {
  const initial = seedState();
  assert.deepEqual(communityFeed(initial, 'board', '  COATS   Saturday ').map((post) => post.id), ['coats']);
  assert.deepEqual(communityFeed(initial, 'board', 'Could I pick up groceries?'), []);
  assert.deepEqual(communityFeed(initial, 'groups', 'coat'), []);
});

test('the resident and offer author can reply in the same persistent public thread', () => {
  const ask: Command = {
    type: 'reply', id: 'question', postId: 'coats', from: 'resident', body: ' Is size 8 still available? ', at,
  };
  const answer: Command = { ...ask, id: 'answer', from: 'author', body: 'Yes, it is.' };
  const initial = seedState();
  const thread = applyCommand(applyCommand(initial, ask), answer);
  assert.deepEqual(reopen(thread).community.replies, [
    { id: 'question', postId: 'coats', from: 'resident', body: 'Is size 8 still available?', at },
    { id: 'answer', postId: 'coats', from: 'author', body: 'Yes, it is.', at },
  ]);
  assert.equal(applyCommand(thread, answer), thread);
  assert.throws(() => applyCommand(initial, { ...ask, postId: 'drive' }), /offer/);
  assert.throws(() => applyCommand(initial, { ...ask, body: '   ' }), /reply/);
  assert.equal(thread.referrals, initial.referrals);
});

test('an event signup survives reload and joining or cancelling twice changes only one place', () => {
  const join: Command = { type: 'event-rsvp', postId: 'drive', joined: true };
  const leave: Command = { ...join, joined: false };
  const joined = reopen(applyCommand(seedState(), join));
  assert.deepEqual(joined.community.joinedEvents, ['drive']);
  assert.equal(applyCommand(joined, join), joined);
  const cancelled = reopen(applyCommand(joined, leave));
  assert.deepEqual(cancelled.community.joinedEvents, []);
  assert.equal(applyCommand(cancelled, leave), cancelled);
  assert.throws(() => applyCommand(cancelled, { ...join, postId: 'coats' }), /unavailable/);
});

test('group posts appear only under My groups while a resident has joined that group', () => {
  const join: Command = { type: 'group-membership', group: 'Harambee', joined: true };
  const post: Command = {
    type: 'post', group: 'Harambee', id: 'group-update', title: 'Park cleanup', body: 'Meet at noon.', at,
  };
  const initial = seedState();
  assert.throws(() => applyCommand(initial, post), /Join the group/);
  const published = reopen(applyCommand(applyCommand(initial, join), post));
  assert.deepEqual(
    communityFeed(published, 'groups').map((item) => item.title),
    ['Park cleanup', 'Help set up the winter drive'],
  );
  assert.deepEqual(communityFeed(published, 'groups', 'cleanup noon').map((item) => item.id), [post.id]);
  assert.deepEqual(communityFeed(published, 'board', 'cleanup noon'), []);
  assert.deepEqual(communityFeed(published, 'board'), initial.posts.filter(({ group }) => !group));
  const bookmarked = applyCommand(published, { type: 'save-post', postId: post.id, saved: true });
  assert.deepEqual(communityFeed(bookmarked, 'saved').map(({ id }) => id), [post.id]);
  const left = reopen(applyCommand(bookmarked, { ...join, joined: false }));
  assert.deepEqual(communityFeed(left, 'groups'), []);
  assert.deepEqual(communityFeed(left, 'groups', 'cleanup'), []);
  assert.deepEqual(communityFeed(left, 'saved'), []);
  const rejoined = applyCommand(left, join);
  assert.deepEqual(communityFeed(rejoined, 'groups'), communityFeed(published, 'groups'));
  assert.deepEqual(communityFeed(rejoined, 'saved').map(({ id }) => id), [post.id]);
});

test('the resident author can edit and fulfill an offer without changing replies or delivery totals', () => {
  const at = '2026-11-21T18:00:00Z';
  const initial = seedState();
  const coat = initial.posts.find((post) => post.id === 'coats')!;
  assert.equal(coat.authorId, 'demo-resident');
  const reply: Command = {
    type: 'reply', id: 'coat-question', postId: 'coats', from: 'resident',
    body: 'Is size 6 still available?', at,
  };
  const replied = applyCommand(initial, reply);
  const edited = reopen(applyCommand(replied, {
    type: 'edit-post',
    postId: 'coats',
    authorId: 'demo-resident',
    title: 'Kids’ coats available',
    body: 'One gently used winter coat, size 8. Available for Saturday pickup.',
  }, 'demo-resident'));
  assert.equal(edited.posts.find((post) => post.id === 'coats')?.body,
    'One gently used winter coat, size 8. Available for Saturday pickup.');
  assert.deepEqual(edited.community.replies, replied.community.replies);
  assert.throws(() => applyCommand(edited, {
    type: 'edit-post',
    postId: 'coats',
    authorId: 'other-resident',
    title: 'Unauthorized',
    body: 'Unauthorized',
  }, 'other-resident'), /original author/);
  const fulfilled = reopen(applyCommand(edited, {
    type: 'close-post',
    postId: 'coats',
    authorId: 'demo-resident',
  }, 'demo-resident'));
  assert.equal(fulfilled.posts.find((post) => post.id === 'coats')?.status, 'fulfilled');
  assert.deepEqual(fulfilled.community.replies, replied.community.replies);
  assert.equal(impact(fulfilled).delivered, impact(initial).delivered);
});

test('a resident can report a post and only a moderator can hide it', () => {
  const at = '2026-11-21T18:00:00Z';
  const initial = seedState();
  const reported = reopen(applyCommand(initial, {
    type: 'report-post',
    postId: 'pantry',
    id: 'pantry-report',
    reporterId: 'demo-resident',
    reason: 'This information is misleading.',
    at,
  }, 'demo-resident'));
  assert.equal(reported.community.reports[0].reason, 'This information is misleading.');
  assert.throws(() => applyCommand(reported, {
    type: 'hide-post',
    postId: 'pantry',
    moderatorId: 'demo-resident',
    reason: 'Unauthorized',
    at,
  }, 'demo-resident'), /Moderator access/);
  const hidden = reopen(applyCommand(reported, {
    type: 'hide-post',
    postId: 'pantry',
    moderatorId: 'moderator',
    reason: 'Inappropriate duplicate listing.',
    at,
  }, 'moderator'));
  assert.equal(hidden.posts.find((post) => post.id === 'pantry')?.status, 'hidden');
  assert.equal(communityFeed(hidden, 'board').some((post) => post.id === 'pantry'), false);
  assert.equal(communityFeed(hidden, 'board', 'pantry').some((post) => post.id === 'pantry'), false);
  assert.equal(impact(hidden).delivered, impact(initial).delivered);
});
