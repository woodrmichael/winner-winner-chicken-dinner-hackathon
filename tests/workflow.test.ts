import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCommand,
  impact,
  mapRows,
  partnerInbox,
  residentTimeline,
  status,
} from '../src/domain/model';
import { profile, program, seedState } from '../src/domain/seed';
import type { Command } from '../src/domain/types';
import { example, matchResources } from '../src/features/matching/match';
import { decode } from '../src/state/persistence';

const at = '2026-11-21T18:00:00Z';
const send: Command = {
  type: 'send',
  id: 'demo-run',
  partnerId: 'winter-team',
  at,
  message: example,
  needs: ['Clothing', 'Transportation'],
  shared: { neighborhood: profile.neighborhood },
};
const accept: Command = { type: 'accept', id: send.id, partnerId: send.partnerId, at };
const complete: Command = {
  type: 'complete',
  id: send.id,
  partnerId: send.partnerId,
  category: 'Clothing',
  programId: program.id,
  at,
};

test('one delivery updates all views, survives reload, and cannot be counted twice', () => {
  const initial = seedState();
  const sent = applyCommand(initial, send);
  const accepted = decode(JSON.stringify(applyCommand(sent, accept)));
  const done = applyCommand(accepted, complete);
  assert.equal(status(residentTimeline(done)[0]), 'Completed');
  assert.equal(impact(done).received, 5);
  assert.equal(impact(sent).open, 3);
  assert.equal(impact(done).open, 2);
  assert.equal(impact(done).delivered, 3);
  assert.equal(impact(done).programDeliveries, 2);
  assert.equal(impact(done).byProvider.find((p) => p.name === 'Winter Care Collective')?.count, 2);
  assert.equal(mapRows(sent)[0].open, mapRows(done)[0].open + 1);
  assert.equal(mapRows(done)[0].delivered, mapRows(initial)[0].delivered + 1);
  assert.equal(applyCommand(done, complete), done);
  assert.equal(applyCommand(sent, send), sent);
  assert.deepEqual(impact(seedState()), impact(initial));
});

test('public views omit request text, identity and unshared geography', () => {
  const state = applyCommand(seedState(), { ...send, shared: {} });
  assert.deepEqual(mapRows(state), mapRows(seedState()));
  assert.deepEqual(state.posts, seedState().posts);
  assert.equal(residentTimeline(state).length, 1);
  assert(!partnerInbox(state, 'table').some((r) => r.id === send.id));
  const ticket = partnerInbox(state, 'winter-team')[0];
  assert.deepEqual(ticket.shared, {});
  assert(!('residentId' in ticket));
  assert(!JSON.stringify([mapRows(state), impact(state), state.posts]).includes(example));
});

test('transitions require assigned partner, acceptance and eligible program', () => {
  const sent = applyCommand(seedState(), send);
  assert.throws(() => applyCommand(sent, complete));
  assert.throws(() => applyCommand(sent, { ...accept, partnerId: 'table' }));
  assert.throws(() =>
    applyCommand(applyCommand(sent, accept), { ...complete, category: 'Transportation' }),
  );
});

test('publishing a public offer affects only the board', () => {
  const initial = seedState();
  const state = applyCommand(initial, {
    type: 'post',
    id: 'offer',
    title: 'A spare coat',
    body: 'Size 8',
    at,
  });
  assert.equal(state.posts[0].kind, 'Offer');
  assert.deepEqual(state.referrals, initial.referrals);
});

test('rules cover multi-need, paraphrase and manual selection', () => {
  assert.deepEqual(matchResources(example).matches[0].covers, ['Clothing', 'Transportation']);
  assert.equal(matchResources('A lift to get groceries').matches.length, 3);
  assert.equal(matchResources('Could someone help with algebra?').matches.length, 0);
  assert.equal(matchResources('A football coach').needs.length, 0);
  const state = applyCommand(seedState(), {
    ...send,
    needs: [],
    partnerId: 'table',
    message: 'Please advise',
  });
  assert.equal(partnerInbox(state, 'table')[0].message, 'Please advise');
});

test('saved state validation and deterministic reset', () => {
  assert.deepEqual(decode(JSON.stringify(seedState())), seedState());
  for (const raw of [
    'null',
    '{}',
    'bad',
    '{"version":2,"posts":[],"referrals":[]}',
    '{"version":1,"posts":[{}],"referrals":[]}',
  ])
    assert.throws(() => decode(raw));
});
