import type { Category } from '../../domain/types';
import { matchResources } from './match';
import { getDemoLlmClient, getLlmClient, rankPartners } from './llm';
import type { MatchResult } from './llm/types';

export type { MatchResult, MatchSource, PartnerMatch } from './llm/types';
export { interpretNeeds, rankPartners } from './llm';

/** Demo flag: set false to force the keyword fallback path. */
export let modelAvailable = true;

export function setModelAvailable(available: boolean) {
  modelAvailable = available;
}

export function matchFromKeywords(text: string): MatchResult {
  const { needs, matches } = matchResources(text);
  return {
    needs,
    source: 'keywords',
    matches: matches.map((match) => ({
      partner: match.partner,
      covers: match.covers,
      explanation: match.covers.length
        ? 'Matches ' + match.covers.map((c) => c.toLowerCase()).join(' and ')
        : '',
    })),
  };
}

export function isVagueRequest(text: string): boolean {
  return getLlmClient().isVague(text);
}

/** Simulated model: uses only the request text. Rejects when unavailable. */
export async function matchWithModel(text: string, waitMs = 550): Promise<MatchResult> {
  if (!modelAvailable) {
    throw new Error('Model unavailable');
  }
  const client = waitMs === 0 ? getDemoLlmClient(0) : getLlmClient();
  const result = await client.interpret(text);
  return { ...result, source: 'model' };
}

export async function findResources(text: string): Promise<MatchResult> {
  try {
    return await matchWithModel(text);
  } catch {
    return matchFromKeywords(text);
  }
}

export async function draftReferral(text: string, needs: Category[], waitMs = 550): Promise<string> {
  if (!modelAvailable) {
    return text.trim();
  }
  const client = waitMs === 0 ? getDemoLlmClient(0) : getLlmClient();
  const draft = await client.draft(text, needs);
  return draft.text;
}

/** Re-rank partners after the resident removes a need chip. */
export function withNeeds(needs: Category[], source: MatchResult['source'] = 'model'): MatchResult {
  return { needs, matches: rankPartners(needs), source };
}
