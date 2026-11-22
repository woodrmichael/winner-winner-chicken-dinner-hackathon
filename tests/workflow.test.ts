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
import { profile, program, residentId, seedState as fullDemo } from '../src/domain/seed';
import { outstandingNeeds, pendingHandoffs } from '../src/domain/referrals';
import type { Command } from '../src/domain/types';
import { partnerDetail, pausedServiceLine } from '../src/features/matching/directory';
import { example, matchResources } from '../src/features/matching/match';
import {
  draftReferral,
  findResources,
  interpretNeeds,
  isVagueRequest,
  matchWithModel,
  missingAddableNeeds,
  needsFullyCovered,
  setModelAvailable,
  shouldOfferDraft,
  withNeeds,
} from '../src/features/matching/modelMatch';
import { decode } from '../src/state/persistence';

const at = '2026-11-21T18:00:00Z';
function seedState() {
  const state = fullDemo();
  return { ...state, referrals: state.referrals.filter(({ id }) => id.startsWith('seed-')) };
}
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

test('neighborhood categories separate an outstanding ride from a delivered coat', () => {
  const empty = { ...seedState(), referrals: [] };
  const partial = applyCommand(applyCommand(applyCommand(empty, send), accept), complete);
  const counts = (category: 'Transportation' | 'Clothing') => {
    const row = mapRows(partial, category).find(({ area }) => area === profile.neighborhood)!;
    return [row.open, row.delivered];
  };
  assert.deepEqual(counts('Transportation'), [1, 0]);
  assert.deepEqual(counts('Clothing'), [0, 1]);
});

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
  assert.deepEqual(mapRows(state, 'Transportation'), mapRows(seedState(), 'Transportation'));
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

test('model ranks Winter Care for clothing and a ride', async () => {
  setModelAvailable(true);
  const result = await matchWithModel(example, 0);
  assert.equal(result.source, 'model');
  assert.deepEqual(result.needs, ['Clothing', 'Transportation']);
  assert.equal(result.matches[0].partner.name, 'Winter Care Collective');
  assert.deepEqual(result.matches[0].covers, ['Clothing', 'Transportation']);
  assert.match(result.matches[0].explanation, /both/i);
  assert.match(result.matches[0].explanation, /clothing/i);
  assert.match(result.matches[0].explanation, /transportation/i);
});

test('model drops satisfied clothing and suggests transportation alone', async () => {
  setModelAvailable(true);
  const text = 'We already have coats but can’t get to the pickup';
  assert.deepEqual(interpretNeeds('I already have coats but need a ride'), ['Transportation']);
  assert.deepEqual(interpretNeeds(text), ['Transportation']);
  const result = await matchWithModel(text, 0);
  assert.deepEqual(result.needs, ['Transportation']);
  assert.ok(result.matches.every((m) => m.covers.includes('Transportation')));
  assert.ok(!result.needs.includes('Clothing'));
  assert.equal(result.matches[0].partner.categories.includes('Transportation'), true);
});

test('keyword fallback runs when the model is unavailable', async () => {
  setModelAvailable(false);
  try {
    await assert.rejects(() => matchWithModel(example, 0));
    const result = await findResources(example);
    assert.equal(result.source, 'keywords');
    assert.equal(result.matches[0].partner.name, 'Winter Care Collective');
  } finally {
    setModelAvailable(true);
  }
});

test('house-fire draft mentions clothing and transportation', async () => {
  setModelAvailable(true);
  const draft = await draftReferral(example, ['Clothing', 'Transportation'], 0);
  assert.match(draft, /cloth/i);
  assert.match(draft, /ride|transport|pick/i);
});

test('vague fire help plus food clarification suggests Neighborhood Table', async () => {
  setModelAvailable(true);
  assert.equal(isVagueRequest('I need help after the fire'), true);
  assert.equal(isVagueRequest(example), false);
  const combined = 'I need help after the fire food for tonight';
  const result = await matchWithModel(combined, 0);
  assert.ok(result.needs.includes('Food'));
  assert.equal(result.matches[0].partner.name, 'Neighborhood Table');
});

test('removing a need re-ranks partners for review', () => {
  const both = withNeeds(['Clothing', 'Transportation']);
  assert.equal(both.matches[0].partner.name, 'Winter Care Collective');
  const rideOnly = withNeeds(['Transportation']);
  assert.ok(rideOnly.matches.every((m) => m.covers.includes('Transportation')));
  assert.ok(!rideOnly.needs.includes('Clothing'));
});

