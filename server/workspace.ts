import { deliveredServices, impact, mapRows } from '../src/domain/model';
import { applyReferralCommand, partnerInbox, residentTimeline } from '../src/domain/referrals';
import { profile, program, seedState } from '../src/domain/seed';
import { applyCommunityCommand } from '../src/features/community/model';
import {
  categories,
  type CommunityCommand,
  type CommunityState,
  type Post,
  type Referral,
  type ReferralCommand,
  type WorkspaceCommand,
} from '../src/domain/types';
import { impactReports, reportingMonth, type ImpactReports } from '../src/features/impact/report';
import { directory } from '../src/features/matching/directory';
import type { Account, SharedSnapshot, VolunteerRole, VolunteerSignup } from '../src/shared/workspace';
import { applyCommunicationCommand, communicationFor, emptyCommunication, notifyReferralChange, type Communication } from './communication';
import { approvedPartner, assignmentScope, WorkspaceError } from './referral-access';

export type StoredAccount = Account & { passwordHash: string };
export type Workspace = {
  referrals: Referral[];
  posts: Post[];
  community: CommunityState;
  accounts: StoredAccount[];
  roles: VolunteerRole[];
  signups: VolunteerSignup[];
  communication: Communication;
};

export type StoredWorkspace = Omit<Workspace, 'communication'> & { communication?: Communication };
export const sampleResidentAccount = 'alex';
const reportCache = new WeakMap<Referral[], { month: number; reports: ImpactReports }>();

export function restoreCommunication(stored: StoredWorkspace): Workspace {
  const demo = seedState(sampleResidentAccount);
  return {
    ...stored,
    posts: stored.posts ?? demo.posts,
    community: stored.community ?? demo.community,
    communication: stored.communication ?? emptyCommunication(),
  };
}

export const demoAccounts: Account[] = [
  { id: sampleResidentAccount, name: 'Alex Rivera', kind: 'resident', details: { ...profile } },
  { id: 'jordan', name: 'Jordan Brooks', kind: 'resident', details: { firstName: 'Jordan', neighborhood: 'Riverwest' } },
  { id: 'sam', name: 'Sam Carter', kind: 'resident', details: { firstName: 'Sam', neighborhood: 'Brewers Hill' } },
  { id: 'winter-worker', name: 'Jamie Reed', kind: 'worker', details: { firstName: 'Jamie' },
    membership: { partnerId: 'winter-team', status: 'approved', admin: false } },
  { id: 'organizer', name: 'Morgan Chen', kind: 'worker', details: { firstName: 'Morgan' },
    membership: { partnerId: 'winter-team', status: 'approved', admin: true }, moderator: true },
  { id: 'table-worker', name: 'Casey Lee', kind: 'worker', details: { firstName: 'Casey' },
    membership: { partnerId: 'table', status: 'approved', admin: false } },
  { id: 'candidate', name: 'Riley Jones', kind: 'worker', details: { firstName: 'Riley' } },
];

export function createWorkspace(accounts: StoredAccount[]): Workspace {
  const demo = seedState(sampleResidentAccount);
  return {
    referrals: demo.referrals,
    posts: demo.posts,
    community: demo.community,
    accounts,
    roles: [
      { id: 'sorting', name: 'Coat sorting', capacity: 4, instructions: 'Check in at the coat sorting table at Moody Park at 9:30 am.' },
      { id: 'distribution', name: 'Coat distribution', capacity: 2, instructions: 'Check in with the distribution lead at Moody Park at 10 am.' },
    ],
    signups: [],
    communication: emptyCommunication(),
  };
}

function adminPartner(account: Account) {
  return account.membership?.admin ? approvedPartner(account) : undefined;
}

function isOrganizer(account: Account) {
  return adminPartner(account) === program.providerId;
}

function sharedImpactReports(workspace: Workspace) {
  const now = new Date();
  const month = reportingMonth(now);
  const cached = reportCache.get(workspace.referrals);
  if (cached?.month === month) return cached.reports;
  const reports = impactReports(workspace, now);
  reportCache.set(workspace.referrals, { month, reports });
  return reports;
}

