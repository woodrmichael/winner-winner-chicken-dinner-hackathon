import type { SupportEntry } from './ledger';

const examples: SupportEntry[] = [
  { kind: 'pledge', id: 'fixture-sponsor-harbor', business: 'Harbor Coffee Roasters', project: 'drive', supplies: 22500, operations: 7500, volunteers: 3 },
  { kind: 'payment', id: 'fixture-sponsor-harbor-payment', pledgeId: 'fixture-sponsor-harbor', cents: 25000 },
  { kind: 'pledge', id: 'fixture-sponsor-northline', business: 'Northline Market', project: 'drive', supplies: 10000, operations: 5000, volunteers: 2 },
  { kind: 'payment', id: 'fixture-sponsor-northline-payment', pledgeId: 'fixture-sponsor-northline', cents: 15000 },
  { kind: 'pledge', id: 'fixture-sponsor-pantry-harbor', business: 'Harbor Coffee Roasters', project: 'demo-post-meal-packing', supplies: 30000, operations: 5000, volunteers: 2 },
  { kind: 'payment', id: 'fixture-sponsor-pantry-harbor-payment', pledgeId: 'fixture-sponsor-pantry-harbor', cents: 35000 },
  { kind: 'pledge', id: 'fixture-sponsor-pantry-oak', business: 'Oak Street Bakery', project: 'demo-post-meal-packing', supplies: 20000, operations: 10000, volunteers: 4 },
  { kind: 'payment', id: 'fixture-sponsor-pantry-oak-payment', pledgeId: 'fixture-sponsor-pantry-oak', cents: 20000 },
  { kind: 'offer', id: 'fixture-sponsor-print', business: 'Lakeside Print Co.', project: 'drive', supplies: 10000, operations: 5000, volunteers: 2 },
  { kind: 'inquiry', id: 'fixture-sponsor-team', business: 'Third Ward Design Studio', project: 'demo-post-meal-packing', proposal: 'Could our team of four help assemble pantry boxes?', contact: 'team@example.org' },
];

export function withExampleSupport(entries: SupportEntry[] = []) {
  const ids = new Set(entries.map(({ id }) => id));
  return [...examples.filter(({ id }) => !ids.has(id)), ...entries];
}
