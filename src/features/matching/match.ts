import type { Category, Partner } from '../../domain/types';
import { approvedPartners, directory, eligibleForNewReferral } from './directory';

export const example =
  'Our family had a house fire. We need clothes for the kids and a ride to pick the clothes up.';
const vocabulary: [Category, RegExp][] = [
  ['Clothing', /\b(cloth(?:es|ing)|coats?|jackets?|shirts?|shoes?|boots?|outfits?)\b/i],
  [
    'Transportation',
    /\b(rides?|bus(?:es)?|transport(?:ation)?|transit|lift|pickup|pick.?up|carpool)\b/i,
  ],
  ['Food', /\b(food|grocer(?:y|ies)|pantry|hungry|meals?|dinner|lunch)\b/i],
];

export function matchResources(message: string, partners: Partner[] = directory) {
  const needs = vocabulary.filter(([, pattern]) => pattern.test(message)).map(([need]) => need);
  const matches = approvedPartners(partners)
    .map((partner) => ({
      partner,
      covers: needs.filter((need) => eligibleForNewReferral(partner, need)),
    }))
    .filter((match) => match.covers.length > 0)
    .sort((a, b) => b.covers.length - a.covers.length);
  return { needs, matches };
}
