import type { Category, Neighborhood, Partner } from '../../domain/types';
import { approvedPartners, directory, eligibleForNewReferral, listWords } from './directory';
import { matchResources } from './match';
import {
  detectNeighborhood,
  getDemoLlmClient,
  getLlmClient,
  interpretNeeds,
  rankPartners,
} from './llm';
import type { MatchResult } from './llm/types';

export type { MatchResult, MatchSource, PartnerMatch } from './llm/types';
export { detectNeighborhood, interpretNeeds, rankPartners } from './llm';

const addableNeeds: Category[] = ['Clothing', 'Food', 'Transportation'];

/** True when some approved, accepting partner offers every listed need. */
export function needsFullyCovered(needs: Category[], partners: Partner[] = directory): boolean {
  if (!needs.length) return false;
  return approvedPartners(partners).some((partner) =>
    needs.every((need) => eligibleForNewReferral(partner, need)),
  );
}

/** Categories the resident can still add on review. */
export function missingAddableNeeds(needs: Category[]): Category[] {
  return addableNeeds.filter((need) => !needs.includes(need));
}

/**
 * Skip drafts when the resident already wrote a detailed request that names every need
 * (e.g. the clothing-and-ride example). Still offer a draft when needs chips diverge
 * from what the text says, or when the prompt is short.
 */
export function shouldOfferDraft(text: string, needs: Category[]): boolean {
  if (!needs.length) return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  const mentioned = interpretNeeds(trimmed);
  const same =
    needs.length === mentioned.length && needs.every((need) => mentioned.includes(need));
  if (same && trimmed.length >= 40) return false;
  return true;
}

/** Controls use of the request interpretation client. */
export let modelAvailable = true;

export function setModelAvailable(available: boolean) {
  modelAvailable = available;
}

export function matchFromKeywords(text: string, partners: Partner[] = directory): MatchResult {
  const { needs, matches } = matchResources(text, partners);
  return {
    needs,
    source: 'keywords',
    matches: matches.map((match) => ({
      partner: match.partner,
      covers: match.covers,
      explanation: match.covers.length
        ? 'Matches ' + listWords(match.covers.map((c) => c.toLowerCase()))
        : '',
    })),
  };
}

export function isVagueRequest(text: string): boolean {
  return getLlmClient().isVague(text);
}

/** Interprets request text and ranks partners in the current directory. */
export async function matchWithModel(
  text: string,
  waitMs = 550,
  partners: Partner[] = directory,
): Promise<MatchResult> {
  if (!modelAvailable) {
    throw new Error('Model unavailable');
  }
  const client = waitMs === 0 ? getDemoLlmClient(0, partners) : getLlmClient(partners);
  const result = await client.interpret(text);
  return { ...result, source: 'model' };
}

export async function findResources(
  text: string,
  partners: Partner[] = directory,
): Promise<MatchResult> {
  try {
    return await matchWithModel(text, 550, partners);
  } catch {
    return matchFromKeywords(text, partners);
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

/** Re-rank partners after the resident removes a need chip or changes neighborhood preference. */
export function withNeeds(
  needs: Category[],
  source: MatchResult['source'] = 'model',
  preferredArea?: Neighborhood,
  partners: Partner[] = directory,
): MatchResult {
  return { needs, matches: rankPartners(needs, preferredArea, partners), source };
}

export function preferredAreaFrom(
  text: string,
  sharedNeighborhood?: boolean,
  profileNeighborhood?: Neighborhood,
): Neighborhood | undefined {
  if (sharedNeighborhood && profileNeighborhood) return profileNeighborhood;
  return detectNeighborhood(text);
}
