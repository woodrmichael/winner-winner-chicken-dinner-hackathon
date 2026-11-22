import assert from 'node:assert/strict';
import { test } from 'node:test';
import { transit_realtime as gtfs } from 'gtfs-realtime-bindings';
import { fetchPublicTransit } from '../src/shared/publicTransit';

test('transit pairs buses with future stop estimates and shows active English alerts', async (t) => {
  const now = Math.floor(Date.now() / 1000);
  const feeds: Record<string, gtfs.IFeedEntity[]> = {
    vehicles: [
      {
        id: 'bus-1',
        vehicle: { trip: { tripId: 'a', routeId: '30' }, position: { latitude: 43, longitude: -88 } },
      },
      { id: 'bad-position', vehicle: { trip: { routeId: '30' }, position: { latitude: 143, longitude: -88 } } },
    ],
    trips: [{
      id: 'trip-1',
      tripUpdate: {
        trip: { tripId: 'a' },
        stopTimeUpdate: [
          { arrival: { time: now - 60 } },
          { arrival: { time: now + 60 }, scheduleRelationship: gtfs.TripUpdate.StopTimeUpdate.ScheduleRelationship.SKIPPED },
          { departure: { time: now + 180 } },
          { arrival: { time: now + 120 } },
        ],
      },
    }],
    alerts: [
      {
        id: 'detour',
        alert: {
          activePeriod: [{ start: now - 60, end: now + 3600 }],
          headerText: { translation: [{ language: 'es', text: 'Desvío' }, { language: 'en', text: 'Detour' }] },
          informedEntity: [{ routeId: '30' }, { routeId: '30' }],
        },
      },
      { id: 'expired', alert: { activePeriod: [{ end: now - 60 }], headerText: { translation: [{ text: 'Expired' }] } } },
    ],
  };
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    const key = new URL(url).pathname.split('/').at(-1) ?? '';
    const bytes = gtfs.FeedMessage.encode({
      header: { gtfsRealtimeVersion: '2.0', timestamp: now }, entity: feeds[key],
    }).finish();
    return new Response(Uint8Array.from(bytes));
  });

  const result = await fetchPublicTransit();
  assert.deepEqual(result.vehicles, {
    updatedAt: now * 1000,
    items: [{
      id: 'bus-1', route: '30', coordinates: [-88, 43], recordedAt: now * 1000,
      arrivals: [(now + 120) * 1000, (now + 180) * 1000],
    }],
  });
  assert.equal(result.tripsUpdatedAt, now * 1000);
  assert.deepEqual(result.alerts?.items, [{ id: 'detour', title: 'Detour', detail: '', routes: ['30'], endsAt: (now + 3600) * 1000 }]);
});

test('a failed vehicle or trip feed leaves service alerts available', async (t) => {
  const now = Math.floor(Date.now() / 1000);
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    if (!url.endsWith('/alerts')) return new Response(null, { status: 503 });
    const bytes = gtfs.FeedMessage.encode({ header: { gtfsRealtimeVersion: '2.0', timestamp: now }, entity: [] }).finish();
    return new Response(Uint8Array.from(bytes));
  });
  assert.deepEqual(await fetchPublicTransit(), {
    vehicles: null, tripsUpdatedAt: null, alerts: { updatedAt: now * 1000, items: [] },
  });
});
