import type { Category, CommunityState, DemoState, Referral, SharedDetails } from './types';

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

export const emptyCommunity = (): CommunityState => ({
  replies: [],
  joinedEvents: [],
  groups: [],
  savedPostIds: [],
});

export function seedState(): DemoState {
  const sentAt = '2026-11-18T15:00:00.000Z';
  const acceptedAt = '2026-11-18T16:00:00.000Z';
  const deliveredAt = '2026-11-19T18:30:00.000Z';
  function sample(
    id: string,
    ownerId: string,
    partnerId: string,
    message: string,
    category: Category,
    shared: SharedDetails,
    stage: 'sent' | 'accepted' | 'delivered',
    programId?: string,
  ): Referral {
    return {
      id,
      residentId: ownerId,
      needs: [category],
      sentAt,
      assignments: [
        {
          id,
          partnerId,
          message,
          shared,
          sentAt,
          ...(stage !== 'sent' && { acceptedAt }),
          declines: {},
        },
      ],
      services:
        stage === 'delivered'
          ? [
              {
                assignmentId: id,
                category,
                providerId: partnerId,
                deliveredAt,
                ...(programId && { programId }),
              },
            ]
          : [],
      withdrawn: [],
      handoffs: [],
    };
  }
  return {
    version: 2,
    community: emptyCommunity(),
    referrals: [
      sample(
        'seed-winter',
        'sample-a',
        'winter-team',
        'A warm coat, please.',
        'Clothing',
        { neighborhood: 'Harambee' },
        'delivered',
        program.id,
      ),
      sample(
        'seed-food',
        'sample-b',
        'table',
        'Could I pick up groceries?',
        'Food',
        { neighborhood: 'Brewers Hill' },
        'delivered',
      ),
      sample(
        'seed-ride',
        'sample-c',
        'ride-circle',
        'I could use a ride this week.',
        'Transportation',
        { neighborhood: 'Riverwest' },
        'accepted',
      ),
      sample(
        'seed-open',
        'sample-d',
        'table',
        'Is there a pantry pickup?',
        'Food',
        { neighborhood: 'Harambee' },
        'sent',
      ),
    ],
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
