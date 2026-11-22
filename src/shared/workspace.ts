import type { deliveredServices, impact, mapRows } from '../domain/model';
import type { partnerInbox } from '../domain/referrals';
import type {
  Category,
  CommunityState,
  Partner,
  Post,
  Referral,
  Service,
  SharedDetails,
  VolunteerRoleId,
  WorkspaceCommand,
} from '../domain/types';
import type { ImpactReports } from '../features/impact/report';

export type Membership = { partnerId: string; status: 'pending' | 'approved'; admin: boolean };
export type Account = {
  id: string;
  name: string;
  kind: 'resident' | 'worker';
  details: SharedDetails;
  membership?: Membership;
  moderator?: boolean;
};

export const referralMessageLimit = 2000;
export type ReferralMessage = {
  id: string;
  assignmentId: string;
  sender: string;
  sentByYou: boolean;
  body: string;
  at: string;
};
export type ActivityUpdate = {
  id: string;
  assignmentId: string;
  partnerId: string;
  kind: 'new-referral' | 'accepted' | 'reply' | 'proposed-handoff';
  at: string;
  read: boolean;
};

export type VolunteerRole = { id: VolunteerRoleId; name: string; capacity: number; instructions: string };
export type VolunteerSignup = { accountId: string; roleId: VolunteerRoleId; minutes?: number };
export type VolunteerView = {
  roles: (VolunteerRole & { reserved: number })[];
  signup?: VolunteerSignup;
  roster: (VolunteerSignup & { name: string })[];
  summary: { signups: number; participants: number; minutes: number };
};

export type ServiceRecord = Pick<
  Service,
  'id' | 'assignmentId' | 'category' | 'providerId' | 'deliveredAt' | 'programId' | 'voidedAt' | 'corrections'
> & { referralId: string };

export type SharedSnapshot = {
  support: import('../features/partnerships/ledger').SupportBook;
  sponsorPayments?: { active: { sessionId: string; pledgeId: string; cents: number }[] };
  revision: number;
  account: Account;
  posts: Post[];
  community: CommunityState;
  partners: Partner[];
  pendingListings: { id: string; name: string; area: string; categories: string[] }[];
  referrals: Referral[];
  inbox: ReturnType<typeof partnerInbox>;
  messages: ReferralMessage[];
  updates: ActivityUpdate[];
  requests: { id: string; name: string }[];
  workers: { id: string; name: string }[];
  volunteers: VolunteerView;
  reporting: {
    impact: ReturnType<typeof impact>;
    impactReports: ImpactReports;
    map: ReturnType<typeof mapRows>;
    mapByCategory: { category: Category; rows: ReturnType<typeof mapRows> }[];
    projectDeliveries: ReturnType<typeof import('../features/partnerships/ledger').projectDeliveryCounts>;
    programServices: Pick<ReturnType<typeof deliveredServices>[number], 'category' | 'providerId' | 'deliveredAt'>[];
    serviceRecords: ServiceRecord[];
  };
};

export function isWorkspaceCommand(cmd: { type: string }): cmd is WorkspaceCommand {
  return [
    'assign-worker', 'request-membership', 'approve-membership', 'reserve-volunteer', 'cancel-volunteer',
    'update-volunteer-role', 'record-attendance', 'send-referral-message', 'mark-activity-read',
  ].includes(cmd.type);
}
