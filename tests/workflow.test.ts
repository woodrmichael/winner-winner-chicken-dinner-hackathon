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
import { profile, program, residentId, seedState } from '../src/domain/seed';
import { outstandingNeeds, pendingHandoffs } from '../src/domain/referrals';
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
const reopen = (state: ReturnType<typeof seedState>) => decode(JSON.stringify(state));

test('partial delivery updates all views, survives reload, and cannot be counted twice', () => {
  const initial = seedState();
  const sent = applyCommand(initial, send);
  const accepted = decode(JSON.stringify(applyCommand(sent, accept)));
  const partial = decode(JSON.stringify(applyCommand(accepted, complete)));
  assert.equal(status(residentTimeline(partial)[0]), 'Accepted');
  assert.deepEqual(outstandingNeeds(residentTimeline(partial)[0]), ['Transportation']);
  assert.deepEqual(partnerInbox(partial, 'winter-team')[0].outstanding, ['Transportation']);
  assert.equal(impact(partial).received, 5);
  assert.equal(impact(sent).open, 3);
  assert.equal(impact(partial).open, 3);
  assert.equal(impact(partial).delivered, 3);
  assert.equal(impact(partial).programDeliveries, 2);
  assert.equal(
    impact(partial).byProvider.find((p) => p.name === 'Winter Care Collective')?.count,
    2,
  );
  assert.equal(mapRows(sent)[0].open, mapRows(partial)[0].open + 1);
  assert.equal(mapRows(partial)[0].delivered, mapRows(initial)[0].delivered + 1);
  assert.equal(applyCommand(partial, complete), partial);
  const done = applyCommand(partial, {
    ...complete,
    category: 'Transportation',
    programId: undefined,
  });
  assert.equal(status(residentTimeline(done)[0]), 'Completed');
  assert.equal(impact(done).open, 2);
  assert.equal(impact(done).delivered, 4);
  assert.equal(applyCommand(sent, send), sent);
  assert.deepEqual(impact(seedState()), impact(initial));
});

test('public views omit request text, identity and unshared geography', () => {
  const state = applyCommand(seedState(), { ...send, shared: {} });
  assert.deepEqual(mapRows(state), mapRows(seedState()));
  assert.deepEqual(state.posts, seedState().posts);
  assert.equal(residentTimeline(state).length, 1);
  assert(!partnerInbox(state, 'table').some((r) => r.assignment.id === send.id));
  const ticket = partnerInbox(state, 'winter-team')[0];
  assert.deepEqual(ticket.assignment.shared, {});
  assert(!('residentId' in ticket));
  assert(!JSON.stringify([mapRows(state), impact(state), state.posts]).includes(example));
});

test('the partner inbox tracks acceptance, appointment changes and completion across reload', () => {
  const sent = applyCommand(seedState(), { ...send, needs: ['Clothing'] });
  const schedule = {
    type: 'schedule',
    id: send.id,
    partnerId: send.partnerId,
    appointment: { date: '2026-11-28', time: '10:00', instructions: 'Use the side entrance.' },
  } as const;
  assert.deepEqual(
    partnerInbox(sent, 'winter-team').map(({ status }) => status),
    ['Sent', 'Completed'],
  );
  assert.throws(() => applyCommand(sent, schedule), /Accept/);
  const accepted = reopen(applyCommand(sent, accept));
  assert.deepEqual(
    partnerInbox(accepted, 'winter-team').map(({ status }) => status),
    ['Accepted', 'Completed'],
  );
  assert.throws(
    () =>
      applyCommand(accepted, {
        ...schedule,
        appointment: { ...schedule.appointment, date: '2026-11-31' },
      }),
    /YYYY-MM-DD/,
  );
  const planned = applyCommand(accepted, schedule);
  assert.deepEqual(
    residentTimeline(reopen(planned))[0].assignments[0].appointment,
    schedule.appointment,
  );
  const appointment = {
    date: '2026-11-29',
    time: '11:30',
    instructions: 'Meet at the front desk.',
  };
  const revised = reopen(applyCommand(planned, { ...schedule, appointment }));
  assert.deepEqual(residentTimeline(revised)[0].assignments[0].appointment, appointment);
  assert.equal(status(residentTimeline(revised)[0]), 'Accepted');
  assert.deepEqual(impact(revised), impact(accepted));
  assert.deepEqual(
    partnerInbox(reopen(applyCommand(revised, complete)), 'winter-team').map(
      ({ status }) => status,
    ),
    ['Completed', 'Completed'],
  );
});

