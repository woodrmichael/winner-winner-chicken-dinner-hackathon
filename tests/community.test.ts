import assert from 'node:assert/strict';
import test from 'node:test';
import { applyCommand } from '../src/domain/model';
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
  assert.deepEqual(communityFeed(upgraded, 'board'), posts);
  assert.deepEqual(upgraded.referrals, referrals);
  assert.deepEqual(upgraded.community, initial.community);
});

test('existing community snapshots gain bookmarks without losing signups or memberships', () => {
  const olderCommunity = { joinedEvents: ['drive'], groups: ['Harambee'], replies: [] };
  const upgraded = decode(JSON.stringify({ ...seedState(), community: olderCommunity }));
  assert.deepEqual(upgraded.community, { ...olderCommunity, savedPostIds: [] });
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
  assert.deepEqual(communityFeed(published, 'groups').map((item) => item.title), ['Park cleanup']);
  assert.deepEqual(communityFeed(published, 'groups', 'cleanup noon').map((item) => item.id), [post.id]);
  assert.deepEqual(communityFeed(published, 'board', 'cleanup noon'), []);
  assert.deepEqual(communityFeed(published, 'board'), initial.posts);
  const bookmarked = applyCommand(published, { type: 'save-post', postId: post.id, saved: true });
  assert.deepEqual(communityFeed(bookmarked, 'saved'), communityFeed(published, 'groups'));
  const left = reopen(applyCommand(bookmarked, { ...join, joined: false }));
  assert.deepEqual(communityFeed(left, 'groups'), []);
  assert.deepEqual(communityFeed(left, 'groups', 'cleanup'), []);
  assert.deepEqual(communityFeed(left, 'saved'), []);
  const rejoined = applyCommand(left, join);
  assert.deepEqual(communityFeed(rejoined, 'groups'), communityFeed(published, 'groups'));
  assert.deepEqual(communityFeed(rejoined, 'saved'), communityFeed(published, 'groups'));
});