test('draft refreshes to ride-only after clothing is removed', async () => {
  setModelAvailable(true);
  const both = await draftReferral(example, ['Clothing', 'Transportation'], 0);
  assert.match(both, /cloth/i);
  const rideOnly = await draftReferral(example, ['Transportation'], 0);
  assert.match(rideOnly, /ride|pickup/i);
  assert.doesNotMatch(rideOnly, /clothes for the kids/i);
});

test('preferred neighborhood breaks equal coverage ties', () => {
  const harambee = withNeeds(['Transportation'], 'model', 'Harambee');
  assert.equal(harambee.matches[0].partner.name, 'Winter Care Collective');
  const riverwest = withNeeds(['Transportation'], 'model', 'Riverwest');
  assert.equal(riverwest.matches[0].partner.name, 'Riverwest Ride Circle');
});

test('food and ride suggest complementary specialists first', () => {
  const result = withNeeds(['Food', 'Transportation']);
  assert.equal(result.matches[0].partner.name, 'Neighborhood Table');
  assert.match(result.matches[0].explanation, /food/i);
  assert.equal(result.matches[1].partner.name, 'Riverwest Ride Circle');
  assert.match(result.matches[1].explanation, /transportation/i);
  assert.ok(result.matches.some((match) => match.partner.name === 'Winter Care Collective'));
});

test('split needs are detected when no partner covers every category', () => {
  assert.equal(needsFullyCovered(['Clothing', 'Transportation']), true);
  assert.equal(needsFullyCovered(['Food', 'Transportation']), false);
  assert.deepEqual(missingAddableNeeds(['Transportation']), ['Clothing', 'Food']);
  assert.deepEqual(missingAddableNeeds(['Food']), ['Clothing', 'Transportation']);
  assert.deepEqual(missingAddableNeeds(['Clothing', 'Food', 'Transportation']), []);
});

test('detailed clothing-and-ride requests skip the suggested draft', () => {
  assert.equal(shouldOfferDraft(example, ['Clothing', 'Transportation']), false);
  assert.equal(shouldOfferDraft('Need a ride', ['Transportation']), true);
  assert.equal(shouldOfferDraft(example, ['Transportation']), true);
});

test('adding food to a ride request re-ranks complementary partners', () => {
  const rideOnly = withNeeds(['Transportation']);
  assert.ok(rideOnly.matches[0].covers.includes('Transportation'));
  const withFood = withNeeds(['Transportation', 'Food']);
  assert.equal(needsFullyCovered(withFood.needs), false);
  const top = withFood.matches.slice(0, 2).map((match) => match.partner.name);
  assert.deepEqual(top, ['Riverwest Ride Circle', 'Neighborhood Table']);
});

test('unmatched requests return no automatic partner matches', async () => {
  setModelAvailable(true);
  const result = await matchWithModel('Could someone help with algebra?', 0);
  assert.equal(result.matches.length, 0);
  assert.equal(result.needs.length, 0);
});

test('partner profiles share pickup and coverage for map and matching', () => {
  const state = seedState();
  const winter = state.partners.find((partner) => partner.id === 'winter-team')!;
  const ride = state.partners.find((partner) => partner.id === 'ride-circle')!;
  assert.ok(winter.pickup.includes('Moody Park'));
  assert.ok(ride.pickup.toLowerCase().includes('riverwest'));
  assert.deepEqual(winter.coverageAreas, ['Harambee', 'Riverwest']);
  assert.ok(ride.categories.includes('Transportation'));
  const ranked = withNeeds(['Transportation'], 'model', undefined, state.partners);
  assert.ok(ranked.matches.some((match) => match.partner.id === 'winter-team'));
  assert.ok(ranked.matches.some((match) => match.partner.id === 'ride-circle'));
});