export function snapshot(workspace: Workspace, account: StoredAccount, revision: number): SharedSnapshot {
  const { passwordHash: _passwordHash, ...publicAccount } = account;
  const partner = approvedPartner(account);
  const admin = adminPartner(account);
  const { roles, signups } = workspace;
  return {
    revision,
    account: publicAccount,
    posts: account.moderator ? workspace.posts : workspace.posts.filter((post) => post.status !== 'hidden'),
    community: {
      ...workspace.community,
      reports: account.moderator ? workspace.community.reports : [],
      moderation: account.moderator ? workspace.community.moderation : [],
    },
    referrals: account.kind === 'resident' ? residentTimeline(workspace, account.id) : [],
    inbox: partner ? partnerInbox(workspace, partner) : [],
    ...communicationFor(workspace, account),
    requests: admin ? workspace.accounts.flatMap((candidate) =>
      candidate.membership?.partnerId === admin && candidate.membership.status === 'pending'
        ? [{ id: candidate.id, name: candidate.name }]
        : [],
    ) : [],
    volunteers: {
      roles: roles.map((role) => ({ ...role, reserved: signups.filter((signup) => signup.roleId === role.id).length })),
      signup: signups.find((signup) => signup.accountId === account.id),
      roster: isOrganizer(account) ? signups.map((signup) => ({ ...signup,
        name: workspace.accounts.find(({ id }) => id === signup.accountId)!.name,
      })) : [],
      summary: {
        signups: signups.length,
        participants: signups.filter(({ minutes }) => (minutes ?? 0) > 0).length,
        minutes: signups.reduce((total, signup) => total + (signup.minutes ?? 0), 0),
      },
    },
    reporting: {
      impact: impact(workspace),
      impactReports: sharedImpactReports(workspace),
      map: mapRows(workspace),
      mapByCategory: categories.map((category) => ({ category, rows: mapRows(workspace, category) })),
      programServices: deliveredServices(workspace).flatMap(({ category, providerId, deliveredAt, programId }) =>
        programId === program.id ? [{ category, providerId, deliveredAt }] : [],
      ),
    },
  };
}

export function applySharedReferral(workspace: Workspace, account: Account, cmd: ReferralCommand): Workspace {
  if (cmd.type === 'send' || !('partnerId' in cmd)) {
    if (account.kind !== 'resident') throw new WorkspaceError(403, 'Sign in as a resident to use this action.');
    if (cmd.type !== 'send' && !residentTimeline(workspace, account.id).some(({ id }) => id === cmd.id)) {
      throw new WorkspaceError(404, 'Referral unavailable.');
    }
  } else {
    const partner = approvedPartner(account);
    if (!partner || partner !== cmd.partnerId) throw new WorkspaceError(403, 'An approved membership is required.');
    if (assignmentScope(workspace.referrals, cmd.id)?.assignment.partnerId !== partner) {
      throw new WorkspaceError(404, 'Referral unavailable.');
    }
  }
  return notifyReferralChange(workspace, applyReferralCommand(workspace, cmd, account), cmd);
}

export function applySharedCommunity(
  workspace: Workspace,
  account: Account,
  cmd: CommunityCommand,
): Workspace {
  if (cmd.type === 'hide-post' && !account.moderator) {
    throw new WorkspaceError(403, 'Moderator access is required.');
  }
  if (cmd.type === 'edit-post' || cmd.type === 'close-post') {
    if (account.kind !== 'resident') {
      throw new WorkspaceError(403, 'Sign in as a resident to manage offers.');
    }
  }
  if (cmd.type === 'report-post' && account.kind !== 'resident') {
    throw new WorkspaceError(403, 'Sign in as a resident to report posts.');
  }
  const state = applyCommunityCommand({
    version: 2,
    posts: workspace.posts,
    community: workspace.community,
    referrals: workspace.referrals,
  }, cmd, account.id);
  return state.posts === workspace.posts && state.community === workspace.community
    ? workspace
    : { ...workspace, posts: state.posts, community: state.community };
}

