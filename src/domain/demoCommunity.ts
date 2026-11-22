import type { Post } from './types';

export type EventVenue = { name: string; address: string; coordinates: [number, number] };
type EventDetails = { when: string; venue: EventVenue; bring: string; volunteers: number };
type DemoPost = Post & { event?: EventDetails };

const moodyPark: EventVenue = { name: 'Moody Park', address: '2201 W. Auer Ave.', coordinates: [-87.939864, 43.076003] };
const centralLibrary: EventVenue = { name: 'Central Library', address: '814 W. Wisconsin Ave.', coordinates: [-87.922372, 43.039523] };
const kingLibrary: EventVenue = { name: 'Martin Luther King Library', address: '2901 N. Martin Luther King Jr. Dr.', coordinates: [-87.914447, 43.071576] };
const bayViewLibrary: EventVenue = { name: 'Bay View Library', address: '2566 S. Kinnickinnic Ave.', coordinates: [-87.900055, 42.998268] };
const eastLibrary: EventVenue = { name: 'East Library', address: '2320 N. Cramer St.', coordinates: [-87.886456, 43.060727] };
const atkinsonLibrary: EventVenue = { name: 'Atkinson Library', address: '1960 W. Atkinson Ave.', coordinates: [-87.93619, 43.090107] };
const capitolLibrary: EventVenue = { name: 'Capitol Library', address: '3969 N. 74th St.', coordinates: [-88.00535, 43.0896] };

