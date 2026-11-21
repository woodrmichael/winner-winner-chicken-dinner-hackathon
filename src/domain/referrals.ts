import { projects } from '../features/partnerships/ledger';
import { directory } from '../features/matching/directory';
import { profile, residentId } from './seed';
import type {
  Appointment,
  Category,
  DemoState,
  Referral,
  ReferralAssignment,
  ReferralCommand,
  SharedDetails,
} from './types';

export function outstandingNeeds(referral: Referral): Category[] {
  if (!referral.needs.length && referral.services.length) return [];
  const requested = referral.needs.length ? referral.needs : ['Other' as const];
  return requested.filter(
    (category) =>
      !referral.withdrawn.includes(category) &&
      !referral.services.some((service) => service.category === category),
  );
}

export function currentAssignment(referral: Referral, category: Category) {
  return (
    referral.assignments.findLast((assignment) => assignment.category === category) ??
    referral.assignments[0]
  );
}

function assignedNeeds(referral: Referral, assignment: ReferralAssignment) {
  return outstandingNeeds(referral).filter(
    (category) => currentAssignment(referral, category).id === assignment.id,
  );
}

export function actionableNeeds(referral: Referral, assignment: ReferralAssignment) {
  return assignedNeeds(referral, assignment).filter((category) => !assignment.declines[category]);
}

export function deliverableCategories(referral: Referral, assignment: ReferralAssignment) {
  const actionable = actionableNeeds(referral, assignment);
  const offered = directory.find((partner) => partner.id === assignment.partnerId)!.categories;
  return !referral.needs.length && actionable.includes('Other')
    ? offered
    : offered.filter((category) => actionable.includes(category));
}

export function otherProviders(partnerId: string, category: Category) {
  return directory.filter(
    (partner) =>
      partner.id !== partnerId && (category === 'Other' || partner.categories.includes(category)),
  );
}

export function pendingHandoffs(referral: Referral) {
  const outstanding = outstandingNeeds(referral);
  return referral.handoffs.filter(
    (handoff) =>
      handoff.status === 'pending' &&
      outstanding.includes(handoff.category) &&
      currentAssignment(referral, handoff.category).id === handoff.fromAssignmentId,
  );
}

export function status(referral: Referral) {
  const open = outstandingNeeds(referral);
  if (!open.length) return referral.services.length ? 'Completed' : 'Closed';
  const active = open.filter(
    (category) => !currentAssignment(referral, category).declines[category],
  );
  if (!active.length) {
    return 'Declined';
  }
  return active.some((category) => currentAssignment(referral, category).acceptedAt)
    ? 'Accepted'
    : 'Sent';
}

function partnerTicket(referral: Referral, assignment: ReferralAssignment) {
  const original = referral.assignments[0].id === assignment.id;
  const assigned = assignedNeeds(referral, assignment);
  const actionable = actionableNeeds(referral, assignment);
  const services = referral.services.filter(
    (service) =>
      original ||
      service.assignmentId === assignment.id ||
      service.category === assignment.category,
  );
  const outstanding = outstandingNeeds(referral).filter(
    (category) => original || category === assignment.category,
  );
  const hasDeclines = Object.keys(assignment.declines).length > 0;
  const canRespond = actionable.length > 0 && !assignment.acceptedAt;
  const coordinating = original && outstanding.length > assigned.length && !hasDeclines;
  const active = actionable.length > 0 || (coordinating && !!assignment.acceptedAt);
  const proposals = pendingHandoffs(referral);
  const routed = original
    ? outstanding.flatMap((category) => {
        const current = currentAssignment(referral, category);
        return current.id === assignment.id ? [] : [{ category, partnerId: current.partnerId }];
      })
    : [];
  return {
    assignment,
    status: active
      ? assignment.acceptedAt
        ? 'Accepted'
        : 'Sent'
      : hasDeclines
        ? 'Declined'
        : services.length
          ? 'Completed'
          : 'Closed',
    services,
    outstanding,
    actionable,
    routed,
    deliverable: deliverableCategories(referral, assignment),
    canRespond,
    handoffCategories: assigned.filter(
      (category) => !proposals.some((handoff) => handoff.category === category),
    ),
    proposedCategories: proposals
      .filter((handoff) => handoff.fromAssignmentId === assignment.id)
      .map((handoff) => handoff.category),
  };
}

export const residentTimeline = (state: Pick<DemoState, 'referrals'>, ownerId: string = residentId) =>
  state.referrals.filter((referral) => referral.residentId === ownerId);

export const partnerInbox = (state: Pick<DemoState, 'referrals'>, partnerId: string) =>
  state.referrals
    .flatMap((referral) =>
      referral.assignments
        .filter((assignment) => assignment.partnerId === partnerId)
        .map((assignment) => partnerTicket(referral, assignment)),
    )
    .sort(
      (left, right) => Date.parse(right.assignment.sentAt) - Date.parse(left.assignment.sentAt),
    );

