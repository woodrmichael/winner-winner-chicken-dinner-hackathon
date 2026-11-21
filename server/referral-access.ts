import type { Referral, ReferralAssignment } from '../src/domain/types';
import type { Account } from '../src/shared/workspace';

export class WorkspaceError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export function approvedPartner(account: Account) {
  return account.kind === 'worker' && account.membership?.status === 'approved'
    ? account.membership.partnerId
    : undefined;
}

export type AssignmentScope = { referral: Referral; assignment: ReferralAssignment };

export function assignmentScope(referrals: Referral[], assignmentId: string): AssignmentScope | undefined {
  for (const referral of referrals) {
    const assignment = referral.assignments.find(({ id }) => id === assignmentId);
    if (assignment) return { referral, assignment };
  }
}

export function participant(account: Account, { referral, assignment }: AssignmentScope) {
  if (account.kind === 'resident' && referral.residentId === account.id) return 'resident';
  if (approvedPartner(account) === assignment.partnerId) return 'partner';
}