test('pausing rides favors available providers while accepted rides stay open', () => {
  const initial = seedState();
  const paused = applyCommand(initial, {
    type: 'set-service-availability',
    partnerId: 'winter-team',
    category: 'Transportation',
    accepting: false,
    at,
  });
  const winter = paused.partners.find((partner) => partner.id === 'winter-team')!;
  assert.equal(winter.availability.Transportation, 'paused');
  assert.equal(winter.availability.Clothing, undefined);
  assert.match(pausedServiceLine(winter), /Transportation temporarily paused/i);
  assert.match(pausedServiceLine(winter, ['Clothing', 'Transportation']), /Transportation temporarily paused/i);
  const rides = withNeeds(['Transportation'], 'model', 'Harambee', paused.partners);
  assert.equal(rides.matches[0].partner.id, 'ride-circle');
  assert.ok(!rides.matches.some((match) => match.partner.id === 'winter-team'));
  assert.ok(needsFullyCovered(['Clothing'], paused.partners));
  const clothingAndRide = withNeeds(['Clothing', 'Transportation'], 'model', undefined, paused.partners);
  assert.ok(clothingAndRide.matches.some((match) => match.partner.id === 'winter-team'));
  assert.deepEqual(
    clothingAndRide.matches.find((match) => match.partner.id === 'winter-team')?.covers,
    ['Clothing'],
  );

  const sent = applyCommand(initial, {
    ...send,
    id: 'ride-before-pause',
    needs: ['Transportation'],
    message: 'Need a ride this week.',
  });
  const accepted = applyCommand(sent, {
    type: 'accept',
    id: 'ride-before-pause',
    partnerId: 'winter-team',
    at,
  });
  const afterPause = applyCommand(accepted, {
    type: 'set-service-availability',
    partnerId: 'winter-team',
    category: 'Transportation',
    accepting: false,
    at,
  });
  assert.equal(partnerInbox(afterPause, 'winter-team')[0].assignment.id, 'ride-before-pause');
  assert.deepEqual(partnerInbox(afterPause, 'winter-team')[0].outstanding, ['Transportation']);

  const reopened = applyCommand(paused, {
    type: 'set-service-availability',
    partnerId: 'winter-team',
    category: 'Transportation',
    accepting: true,
    at,
  });
  assert.equal(
    withNeeds(['Transportation'], 'model', 'Harambee', reopened.partners).matches[0].partner.id,
    'winter-team',
  );
  assert.throws(
    () =>
      applyCommand(paused, {
        ...send,
        id: 'blocked-ride',
        needs: ['Transportation'],
        message: 'Still need a ride.',
      }),
    /not accepting/,
  );
});

test('pending directory listings stay out of matching until approved', () => {
  const submitted = applyCommand(seedState(), {
    type: 'submit-partner-listing',
    id: 'new-coats',
    name: 'Northside Coats',
    area: 'Harambee',
    categories: ['Clothing'],
    pickup: 'Drop-in closet on 3rd Street.',
    at,
  });
  const pending = submitted.partners.find((partner) => partner.id === 'new-coats')!;
  assert.equal(pending.listingStatus, 'pending');
  assert.ok(
    !withNeeds(['Clothing'], 'model', undefined, submitted.partners).matches.some(
      (match) => match.partner.id === 'new-coats',
    ),
  );
  assert.throws(
    () =>
      applyCommand(submitted, {
        ...send,
        id: 'to-pending',
        partnerId: 'new-coats',
        needs: ['Clothing'],
        message: 'Need a coat.',
      }),
    /directory/,
  );
  const approved = applyCommand(submitted, {
    type: 'approve-partner-listing',
    partnerId: 'new-coats',
    at,
  });
  assert.equal(
    approved.partners.find((partner) => partner.id === 'new-coats')?.listingStatus,
    'approved',
  );
  assert.ok(
    withNeeds(['Clothing'], 'model', undefined, approved.partners).matches.some(
      (match) => match.partner.id === 'new-coats',
    ),
  );
});

