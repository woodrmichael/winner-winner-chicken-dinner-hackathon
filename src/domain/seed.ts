import { demoPosts } from './demoCommunity';
import { neighborhoods, serviceNeighborhoods } from './types';
import type { Category, CommunityState, DemoState, Neighborhood, Referral } from './types';

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
export const historicalIncidents: Partial<Record<Neighborhood, { fatal: number; nonfatal: number }>> = {
  Harambee: { fatal: 23, nonfatal: 84 },
  Riverwest: { fatal: 2, nonfatal: 16 },
  'Brewers Hill': { fatal: 1, nonfatal: 3 },
};

export const emptyCommunity = (): CommunityState => ({
  replies: [],
  joinedEvents: [],
  groups: [],
  savedPostIds: [],
  reports: [],
  moderation: [],
});

const scenarios: { provider: string; needs: Category[]; message: string }[] = [
  { provider: 'table', needs: ['Food'], message: 'Could I get groceries for the week?' },
  { provider: 'winter-team', needs: ['Clothing'], message: 'We need warmer clothes for the kids.' },
  { provider: 'ride-circle', needs: ['Transportation'], message: 'Can someone help with a ride to the pantry?' },
  { provider: 'table', needs: ['Food'], message: 'Is there a meal kit I can collect after work?' },
  { provider: 'winter-team', needs: ['Clothing', 'Transportation'], message: 'I need a winter coat and a ride to the pickup.' },
  { provider: 'ride-circle', needs: ['Transportation'], message: 'Could I arrange a ride to an appointment?' },
  { provider: 'winter-team', needs: ['Clothing'], message: 'Is there a warm jacket in an adult size?' },
  { provider: 'table', needs: ['Food'], message: 'I could use a pantry box and have time to collect it this week.' },
  { provider: 'ride-circle', needs: ['Transportation'], message: 'I need a ride home from the community center.' },
  { provider: 'table', needs: ['Food'], message: 'Do you have staple groceries available for pickup?' },
];
const winterPickup = scenarios[4];
const areas: Neighborhood[] = ['Harambee', 'Riverwest', 'Harambee', 'Brewers Hill', 'Riverwest', 'Harambee', 'Brewers Hill'];
const additionalAreas = ['Amani', 'Bay View', "Walker's Point"] as const;
const responseMinutes = [25, 40, 55, 75, 95, 130, 230, 370, 540, 1080];
const alternateMessages: Record<Category, string[]> = {
  Clothing: ['Do you have a warm jacket for my teenager?', 'Looking for a coat that can fit over a work uniform.'],
  Transportation: ['Could someone give me a ride to pick up a grocery box?', 'I need a ride to the community room after work.'],
  Food: ['Could I reserve a pantry bag for Thursday pickup?', 'Is there a meal box I can pick up after my shift?'],
  Other: [],
};
const winterPickupMessages = [
  winterPickup.message,
  'My daughter needs a winter coat. Could we also get a ride to pick it up?',
  'I can pick up a coat this week if someone can help me get there.',
];

function sampleReferral({
  id, ownerId, scenario, neighborhood, sent, wait, deliveryDelays,
}: {
  id: string;
  ownerId: string;
  scenario: (typeof scenarios)[number];
  neighborhood?: Neighborhood;
  sent: number;
  wait?: number;
  deliveryDelays: number[];
}): Referral {
  const { provider, message, needs } = scenario;
  const sentAt = new Date(sent).toISOString();
  const accepted = wait === undefined ? undefined : sent + wait * 60_000;
  return {
    id,
    residentId: ownerId,
    sentAt,
    needs: [...needs],
    assignments: [{
      id,
      partnerId: provider,
      message,
      sentAt,
      shared: neighborhood ? { neighborhood } : {},
      ...(accepted === undefined ? {} : { acceptedAt: new Date(accepted).toISOString() }),
      declines: {},
    }],
    services: accepted === undefined ? [] : deliveryDelays.map((hours, index) => ({
      id: `${id}:${needs[index]}`,
      assignmentId: id,
      providerId: provider,
      category: needs[index],
      deliveredAt: new Date(accepted + hours * 3_600_000).toISOString(),
      ...(needs[index] === 'Clothing' && provider === program.providerId ? { programId: program.id } : {}),
      corrections: [],
    })),
    withdrawn: [],
    handoffs: [],
  };
}

