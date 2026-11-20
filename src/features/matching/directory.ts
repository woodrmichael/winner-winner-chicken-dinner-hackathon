import type { Partner } from '../../domain/types';

export const directory: Partner[] = [
  {
    id: 'winter-team',
    name: 'Winter Care Collective',
    categories: ['Clothing', 'Transportation'],
    area: 'Harambee',
  },
  {
    id: 'ride-circle',
    name: 'Riverwest Ride Circle',
    categories: ['Transportation'],
    area: 'Riverwest',
  },
  { id: 'table', name: 'Neighborhood Table', categories: ['Food'], area: 'Brewers Hill' },
];

export function partnerName(id: string) {
  return directory.find((partner) => partner.id === id)?.name ?? 'Unknown partner';
}
