export const incidentLayers = [
  { key: 'fatal', label: 'Homicides', ink: '#621B7D' },
  { key: 'nonfatal', label: 'Nonfatal shootings', ink: '#97400F' },
] as const;

export const incidentPeriod = '2014–2016';

// The map and legend use the same count ranges for both three-year totals.
export const incidentBands = [
  { max: 0, label: '0 recorded', fatal: '#8B818A', nonfatal: '#E4E0D8' },
  { max: 9, label: '1–9', fatal: '#AC62BA', nonfatal: '#F8CA61' },
  { max: 24, label: '10–24', fatal: '#8934A0', nonfatal: '#E38717' },
  { max: Infinity, label: '25+', fatal: '#621B7D', nonfatal: '#B54A0D' },
];
export const noIncidentData = { label: 'No data', fatal: '#C0C8C9', nonfatal: '#C0C8C9' };

export function incidentBand(count: number | null | undefined) {
  if (count == null) return noIncidentData;
  return incidentBands.find((band) => count <= band.max) ?? noIncidentData;
}

export const needBands = [
  { max: 0, label: '0', ink: '#EAF6EF' },
  { max: 3, label: '1–3', ink: '#A6DFCC' },
  { max: 9, label: '4–9', ink: '#60B69E' },
  { max: 24, label: '10–24', ink: '#299C85' },
  { max: Infinity, label: '25+', ink: '#005C50' },
];

export function needColor(count: number) {
  return needBands.find(({ max }) => count <= max)?.ink ?? needBands[0].ink;
}