test('organizations can edit their listing and moderators can remove partners', () => {
  const initial = seedState();
  const paused = applyCommand(initial, {
    type: 'set-service-availability',
    partnerId: 'winter-team',
    category: 'Transportation',
    accepting: false,
    at,
  });
  assert.match(
    pausedServiceLine(paused.partners.find((partner) => partner.id === 'winter-team')!),
    /Transportation temporarily paused/i,
  );
  const updated = applyCommand(paused, {
    type: 'update-partner-listing',
    partnerId: 'winter-team',
    name: 'Winter Care Collective East',
    area: 'Riverwest',
    categories: ['Clothing', 'Food'],
    coverageAreas: ['Riverwest', 'Harambee'],
    pickup: 'Pickup at the east pavilion.',
    at,
  });
  const winter = updated.partners.find((partner) => partner.id === 'winter-team')!;
  assert.equal(winter.name, 'Winter Care Collective East');
  assert.equal(winter.area, 'Riverwest');
  assert.deepEqual(winter.categories, ['Clothing', 'Food']);
  assert.deepEqual(winter.coverageAreas, ['Riverwest', 'Harambee']);
  assert.equal(winter.pickup, 'Pickup at the east pavilion.');
  assert.equal(winter.listingStatus, 'approved');
  assert.equal(winter.availability.Transportation, undefined);
  assert.equal(pausedServiceLine(winter), '');
  assert.equal(pausedServiceLine(winter, ['Clothing', 'Transportation']), '');
  assert.ok(!partnerDetail(winter).toLowerCase().includes('paused'));
  assert.ok(
    withNeeds(['Food'], 'model', undefined, updated.partners).matches.some(
      (match) => match.partner.id === 'winter-team',
    ),
  );
  assert.ok(
    !withNeeds(['Transportation'], 'model', undefined, updated.partners).matches.some(
      (match) => match.partner.id === 'winter-team',
    ),
  );

  const withDelivery = applyCommand(
    applyCommand(
      applyCommand(updated, {
        ...send,
        id: 'winter-before-remove',
        needs: ['Clothing'],
        message: 'Need a coat.',
      }),
      { type: 'accept', id: 'winter-before-remove', partnerId: 'winter-team', at },
    ),
    {
      type: 'complete',
      id: 'winter-before-remove',
      partnerId: 'winter-team',
      category: 'Clothing',
      programId: program.id,
      at,
    },
  );
  const winterCreditBefore = impact(withDelivery).byProvider.find(
    (entry) => entry.name === 'Winter Care Collective East',
  )?.count;
  assert.ok((winterCreditBefore ?? 0) >= 1);
  const riverwestResourcesBefore = mapRows(withDelivery).find(({ area }) => area === 'Riverwest')!
    .resources;

  const removed = applyCommand(withDelivery, {
    type: 'delete-partner-listing',
    partnerId: 'winter-team',
    at,
  });
  assert.equal(
    removed.partners.find((partner) => partner.id === 'winter-team')?.listingStatus,
    'removed',
  );
  assert.ok(
    !withNeeds(['Clothing'], 'model', undefined, removed.partners).matches.some(
      (match) => match.partner.id === 'winter-team',
    ),
  );
  assert.equal(
    mapRows(removed).find(({ area }) => area === 'Riverwest')!.resources,
    riverwestResourcesBefore - 1,
  );
  assert.equal(
    impact(removed).byProvider.find((entry) => entry.name === 'Winter Care Collective East')
      ?.count,
    winterCreditBefore,
  );
  assert.equal(partnerInbox(removed, 'winter-team')[0]?.assignment.id, 'winter-before-remove');
  assert.equal(
    applyCommand(removed, { type: 'delete-partner-listing', partnerId: 'winter-team', at }),
    removed,
  );
});

test('declining a pending listing removes it from the directory queue', () => {
  const submitted = applyCommand(seedState(), {
    type: 'submit-partner-listing',
    id: 'eastside-aid',
    name: 'Eastside Aid',
    area: 'Riverwest',
    categories: ['Food'],
    at,
  });
  const declined = applyCommand(submitted, {
    type: 'decline-partner-listing',
    partnerId: 'eastside-aid',
    at,
    reason: 'Coverage area overlaps an existing partner.',
  });
  const eastside = declined.partners.find((partner) => partner.id === 'eastside-aid')!;
  assert.equal(eastside.listingStatus, 'declined');
  assert.equal(eastside.declineReason, 'Coverage area overlaps an existing partner.');
  const declinedQuietly = applyCommand(submitted, {
    type: 'decline-partner-listing',
    partnerId: 'eastside-aid',
    at,
  });
  assert.equal(
    declinedQuietly.partners.find((partner) => partner.id === 'eastside-aid')?.declineReason,
    undefined,
  );
  assert.equal(applyCommand(declined, {
    type: 'decline-partner-listing',
    partnerId: 'eastside-aid',
    at,
  }), declined);
  assert.ok(
    !withNeeds(['Food'], 'model', undefined, declined.partners).matches.some(
      (match) => match.partner.id === 'eastside-aid',
    ),
  );
  assert.throws(
    () =>
      applyCommand(declined, {
        type: 'approve-partner-listing',
        partnerId: 'eastside-aid',
        at,
      }),
    /no longer available/,
  );
  const another = applyCommand(declined, {
    type: 'submit-partner-listing',
    id: 'westside-aid',
    name: 'Westside Aid',
    area: 'Harambee',
    categories: ['Food'],
    at,
  });
  const approvedOther = applyCommand(another, {
    type: 'approve-partner-listing',
    partnerId: 'westside-aid',
    at,
  });
  assert.equal(
    approvedOther.partners.find((partner) => partner.id === 'westside-aid')?.listingStatus,
    'approved',
  );
  assert.ok(
    withNeeds(['Food'], 'model', undefined, approvedOther.partners).matches.some(
      (match) => match.partner.id === 'westside-aid',
    ),
  );
});

