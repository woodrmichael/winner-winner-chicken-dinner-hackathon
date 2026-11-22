import type { transit_realtime as gtfs } from 'gtfs-realtime-bindings';
import { withResponse } from './http';

export const publicTransitPath = '/public/map/transit';
export const transitRefresh = 30_000;
export const livePositionAge = 90_000;
export const alertFeedAge = 10 * 60_000;
export const transitAlertsUrl = 'https://www.ridemcts.com/alerts';
const feedUrl = 'https://realtime.ridemcts.com/gtfsrt/';

export type TransitVehicle = {
  id: string;
  route: string;
  coordinates: [number, number];
  recordedAt: number;
  arrivals: number[];
};

type TransitAlert = { id: string; title: string; detail: string; routes: string[]; endsAt: number | null };

export type TransitSnapshot = {
  vehicles: { updatedAt: number; items: TransitVehicle[] } | null;
  tripsUpdatedAt: number | null;
  alerts: { updatedAt: number; items: TransitAlert[] } | null;
};

function milliseconds(value: number | { toString(): string } | null | undefined) {
  return Number(value ?? 0) * 1000;
}

async function feed(name: 'vehicles' | 'trips' | 'alerts', schema: typeof gtfs) {
  return withResponse(feedUrl + name, {}, 6500, async (response) => {
    if (!response.ok) throw new Error('Transit feed unavailable.');
    const data = schema.FeedMessage.decode(new Uint8Array(await response.arrayBuffer()));
    const updatedAt = milliseconds(data.header.timestamp);
    if (!Number.isFinite(updatedAt) || updatedAt <= 0) throw new Error('Transit feed has no timestamp.');
    return { updatedAt, items: data.entity.filter((entry) => !entry.isDeleted) };
  }).catch(() => null);
}

function translated(value: gtfs.ITranslatedString | null | undefined) {
  const choices = value?.translation ?? [];
  return (choices.find(({ language }) => /^en(?:-|$)/i.test(language ?? ''))
    ?? choices.find(({ language }) => !language) ?? choices[0])?.text.trim() ?? '';
}

export async function fetchPublicTransit(): Promise<TransitSnapshot> {
  const { default: { transit_realtime: schema } } = await import('gtfs-realtime-bindings');
  const [vehicles, trips, alerts] = await Promise.all([
    feed('vehicles', schema), feed('trips', schema), feed('alerts', schema),
  ]);
  const now = Date.now();
  const arrivalsByTrip = new Map<string, number[]>();
  for (const { tripUpdate } of trips?.items ?? []) {
    const trip = tripUpdate?.trip;
    if (!trip?.tripId || trip.scheduleRelationship === schema.TripDescriptor.ScheduleRelationship.CANCELED) continue;
    const arrivals = (tripUpdate?.stopTimeUpdate ?? [])
      .filter((stop) => stop.scheduleRelationship !== schema.TripUpdate.StopTimeUpdate.ScheduleRelationship.SKIPPED)
      .map((stop) => milliseconds(stop.arrival?.time ?? stop.departure?.time))
      .filter((arrival) => arrival >= now)
      .sort((a, b) => a - b)
      .slice(0, 3);
    arrivalsByTrip.set(trip.tripId, arrivals);
  }

  return {
    vehicles: vehicles && {
      updatedAt: vehicles.updatedAt,
      items: vehicles.items.flatMap(({ id, vehicle }) => {
        const position = vehicle?.position;
        const route = vehicle?.trip?.routeId;
        if (!position || !route || Math.abs(position.longitude) > 180 || Math.abs(position.latitude) > 90
          || !Number.isFinite(position.longitude) || !Number.isFinite(position.latitude)) return [];
        return [{
          id, route, coordinates: [position.longitude, position.latitude],
          recordedAt: milliseconds(vehicle?.timestamp) || vehicles.updatedAt,
          arrivals: arrivalsByTrip.get(vehicle?.trip?.tripId ?? '') ?? [],
        }];
      }),
    },
    tripsUpdatedAt: trips?.updatedAt ?? null,
    alerts: alerts && {
      updatedAt: alerts.updatedAt,
      items: alerts.items.flatMap(({ id, alert }) => {
        const title = translated(alert?.headerText);
        if (!title) return [];
        const ranges = alert?.activePeriod ?? [];
        const active = ranges.filter(({ start, end }) =>
          (!start || milliseconds(start) <= now) && (!end || milliseconds(end) > now));
        if (ranges.length && !active.length) return [];
        const endsAt = active.length && active.every(({ end }) => !!end)
          ? Math.max(...active.map(({ end }) => milliseconds(end))) : null;
        const routes = Array.from(new Set((alert?.informedEntity ?? []).flatMap(({ routeId }) => routeId ? [routeId] : [])));
        return [{ id, title, detail: translated(alert?.descriptionText), routes, endsAt }];
      }),
    },
  };
}
