import { emptyCommunity } from '../domain/seed';
import { validAppointment } from '../domain/referrals';
import type {
  Category,
  CommunityState,
  DemoState,
  Handoff,
  Post,
  PostModeration,
  PostReport,
  Referral,
  ReferralAssignment,
  Service,
  SharedDetails,
} from '../domain/types';
import { categories, neighborhoods } from '../domain/types';
import { directory } from '../features/matching/directory';

export const storageKey = 'comforce-connect/demo/v1';
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
const isText = (value: unknown) => typeof value === 'string';
const isDate = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value));
const includes = (values: readonly string[], candidate: unknown) =>
  typeof candidate === 'string' && values.includes(candidate);

function isPost(p: unknown): p is Post {
  return (
    record(p) &&
    [p.id, p.author, p.title, p.body].every(isText) &&
    isDate(p.date) &&
    includes(['Offer', 'Event', 'Update'], p.kind) &&
    (p.group === undefined || (p.kind === 'Update' && includes(neighborhoods, p.group))) &&
    (p.authorId === undefined || isText(p.authorId)) &&
    (p.status === undefined || includes(['active', 'fulfilled', 'hidden'], p.status))
  );
}

type StoredCommunity = Omit<CommunityState, 'savedPostIds' | 'reports' | 'moderation'> & {
  savedPostIds?: string[];
  reports?: PostReport[];
  moderation?: PostModeration[];
};

function isCommunity(value: unknown, posts: Post[]): value is StoredCommunity {
  if (
    !record(value) ||
    !Array.isArray(value.replies) ||
    !Array.isArray(value.joinedEvents) ||
    !Array.isArray(value.groups)
  ) {
    return false;
  }

  const postKinds = new Map(posts.map((post) => [post.id, post.kind]));
  return (
    value.replies.every(
      (reply: unknown) =>
        record(reply) &&
        isText(reply.id) &&
        typeof reply.postId === 'string' &&
        postKinds.get(reply.postId) === 'Offer' &&
        includes(['resident', 'author'], reply.from) &&
        typeof reply.body === 'string' &&
        !!reply.body.trim() &&
        isDate(reply.at),
    ) &&
    new Set(value.replies.map((reply) => reply.id)).size === value.replies.length &&
    value.joinedEvents.every((id) => postKinds.get(id) === 'Event') &&
    new Set(value.joinedEvents).size === value.joinedEvents.length &&
    value.groups.every((group) => includes(neighborhoods, group)) &&
    new Set(value.groups).size === value.groups.length &&
    (value.savedPostIds === undefined ||
      (Array.isArray(value.savedPostIds) &&
        value.savedPostIds.every((id) => postKinds.has(id)) &&
        new Set(value.savedPostIds).size === value.savedPostIds.length)) &&
    (value.reports === undefined ||
      (Array.isArray(value.reports) &&
        value.reports.every((report: unknown) =>
          record(report) &&
          isText(report.id) &&
          isText(report.postId) &&
          isText(report.reporterId) &&
          isText(report.reason) &&
          !!report.reason.trim() &&
          isDate(report.at) &&
          postKinds.has(report.postId)) &&
        new Set(value.reports.map((report) => report.id)).size === value.reports.length)) &&
    (value.moderation === undefined ||
      (Array.isArray(value.moderation) &&
        value.moderation.every((entry: unknown) =>
          record(entry) &&
          isText(entry.postId) &&
          isText(entry.moderatorId) &&
          isText(entry.reason) &&
          !!entry.reason.trim() &&
          isDate(entry.at) &&
          postKinds.has(entry.postId))))
  );
}
const isCategory = (value: unknown): value is Category => includes(categories, value);
const isPartner = (value: unknown) => directory.some(({ id }) => id === value);
const unique = (values: unknown[]) => new Set(values).size === values.length;

function isShared(value: unknown): value is SharedDetails {
  return (
    record(value) &&
    [value.firstName, value.callback].every((item) => item === undefined || isText(item)) &&
    (value.neighborhood === undefined || includes(neighborhoods, value.neighborhood)) &&
    Object.keys(value).every((key) => ['firstName', 'callback', 'neighborhood'].includes(key))
  );
}

function isAssignment(value: unknown): value is ReferralAssignment {
  if (!record(value)) return false;
  const { id, partnerId, message, shared, sentAt, category, acceptedAt, appointment, declines } =
    value;
  return (
    isText(id) &&
    isPartner(partnerId) &&
    isText(message) &&
    isShared(shared) &&
    isDate(sentAt) &&
    (category === undefined || isCategory(category)) &&
    (acceptedAt === undefined || isDate(acceptedAt)) &&
    (appointment === undefined ||
      (acceptedAt !== undefined &&
        record(appointment) &&
        typeof appointment.date === 'string' &&
        typeof appointment.time === 'string' &&
        typeof appointment.instructions === 'string' &&
        validAppointment({
          date: appointment.date,
          time: appointment.time,
          instructions: appointment.instructions,
        }))) &&
    record(declines) &&
    Object.entries(declines).every(
      ([need, decline]) =>
        isCategory(need) && record(decline) && isText(decline.reason) && isDate(decline.at),
    )
  );
}