test('saved state validation and deterministic reset', () => {
  assert.deepEqual(decode(JSON.stringify(fullDemo())), fullDemo());
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

test('voiding a mistaken delivery restores the open need and changes totals once', () => {
  const initial = seedState();
  const sent = applyCommand(initial, send);
  const accepted = applyCommand(sent, accept);
  const delivered = applyCommand(accepted, complete);
  const serviceId = delivered.referrals[0].services.find(({ category }) => category === 'Clothing')!.id;
  const correction: Command = {
    type: 'correct-service',
    id: send.id,
    partnerId: send.partnerId,
    serviceId,
    void: true,
    reason: 'The coat was not picked up.',
    workerId: 'winter-worker',
    workerName: 'Jamie Reed',
    at: '2026-11-21T19:00:00Z',
  };
  const voided = decode(JSON.stringify(applyCommand(delivered, correction)));
  assert.deepEqual(outstandingNeeds(residentTimeline(voided)[0]), ['Clothing', 'Transportation']);
  assert.equal(status(residentTimeline(voided)[0]), 'Accepted');
  assert.equal(impact(voided).delivered, impact(delivered).delivered - 1);
  assert.equal(mapRows(voided)[0].delivered, mapRows(delivered)[0].delivered - 1);
  assert.equal(mapRows(voided)[0].open, mapRows(delivered)[0].open + 1);
  assert.equal(applyCommand(voided, correction), voided);
  const voidHistory = voided.referrals[0].services.find(({ id }) => id === serviceId)?.corrections;
  assert.equal(voidHistory?.[0].workerId, 'winter-worker');
  assert.equal(voidHistory?.[0].reason, 'The coat was not picked up.');
});

test('category correction updates Impact and preserves original service history', () => {
  const initial = seedState();
  const sent = applyCommand(initial, send);
  const accepted = applyCommand(sent, accept);
  const delivered = applyCommand(accepted, complete);
  const deliveredRecord = delivered.referrals[0].services.find(({ category }) => category === 'Clothing')!;
  const corrected = decode(JSON.stringify(applyCommand(delivered, {
    type: 'correct-service',
    id: send.id,
    partnerId: send.partnerId,
    serviceId: deliveredRecord.id,
    category: 'Transportation',
    void: false,
    reason: 'This was a ride, not coat delivery.',
    workerId: 'winter-worker',
    workerName: 'Jamie Reed',
    at: '2026-11-21T19:00:00Z',
  })));
  assert.deepEqual(outstandingNeeds(residentTimeline(corrected)[0]), ['Clothing']);
  assert.equal(impact(corrected).delivered, impact(delivered).delivered);
  assert.equal(
    impact(corrected).byCategory.find(({ name }) => name === 'Clothing')?.count,
    impact(delivered).byCategory.find(({ name }) => name === 'Clothing')!.count - 1,
  );
  assert.equal(
    impact(corrected).byCategory.find(({ name }) => name === 'Transportation')?.count,
    impact(delivered).byCategory.find(({ name }) => name === 'Transportation')!.count + 1,
  );
  const record = corrected.referrals[0].services.find(({ id }) => id === deliveredRecord.id);
  assert.equal(record?.category, 'Transportation');
  assert.equal(record?.corrections[0].kind, 'category');
  assert.deepEqual(
    [record?.corrections[0].fromCategory, record?.corrections[0].toCategory],
    ['Clothing', 'Transportation'],
  );
});
