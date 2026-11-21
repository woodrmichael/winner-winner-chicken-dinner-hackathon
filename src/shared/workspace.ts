import type { deliveredServices, impact, mapRows } from '../domain/model';
import type { partnerInbox } from '../domain/referrals';
import type { Category, Referral, SharedDetails, VolunteerRoleId, WorkspaceCommand } from '../domain/types';
import type { ImpactReports } from '../features/impact/report';

export type Membership = { partnerId: string; status: 'pending' | 'approved'; admin: boolean };
export type Account = {
  id: string;
  name: string;
  kind: 'resident' | 'worker';
  details: SharedDetails;
  membership?: Membership;
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

export type SharedSnapshot = {
  revision: number;
  account: Account;
  referrals: Referral[];
  inbox: ReturnType<typeof partnerInbox>;
  messages: ReferralMessage[];
  updates: ActivityUpdate[];
  requests: { id: string; name: string }[];
  volunteers: VolunteerView;
  reporting: {
    impact: ReturnType<typeof impact>;
    impactReports: ImpactReports;
    map: ReturnType<typeof mapRows>;
    mapByCategory: { category: Category; rows: ReturnType<typeof mapRows> }[];
    programServices: Pick<ReturnType<typeof deliveredServices>[number], 'category' | 'providerId' | 'deliveredAt'>[];
  };
};

export function isWorkspaceCommand(cmd: { type: string }): cmd is WorkspaceCommand {
  return [
    'request-membership', 'approve-membership', 'reserve-volunteer', 'cancel-volunteer',
    'update-volunteer-role', 'record-attendance', 'send-referral-message', 'mark-activity-read',
  ].includes(cmd.type);
}
