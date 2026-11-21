export const categories = ['Clothing', 'Transportation', 'Food', 'Other'] as const;
export type Category = (typeof categories)[number];
export const neighborhoods = ['Harambee', 'Riverwest', 'Brewers Hill'] as const;
export type Neighborhood = (typeof neighborhoods)[number];

export type Partner = { id: string; name: string; categories: Category[]; area: Neighborhood };
export type Post = {
  id: string;
  kind: 'Event' | 'Offer' | 'Update';
  author: string;
  title: string;
  body: string;
  date: string;
  group?: Neighborhood;
};
export type OfferReply = {
  id: string;
  postId: string;
  from: 'resident' | 'author';
  body: string;
  at: string;
};
export type CommunityState = {
  replies: OfferReply[];
  joinedEvents: string[];
  groups: Neighborhood[];
  savedPostIds: string[];
};
export type SharedDetails = { firstName?: string; callback?: string; neighborhood?: Neighborhood };
export type Referral = {
  id: string;
  residentId: string;
  partnerId: string;
  message: string;
  needs: Category[];
  shared: SharedDetails;
  sentAt: string;
  acceptedAt?: string;
  service?: { category: Category; providerId: string; deliveredAt: string; programId?: string };
};
export type DemoState = { version: 1; posts: Post[]; referrals: Referral[]; community: CommunityState };
export type CommunityCommand =
  | { type: 'post'; id: string; title: string; body: string; at: string; group?: Neighborhood }
  | ({ type: 'reply' } & OfferReply)
  | { type: 'event-rsvp'; postId: string; joined: boolean }
  | { type: 'group-membership'; group: Neighborhood; joined: boolean }
  | { type: 'save-post'; postId: string; saved: boolean };
export type Command =
  | CommunityCommand
  | {
      type: 'send';
      id: string;
      partnerId: string;
      message: string;
      needs: Category[];
      shared: SharedDetails;
      at: string;
    }
  | { type: 'accept'; id: string; partnerId: string; at: string }
  | {
      type: 'complete';
      id: string;
      partnerId: string;
      at: string;
      category: Category;
      programId?: string;
    };
