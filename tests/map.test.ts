import assert from 'node:assert/strict';
import test from 'node:test';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import { createPublicLibraryCache } from '../server/public-map';
import { communityEventPins, communityEvents, demoPosts } from '../src/domain/demoCommunity';
import { serviceNeighborhoods } from '../src/domain/types';
import { incidentBand } from '../src/features/map/incidentScale';
import bundledLibraries from '../src/features/map/libraries.json';
import geometry from '../src/features/map/neighborhoods.geojson.json';
import { normalizeCityLibraries, libraryMaxAge, readLibrarySnapshot } from '../src/shared/publicLibraries';

test('only public visible events with venue details appear on the map', () => {
  const posts = demoPosts();
  const drive = posts.find(({ id }) => id === 'drive')!;
  const pins = communityEventPins(posts);
  assert.equal(pins.length, 3);
  assert.deepEqual(pins.find(({ id }) => id === drive.id), {
    id: drive.id, title: drive.title, coordinates: communityEvents.get(drive.id)!.venue.coordinates,
  });
  assert.deepEqual(communityEventPins([
    { ...drive, status: 'hidden' },
    { ...drive, group: 'Amani' },
    { ...drive, kind: 'Update' },
    { ...drive, id: 'unmapped-event' },
  ]), []);
});

test('city library rows are normalized and malformed or incomplete responses are rejected', () => {
  const feature = {
    properties: { LIBRARY: '  Central  Library ', ADDRESS: ' 814 W Wisconsin Av ' },
    geometry: { type: 'Point', coordinates: [-87.92, 43.04] },
  };
  const collection = { type: 'FeatureCollection', features: [feature, feature] };
  assert.deepEqual(normalizeCityLibraries(collection), [{
    name: 'Central Library', address: '814 W Wisconsin Av', coordinates: [-87.92, 43.04],
  }]);
  assert.throws(() => normalizeCityLibraries({ ...collection, exceededTransferLimit: true }));
  assert.throws(() => normalizeCityLibraries({
    ...collection, features: [{ ...feature, geometry: { type: 'Point', coordinates: [43.04, -87.92] } }],
  }));
});

test('the City GIS record for the old King branch uses the address from the library directory', () => {
  const library = normalizeCityLibraries({
    type: 'FeatureCollection',
    features: [{
      properties: { LIBRARY: 'Martin Luther King Library', ADDRESS: '310 W Locust St' },
      geometry: { type: 'Point', coordinates: [-87.915, 43.072] },
    }],
  })[0];
  assert.equal(library.address, '2901 N. Martin Luther King Jr. Dr.');
  assert.deepEqual(library.coordinates, [-87.914447, 43.071576]);
});

test('public library cache coalesces updates and keeps valid locations during a failed refresh', async () => {
  const bundled = readLibrarySnapshot(bundledLibraries);
  let time = bundled.fetchedAt;
  let requests = 0;
  const getLibraries = createPublicLibraryCache(async () => {
    requests += 1;
    if (requests === 1) throw new Error('City feed unavailable');
    return { ...bundled, fetchedAt: time };
  }, () => time);

  assert.deepEqual(await getLibraries(), bundled);
  assert.equal(requests, 0);
  time += libraryMaxAge;
  assert.deepEqual(await Promise.all([getLibraries(), getLibraries()]), [bundled, bundled]);
  assert.deepEqual(await getLibraries(), bundled);
  assert.equal(requests, 1);
  time += 5 * 60 * 1000;
  assert.equal((await getLibraries()).fetchedAt, time);
  assert.equal((await getLibraries()).fetchedAt, time);
  assert.equal(requests, 2);
});

test('the map includes 190 City neighborhoods and every reporting area', () => {
  const features = geometry.features as Feature<Polygon | MultiPolygon, { area: string }>[];
  const names = new Set(features.map((feature) => feature.properties.area));
  assert.equal(features.length, 190);
  assert.equal(names.size, features.length);
  for (const area of serviceNeighborhoods) assert.ok(names.has(area));
  for (const feature of features) {
    const { type, coordinates } = feature.geometry;
    assert.ok(type === 'Polygon' || type === 'MultiPolygon');
    const polygons = type === 'Polygon' ? [coordinates] : coordinates;
    assert.ok(polygons.length > 0);
    for (const polygon of polygons) {
      for (const ring of polygon) {
        assert.ok(ring.length >= 4);
        assert.deepEqual(ring[0], ring.at(-1));
        for (const [longitude, latitude] of ring) {
          assert.ok(longitude > -88.2 && longitude < -87.8);
          assert.ok(latitude > 42.85 && latitude < 43.25);
        }
      }
    }
  }
});

test('historical map distinguishes a recorded zero from a missing observation on both layers', () => {
  const zero = incidentBand(0);
  const missing = incidentBand(undefined);
  assert.equal(zero.label, '0 recorded');
  assert.equal(missing.label, 'No data');
  assert.deepEqual(incidentBand(null), missing);
  assert.notEqual(zero.fatal, missing.fatal);
  assert.notEqual(zero.nonfatal, missing.nonfatal);
});

test('incident counts use the ranges and layer colors shown in the legend', () => {
  for (const [count, label] of [[1, '1–9'], [9, '1–9'], [10, '10–24'], [24, '10–24'], [25, '25+'], [84, '25+']] as const) {
    const band = incidentBand(count);
    assert.equal(band.label, label);
    assert.notEqual(band.fatal, band.nonfatal);
  }
});
