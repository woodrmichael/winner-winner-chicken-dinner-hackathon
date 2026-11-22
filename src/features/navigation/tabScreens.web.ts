import { lazy } from 'react';

export { default as ActivityScreen } from '../activity/Activity';
export { default as Community } from '../community/Community';
export { default as Impact } from '../impact/Impact';

const loadMap = () => import('../map/MapScreen');
export const MapScreen = lazy(loadMap);

export function warmNavigation() {
  void Promise.allSettled([loadMap(), import('../community/PostDetails')]);
}
