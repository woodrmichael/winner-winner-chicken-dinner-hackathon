export const incidentLayers = [
  { key: 'fatal', label: 'Homicides', symbol: '◆', ink: '#873750' },
  { key: 'nonfatal', label: 'Nonfatal shootings', symbol: '△', ink: '#805413' },
] as const;

export const incidentPeriod = '2014–2016';

// The map and legend use the same count ranges for both three-year totals.
export const incidentBands = [
  { max: 0, label: '0 recorded', fatal: '#FFFFFF', nonfatal: '#FFFFFF' },
  { max: 9, label: '1–9', fatal: '#F2D4E0', nonfatal: '#FFE7A3' },
  { max: 24, label: '10–24', fatal: '#CB819E', nonfatal: '#E9A83D' },
  { max: Infinity, label: '25+', fatal: '#873750', nonfatal: '#956015' },
];
export const noIncidentData = { label: 'No data', fatal: '#C0C8C9', nonfatal: '#C0C8C9' };

export function incidentBand(count: number | null | undefined) {
  if (count == null) return noIncidentData;
  return incidentBands.find((band) => count <= band.max) ?? noIncidentData;
}
