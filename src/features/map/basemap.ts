import { getVersion } from 'maplibre-gl';

export const styleUrl = 'https://tiles.openfreemap.org/styles/liberty';
export const workerUrl = 'https://cdn.jsdelivr.net/npm/maplibre-gl@' + getVersion() + '/dist/maplibre-gl-worker.mjs';