export function validAppointment({ date, time }: Appointment) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return false;
  }
  const day = new Date(date + 'T00:00:00Z');
  return Number.isFinite(day.getTime()) && day.toISOString().slice(0, 10) === date;
}

function requiredText(value: string, error: string) {
  const text = value.trim();
  if (!text) throw new Error(error);
  return text;
}

export const shareFields = ['firstName', 'callback', 'neighborhood'] as const;

export function detailsToShare(
  keys: readonly (keyof SharedDetails)[],
  details: SharedDetails = profile,
): SharedDetails {
  return Object.fromEntries(
    shareFields.filter((key) => keys.includes(key) && details[key]).map((key) => [key, details[key]]),
  );
}

type ResidentIdentity = { id: string; details: SharedDetails };
const demoResident = { id: residentId, details: profile };

function withAssignment(referral: Referral, assignment: ReferralAssignment): Referral {
  const [initial, ...handoffs] = referral.assignments;
  return {
    ...referral,
    assignments: [
      initial.id === assignment.id ? assignment : initial,
      ...handoffs.map((entry) => (entry.id === assignment.id ? assignment : entry)),
    ],
  };
}

function applyResidentCommand(
  referral: Referral,
  cmd: Extract<ReferralCommand, { type: 'respond-handoff' | 'seek-provider' | 'withdraw-need' }>,
  resident: ResidentIdentity,
): Referral {
  if (referral.residentId !== resident.id)
    throw new Error('This referral belongs to another resident.');
  if (cmd.type === 'respond-handoff') {
    const handoff = referral.handoffs.find((entry) => entry.id === cmd.handoffId);
    if (!handoff) throw new Error('This proposal is no longer available.');
    if (handoff.status !== 'pending') return referral;
    if (!pendingHandoffs(referral).includes(handoff)) {
      throw new Error('This need has already been resolved or sent to another partner.');
    }
    const handoffs = referral.handoffs.map((entry) =>
      entry.id === handoff.id
        ? {
            ...entry,
            status: cmd.response === 'approve' ? ('approved' as const) : ('declined' as const),
          }
        : entry,
    );
    if (cmd.response === 'decline') return { ...referral, handoffs };
    return {
      ...referral,
      handoffs,
      assignments: [
        ...referral.assignments,
        {
          id: handoff.id,
          partnerId: handoff.partnerId,
          category: handoff.category,
          message: handoff.reason,
          shared: detailsToShare(cmd.share, resident.details),
          sentAt: cmd.at,
          declines: {},
        },
      ],
    };
  }

  if (!outstandingNeeds(referral).includes(cmd.category)) return referral;
  const assigned = currentAssignment(referral, cmd.category);
  if (
    cmd.type === 'seek-provider' &&
    referral.assignments.some(({ id }) => id === cmd.assignmentId)
  ) {
    return referral;
  }
  if (!assigned.declines[cmd.category]) {
    throw new Error('This need is still with the current partner.');
  }
  if (cmd.type === 'withdraw-need') {
    return { ...referral, withdrawn: [...referral.withdrawn, cmd.category] };
  }
  if (!otherProviders(assigned.partnerId, cmd.category).some(({ id }) => id === cmd.recipientId)) {
    throw new Error('Choose another partner that offers this service.');
  }
  return {
    ...referral,
    assignments: [
      ...referral.assignments,
      {
        id: cmd.assignmentId,
        partnerId: cmd.recipientId,
        category: cmd.category,
        message: requiredText(cmd.message, 'Add a message before sending.'),
        shared: detailsToShare(cmd.share, resident.details),
        sentAt: cmd.at,
        declines: {},
      },
    ],
  };
}