test('a handoff stays private until approval and credits a different provider to the original request', () => {
  const state = applyCommand(
    applyCommand(seedState(), {
      ...send,
      shared: { ...send.shared, callback: profile.callback, firstName: profile.firstName },
    }),
    accept,
  );
  const partial = applyCommand(state, complete);
  const propose: Command = {
    type: 'propose-handoff',
    id: send.id,
    partnerId: send.partnerId,
    handoffId: 'ride-proposal',
    recipientId: 'ride-circle',
    category: 'Transportation',
    reason: 'The van is unavailable this weekend.',
  };
  const proposed = reopen(applyCommand(partial, propose));
  assert.equal(applyCommand(proposed, propose), proposed);
  assert.equal(pendingHandoffs(residentTimeline(proposed)[0]).length, 1);
  assert(
    !partnerInbox(proposed, 'ride-circle').some(
      ({ assignment }) => assignment.id === propose.handoffId,
    ),
  );
  const declined = reopen(
    applyCommand(proposed, {
      type: 'respond-handoff',
      id: send.id,
      handoffId: propose.handoffId,
      response: 'decline',
    }),
  );
  assert.equal(pendingHandoffs(residentTimeline(declined)[0]).length, 0);
  assert.deepEqual(partnerInbox(declined, 'ride-circle'), partnerInbox(state, 'ride-circle'));
  const approve: Command = {
    type: 'respond-handoff',
    id: send.id,
    handoffId: propose.handoffId,
    response: 'approve',
    at,
    share: ['firstName'],
  };
  assert.equal(applyCommand(declined, approve), declined);
  const approved = reopen(applyCommand(proposed, approve));
  assert.equal(applyCommand(approved, approve), approved);
  const inbox = partnerInbox(approved, 'ride-circle');
  const [ticket] = inbox.filter(({ assignment }) => assignment.id === propose.handoffId);
  assert.equal(inbox.filter(({ assignment }) => assignment.id === propose.handoffId).length, 1);
  assert.equal(ticket.status, 'Sent');
  assert.equal(ticket.assignment.message, propose.reason);
  assert.deepEqual(ticket.assignment.shared, { firstName: profile.firstName });
  assert.deepEqual(ticket.outstanding, ['Transportation']);
  assert(!JSON.stringify(ticket).includes(send.message));
  assert(!JSON.stringify(ticket).includes(profile.callback));
  assert.deepEqual(impact(approved), impact(partial));
  assert.deepEqual(mapRows(approved), mapRows(partial));
  assert.throws(
    () =>
      applyCommand(approved, {
        ...complete,
        category: 'Transportation',
        programId: undefined,
      }),
    /outstanding/,
  );
  const accepted = applyCommand(approved, {
    ...accept,
    id: propose.handoffId,
    partnerId: 'ride-circle',
  });
  const resolved = reopen(
    applyCommand(accepted, {
      ...complete,
      id: propose.handoffId,
      partnerId: 'ride-circle',
      category: 'Transportation',
      programId: undefined,
    }),
  );
  const referral = residentTimeline(resolved)[0];
  assert.equal(status(referral), 'Completed');
  assert.deepEqual(
    referral.services.map(({ category, providerId }) => [category, providerId]),
    [
      ['Clothing', 'winter-team'],
      ['Transportation', 'ride-circle'],
    ],
  );
  assert.equal(impact(resolved).received, 5);
  assert.equal(impact(resolved).delivered, 4);
  assert.equal(impact(resolved).programDeliveries, 2);
  assert.equal(mapRows(resolved)[0].delivered, 3);
});

