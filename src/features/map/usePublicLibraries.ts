import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { workspaceApiUrl } from '../../shared/http';
import { fetchCachedLibraries, fetchCityLibraries, libraryMaxAge, readLibrarySnapshot } from '../../shared/publicLibraries';
import bundled from './libraries.json';

const cacheKey = 'comforce-connect/public-libraries/v1';
const retryDelay = 5 * 60 * 1000;
let latest = readLibrarySnapshot(bundled);
let cachedRead: Promise<void> | undefined;
let inFlight: Promise<typeof latest> | undefined;
let retryAfter = 0;

function readSavedLibraries() {
  cachedRead ??= AsyncStorage.getItem(cacheKey).then((saved) => {
    if (!saved) return;
    const snapshot = readLibrarySnapshot(JSON.parse(saved));
    if (snapshot.fetchedAt > latest.fetchedAt) latest = snapshot;
  }).catch(() => {
    // Keep using the last valid public locations.
  });
  return cachedRead;
}

function refreshLibraries() {
  if (Date.now() - latest.fetchedAt < libraryMaxAge || Date.now() < retryAfter) return Promise.resolve(latest);
  inFlight ??= (async () => {
    try {
      const refreshed = workspaceApiUrl
        ? await fetchCachedLibraries(workspaceApiUrl).catch(fetchCityLibraries)
        : await fetchCityLibraries();
      if (refreshed.fetchedAt > latest.fetchedAt) {
        latest = refreshed;
        await AsyncStorage.setItem(cacheKey, JSON.stringify(latest)).catch(() => {});
      }
    } catch {
      // Keep the cached locations available while the city feed is offline.
    }
    retryAfter = Date.now() + retryDelay;
    return latest;
  })().finally(() => { inFlight = undefined; });

  return inFlight;
}

export function usePublicLibraries(enabled: boolean) {
  const [libraries, setLibraries] = useState(latest.libraries);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    void readSavedLibraries().then(() => {
      if (active) setLibraries(latest.libraries);
      return refreshLibraries();
    }).then((snapshot) => {
      if (active) setLibraries(snapshot.libraries);
    });
    return () => { active = false; };
  }, [enabled]);
  return libraries;
}
