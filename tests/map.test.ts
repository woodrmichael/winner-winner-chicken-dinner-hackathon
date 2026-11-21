import assert from 'node:assert/strict';
import test from 'node:test';
import { incidentBand } from '../src/features/map/incidentScale';

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
