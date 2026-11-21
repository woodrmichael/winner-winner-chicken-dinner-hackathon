import { directory } from '../features/matching/directory';
import { applyCommunityCommand } from '../features/community/model';
import { applyReferralCommand, outstandingNeeds } from './referrals';
import { historicalIncidents, program } from './seed';
import { categories, neighborhoods, type Command, type DemoState } from './types';

export { partnerInbox, residentTimeline, status } from './referrals';

export function applyCommand(state: DemoState, cmd: Command): DemoState {
  switch (cmd.type) {
    case 'post':
    case 'reply':
    case 'event-rsvp':
    case 'group-membership':
    case 'save-post':
      return applyCommunityCommand(state, cmd);
    default:
      return applyReferralCommand(state, cmd);
  }
}

export const deliveredServices = (state: DemoState) =>
  state.referrals.flatMap((referral) => referral.services);

export function impact(state: DemoState) {
  const services = deliveredServices(state);
  return {
    received: state.referrals.length,
    open: state.referrals.filter((referral) => outstandingNeeds(referral).length > 0).length,
    delivered: services.length,
    byCategory: categories.map((name) => ({
      name,
      count: services.filter((s) => s.category === name).length,
    })),
    byProvider: directory.map((p) => ({
      name: p.name,
      count: services.filter((s) => s.providerId === p.id).length,
    })),
    programDeliveries: services.filter((s) => s.programId === program.id).length,
  };
}

export function mapRows(state: DemoState) {
  const referralsWithNeighborhood = state.referrals.map((referral) => ({
    referral,
    neighborhood: referral.assignments.find(({ shared }) => shared.neighborhood)?.shared
      .neighborhood,
  }));
  return neighborhoods.map((area) => {
    const local = referralsWithNeighborhood
      .filter(({ neighborhood }) => neighborhood === area)
      .map(({ referral }) => referral);
    return {
      area,
      ...historicalIncidents[area],
      open: local.flatMap(outstandingNeeds).length,
      delivered: local.flatMap((referral) => referral.services).length,
      resources: directory.filter((p) => p.area === area).length,
    };
  });
}
