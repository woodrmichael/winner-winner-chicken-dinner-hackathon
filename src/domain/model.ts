import { directory } from '../features/matching/directory';
import { applyCommunityCommand } from '../features/community/model';
import { historicalIncidents, program, residentId } from './seed';
import { categories, neighborhoods, type Command, type DemoState, type Referral } from './types';

export function status(referral: Pick<Referral, 'service' | 'acceptedAt'>) {
  if (referral.service) return 'Completed';
  return referral.acceptedAt ? 'Accepted' : 'Sent';
}

export function applyCommand(state: DemoState, cmd: Command): DemoState {
  if (!('partnerId' in cmd)) return applyCommunityCommand(state, cmd);
  const partner = directory.find((entry) => entry.id === cmd.partnerId);
  if (!partner) throw new Error('Choose a partner from the directory.');
  const referral = state.referrals.find((item) => item.id === cmd.id);
  if (cmd.type === 'send') {
    if (!cmd.message.trim()) throw new Error('Add a message before sending.');
    if (referral) return state;
    return {
      ...state,
      referrals: [
        {
          id: cmd.id,
          residentId,
          partnerId: partner.id,
          message: cmd.message.trim(),
          needs: [...cmd.needs],
          shared: { ...cmd.shared },
          sentAt: cmd.at,
        },
        ...state.referrals,
      ],
    };
  }
  if (!referral || referral.partnerId !== cmd.partnerId)
    throw new Error('This referral belongs to another partner.');
  let updated: Referral;
  if (cmd.type === 'accept') {
    if (referral.acceptedAt) return state;
    updated = { ...referral, acceptedAt: cmd.at };
  } else {
    if (referral.service) return state;
    if (!referral.acceptedAt) throw new Error('Accept the referral before recording a service.');
    if (!partner.categories.includes(cmd.category))
      throw new Error('Choose a service offered by this partner.');
    if (
      cmd.programId &&
      (cmd.programId !== program.id ||
        cmd.partnerId !== program.providerId ||
        cmd.category !== 'Clothing')
    ) {
      throw new Error('This delivery is ineligible for the winter program.');
    }
    updated = {
      ...referral,
      service: {
        providerId: partner.id,
        deliveredAt: cmd.at,
        category: cmd.category,
        programId: cmd.programId,
      },
    };
  }
  return {
    ...state,
    referrals: state.referrals.map((item) => (item.id === cmd.id ? updated : item)),
  };
}

export const residentTimeline = (state: DemoState) =>
  state.referrals.filter((r) => r.residentId === residentId);
export const partnerInbox = (state: DemoState, id: string) =>
  state.referrals
    .filter((r) => r.partnerId === id)
    .map(({ residentId: _owner, ...approved }) => approved);

export function impact(state: DemoState) {
  const services = state.referrals.flatMap((r) => (r.service ? [r.service] : []));
  return {
    received: state.referrals.length,
    open: state.referrals.length - services.length,
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
  return neighborhoods.map((area) => {
    const local = state.referrals.filter((r) => r.shared.neighborhood === area);
    return {
      area,
      ...historicalIncidents[area],
      open: local.filter((r) => !r.service).length,
      delivered: local.filter((r) => r.service).length,
      resources: directory.filter((p) => p.area === area).length,
    };
  });
}
