export const categories = ['Clothing', 'Transportation', 'Food', 'Other'] as const;
export type Category = (typeof categories)[number];
export const neighborhoods = ['Harambee', 'Riverwest', 'Brewers Hill', 'Amani', 'Bay View', "Walker's Point"] as const;
type CommunityNeighborhood = (typeof neighborhoods)[number];
export const serviceNeighborhoods = [
  ...neighborhoods,
  'Avenues West', 'Clarke Square', 'Enderis Park', 'Garden Homes', 'Havenwoods',
  'Historic Mitchell Street', 'Historic Third Ward', 'Jackson Park', 'Lincoln Village', 'Lower East Side',
  'Morgandale', 'Old North Milwaukee', 'Silver City', 'Silver Spring', 'Story Hill',
  'Tippecanoe', 'Upper East Side', 'Washington Heights', 'Washington Park', 'Wilson Park',
] as const;
export type Neighborhood = (typeof serviceNeighborhoods)[number];

export type ServiceAvailability = 'accepting' | 'paused';
export type ListingStatus = 'pending' | 'approved' | 'declined' | 'removed';
export type Partner = {
  id: string;
  name: string;
  categories: Category[];
  area: Neighborhood;
  coverageAreas: Neighborhood[];
  pickup: string;
  availability: Partial<Record<Category, ServiceAvailability>>;
  listingStatus: ListingStatus;
  /** Optional moderator note when a pending listing is declined. */
  declineReason?: string;
};
export type Post = {
  id: string;
  kind: 'Event' | 'Offer' | 'Update';
  author: string;
  authorId?: string;
  title: string;
  body: string;
  date: string;
  group?: CommunityNeighborhood;
  status?: 'active' | 'fulfilled' | 'hidden';
};
export type OfferReply = {
  id: string;
  postId: string;
  from: 'resident' | 'author';
  authorName?: string;
  body: string;
  at: string;
};
export type PostReport = {
  id: string;
  postId: string;
  reporterId: string;
  reason: string;
  at: string;
};
export type PostModeration = {
  postId: string;
  moderatorId: string;
  reason: string;
  at: string;
};
export type CommunityState = {
  replies: OfferReply[];
  joinedEvents: string[];
  groups: CommunityNeighborhood[];
  savedPostIds: string[];
  reports: PostReport[];
  moderation: PostModeration[];
};
export type SharedDetails = { firstName?: string; callback?: string; neighborhood?: Neighborhood };
export type Appointment = { date: string; time: string; instructions: string };
export type Service = {
  id: string;
  assignmentId: string;
  category: Category;
  providerId: string;
  deliveredAt: string;
  programId?: string;
  voidedAt?: string;
  corrections: ServiceCorrection[];
};
export type ServiceCorrection = {
  id: string;
  kind: 'category' | 'void';
  workerId: string;
  workerName: string;
  reason: string;
  at: string;
  fromCategory?: Category;
  toCategory?: Category;
};
export type ReferralAssignment = {
  id: string;
  partnerId: string;
  message: string;
  shared: SharedDetails;
  sentAt: string;
  category?: Category;
  acceptedAt?: string;
  assignedWorker?: { id: string; name: string };
  appointment?: Appointment;
  declines: Partial<Record<Category, { reason: string; at: string }>>;
};
export type Handoff = {
  id: string;
  fromAssignmentId: string;
  partnerId: string;
  category: Category;
  reason: string;
  status: 'pending' | 'approved' | 'declined';
};
export type Referral = {
  id: string;
  residentId: string;
  needs: Category[];
  sentAt: string;
  assignments: [ReferralAssignment, ...ReferralAssignment[]];
  services: Service[];
  withdrawn: Category[];
  handoffs: Handoff[];
};
export type DemoState = {
  supportEntries?: import('../features/partnerships/ledger').SupportEntry[];
  version: 2;
  posts: Post[];
  referrals: Referral[];
  community: CommunityState;
  partners: Partner[];
};
export type CommunityCommand =
  | { type: 'post'; id: string; title: string; body: string; at: string; group?: CommunityNeighborhood }
  | ({ type: 'reply' } & OfferReply)
  | { type: 'event-rsvp'; postId: string; joined: boolean }
  | { type: 'group-membership'; group: CommunityNeighborhood; joined: boolean }
  | { type: 'save-post'; postId: string; saved: boolean }
  | { type: 'edit-post'; postId: string; authorId: string; title: string; body: string }
  | { type: 'close-post'; postId: string; authorId: string }
  | { type: 'report-post'; postId: string; id: string; reporterId: string; reason: string; at: string }
  | { type: 'hide-post'; postId: string; moderatorId: string; reason: string; at: string };
export type ReferralCommand =
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
  | { type: 'schedule'; id: string; partnerId: string; appointment: Appointment | null }
  | {
      type: 'decline-service';
      id: string;
      partnerId: string;
      category: Category;
      reason: string;
      at: string;
    }
  | {
      type: 'propose-handoff';
      id: string;
      partnerId: string;
      handoffId: string;
      recipientId: string;
      category: Category;
      reason: string;
    }
  | {
      type: 'complete';
      id: string;
      partnerId: string;
      at: string;
      category: Category;
      programId?: string;
    }
  | {
      type: 'correct-service';
      id: string;
      partnerId: string;
      serviceId: string;
      category?: Category;
      void: boolean;
      reason: string;
      workerId: string;
      workerName: string;
      at: string;
    }
  | { type: 'respond-handoff'; id: string; handoffId: string; response: 'decline' }
  | {
      type: 'respond-handoff';
      id: string;
      handoffId: string;
      response: 'approve';
      share: (keyof SharedDetails)[];
      at: string;
    }
  | {
      type: 'seek-provider';
      id: string;
      assignmentId: string;
      recipientId: string;
      category: Category;
      message: string;
      share: (keyof SharedDetails)[];
      at: string;
    }
  | { type: 'withdraw-need'; id: string; category: Category };

export type VolunteerRoleId = 'sorting' | 'distribution';
export type WorkspaceCommand =
  | { type: 'assign-worker'; assignmentId: string; workerId: string | null }
  | { type: 'request-membership'; partnerId: string }
  | { type: 'approve-membership'; accountId: string }
  | { type: 'send-referral-message'; assignmentId: string; messageId: string; body: string }
  | { type: 'mark-activity-read'; updateId: string }
  | { type: 'reserve-volunteer'; roleId: VolunteerRoleId }
  | { type: 'cancel-volunteer' }
  | { type: 'update-volunteer-role'; roleId: VolunteerRoleId; capacity: number; instructions: string }
  | { type: 'record-attendance'; accountId: string; minutes: number };

export type DirectoryCommand =
  | {
      type: 'set-service-availability';
      partnerId: string;
      category: Category;
      accepting: boolean;
      at: string;
    }
  | {
      type: 'submit-partner-listing';
      id: string;
      name: string;
      area: Neighborhood;
      categories: Category[];
      coverageAreas?: Neighborhood[];
      pickup?: string;
      at: string;
    }
  | { type: 'approve-partner-listing'; partnerId: string; at: string }
  | { type: 'decline-partner-listing'; partnerId: string; at: string; reason?: string }
  | {
      type: 'update-partner-listing';
      partnerId: string;
      name: string;
      area: Neighborhood;
      categories: Category[];
      coverageAreas: Neighborhood[];
      pickup: string;
      at: string;
    }
  | { type: 'delete-partner-listing'; partnerId: string; at: string };

export type Command =
  | CommunityCommand
  | ReferralCommand
  | WorkspaceCommand
  | DirectoryCommand
  | import('../features/partnerships/ledger').SupportCommand;