function sampleMonth(month: number, delivered: number, partial: number, accepted: number, awaiting: number) {
  const requests = delivered + partial + accepted + awaiting;
  return Array.from({ length: requests }, (_, index) => {
    const isPartial = index >= delivered && index < delivered + partial;
    const scenario = isPartial ? winterPickup : scenarios[(index + month) % scenarios.length];
    const owner = Math.floor(index * 0.76);
    const area = areas[(owner + month) % areas.length];
    const lastRequestDay = month === 11 ? 20 : 27;
    const day = 1 + Math.floor(index * lastRequestDay / requests);
    const variants = scenario === winterPickup
      ? winterPickupMessages
      : [scenario.message, ...alternateMessages[scenario.needs[0]]];
    const message = variants[(Math.floor(index / scenarios.length) + month) % variants.length];
    return sampleReferral({
      id: `demo-ref-${month}-${index + 1}`,
      ownerId: `demo-neighbor-${month}-${owner + 1}`,
      scenario: { ...scenario, message },
      neighborhood: index % 17 === 0 ? undefined : area,
      sent: Date.UTC(2026, month - 1, day, 14 + (index * 5 + owner) % 8, (index * 13 + owner * 7) % 60),
      wait: index < requests - awaiting ? responseMinutes[(index * 3 + month) % responseMinutes.length] : undefined,
      deliveryDelays: index < delivered
        ? scenario.needs.map((_, need) => 6 + index % 27 + 2 * need)
        : isPartial ? [12 + index % 16] : [],
    });
  });
}

function expandedReferrals() {
  return [
    ...sampleMonth(8, 30, 0, 4, 2),
    ...sampleMonth(9, 43, 1, 6, 3),
    ...sampleMonth(10, 58, 3, 7, 5),
    ...sampleMonth(11, 65, 12, 19, 23),
    ...additionalAreas.flatMap((neighborhood, areaIndex) =>
      Array.from({ length: 8 }, (_, index) => {
        const scenario = scenarios[(index + areaIndex * 3) % scenarios.length];
        return sampleReferral({
          id: `demo-ref-neighborhood-${areaIndex + 1}-${index + 1}`,
          ownerId: `demo-neighbor-new-${areaIndex + 1}-${Math.floor(index * 0.8) + 1}`,
          neighborhood,
          scenario,
          sent: Date.UTC(2026, 8 + Math.floor(index / 3), 5 + index % 3 * 5 + areaIndex, 15 + (index + areaIndex) % 7, 10 + 7 * index),
          wait: index === 7 && areaIndex !== 1 ? undefined : responseMinutes[index + areaIndex],
          deliveryDelays: index < 6 || (index === 6 && areaIndex !== 1)
            ? scenario.needs.map((_, need) => 10 + index * 3 + need * 4)
            : [],
        });
      })),
    ...serviceNeighborhoods.slice(neighborhoods.length).flatMap((neighborhood, areaIndex) => {
      const areaId = neighborhood.toLowerCase().replaceAll(' ', '-');
      return Array.from({ length: 7 + (areaIndex * 5) % 9 }, (_, index) => {
        const scenario = scenarios[(index + areaIndex * 3) % scenarios.length];
        const month = 8 + (areaIndex + index * 3) % 4;
        const day = 2 + (areaIndex * 3 + index * 5) % 18;
        const stage = (areaIndex + index * 7) % 10;
        const messages = [scenario.message, ...alternateMessages[scenario.needs[0]]];
        return sampleReferral({
          id: `demo-ref-city-${areaId}-${index + 1}`,
          ownerId: `demo-neighbor-city-${areaId}-${Math.floor(index * 0.85) + 1}`,
          neighborhood,
          scenario: { ...scenario, message: messages[(index + month) % messages.length] },
          sent: Date.UTC(2026, month - 1, day, 14 + (index + areaIndex) % 8, (index * 11) % 60),
          wait: stage < 8 ? responseMinutes[(areaIndex + index) % responseMinutes.length] : undefined,
          deliveryDelays: stage < 6
            ? scenario.needs.map((_, need) => 9 + (index * 3) % 28 + need * 4)
            : stage === 6 && scenario.needs.length > 1 ? [18] : [],
        });
      });
    }),
    sampleReferral({
      id: 'demo-ref-october-coat',
      ownerId: 'demo-neighbor-october-coat',
      scenario: scenarios[1],
      neighborhood: 'Harambee',
      sent: Date.UTC(2026, 9, 31, 22),
      wait: 80,
      deliveryDelays: [32],
    }),
    sampleReferral({
      id: 'demo-ref-alex-winter',
      ownerId: residentId,
      scenario: winterPickup,
      neighborhood: profile.neighborhood,
      sent: Date.UTC(2026, 10, 17, 18),
      wait: 95,
      deliveryDelays: [20],
    }),
    sampleReferral({
      id: 'demo-ref-alex-pantry',
      ownerId: residentId,
      scenario: scenarios[7],
      neighborhood: profile.neighborhood,
      sent: Date.UTC(2026, 10, 9, 16),
      wait: 55,
      deliveryDelays: [28],
    }),
    sampleReferral({
      id: 'demo-ref-alex-ride',
      ownerId: residentId,
      scenario: scenarios[5],
      neighborhood: profile.neighborhood,
      sent: Date.UTC(2026, 10, 20, 17),
      deliveryDelays: [],
    }),
  ];
}