export function applyWorkspaceCommand(workspace: Workspace, account: StoredAccount, cmd: WorkspaceCommand): Workspace {
  const { accounts, roles, signups } = workspace;
  switch (cmd.type) {
    case 'send-referral-message':
    case 'mark-activity-read':
      return applyCommunicationCommand(workspace, account, cmd);
    case 'request-membership': {
      if (account.kind !== 'worker') throw new WorkspaceError(403, 'Only worker accounts can request membership.');
      if (account.membership) {
        if (account.membership.partnerId === cmd.partnerId) return workspace;
        throw new WorkspaceError(409, 'This account already has a membership request or approval.');
      }
      if (!directory.some(({ id }) => id === cmd.partnerId)) throw new WorkspaceError(400, 'Choose an organization.');
      return { ...workspace, accounts: accounts.map((entry) => entry.id === account.id ? {
        ...entry, membership: { partnerId: cmd.partnerId, status: 'pending', admin: false },
      } : entry) };
    }
    case 'approve-membership': {
      const partnerId = adminPartner(account);
      if (!partnerId) throw new WorkspaceError(403, 'Organization administrator access is required.');
      const candidate = accounts.find(({ id }) => id === cmd.accountId);
      if (!candidate?.membership || candidate.membership.partnerId !== partnerId) {
        throw new WorkspaceError(404, 'Membership request unavailable.');
      }
      if (candidate.membership.status === 'approved') return workspace;
      return { ...workspace, accounts: accounts.map((entry) => entry === candidate ? {
        ...entry, membership: { partnerId, status: 'approved', admin: false },
      } : entry) };
    }
    case 'reserve-volunteer': {
      const role = roles.find(({ id }) => id === cmd.roleId);
      if (!role) throw new WorkspaceError(400, 'Choose a volunteer role.');
      const signup = signups.find(({ accountId }) => accountId === account.id);
      if (signup?.roleId === role.id) return workspace;
      if (signup) throw new WorkspaceError(409, 'Cancel your current signup before choosing another role.');
      if (signups.filter(({ roleId }) => roleId === role.id).length >= role.capacity) {
        throw new WorkspaceError(409, 'This volunteer role is full. Choose another role.');
      }
      return { ...workspace, signups: [...signups, { accountId: account.id, roleId: role.id }] };
    }
    case 'cancel-volunteer': {
      const signup = signups.find(({ accountId }) => accountId === account.id);
      if (!signup) return workspace;
      if (signup.minutes !== undefined) throw new WorkspaceError(409, 'Attendance has already been recorded for this signup.');
      return { ...workspace, signups: signups.filter((entry) => entry !== signup) };
    }
    case 'update-volunteer-role': {
      if (!isOrganizer(account)) throw new WorkspaceError(403, 'Winter drive organizer access is required.');
      if (!roles.some(({ id }) => id === cmd.roleId)) throw new WorkspaceError(404, 'Volunteer role unavailable.');
      if (cmd.capacity < signups.filter(({ roleId }) => roleId === cmd.roleId).length) {
        throw new WorkspaceError(409, 'Capacity cannot be lower than the number already signed up.');
      }
      return { ...workspace, roles: roles.map((role) => role.id === cmd.roleId
        ? { ...role, capacity: cmd.capacity, instructions: cmd.instructions }
        : role) };
    }
    case 'record-attendance': {
      if (!isOrganizer(account)) throw new WorkspaceError(403, 'Winter drive organizer access is required.');
      if (!signups.some(({ accountId }) => accountId === cmd.accountId)) {
        throw new WorkspaceError(404, 'Volunteer signup unavailable.');
      }
      return { ...workspace, signups: signups.map((signup) => signup.accountId === cmd.accountId
        ? { ...signup, minutes: cmd.minutes }
        : signup) };
    }
  }
}
