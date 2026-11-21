import type { Category } from '../../../domain/types';
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
  return vocabulary.filter(([need, pattern]) =>
    clauses.some((clause) => pattern.test(clause) &&
      !satisfied.some(([category, rule]) => category === need && rule.test(clause))),
  ).map(([need]) => need);
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

export function rankPartners(needs: Category[]): PartnerMatch[] {
  const directoryIndex = new Map(directory.map((partner, index) => [partner.id, index]));
  return directory
    .map((partner) => {
      const covers = needs.filter((need) => partner.categories.includes(need));
      return { partner, covers, explanation: explain(covers) };
    })
    .filter((match) => match.covers.length > 0)
    .sort((a, b) => {
      const byCoverage = b.covers.length - a.covers.length;
      if (byCoverage !== 0) return byCoverage;
      return (directoryIndex.get(a.partner.id) ?? 0) - (directoryIndex.get(b.partner.id) ?? 0);
    });
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
      return { needs, matches: rankPartners(needs) };
    },
    async draft(text: string, needs: Category[]) {
      await delay(Math.min(220, waitMs));
      return { text: cannedDraft(text, needs), needs };
    },
  };
}
