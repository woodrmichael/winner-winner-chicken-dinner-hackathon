import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { workspaceApiUrl, withResponse } from '../../shared/http';
import { fetchPublicTransit, publicTransitPath, transitRefresh, type TransitSnapshot } from '../../shared/publicTransit';

type TransitReading = { data: TransitSnapshot; fetchedAt: number };
let recent: TransitReading | undefined;
let pending: Promise<TransitSnapshot> | undefined;

function refresh(): Promise<TransitSnapshot> {
  if (recent && Date.now() - recent.fetchedAt < transitRefresh) return Promise.resolve(recent.data);
  pending ??= (async () => {
    if (Platform.OS !== 'web') return fetchPublicTransit();
    return withResponse((workspaceApiUrl ?? '') + publicTransitPath, {}, 9000, async (response) => {
      if (!response.ok || !response.headers.get('Content-Type')?.includes('application/json')) {
        throw new Error('Transit feed unavailable.');
      }
      return await response.json() as TransitSnapshot;
    });
  })().catch(() => ({ vehicles: null, tripsUpdatedAt: null, alerts: null })).then((data) => {
    recent = { data, fetchedAt: Date.now() };
    return data;
  }).finally(() => { pending = undefined; });
  return pending;
}

export function usePublicTransit(enabled: boolean) {
  const [reading, setReading] = useState<TransitReading>();
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function poll() {
      const next = await refresh();
      if (stopped) return;
      setReading({ data: next, fetchedAt: Date.now() });
      timer = setTimeout(poll, transitRefresh);
    }
    void poll();
    return () => { stopped = true; clearTimeout(timer); };
  }, [enabled]);
  return reading;
}
