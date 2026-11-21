import type { LlmClient } from './client';
import { createDemoLlmClient } from './demoClient';

export type { LlmClient } from './client';
export type { DraftResult, MatchResult, MatchSource, PartnerMatch } from './types';
export { detectNeighborhood, interpretNeeds, rankPartners } from './demoClient';

/**
 * Returns the active LLM client. Demo hardcoding for now;
 * replace with a real provider when an API key/backend is available.
 */
export function getLlmClient(): LlmClient {
  return createDemoLlmClient();
}

/** Sync helpers and zero-delay client for tests. */
export function getDemoLlmClient(waitMs = 0): LlmClient {
  return createDemoLlmClient(waitMs);
}
