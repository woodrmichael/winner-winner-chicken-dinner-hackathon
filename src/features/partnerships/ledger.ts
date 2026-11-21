import { program } from '../../domain/seed';

export const projects = [
  { id: 'drive', programId: program.id, providerId: program.providerId, category: 'Clothing', name: program.name, event: 'Winter essentials drive', goal: program.goal, organizer: 'Winter Care Collective', supplies: 'Coats, boots and sorting supplies', updateId: 'demo-post-ride-pickups', activities: [
    { id: 'drive', name: 'Winter drive', at: '2026-11-21T10:00:00-06:00' },
    { id: 'demo-post-winter-sorting', name: 'Donation sorting', at: '2026-11-24T17:30:00-06:00' },
  ] },
  { id: 'demo-post-meal-packing', programId: 'pantry-meal-kits', providerId: 'table', category: 'Food', name: 'Pantry meal kits', event: 'Help pack pantry meal kits', goal: 1000, organizer: 'Neighborhood Table', supplies: 'Shelf-stable groceries and packing supplies', updateId: 'pantry', activities: [
    { id: 'demo-post-meal-packing', name: 'Meal kit packing', at: '2026-11-22T13:00:00-06:00' },
  ] },
] as const;
export function projectDeliveryCounts(services: readonly { programId?: string; providerId: string }[]) {
  return projects.map(({ id, providerId, programId }) => ({ project: id, providerId,
    count: services.filter((s) => s.programId === programId && s.providerId === providerId).length,
  }));
}

export type ProjectId = typeof projects[number]['id'];
type Terms = { business: string; project: ProjectId; supplies: number; operations: number; volunteers: number };
export type SupportEntry =
  | ({ kind: 'offer' | 'pledge'; id: string } & Terms)
  | { kind: 'inquiry'; id: string; business: string; project: ProjectId; proposal: string; contact: string }
  | { kind: 'confirm'; id: string; offerId: string }
  | { kind: 'payment'; id: string; pledgeId: string; cents: number };
export type SupportCommand = { type: 'partnership'; entry: SupportEntry };
export type Pledge = Terms & { id: string; paid: number; payments: number[] };
export type SupportBook = {
  pledges: Pledge[];
  offers: (Terms & { id: string })[];
  inquiries: Extract<SupportEntry, { kind: 'inquiry' }>[];
};

const limit = 100_000_000;
function amount(n: unknown, max = limit): n is number {
  return typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n <= max;
}
function string(s: unknown, max = 160): s is string {
  return typeof s === 'string' && !!s.trim() && s.length <= max;
}
export function parseEntry(raw: unknown): SupportEntry {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid partnership entry.');
  const r = raw as Record<string, unknown>;
  if (!string(r.id)) throw new Error('Missing entry ID.');
  const id = r.id;
  if (r.kind === 'confirm' && string(r.offerId)) return { kind: 'confirm', id, offerId: r.offerId };
  if (r.kind === 'payment' && string(r.pledgeId) && amount(r.cents) && r.cents > 0)
    return { kind: 'payment', id, pledgeId: r.pledgeId, cents: r.cents };
  const project = projects.find((p) => p.id === r.project)?.id;
  if (project && string(r.business)) {
    const business = r.business.trim();
    if (r.kind === 'inquiry' && string(r.proposal, 1000) && string(r.contact, 300))
      return { kind: 'inquiry', id, project, business, proposal: r.proposal.trim(), contact: r.contact.trim() };
    if ((r.kind === 'offer' || r.kind === 'pledge') && amount(r.supplies) && amount(r.operations) &&
      amount(r.volunteers, 1000) && r.supplies + r.operations <= limit && r.supplies + r.operations + r.volunteers > 0)
      return { kind: r.kind, id, project, business, supplies: r.supplies, operations: r.operations, volunteers: r.volunteers };
  }
  throw new Error('Check the business, project, amounts and contact details.');
}

export function supportBook(entries: readonly SupportEntry[] = []): SupportBook {
  const book: SupportBook = {
    pledges: [{ id: 'opening-winter', business: program.sponsor, project: 'drive',
      supplies: 100 * (program.received + program.pledged), operations: 0, volunteers: 0, paid: 100 * program.received, payments: [100 * program.received] }],
    offers: [], inquiries: [],
  };
  for (const e of entries) {
    switch (e.kind) {
      case 'inquiry': book.inquiries.push(e); break;
      case 'offer': book.offers.push(e); break;
      case 'pledge': book.pledges.push({ ...e, paid: 0, payments: [] }); break;
      case 'confirm': {
        const index = book.offers.findIndex((offer) => offer.id === e.offerId);
        if (index < 0) throw new Error('This offer is no longer pending.');
        const [offer] = book.offers.splice(index, 1);
        book.pledges.push({ ...offer, paid: 0, payments: [] });
        break;
      }
      case 'payment': {
        const pledge = book.pledges.find((p) => p.id === e.pledgeId);
        if (!pledge || pledge.paid + e.cents > pledge.supplies + pledge.operations)
          throw new Error('Payment exceeds the remaining pledge.');
        pledge.paid += e.cents;
        pledge.payments.push(e.cents);
        break;
      }
    }
  }
  return book;
}

export function appendEntry(entries: SupportEntry[] = [], raw: SupportEntry) {
  const entry = parseEntry(raw);
  const prior = entries.find((e) => e.id === entry.id);
  if (prior && JSON.stringify(prior) === JSON.stringify(entry)) return entries;
  if (prior || entry.id === 'opening-winter') throw new Error('This entry ID is already in use.');
  if (entry.kind === 'confirm' && entries.some((e) => e.kind === 'confirm' && e.offerId === entry.offerId)) return entries;
  const next = [...entries, entry];
  supportBook(next);
  return next;
}

export function decodeEntries(raw: unknown): SupportEntry[] {
  if (!Array.isArray(raw)) throw new Error('Invalid partnership history.');
  const entries = raw.map(parseEntry);
  if (new Set(['opening-winter', ...entries.map((e) => e.id)]).size !== entries.length + 1)
    throw new Error('Duplicate partnership entry.');
  supportBook(entries);
  return entries;
}

export function funding(pledges: readonly Pledge[]) {
  const total = { paid: 0, outstanding: 0, suppliesPaid: 0, operationsPaid: 0, unallocatedPaid: 0, volunteers: 0 };
  for (const p of pledges) {
    const promised = p.supplies + p.operations;
    const operationsPaid = promised ? Math.round(p.paid * p.operations / promised) : 0;
    total.paid += p.paid;
    total.outstanding += promised - p.paid;
    total.operationsPaid += operationsPaid;
    if (p.id === 'opening-winter') total.unallocatedPaid += p.paid;
    else total.suppliesPaid += p.paid - operationsPaid;
    total.volunteers += p.volunteers;
  }
  return total;
}

export const cash = (cents: number) => (cents / 100).toLocaleString('en-US', {
  style: 'currency', currency: 'USD', minimumFractionDigits: cents % 100 ? 2 : 0,
});
export function parseDollars(value: string) {
  if (!value.trim()) return 0;
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) throw new Error('Enter dollars with up to two decimal places.');
  return Math.round(Number(value) * 100);
}
