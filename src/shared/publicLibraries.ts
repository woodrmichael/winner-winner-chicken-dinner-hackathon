import { withResponse } from './http';

export const librarySource = 'https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/AGO/LibraryServices/MapServer/0';
export const libraryDirectory = 'https://mpl.org/hours_locations/';
export const publicLibrariesPath = '/public/map/libraries';
export const libraryMaxAge = 24 * 60 * 60 * 1000;

export type PublicLibrary = {
  name: string;
  address: string;
  coordinates: [longitude: number, latitude: number];
};

export type LibrarySnapshot = { fetchedAt: number; libraries: PublicLibrary[] };

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function normalizeLibraries(input: unknown): PublicLibrary[] {
  if (!Array.isArray(input) || !input.length || input.length > 100) {
    throw new Error('City library data has an unexpected record count.');
  }
  const seen = new Set<string>();
  return input.flatMap((value) => {
    const point = record(value);
    const name = text(point?.name);
    const address = text(point?.address);
    const coordinates = point?.coordinates;
    if (!name || !address || !Array.isArray(coordinates) || coordinates.length !== 2) {
      throw new Error('City library data is missing a name, address or location.');
    }
    const [longitude, latitude] = coordinates;
    if (typeof longitude !== 'number' || longitude <= -88.2 || longitude >= -87.8 ||
        typeof latitude !== 'number' || latitude <= 42.85 || latitude >= 43.25 ||
        !Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      throw new Error('A city library location is outside Milwaukee.');
    }
    const library: PublicLibrary = { name, address, coordinates: [longitude, latitude] };
    // MPL's directory shows the new entrance. Correct the old record in cached copies too.
    if (name.toLowerCase() === 'martin luther king library' &&
        address.replace(/\./g, '').toLowerCase() === '310 w locust st') {
      library.address = '2901 N. Martin Luther King Jr. Dr.';
      library.coordinates = [-87.914447, 43.071576];
    }
    const key = name.toLowerCase() + '|' + library.address.toLowerCase();
    if (seen.has(key)) return [];
    seen.add(key);
    return [library];
  }).sort((left, right) => left.name.localeCompare(right.name));
}

export function readLibrarySnapshot(input: unknown): LibrarySnapshot {
  const snapshot = record(input);
  const fetchedAt = snapshot?.fetchedAt;
  if (typeof fetchedAt !== 'number' || !Number.isSafeInteger(fetchedAt) || fetchedAt <= 0) {
    throw new Error('City library data has an invalid refresh date.');
  }
  return { fetchedAt, libraries: normalizeLibraries(snapshot?.libraries) };
}

export function normalizeCityLibraries(input: unknown) {
  const collection = record(input);
  if (collection?.type !== 'FeatureCollection' || !Array.isArray(collection.features) ||
      collection.exceededTransferLimit || record(collection.properties)?.exceededTransferLimit) {
    throw new Error('The City of Milwaukee did not return complete library data.');
  }
  const libraries = collection.features.map((feature: unknown) => {
    const object = record(feature);
    const properties = record(object?.properties);
    const geometry = record(object?.geometry);
    return {
      name: properties?.LIBRARY,
      address: properties?.ADDRESS,
      coordinates: geometry?.type === 'Point' ? geometry.coordinates : undefined,
    };
  });
  return normalizeLibraries(libraries);
}

function readJson(url: string): Promise<unknown> {
  return withResponse(url, {}, 6000, async (response) => {
    if (!response.ok) throw new Error('Public library data is unavailable.');
    return response.json();
  });
}

export async function fetchCityLibraries(): Promise<LibrarySnapshot> {
  const params = new URLSearchParams({
    where: "TYPE = 'MPL'",
    outFields: 'LIBRARY,ADDRESS',
    outSR: '4326',
    geometryPrecision: '6',
    f: 'geojson',
  });
  const libraries = normalizeCityLibraries(await readJson(librarySource + '/query?' + params));
  return { fetchedAt: Date.now(), libraries };
}

export async function fetchCachedLibraries(apiUrl: string) {
  return readLibrarySnapshot(await readJson(apiUrl + publicLibrariesPath));
}
