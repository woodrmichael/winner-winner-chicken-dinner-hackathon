import bundled from '../src/features/map/libraries.json';
import { fetchCityLibraries, libraryMaxAge, readLibrarySnapshot } from '../src/shared/publicLibraries';

export function createPublicLibraryCache(refresh = fetchCityLibraries, now = Date.now) {
  let snapshot = readLibrarySnapshot(bundled);
  let pending: Promise<typeof snapshot> | undefined;
  let retryAfter = 0;

  return function getLibraries() {
    if (pending) return pending;
    if (now() - snapshot.fetchedAt < libraryMaxAge || now() < retryAfter) return Promise.resolve(snapshot);

    pending = Promise.resolve().then(refresh).then(readLibrarySnapshot).then((updated) => {
      if (updated.fetchedAt > snapshot.fetchedAt) snapshot = updated;
      return snapshot;
    }).catch(() => {
      retryAfter = now() + 5 * 60 * 1000;
      return snapshot;
    }).finally(() => {
      pending = undefined;
    });
    return pending;
  };
}
