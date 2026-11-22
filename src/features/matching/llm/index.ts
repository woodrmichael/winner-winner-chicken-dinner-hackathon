import type { Partner } from '../../../domain/types';
import type { LlmClient } from './client';
import { createDemoLlmClient } from './demoClient';

export type { LlmClient } from './client';
export type { DraftResult, MatchResult, MatchSource, PartnerMatch } from './types';
export { detectNeighborhood, interpretNeeds, rankPartners } from './demoClient';

/** Uses local request interpretation and the current organization directory. */
export function getLlmClient(partners?: Partner[]): LlmClient {
  return createDemoLlmClient(550, partners);
}

/** Sync helpers and zero-delay client for tests. */
export function getDemoLlmClient(waitMs = 0, partners?: Partner[]): LlmClient {
  return createDemoLlmClient(waitMs, partners);
}
