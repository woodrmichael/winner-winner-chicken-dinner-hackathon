import type { Category } from '../../domain/types';

const terms: Record<Category, RegExp> = {
  Clothing: /\b(coats?|clothes|clothing|boots?|jackets?)\b/i,
  Transportation: /\b(rides?|transportation|transport|drove|driven)\b/i,
  Food: /\b(food|meals?|groceries|pantry)\b/i,
  Other: /\b(other service)\b/i,
};

export function suggestService(note: string, eligible: readonly Category[]): Category[] {
  const completed = note.split(/[.!?;\n]|\bbut\b|\band\b/i).filter((part) =>
    /\b(delivered|dropped off|provided|completed|gave|drove|transported|distributed)\b/i.test(part) &&
    !/\b(not|never|haven't|hasn't|didn't|couldn't|cannot|can't|need|needed|pending|will|tomorrow|plan|planning)\b/i.test(part),
  );
  return eligible.filter((category) => completed.some((part) => terms[category].test(part)));
}