function applyPartnerCommand(
  referral: Referral,
  assignment: ReferralAssignment,
  cmd: Extract<
    ReferralCommand,
    { type: 'accept' | 'schedule' | 'decline-service' | 'propose-handoff' | 'complete' }
  >,
): Referral {
  const actionable = actionableNeeds(referral, assignment);
  if (cmd.type === 'accept') {
    if (assignment.acceptedAt) return referral;
    if (!actionable.length) throw new Error('There are no outstanding needs for this partner.');
    return withAssignment(referral, { ...assignment, acceptedAt: cmd.at });
  }
  if (cmd.type === 'schedule') {
    if (!assignment.acceptedAt || !actionable.length) {
      throw new Error('Accept an open referral before scheduling.');
    }
    const appointment = cmd.appointment
      ? { ...cmd.appointment, instructions: cmd.appointment.instructions.trim() }
      : undefined;
    if (appointment && !validAppointment(appointment)) {
      throw new Error('Use YYYY-MM-DD for the date and HH:MM for the time.');
    }
    return withAssignment(referral, { ...assignment, appointment });
  }
  if (cmd.type === 'decline-service') {
    if (assignment.declines[cmd.category]) return referral;
    if (!actionable.includes(cmd.category))
      throw new Error('This need is no longer with this partner.');
    const reason = requiredText(cmd.reason, 'Add a reason before declining.');
    return withAssignment(referral, {
      ...assignment,
      declines: { ...assignment.declines, [cmd.category]: { reason, at: cmd.at } },
    });
  }
  if (cmd.type === 'propose-handoff') {
    if (referral.handoffs.some(({ id }) => id === cmd.handoffId)) return referral;
    if (!assignedNeeds(referral, assignment).includes(cmd.category)) {
      throw new Error('This need is no longer with this partner.');
    }
    if (pendingHandoffs(referral).some((handoff) => handoff.category === cmd.category)) {
      throw new Error('The resident already has a proposal for this need.');
    }
    if (!otherProviders(cmd.partnerId, cmd.category).some(({ id }) => id === cmd.recipientId)) {
      throw new Error('Choose another partner that offers this service.');
    }
    return {
      ...referral,
      handoffs: [
        ...referral.handoffs,
        {
          id: cmd.handoffId,
          fromAssignmentId: assignment.id,
          partnerId: cmd.recipientId,
          category: cmd.category,
          reason: requiredText(cmd.reason, 'Explain why you are suggesting this partner.'),
          status: 'pending',
        },
      ],
    };
  }
  if (
    referral.services.some(
      (service) => service.category === cmd.category && service.assignmentId === assignment.id,
    )
  )
    return referral;
  if (!assignment.acceptedAt) throw new Error('Accept the referral before recording a service.');
  if (!deliverableCategories(referral, assignment).includes(cmd.category)) {
    throw new Error('Choose an outstanding service offered by this partner.');
  }
  if (
    cmd.programId &&
    !projects.some((p) => p.programId === cmd.programId && p.providerId === cmd.partnerId && p.category === cmd.category)
  ) {
    throw new Error('This delivery is ineligible for the selected program.');
  }
  return {
    ...referral,
    services: [
      ...referral.services,
      {
        assignmentId: assignment.id,
        providerId: cmd.partnerId,
        deliveredAt: cmd.at,
        category: cmd.category,
        programId: cmd.programId,
      },
    ],
  };
}

export function applyReferralCommand<T extends Pick<DemoState, 'referrals'>>(
  state: T,
  cmd: ReferralCommand,
  resident: ResidentIdentity = demoResident,
): T {
  const assignmentIdInUse = (id: string) =>
    state.referrals.some(
      (referral) =>
        referral.assignments.some((assignment) => assignment.id === id) ||
        referral.handoffs.some((handoff) => handoff.id === id),
    );
  if (cmd.type === 'send') {
    const prior = state.referrals.find(({ id }) => id === cmd.id);
    if (prior) {
      if (prior.residentId !== resident.id) throw new Error('This request ID is already in use.');
      return state;
    }
    if (assignmentIdInUse(cmd.id)) throw new Error('This request ID is already in use.');
    if (!directory.some(({ id }) => id === cmd.partnerId)) {
      throw new Error('Choose a partner from the directory.');
    }
    return {
      ...state,
      referrals: [
        {
          id: cmd.id,
          residentId: resident.id,
          needs: [...new Set(cmd.needs)],
          sentAt: cmd.at,
          assignments: [
            {
              id: cmd.id,
              partnerId: cmd.partnerId,
              message: requiredText(cmd.message, 'Add a message before sending.'),
              shared: { ...cmd.shared },
              sentAt: cmd.at,
              declines: {},
            },
          ],
          services: [],
          withdrawn: [],
          handoffs: [],
        },
        ...state.referrals,
      ],
    };
  }

  let referral: Referral | undefined;
  let updated: Referral;
  if ('partnerId' in cmd) {
    referral = state.referrals.find((entry) => entry.assignments.some(({ id }) => id === cmd.id));
    const assignment = referral?.assignments.find(({ id }) => id === cmd.id);
    if (!referral || !assignment || assignment.partnerId !== cmd.partnerId) {
      throw new Error('This referral belongs to another partner.');
    }
    if (
      cmd.type === 'propose-handoff' &&
      !referral.handoffs.some(({ id }) => id === cmd.handoffId) &&
      assignmentIdInUse(cmd.handoffId)
    )
      throw new Error('This proposal ID is already in use.');
    updated = applyPartnerCommand(referral, assignment, cmd);
  } else {
    referral = state.referrals.find(({ id }) => id === cmd.id);
    if (!referral) throw new Error('This referral could not be found.');
    if (
      cmd.type === 'seek-provider' &&
      !referral.assignments.some(({ id }) => id === cmd.assignmentId) &&
      assignmentIdInUse(cmd.assignmentId)
    )
      throw new Error('This request ID is already in use.');
    updated = applyResidentCommand(referral, cmd, resident);
  }
  if (updated === referral) return state;
  return {
    ...state,
    referrals: state.referrals.map((entry) => (entry === referral ? updated : entry)),
  };
}
