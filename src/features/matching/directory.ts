import type { Category, Partner, ServiceAvailability } from '../../domain/types';

export function seedPartners(): Partner[] {
  return [
    {
      id: 'winter-team',
      name: 'Winter Care Collective',
      categories: ['Clothing', 'Transportation'],
      area: 'Harambee',
      coverageAreas: ['Harambee', 'Riverwest'],
      pickup:
        'Coat pickup at Moody Park pavilion; rides arranged by text the day before. Side entrance for Saturday appointments.',
      availability: {},
      listingStatus: 'approved',
    },
    {
      id: 'ride-circle',
      name: 'Riverwest Ride Circle',
      categories: ['Transportation'],
      area: 'Riverwest',
      coverageAreas: ['Riverwest', 'Harambee', 'Brewers Hill'],
      pickup:
        'Volunteer drivers meet at the Riverwest Food Co-op lot. Share a callback number so the driver can confirm the curb location.',
      availability: {},
      listingStatus: 'approved',
    },
    {
      id: 'table',
      name: 'Neighborhood Table',
      categories: ['Food'],
      area: 'Brewers Hill',
      coverageAreas: ['Brewers Hill', 'Harambee'],
      pickup:
        'Pantry boxes ready at the Brewers Hill community kitchen. Use the alley door and bring a bag.',
      availability: {},
      listingStatus: 'approved',
    },
  ];
}

/** Approved seed partners — default directory for tests and name lookups of known orgs. */
export const directory: Partner[] = seedPartners();

export function approvedPartners(partners: Partner[]) {
  return partners.filter((partner) => partner.listingStatus === 'approved');
}

/** Approved partners plus removed orgs that still have delivery credit for Impact. */
export function creditedPartners(
  partners: Partner[],
  providerIds: Iterable<string>,
) {
  const approved = approvedPartners(partners);
  const delivered = new Set(providerIds);
  const seen = new Set(approved.map((partner) => partner.id));
  const removedWithCredit = partners.filter(
    (partner) =>
      partner.listingStatus === 'removed' &&
      delivered.has(partner.id) &&
      !seen.has(partner.id),
  );
  return [...approved, ...removedWithCredit];
}

export function offersCategory(partner: Partner, category: Category) {
  return category === 'Other' || partner.categories.includes(category);
}

export function serviceAvailability(partner: Partner, category: Category): ServiceAvailability {
  if (!offersCategory(partner, category)) return 'accepting';
  return partner.availability[category] ?? 'accepting';
}

/** Drop paused/accepting flags for services the organization no longer lists. */
export function availabilityForCategories(
  availability: Partner['availability'],
  categories: Category[],
): Partner['availability'] {
  return Object.fromEntries(
    Object.entries(availability).filter(([category]) =>
      categories.includes(category as Category),
    ),
  ) as Partner['availability'];
}

export function eligibleForNewReferral(partner: Partner, category: Category) {
  return (
    partner.listingStatus === 'approved' &&
    offersCategory(partner, category) &&
    serviceAvailability(partner, category) === 'accepting'
  );
}

export function pausedCategories(partner: Partner, among?: Category[]) {
  const scope = among?.length
    ? among.filter((category) => offersCategory(partner, category))
    : partner.categories;
  return scope.filter((category) => serviceAvailability(partner, category) === 'paused');
}

/** Join words as "a", "a and b", or "a, b, and c". */
export function listWords(items: string[]) {
  if (!items.length) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

/** Resident-facing cover line: "Covers food", "Offers both clothing and transportation", "Offers clothing, food, and transportation". */
export function offerCoversLine(covers: string[]) {
  if (!covers.length) return '';
  if (covers.length === 1) return 'Covers ' + covers[0];
  if (covers.length === 2) return 'Offers both ' + listWords(covers);
  return 'Offers ' + listWords(covers);
}

/** Resident-facing copy, e.g. "Transportation temporarily paused". */
export function pausedServiceLine(partner: Partner, among?: Category[]) {
  const paused = pausedCategories(partner, among).map((category, index) =>
    index === 0 ? category : category.toLowerCase(),
  );
  if (!paused.length) return '';
  return `${listWords(paused)} temporarily paused`;
}

export function partnerName(partners: Partner[] | string, id?: string): string {
  if (typeof partners === 'string') {
    return directory.find((partner) => partner.id === partners)?.name ?? 'Unknown partner';
  }
  return partners.find((partner) => partner.id === id)?.name
    ?? directory.find((partner) => partner.id === id)?.name
    ?? 'Unknown partner';
}

export function partnerDetail(partner: Partner, explanation?: string) {
  const covers =
    explanation ||
    (partner.categories.length
      ? offerCoversLine(partner.categories.map((c) => c.toLowerCase()))
      : '');
  const coverage =
    partner.coverageAreas.length > 1
      ? `Serves ${listWords(partner.coverageAreas)}`
      : `Serves ${partner.area}`;
  const paused = pausedServiceLine(partner);
  const availability = paused || 'Accepting new referrals';
  return [covers, coverage, partner.pickup, availability].filter(Boolean).join(' · ');
}

export function mergePartners(existing: Partner[] | undefined, seeds = seedPartners()) {
  if (!existing?.length) return seeds.map((partner) => ({ ...partner, availability: { ...partner.availability }, coverageAreas: [...partner.coverageAreas], categories: [...partner.categories] }));
  const byId = new Map(existing.map((partner) => [partner.id, partner]));
  for (const seed of seeds) {
    if (!byId.has(seed.id)) byId.set(seed.id, seed);
  }
  return [...byId.values()];
}

export function normalizePartner(value: Partial<Partner> & Pick<Partner, 'id' | 'name' | 'categories' | 'area'>): Partner {
  const listingStatus =
    value.listingStatus === 'pending' ||
    value.listingStatus === 'declined' ||
    value.listingStatus === 'removed'
      ? value.listingStatus
      : 'approved';
  const declineReason = value.declineReason?.trim();
  return {
    id: value.id,
    name: value.name,
    categories: [...value.categories],
    area: value.area,
    coverageAreas: value.coverageAreas?.length ? [...value.coverageAreas] : [value.area],
    pickup: value.pickup?.trim() || 'Contact the organization for pickup arrangements.',
    availability: availabilityForCategories(value.availability ?? {}, value.categories),
    listingStatus,
    ...(declineReason && listingStatus === 'declined' ? { declineReason } : {}),
  };
}