function eventPost(id: string, author: string, title: string, body: string, date: string, event: EventDetails): DemoPost {
  return { id: `demo-post-${id}`, kind: 'Event', author, title, body, date, event };
}

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
      venue: moodyPark,
      bring: 'Bring a clean winter coat if you’re donating. If you’re picking one up, just bring yourself.',
      volunteers: 8,
    },
  },
  {
    id: 'coats',
    kind: 'Offer',
    author: 'Alex Rivera',
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
      venue: centralLibrary,
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
      venue: kingLibrary,
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
  eventPost('bay-view-repair', 'Bay View Neighbors', 'Winter gear repair café',
    'Bring a coat with a torn seam or a backpack with a broken strap. Neighbors will help with simple repairs.',
    '2026-11-20T17:00:00Z', { when: 'Sunday, November 22 · 2 pm', venue: bayViewLibrary,
      bring: 'Bring one item to repair. Thread, patches and hand tools are provided.', volunteers: 5 }),
  eventPost('ride-orientation', 'Riverwest Ride Circle', 'Volunteer driver orientation',
    'Meet the dispatch team and practice coordinating pickup times for pantry rides.',
    '2026-11-20T16:00:00Z', { when: 'Monday, November 23 · 6 pm', venue: eastLibrary,
      bring: 'Bring a phone and any questions about scheduling rides.', volunteers: 3 }),
  eventPost('pantry-boxes', 'Neighborhood Table', 'Thanksgiving pantry box packing',
    'Pack shelf-stable groceries and label boxes for the holiday distribution.',
    '2026-11-19T15:15:00Z', { when: 'Wednesday, November 25 · 4 pm', venue: atkinsonLibrary,
      bring: 'Wear closed-toe shoes. All packing materials are provided.', volunteers: 9 }),
  eventPost('capitol-swap', 'Capitol Heights Neighbors', 'Kids’ winter clothing swap',
    'Trade outgrown coats, snow pants, hats and mittens. Families can pick up items without bringing a donation.',
    '2026-11-18T19:00:00Z', { when: 'Saturday, November 28 · 11 am', venue: capitolLibrary,
      bring: 'If donating, bring clean winter clothes labeled with the size.', volunteers: 7 }),
  eventPost('resource-table', 'ComForce Connect', 'Neighborhood resource table',
    'Meet local providers and get help finding pantry hours, clothing pickups and transportation.',
    '2026-11-18T16:30:00Z', { when: 'Sunday, November 29 · noon', venue: kingLibrary,
      bring: 'Bring any questions about services or pickup accessibility.', volunteers: 4 }),
  eventPost('warm-kits', 'Winter Care Collective', 'Assemble winter welcome kits',
    'Put together socks, gloves and hand warmers for families coming to the next coat pickup.',
    '2026-11-17T18:00:00Z', { when: 'Tuesday, December 1 · 5 pm', venue: moodyPark,
      bring: 'Wear warm layers. Supplies and labels will be at the pavilion.', volunteers: 6 }),
  eventPost('meal-planning', 'Neighborhood Table', 'Pantry meal planning workshop',
    'Share ways to stretch a pantry box into a few warm meals and take home recipe cards.',
    '2026-11-17T16:00:00Z', { when: 'Wednesday, December 2 · 6 pm', venue: centralLibrary,
      bring: 'Bring a favorite pantry recipe to share if you have one.', volunteers: 5 }),
  eventPost('donation-check-in', 'Winter Care Collective', 'Coat donation check-in',
    'Welcome donors, tag items by size and help keep the clothing tables stocked.',
    '2026-11-16T19:00:00Z', { when: 'Saturday, December 5 · 9 am', venue: moodyPark,
      bring: 'Bring gloves for outdoor check-in and wear shoes you can stand in comfortably.', volunteers: 8 }),
  eventPost('winter-route-walk', 'Bay View Neighbors', 'Walk the winter pickup route',
    'Walk the route together to flag icy spots and identify curbside pickup locations.',
    '2026-11-15T18:00:00Z', { when: 'Saturday, December 5 · 1 pm', venue: bayViewLibrary,
      bring: 'Wear shoes with good grip. Meet outside the library entrance.', volunteers: 4 }),
  eventPost('family-supply-sort', 'ComForce Connect', 'Family supply sorting day',
    'Organize backpacks, school supplies and household essentials for the next distribution.',
    '2026-11-14T18:00:00Z', { when: 'Sunday, December 6 · 10 am', venue: capitolLibrary,
      bring: 'Bring a refillable water bottle. Sorting bins and labels are provided.', volunteers: 6 }),
  eventPost('dispatch-check-in', 'Riverwest Ride Circle', 'Pickup accessibility check-in',
    'Help the team review meeting points and pickup instructions before the next pantry distribution.',
    '2026-11-13T18:00:00Z', { when: 'Tuesday, December 8 · 5:30 pm', venue: eastLibrary,
      bring: 'Bring suggestions for curbside pickup or accessible entrances.', volunteers: 3 }),
  eventPost('shelf-stock', 'Neighborhood Table', 'Restock the pantry shelves',
    'Sort donated shelf-stable food by category and prepare bags for the evening pickup.',
    '2026-11-12T18:00:00Z', { when: 'Thursday, December 10 · 4 pm', venue: atkinsonLibrary,
      bring: 'Wear closed-toe shoes. Light tasks are available at seated stations.', volunteers: 7 }),
  { id: 'demo-post-backpacks', kind: 'Offer', author: 'Nia W.', title: 'Two backpacks with school supplies',
    body: 'Each bag has notebooks, pencils and folders. Pickup near Atkinson Library.', date: '2026-11-20T14:30:00Z' },
  { id: 'demo-post-snow-pants', kind: 'Offer', author: 'Maria G.', title: 'Youth snow pants, sizes 8 and 10',
    body: 'Two pairs in good shape. I can bring them to the Bay View clothing swap.', date: '2026-11-19T14:00:00Z' },
  { id: 'demo-post-slow-cooker', kind: 'Offer', author: 'Devon H.', title: 'Working four-quart slow cooker',
    body: 'Clean and free for pickup. Includes the lid and removable insert.', date: '2026-11-16T20:00:00Z' },
  { id: 'demo-post-winter-socks', kind: 'Offer', author: 'Tasha B.', title: 'Unopened packs of warm socks',
    body: 'Three adult packs, available near Moody Park this week.', date: '2026-11-15T19:00:00Z' },
  { id: 'demo-post-transit-vouchers', kind: 'Update', author: 'Riverwest Ride Circle', title: 'Bus fare help at pickup',
    body: 'Ask the welcome table about fare assistance if you plan to take the bus home with your supplies.', date: '2026-11-19T16:00:00Z' },
  { id: 'demo-post-box-labels', kind: 'Update', author: 'Neighborhood Table', title: 'Pantry boxes now have ingredient labels',
    body: 'Read the label at pickup or ask a volunteer to help check the ingredients before taking a box.', date: '2026-11-17T21:00:00Z' },
  { id: 'demo-post-donation-door', kind: 'Update', author: 'Winter Care Collective', title: 'Use the west entrance for large donations',
    body: 'A volunteer can meet you at the door if you are dropping off several bags of clothing.', date: '2026-11-16T18:00:00Z' },
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
