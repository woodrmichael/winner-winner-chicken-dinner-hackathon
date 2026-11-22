import { serviceNeighborhoods, type Category, type Neighborhood } from '../../../domain/types';
import { directory } from '../directory';
import type { LlmClient } from './client';
import type { PartnerMatch } from './types';

const vocabulary: [Category, RegExp][] = [
  ['Clothing', /\b(cloth(?:es|ing)|coats?|jackets?|shirts?|shoes?|boots?|outfits?)\b/i],
  [
    'Transportation',
    /\b(rides?|bus(?:es)?|transport(?:ation)?|transit|lift|pickup|pick.?up|carpool|get to)\b/i,
  ],
  ['Food', /\b(food|grocer(?:y|ies)|pantry|hungry|meals?|dinner|lunch)\b/i],
];

const satisfied: [Category, RegExp][] = [
  [
    'Clothing',
    /\b(?:already\s+have|don'?t\s+need|do\s+not\s+need|found|got|have)\b[^.!?]{0,40}\b(?:coats?|cloth(?:es|ing)|jackets?)\b/i,
  ],
  [
    'Transportation',
    /\b(?:already\s+have|don'?t\s+need|do\s+not\s+need|found|got)\b[^.!?]{0,40}\b(?:rides?|transport(?:ation)?|lift)\b/i,
  ],
  [
    'Food',
    /\b(?:already\s+have|don'?t\s+need|do\s+not\s+need|found|got)\b[^.!?]{0,40}\b(?:food|grocer(?:y|ies)|meals?)\b/i,
  ],
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function interpretNeeds(text: string): Category[] {
  const clauses = text.split(/[.!?;]|\bbut\b/i);
  return vocabulary
    .filter(([need, pattern]) =>
      clauses.some(
        (clause) =>
          pattern.test(clause) &&
          !satisfied.some(([category, rule]) => category === need && rule.test(clause)),
      ),
    )
    .map(([need]) => need);
}

/** Detect a directory neighborhood named in the request text. */
export function detectNeighborhood(text: string): Neighborhood | undefined {
  const lower = text.toLowerCase();
  return serviceNeighborhoods.find((area) => lower.includes(area.toLowerCase()));
}

function explain(covers: Category[]): string {
  if (covers.length >= 2) {
    return 'Offers both ' + covers.map((c) => c.toLowerCase()).join(' and ');
  }
  if (covers.length === 1) {
    return 'Covers ' + covers[0].toLowerCase();
  }
  return '';
}

function directoryIndex() {
  return new Map(directory.map((partner, index) => [partner.id, index]));
}

function areaScore(area: Neighborhood, preferred?: Neighborhood) {
  if (!preferred) return 0;
  return area === preferred ? 1 : 0;
}

function compareMatches(
  a: PartnerMatch,
  b: PartnerMatch,
  index: Map<string, number>,
  preferred?: Neighborhood,
) {
  const byCoverage = b.covers.length - a.covers.length;
  if (byCoverage !== 0) return byCoverage;
  const byArea = areaScore(b.partner.area, preferred) - areaScore(a.partner.area, preferred);
  if (byArea !== 0) return byArea;
  return (index.get(a.partner.id) ?? 0) - (index.get(b.partner.id) ?? 0);
}

function coveringMatches(needs: Category[]): PartnerMatch[] {
  return directory
    .map((partner) => {
      const covers = needs.filter((need) => partner.categories.includes(need));
      return { partner, covers, explanation: explain(covers) };
    })
    .filter((match) => match.covers.length > 0);
}

function pickSpecialist(
  need: Category,
  candidates: PartnerMatch[],
  preferred?: Neighborhood,
): PartnerMatch | undefined {
  const index = directoryIndex();
  const forNeed = candidates.filter((match) => match.covers.includes(need));
  if (!forNeed.length) return undefined;
  return [...forNeed].sort((a, b) => {
    const bySpecialty = a.partner.categories.length - b.partner.categories.length;
    if (bySpecialty !== 0) return bySpecialty;
    const byArea = areaScore(b.partner.area, preferred) - areaScore(a.partner.area, preferred);
    if (byArea !== 0) return byArea;
    return (index.get(a.partner.id) ?? 0) - (index.get(b.partner.id) ?? 0);
  })[0];
}

/**
 * Rank partners by needs covered, then preferred neighborhood, then directory order.
 * When no partner covers every need, surface one complementary specialist per need first.
 */
export function rankPartners(needs: Category[], preferredArea?: Neighborhood): PartnerMatch[] {
  if (!needs.length) return [];
  const index = directoryIndex();
  const matches = coveringMatches(needs);
  const fullCover = matches.some((match) => match.covers.length === needs.length);

  if (fullCover) {
    return [...matches].sort((a, b) => compareMatches(a, b, index, preferredArea));
  }

  const complementary: PartnerMatch[] = [];
  const seen = new Set<string>();
  for (const need of needs) {
    const pick = pickSpecialist(need, matches, preferredArea);
    if (pick && !seen.has(pick.partner.id)) {
      seen.add(pick.partner.id);
      complementary.push({
        ...pick,
        covers: [need],
        explanation: 'Covers ' + need.toLowerCase(),
      });
    }
  }

  const others = matches
    .filter((match) => !seen.has(match.partner.id))
    .sort((a, b) => compareMatches(a, b, index, preferredArea));

  return [...complementary, ...others];
}

function cannedDraft(text: string, needs: Category[]): string {
  const lower = text.toLowerCase();
  const clothing = needs.includes('Clothing');
  const ride = needs.includes('Transportation');
  const food = needs.includes('Food');

  if (clothing && ride) {
    return (
      'Our family had a house fire. We still need clothes for the kids and a ride to pick them up. ' +
      'Any help you can offer would mean a lot.'
    );
  }
  if (ride && !clothing) {
    return (
      'We already have coats, but we can’t get to the pickup on our own. ' +
      'Could you help with a ride?'
    );
  }
  if (food) {
    return 'We need food for tonight after the fire. Thank you for considering our request.';
  }
  if (clothing) {
    return 'We need clothing for our family. Thank you for any help you can provide.';
  }
  if (ride) {
    return 'We need a ride to reach a pickup. Thank you for considering our request.';
  }
  if (lower.trim()) {
    return text.trim();
  }
  return 'We need help and would appreciate whatever you can offer.';
}

export function createDemoLlmClient(waitMs = 550): LlmClient {
  return {
    isVague(text: string) {
      const trimmed = text.trim();
      if (!trimmed) return true;
      // No identifiable need yet — ask a clarifying question (task 2.3).
      return interpretNeeds(trimmed).length === 0;
    },
    async interpret(text: string) {
      await delay(waitMs);
      const needs = interpretNeeds(text);
      return { needs, matches: rankPartners(needs, detectNeighborhood(text)) };
    },
    async draft(text: string, needs: Category[]) {
      await delay(Math.min(220, waitMs));
      return { text: cannedDraft(text, needs), needs };
    },
  };
}
