import type { Post } from './types';

export type EventVenue = { name: string; address: string; coordinates: [number, number] };
type EventDetails = { when: string; venue: EventVenue; bring: string; volunteers: number };
type DemoPost = Post & { event?: EventDetails };

const entries: DemoPost[] = [
  {
    id: 'drive',
    kind: 'Event',
    author: 'ComForce Connect',
    title: 'Winter essentials drive',
    body: 'We’re collecting winter gear for neighbors recovering from an apartment fire and anyone who needs a coat. Saturday pickup rides are available by request.',
    date: '2026-11-20T15:00:00Z',
    event: {
      when: 'Saturday, November 21 · 10 am',
      venue: { name: 'Moody Park', address: '2201 W. Auer Ave.', coordinates: [-87.939864, 43.076003] },
      bring: 'Bring a clean winter coat if you’re donating. If you’re picking one up, just bring yourself.',
      volunteers: 8,
    },
  },
  {
    id: 'coats',
    kind: 'Offer',
    author: 'Alex (you)',
    authorId: 'demo-resident',
    title: 'Kids’ coats available',
    body: 'Two gently used winter coats, sizes 6 and 8. Available for Saturday pickup.',
    date: '2026-11-19T18:00:00Z',
    status: 'active',
  },
  {
    id: 'pantry',
    kind: 'Update',
    author: 'Neighborhood Table',
    title: 'Pantry pickup has moved indoors',
    body: 'This week’s volunteers will meet families inside the community room.',
    date: '2026-11-18T15:00:00Z',
  },
  {
    id: 'demo-post-meal-packing',
    kind: 'Event',
    author: 'Neighborhood Table',
    title: 'Help pack pantry meal kits',
    body: 'We’ll sort groceries and pack shelf-stable meal kits for next week’s pantry pickup.',
    date: '2026-11-17T15:30:00Z',
    event: {
      when: 'Sunday, November 22 · 1 pm',
      venue: { name: 'Central Library', address: '814 W. Wisconsin Ave.', coordinates: [-87.922372, 43.039523] },
      bring: 'Wear closed-toe shoes. We’ll have gloves and packing supplies.',
      volunteers: 6,
    },
  },
  {
    id: 'demo-post-boots',
    kind: 'Offer',
    author: 'Jordan L.',
    title: 'Adult winter boots, size 9',
    body: 'One pair of insulated boots in good condition. I can meet near Moody Park.',
    date: '2026-11-16T21:00:00Z',
  },
  {
    id: 'demo-post-ride-pickups',
    kind: 'Update',
    author: 'Riverwest Ride Circle',
    title: 'Adding a second pantry ride',
    body: 'Tuesday pantry rides will continue. We’re also taking ride requests for Saturday’s winter drive.',
    date: '2026-11-15T17:00:00Z',
  },
  {
    id: 'demo-post-blankets',
    kind: 'Offer',
    author: 'Tasha B.',
    title: 'Clean blankets for pickup',
    body: 'Three twin blankets washed and ready. Pickup near the library on a weekday evening.',
    date: '2026-11-14T19:00:00Z',
  },
  {
    id: 'demo-post-winter-sorting',
    kind: 'Event',
    author: 'Winter Care Collective',
    title: 'Sort winter donations',
    body: 'Help fold, size and label winter gear before the next neighborhood distribution.',
    date: '2026-11-12T16:00:00Z',
    event: {
      when: 'Tuesday, November 24 · 5:30 pm',
      venue: { name: 'Martin Luther King Library', address: '2901 N. Martin Luther King Jr. Dr.', coordinates: [-87.914447, 43.071576] },
      bring: 'No supplies needed. We’ll provide size labels and sorting bins.',
      volunteers: 4,
    },
  },
  {
    id: 'demo-post-pantry-hours',
    kind: 'Update',
    author: 'Neighborhood Table',
    title: 'New evening pantry hours',
    body: 'The pantry is now open until 7 pm on Wednesdays for neighbors who need to come after work.',
    date: '2026-11-10T20:00:00Z',
  },
  {
    id: 'demo-post-gloves',
    kind: 'Offer',
    author: 'Sam K.',
    title: 'Gloves and knit hats',
    body: 'A bag of new adult hats and gloves. Take what you need at the next winter distribution.',
    date: '2026-11-08T15:00:00Z',
  },
  {
    id: 'demo-post-harambee',
    kind: 'Update',
    group: 'Harambee',
    author: 'Winter Care Collective',
    title: 'Help set up the winter drive',
    body: 'Harambee neighbors are meeting at the west entrance to set out tables and signs.',
    date: '2026-11-18T17:00:00Z',
  },
  {
    id: 'demo-post-riverwest',
    kind: 'Update',
    group: 'Riverwest',
    author: 'Riverwest Ride Circle',
    title: 'Ride pickup meeting point',
    body: 'Please wait at the north entrance so drivers can find everyone before heading to the pantry.',
    date: '2026-11-17T16:30:00Z',
  },
  {
    id: 'demo-post-brewers-hill',
    kind: 'Update',
    group: 'Brewers Hill',
    author: 'Neighborhood Table',
    title: 'Meal kit packing supplies',
    body: 'We have bags and labels ready. Volunteers can check in at the main door.',
    date: '2026-11-16T17:30:00Z',
  },
  {
    id: 'demo-post-amani',
    kind: 'Update',
    group: 'Amani',
    author: 'Winter Care Collective',
    title: 'Coat donations near Moody Park',
    body: 'We’ll have bins by the welcome table. Zip or button coats before dropping them off so sorting goes faster.',
    date: '2026-11-18T18:15:00Z',
  },
  {
    id: 'demo-post-bay-view',
    kind: 'Update',
    group: 'Bay View',
    author: 'Neighborhood Table',
    title: 'Pantry bag pickup this week',
    body: 'We’ll set aside a few shelf-stable bags for neighbors who can only pick up after work.',
    date: '2026-11-17T23:10:00Z',
  },
  {
    id: 'demo-post-walkers-point',
    kind: 'Update',
    group: "Walker's Point",
    author: 'Riverwest Ride Circle',
    title: 'Ride requests for Saturday',
    body: 'Send a request with the time you need to arrive and whether you’ll be carrying donations.',
    date: '2026-11-19T20:20:00Z',
  },
];

export const demoPosts = () => entries.map(({ event: _event, ...post }) => post);
export const communityEvents = new Map(
  entries.flatMap(({ id, event }) => event ? [[id, event]] : []),
);

export type CommunityEventPin = Pick<Post, 'id' | 'title'> & { coordinates: EventVenue['coordinates'] };

export function communityEventPins(posts: Post[]): CommunityEventPin[] {
  return posts.flatMap(({ id, title, kind, group, status }) => {
    if (kind !== 'Event' || group || status === 'hidden') return [];
    const event = communityEvents.get(id);
    return event ? [{ id, title, coordinates: event.venue.coordinates }] : [];
  });
}
