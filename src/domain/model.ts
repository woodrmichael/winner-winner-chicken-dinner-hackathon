import { appendEntry, type SupportCommand } from '../features/partnerships/ledger';
import { approvedPartners, creditedPartners } from '../features/matching/directory';
import { applyCommunityCommand } from '../features/community/model';
import { applyDirectoryCommand } from '../features/directory/model';
import { applyReferralCommand, outstandingNeeds } from './referrals';
import { historicalIncidents, program } from './seed';
import {
  categories,
  serviceNeighborhoods,
  type Category,
  type CommunityCommand,
  type DemoState,
  type DirectoryCommand,
  type ReferralCommand,
} from './types';

export { partnerInbox, residentTimeline, status } from './referrals';

export function isCommunityCommand(cmd: { type: string }): cmd is CommunityCommand {
  return [
    'post', 'reply', 'event-rsvp', 'group-membership', 'save-post',
    'edit-post', 'close-post', 'report-post', 'hide-post',
  ].includes(cmd.type);
}

export function isDirectoryCommand(cmd: { type: string }): cmd is DirectoryCommand {
  return [
    'set-service-availability',
    'submit-partner-listing',
    'approve-partner-listing',
    'decline-partner-listing',
    'update-partner-listing',
    'delete-partner-listing',
  ].includes(cmd.type);
}

export function applyCommand(
  state: DemoState,
  cmd: CommunityCommand | ReferralCommand | DirectoryCommand | SupportCommand,
  actorId?: string,
): DemoState {
  switch (cmd.type) {
    case 'partnership': return { ...state, supportEntries: appendEntry(state.supportEntries, cmd.entry) };
    case 'post':
    case 'reply':
    case 'event-rsvp':
    case 'group-membership':
    case 'save-post':
    case 'edit-post':
    case 'close-post':
    case 'report-post':
    case 'hide-post':
      return applyCommunityCommand(state, cmd, actorId);
    case 'set-service-availability':
    case 'submit-partner-listing':
    case 'approve-partner-listing':
    case 'decline-partner-listing':
    case 'update-partner-listing':
    case 'delete-partner-listing':
      return applyDirectoryCommand(state, cmd);
    default:
      return applyReferralCommand(state, cmd);
  }
}

export const deliveredServices = (state: Pick<DemoState, 'referrals'>) =>
  state.referrals.flatMap((referral) =>
    referral.services.filter((service) => !service.voidedAt),
  );

export function impact(state: Pick<DemoState, 'referrals' | 'partners'>) {
  const services = deliveredServices(state);
  const partners = creditedPartners(
    state.partners ?? [],
    services.map((service) => service.providerId),
  );
  return {
    received: state.referrals.length,
    open: state.referrals.filter((referral) => outstandingNeeds(referral).length > 0).length,
    delivered: services.length,
    byCategory: categories.map((name) => ({
      name,
      count: services.filter((s) => s.category === name).length,
    })),
    byProvider: partners.map((p) => ({
      name: p.name,
      count: services.filter((s) => s.providerId === p.id).length,
    })),
    programDeliveries: services.filter((s) => s.programId === program.id).length,
  };
}

export function mapRows(state: Pick<DemoState, 'referrals' | 'partners'>, category?: Category) {
  const referralsWithNeighborhood = state.referrals.map((referral) => ({
    referral,
    neighborhood: referral.assignments.find(({ shared }) => shared.neighborhood)?.shared
      .neighborhood,
  }));
  const partners = approvedPartners(state.partners ?? []);
  return serviceNeighborhoods.map((area) => {
    const local = referralsWithNeighborhood
      .filter(({ neighborhood }) => neighborhood === area)
      .map(({ referral }) => referral);
    return {
      area,
      ...historicalIncidents[area],
      open: local.flatMap(outstandingNeeds).filter((need) => !category || need === category).length,
      delivered: local.flatMap((referral) => referral.services)
        .filter((service) => !service.voidedAt)
        .filter((service) => !category || service.category === category).length,
      resources: partners.filter((p) => p.area === area).length,
    };
  });
}