test('a provider decline stays outstanding through reload until the resident withdraws or another provider delivers', () => {
  const sent = applyCommand(seedState(), { ...send, needs: ['Transportation'] });
  const decline: Command = {
    type: 'decline-service',
    id: send.id,
    partnerId: send.partnerId,
    category: 'Transportation',
    reason: 'All drivers are booked.',
    at,
  };
  assert.throws(() => applyCommand(sent, { ...decline, reason: ' ' }), /reason/);
  const declined = reopen(applyCommand(sent, decline));
  assert.equal(applyCommand(declined, decline), declined);
  assert.equal(status(residentTimeline(declined)[0]), 'Declined');
  assert.equal(
    residentTimeline(declined)[0].assignments[0].declines.Transportation?.reason,
    decline.reason,
  );
  assert.deepEqual(impact(declined), impact(sent));
  assert.deepEqual(mapRows(declined), mapRows(sent));
  const withdraw = { type: 'withdraw-need', id: send.id, category: 'Transportation' } as const;
  const withdrawn = reopen(applyCommand(declined, withdraw));
  assert.equal(applyCommand(withdrawn, withdraw), withdrawn);
  assert.equal(status(residentTimeline(withdrawn)[0]), 'Closed');
  assert.equal(mapRows(withdrawn)[0].open, mapRows(sent)[0].open - 1);
  assert.equal(impact(withdrawn).delivered, impact(sent).delivered);

  const seek: Command = {
    type: 'seek-provider',
    id: send.id,
    assignmentId: 'new-ride-provider',
    recipientId: 'ride-circle',
    category: 'Transportation',
    message: 'Can you help with a ride?',
    share: [],
    at,
  };
  assert.throws(() => applyCommand(sent, seek), /current partner/);
  const reassigned = reopen(applyCommand(declined, seek));
  assert.equal(applyCommand(reassigned, seek), reassigned);
  assert.equal(status(residentTimeline(reassigned)[0]), 'Sent');
  assert.deepEqual(mapRows(reassigned), mapRows(sent));
  assert.equal(partnerInbox(reassigned, 'ride-circle')[0].assignment.message, seek.message);
});

test('a v1 snapshot preserves bookmarks and a delivered coat while keeping the ride open', () => {
  const legacy = {
    version: 1,
    posts: seedState().posts,
    community: { ...seedState().community, savedPostIds: ['drive'] },
    referrals: [
      {
        ...send,
        residentId,
        sentAt: at,
        acceptedAt: at,
        service: {
          category: 'Clothing',
          providerId: 'winter-team',
          deliveredAt: at,
          programId: program.id,
        },
      },
    ],
  };
  const migrated = decode(JSON.stringify(legacy));
  const [referral] = residentTimeline(migrated);
  assert.equal(migrated.version, 2);
  assert.deepEqual(migrated.community.savedPostIds, ['drive']);
  assert.deepEqual(outstandingNeeds(referral), ['Transportation']);
  assert.equal(referral.services[0].assignmentId, send.id);
  assert.deepEqual(referral.assignments[0].shared, send.shared);
  assert.equal(impact(migrated).programDeliveries, 1);
  assert.deepEqual(reopen(migrated), migrated);
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
  assert.equal(partnerInbox(state, 'table')[0].assignment.message, 'Please advise');
});

test('saved state validation and deterministic reset', () => {
  assert.deepEqual(decode(JSON.stringify(seedState())), seedState());
  for (const raw of [
    'null',
    '{}',
    'bad',
    '{"version":3,"posts":[],"referrals":[]}',
    '{"version":2,"posts":[],"referrals":[{}]}',
    '{"version":1,"posts":[{}],"referrals":[]}',
  ])
    assert.throws(() => decode(raw));
});
