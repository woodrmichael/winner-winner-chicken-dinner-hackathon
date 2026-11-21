import type { Category, Partner } from '../../../domain/types';

export type MatchSource = 'model' | 'keywords';

export type PartnerMatch = {
  partner: Partner;
  covers: Category[];
  explanation: string;
};

export type MatchResult = {
  needs: Category[];
  matches: PartnerMatch[];
  source: MatchSource;
};

export type DraftResult = {
  text: string;
  needs: Category[];
};
