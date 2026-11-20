import type { DemoState, Referral } from './types';

export const residentId = 'demo-resident';
export const profile = {
  firstName: 'Alex',
  callback: '414-555-0142',
  neighborhood: 'Harambee',
} as const;
export const program = {
  id: 'winter-essentials',
  name: 'Winter essentials',
  sponsor: 'Juniper Market',
  providerId: 'winter-team',
  goal: 2000,
  received: 1250,
  pledged: 300,
} as const;
// MHRC 2016 Annual Report, tables 16–17. Three-year totals for 2014–2016.
export const historicalIncidents = {
  Harambee: { fatal: 23, nonfatal: 84 },
  Riverwest: { fatal: 2, nonfatal: 16 },
  'Brewers Hill': { fatal: 1, nonfatal: 3 },
};

export function seedState(): DemoState {
  const sentAt = '2026-11-18T15:00:00.000Z';
  const acceptedAt = '2026-11-18T16:00:00.000Z';
  const deliveredAt = '2026-11-19T18:30:00.000Z';
  const referrals: Referral[] = [
    {
      id: 'seed-winter',
      residentId: 'sample-a',
      partnerId: 'winter-team',
      message: 'A warm coat, please.',
      needs: ['Clothing'],
      shared: { neighborhood: 'Harambee' },
      sentAt,
      acceptedAt,
      service: {
        category: 'Clothing',
        providerId: 'winter-team',
        deliveredAt,
        programId: program.id,
      },
    },
    {
      id: 'seed-food',
      residentId: 'sample-b',
      partnerId: 'table',
      message: 'Could I pick up groceries?',
      needs: ['Food'],
      shared: { neighborhood: 'Brewers Hill' },
      sentAt,
      acceptedAt,
      service: { category: 'Food', providerId: 'table', deliveredAt },
    },
    {
      id: 'seed-ride',
      residentId: 'sample-c',
      partnerId: 'ride-circle',
      message: 'I could use a ride this week.',
      needs: ['Transportation'],
      shared: { neighborhood: 'Riverwest' },
      sentAt,
      acceptedAt,
    },
    {
      id: 'seed-open',
      residentId: 'sample-d',
      partnerId: 'table',
      message: 'Is there a pantry pickup?',
      needs: ['Food'],
      shared: { neighborhood: 'Harambee' },
      sentAt,
    },
  ];
  return {
    version: 1,
    referrals,
    posts: [
      {
        id: 'drive',
        kind: 'Event',
        author: 'ComForce Connect',
        title: 'Winter essentials drive',
        body: 'Bring a clean coat or stop by to pick one up. Kids’ and adult sizes welcome.',
        date: '2026-11-20T15:00:00Z',
      },
      {
        id: 'coats',
        kind: 'Offer',
        author: 'Maya R.',
        title: 'Kids’ coats available',
        body: 'Two gently used winter coats, sizes 6 and 8. Available for Saturday pickup.',
        date: '2026-11-19T18:00:00Z',
      },
      {
        id: 'pantry',
        kind: 'Update',
        author: 'Neighborhood Table',
        title: 'Pantry pickup has moved indoors',
        body: 'This week’s volunteers will meet families inside the community room.',
        date: '2026-11-18T15:00:00Z',
      },
    ],
  };
}
