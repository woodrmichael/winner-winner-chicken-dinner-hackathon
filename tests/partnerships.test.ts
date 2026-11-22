import assert from 'node:assert/strict';
import test from 'node:test';
import { applyCommand, deliveredServices } from '../src/domain/model';
import { seedState } from '../src/domain/seed';
import { decode } from '../src/state/persistence';
import { appendEntry, funding, parseDollars, projectDeliveryCounts, supportBook, type SupportEntry } from '../src/features/partnerships/ledger';
import { withExampleSupport } from '../src/features/partnerships/exampleSupport';

test('device sponsorship fixtures retain partial payments and do not duplicate existing support', () => {
  const entries: SupportEntry[] = [{ kind: 'pledge', id: 'my-pledge', business: 'Local Market', project: 'drive', supplies: 500, operations: 0, volunteers: 1 }];
  const seeded = withExampleSupport(entries);
  assert.deepEqual(withExampleSupport(seeded), seeded);
  const book = supportBook(seeded);
  const winter = funding(book.pledges.filter(({ project }) => project === 'drive'));
  assert.equal(winter.paid, 165000);
  assert.equal(winter.volunteers, 6);
  assert.equal(funding(book.pledges.filter(({ project }) => project === 'demo-post-meal-packing')).paid, 55000);
});

test('a reviewed team offer credits the sponsor once and reconciles partial payments after reload', () => {
  const start = seedState();
  const offer: SupportEntry = { kind: 'offer', id: 'market', project: 'drive', business: 'Market',
    supplies: 15000, operations: 5000, volunteers: 2 };
  const run = (state: typeof start, entry: SupportEntry) => applyCommand(state, { type: 'partnership', entry });
  const pending = run(start, offer);
  assert.deepEqual(supportBook(pending.supportEntries).pledges, supportBook().pledges);
  const approved = run(pending, { kind: 'confirm', id: 'confirm', offerId: offer.id });
  const retry = run(approved, { kind: 'confirm', id: 'confirm-again', offerId: offer.id });
  const receipt: SupportEntry = { kind: 'payment', id: 'receipt', pledgeId: offer.id, cents: 5000 };
  const partial = decode(JSON.stringify(run(run(retry, receipt), receipt)));
  const market = (state: typeof start) => supportBook(state.supportEntries).pledges.filter((p) => p.business === 'Market');
  assert.deepEqual(funding(market(partial)), { paid: 5000, outstanding: 15000, suppliesPaid: 3750, operationsPaid: 1250, unallocatedPaid: 0, volunteers: 2 });
  const paid = run(partial, { ...receipt, id: 'second', cents: 15000 });
  assert.deepEqual(market(paid)[0].payments, [5000, 15000]);
  assert.deepEqual(funding(market(paid)), { paid: 20000, outstanding: 0, suppliesPaid: 15000, operationsPaid: 5000, unallocatedPaid: 0, volunteers: 2 });
  assert.deepEqual(deliveredServices(paid), deliveredServices(start));
  assert.throws(() => run(paid, { ...receipt, id: 'overpaid' }), /remaining/);
  assert.throws(() => run(paid, { ...receipt, cents: 6000 }), /already/);
});

test('older snapshots keep opening funding and separate projects retain their own payments and provider credit', () => {
  assert.equal(funding(supportBook(decode(JSON.stringify(seedState())).supportEntries).pledges).paid, 125000);
  const terms = { kind: 'pledge', business: 'Market', supplies: 101, operations: 100, volunteers: 0 } as const;
  const entries = appendEntry(appendEntry([], { ...terms, project: 'drive', id: 'one' }),
    { ...terms, project: 'demo-post-meal-packing', id: 'two' });
  const book = supportBook(appendEntry(entries, { kind: 'payment', id: 'cent', pledgeId: 'two', cents: 1 }));
  assert.deepEqual(book.pledges.filter((p) => p.business === 'Market').map((p) => p.paid), [0, 1]);
  const counts = projectDeliveryCounts([{ providerId: 'table', programId: 'pantry-meal-kits' },
    { providerId: 'winter-team', programId: 'winter-essentials' }, { providerId: 'table' }]);
  assert.deepEqual(counts.map((row) => [row.providerId, row.count]), [['winter-team', 1], ['table', 1]]);
  assert.throws(() => parseDollars('12.001'));
  assert.throws(() => decode(JSON.stringify({ ...seedState(), supportEntries: [{ kind: 'payment' }] })));
});
