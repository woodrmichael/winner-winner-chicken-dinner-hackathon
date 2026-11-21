import type { Post } from './types';

type EventDetails = { when: string; where: string; bring: string; volunteers: number };
type DemoPost = Post & { event?: EventDetails };

const entries: DemoPost[] = [
  {
    id: 'drive',
    kind: 'Event',
    author: 'ComForce Connect',
    title: 'Winter essentials drive',
    body: 'Bring a clean coat or stop by to pick one up. Kids’ and adult sizes welcome.',
    date: '2026-11-20T15:00:00Z',
    event: {
      when: 'Saturday, November 21 · 10 am',
      where: 'Moody Park',
      bring: 'Bring a clean winter coat if you’re donating. If you’re picking one up, just bring yourself.',
      volunteers: 8,
    },
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
  {
    id: 'demo-post-meal-packing',
    kind: 'Event',
    author: 'Neighborhood Table',
    title: 'Help pack pantry meal kits',
    body: 'We’ll sort groceries and pack shelf-stable meal kits for next week’s pantry pickup.',
    date: '2026-11-17T15:30:00Z',
    event: {
      when: 'Sunday, November 22 · 1 pm',
      where: 'Brewers Hill community room',
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
    body: 'Tuesday pickups are staying in place. A Thursday afternoon ride will serve the pantry and winter drive.',
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
      where: 'Moody Park community room',
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
];

export const demoPosts = () => entries.map(({ event: _event, ...post }) => post);
export const communityEvents = new Map(
  entries.flatMap(({ id, event }) => event ? [[id, event]] : []),
);
