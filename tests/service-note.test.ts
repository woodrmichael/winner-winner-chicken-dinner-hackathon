import assert from 'node:assert/strict';
import test from 'node:test';
import { suggestService } from '../src/features/activity/serviceNote';
import { applyCommand, deliveredServices } from '../src/domain/model';
import { seedState } from '../src/domain/seed';
import { decode } from '../src/state/persistence';
import { outstandingNeeds } from '../src/domain/referrals';

test('worker note suggests only completed eligible services and confirmation records one delivery', () => {
  const categories = ['Clothing', 'Transportation'] as const;
  assert.deepEqual(suggestService('Dropped off the coats today. Ride still needed.', categories), ['Clothing']);
  for (const note of ["Did not deliver coats.", "Will deliver coats tomorrow.", "We couldn't provide a ride.", 'Coats needed.']) {
    assert.deepEqual(suggestService(note, categories), []);
  }
  assert.deepEqual(suggestService('Delivered meals today.', categories), []);
  assert.deepEqual(suggestService('Delivered coats. Completed the ride.', categories), categories);
  let state = applyCommand(seedState(), { type: 'send', id: 'note-review', partnerId: 'winter-team',
    message: 'Coats and a ride', needs: [...categories], shared: {}, at: '2026-11-21T10:00:00Z' });
  state = applyCommand(state, { type: 'accept', id: 'note-review', partnerId: 'winter-team', at: '2026-11-21T10:01:00Z' });
  const before = deliveredServices(state).length;
  const command = { type: 'complete', id: 'note-review', partnerId: 'winter-team', category: 'Clothing',
    programId: 'winter-essentials', at: '2026-11-21T10:02:00Z' } as const;
  const completed = decode(JSON.stringify(applyCommand(applyCommand(state, command), command)));
  assert.equal(deliveredServices(completed).length, before + 1);
  assert.deepEqual(outstandingNeeds(completed.referrals.find((r) => r.id === 'note-review')!), ['Transportation']);
});