function isService(value: unknown): value is Omit<Service, 'assignmentId'> {
  return (
    record(value) &&
    (value.id === undefined || isText(value.id)) &&
    isCategory(value.category) &&
    isPartner(value.providerId) &&
    isDate(value.deliveredAt) &&
    (value.programId === undefined || isText(value.programId)) &&
    (value.voidedAt === undefined || isDate(value.voidedAt)) &&
    (value.corrections === undefined ||
      (Array.isArray(value.corrections) &&
        value.corrections.every((correction: unknown) =>
          record(correction) &&
          isText(correction.id) &&
          includes(['category', 'void'], correction.kind) &&
          isText(correction.workerId) &&
          isText(correction.workerName) &&
          isText(correction.reason) &&
          isDate(correction.at) &&
          (correction.fromCategory === undefined || isCategory(correction.fromCategory)) &&
          (correction.toCategory === undefined || isCategory(correction.toCategory)))))
  );
}

function isHandoff(value: unknown): value is Handoff {
  return (
    record(value) &&
    isText(value.id) &&
    isText(value.fromAssignmentId) &&
    isPartner(value.partnerId) &&
    isCategory(value.category) &&
    isText(value.reason) &&
    includes(['pending', 'approved', 'declined'], value.status)
  );
}

function isReferral(value: unknown): value is Referral {
  if (!record(value)) return false;
  const { id, residentId, sentAt, needs, assignments, services, withdrawn, handoffs } = value;
  if (
    !isText(id) ||
    !isText(residentId) ||
    !isDate(sentAt) ||
    !Array.isArray(needs) ||
    !needs.every(isCategory) ||
    !unique(needs) ||
    !Array.isArray(assignments) ||
    !assignments.every(isAssignment) ||
    !Array.isArray(services) ||
    !Array.isArray(withdrawn) ||
    !Array.isArray(handoffs) ||
    !handoffs.every(isHandoff)
  )
    return false;

  const [initial, ...additional] = assignments;
  if (
    !initial ||
    initial.id !== id ||
    initial.category !== undefined ||
    initial.sentAt !== sentAt ||
    !unique(assignments.map((assignment) => assignment.id))
  )
    return false;
  const requested = needs.length ? needs : ['Other'];
  const byId = new Map(assignments.map((assignment) => [assignment.id, assignment]));
  return (
    additional.every(
      (assignment) => assignment.category && requested.includes(assignment.category),
    ) &&
    services.every((service: unknown): service is Service => {
      if (!record(service) || typeof service.assignmentId !== 'string') return false;
      const assignment = byId.get(service.assignmentId);
      return (
        isService(service) &&
        Boolean(assignment?.acceptedAt && assignment.partnerId === service.providerId)
      );
    }) &&
    unique(
      services.map((service) =>
        typeof service === 'object' && service && 'id' in service
          ? String((service as { id?: unknown }).id ?? '')
          : '',
      ).filter(Boolean),
    ) &&
    withdrawn.every((category) => requested.includes(category)) &&
    unique(withdrawn) &&
    unique(handoffs.map((handoff) => handoff.id)) &&
    handoffs.every(
      (handoff) =>
        requested.includes(handoff.category) &&
        byId.has(handoff.fromAssignmentId) &&
        (handoff.status !== 'approved' ||
          (byId.get(handoff.id)?.partnerId === handoff.partnerId &&
            byId.get(handoff.id)?.category === handoff.category)),
    )
  );
}

function migrateReferral(value: unknown): Referral | undefined {
  if (!record(value)) return undefined;
  const { id, residentId, partnerId, sentAt, message, shared, acceptedAt, needs, service } = value;
  const initial = { id, partnerId, sentAt, message, shared, acceptedAt, declines: {} };
  if (
    typeof id !== 'string' ||
    typeof residentId !== 'string' ||
    typeof sentAt !== 'string' ||
    !isAssignment(initial) ||
    !Array.isArray(needs) ||
    !needs.every(isCategory)
  )
    return undefined;
  if (
    service !== undefined &&
    (!isService(service) || service.providerId !== partnerId || !acceptedAt)
  ) {
    return undefined;
  }
  return {
    id,
    residentId,
    sentAt,
    needs: [...new Set(needs)],
    assignments: [initial],
    services: service ? [{
      ...service,
      id: `${id}:${service.category}`,
      assignmentId: id,
      corrections: [],
    }] : [],
    withdrawn: [],
    handoffs: [],
  };
}

export function decode(raw: string): DemoState {
  const state: unknown = JSON.parse(raw);
  if (
    record(state) &&
    (state.version === 1 || state.version === 2) &&
    Array.isArray(state.posts) &&
    state.posts.every(isPost) &&
    Array.isArray(state.referrals) &&
    (state.community === undefined || isCommunity(state.community, state.posts))
  ) {
    const referrals: unknown[] =
      state.version === 1 ? state.referrals.map(migrateReferral) : state.referrals;
    if (
      referrals.every(isReferral) &&
      unique(referrals.flatMap(({ assignments }) => assignments.map(({ id }) => id)))
    ) {
      const normalizedReferrals = (referrals as Referral[]).map((referral) => ({
        ...referral,
        services: referral.services.map((service) => ({
          ...service,
          id: service.id || `${service.assignmentId}:${service.category}`,
          corrections: service.corrections ?? [],
        })),
      }));
      if (!normalizedReferrals.every(isReferral)) throw new Error('Your workspace couldn’t be opened. Reset it to start again.');
      return {
        version: 2,
        posts: state.posts,
        referrals: normalizedReferrals,
        community: { ...emptyCommunity(), ...state.community },
      };
    }
  }
  throw new Error('Your workspace couldn’t be opened. Reset it to start again.');
}
