import type { DemoState, Post, Referral } from '../domain/types';
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
    includes(['Offer', 'Event', 'Update'], p.kind)
  );
}
function isReferral(r: unknown): r is Referral {
  if (
    !record(r) ||
    ![r.id, r.residentId, r.partnerId, r.message].every(isText) ||
    !directory.some((partner) => partner.id === r.partnerId) ||
    !isDate(r.sentAt)
  )
    return false;
  if (
    !Array.isArray(r.needs) ||
    !r.needs.every((n) => includes(categories, n)) ||
    !record(r.shared)
  )
    return false;
  if ([r.shared.firstName, r.shared.callback].some((v) => v !== undefined && !isText(v)))
    return false;
  if (r.shared.neighborhood !== undefined && !includes(neighborhoods, r.shared.neighborhood))
    return false;
  if (r.acceptedAt !== undefined && !isDate(r.acceptedAt)) return false;
  if (Object.keys(r.shared).some((key) => !['firstName', 'callback', 'neighborhood'].includes(key)))
    return false;
  return (
    r.service === undefined ||
    (record(r.service) &&
      isDate(r.acceptedAt) &&
      isDate(r.service.deliveredAt) &&
      includes(categories, r.service.category) &&
      r.service.providerId === r.partnerId)
  );
}

export function decode(raw: string): DemoState {
  const state: unknown = JSON.parse(raw);
  if (
    record(state) &&
    state.version === 1 &&
    Array.isArray(state.posts) &&
    state.posts.every(isPost) &&
    Array.isArray(state.referrals) &&
    state.referrals.every(isReferral)
  )
    return { version: 1, posts: state.posts, referrals: state.referrals };
  throw new Error('Your workspace couldn’t be opened. Reset it to start again.');
}