function appendMissing<T extends { id: string }>(existing: T[], samples: T[]) {
  const ids = new Set(existing.map(({ id }) => id));
  const missing = samples.filter(({ id }) => !ids.has(id));
  return missing.length ? [...existing, ...missing] : existing;
}

export function withDemoSamples(state: DemoState, sampleResidentId = residentId): DemoState {
  let postsChanged = false;
  const postsWithResident = state.posts.map((post) => {
    if (post.authorId !== residentId || sampleResidentId === residentId) return post;
    postsChanged = true;
    return { ...post, authorId: sampleResidentId };
  });
  const posts = appendMissing(
    postsChanged ? postsWithResident : state.posts,
    demoPosts()
      .filter(({ id }) => id.startsWith('demo-post-'))
      .map((post) => post.authorId === residentId ? { ...post, authorId: sampleResidentId } : post),
  );
  const referrals = withDemoReferrals(state.referrals, sampleResidentId);
  return posts === state.posts && referrals === state.referrals ? state : { ...state, posts, referrals };
}

export function withDemoReferrals(referrals: Referral[], sampleResidentId = residentId) {
  const samples = expandedReferrals().map((referral) =>
    referral.residentId === residentId ? { ...referral, residentId: sampleResidentId } : referral,
  );
  return appendMissing(referrals, samples);
}

export function seedState(sampleResidentId = residentId): DemoState {
  const sent = Date.UTC(2026, 10, 18, 15);
  return withDemoSamples({
    version: 2,
    community: emptyCommunity(),
    referrals: [
      sampleReferral({
        id: 'seed-winter',
        ownerId: 'sample-a',
        scenario: { provider: 'winter-team', needs: ['Clothing'], message: 'A warm coat, please.' },
        neighborhood: 'Harambee',
        sent,
        wait: 60,
        deliveryDelays: [26.5],
      }),
      sampleReferral({
        id: 'seed-food',
        ownerId: 'sample-b',
        scenario: { provider: 'table', needs: ['Food'], message: 'Could I pick up groceries?' },
        neighborhood: 'Brewers Hill',
        sent,
        wait: 60,
        deliveryDelays: [26.5],
      }),
      sampleReferral({
        id: 'seed-ride',
        ownerId: 'sample-c',
        scenario: { provider: 'ride-circle', needs: ['Transportation'], message: 'I could use a ride this week.' },
        neighborhood: 'Riverwest',
        sent,
        wait: 60,
        deliveryDelays: [],
      }),
      sampleReferral({
        id: 'seed-open',
        ownerId: 'sample-d',
        scenario: { provider: 'table', needs: ['Food'], message: 'Is there a pantry pickup?' },
        neighborhood: 'Harambee',
        sent,
        deliveryDelays: [],
      }),
    ],
    posts: demoPosts(),
  }, sampleResidentId);
}
