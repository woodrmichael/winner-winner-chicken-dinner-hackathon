import type { Category } from '../../../domain/types';
import type { DraftResult, MatchResult } from './types';

/**
 * Language-model surface for resource matching.
 * Swap `getLlmClient()` to a real provider later; demo uses hardcoded replies.
 */
export type LlmClient = {
  /** Interpret request text only → needs and ranked partners with explanations. */
  interpret(text: string): Promise<Omit<MatchResult, 'source'>>;
  /** Draft a referral message in the resident's voice. */
  draft(text: string, needs: Category[]): Promise<DraftResult>;
  /** True when the request is too vague to match without a follow-up. */
  isVague(text: string): boolean;
};
