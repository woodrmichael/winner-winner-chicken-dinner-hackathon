import { Image, type ImageRef } from 'expo-image';

type PostPhoto = { source: number; description: string };

const postPhotos: Partial<Record<string, PostPhoto>> = {
  drive: {
    source: require('../../../assets/clothing-rack.jpg'),
    description: 'Winter coats on a clothing rack',
  },
  coats: {
    source: require('../../../assets/kids-winter-coats.jpg'),
    description: 'Two children’s winter coats and mittens beside a window',
  },
  'demo-post-bay-view-repair': {
    source: require('../../../assets/winter-gear-repair.jpg'),
    description: 'A volunteer stitching a winter coat at a worktable',
  },
  'demo-post-meal-packing': {
    source: require('../../../assets/pantry-packing.jpg'),
    description: 'Volunteers packing bags with groceries',
  },
};

const decoded = new Map<number, ImageRef>();
let warmup: Promise<unknown> | undefined;

export function warmPostPhotos() {
  warmup ??= Promise.allSettled(Object.values(postPhotos).map(async (photo) => {
    if (!photo) return;
    decoded.set(photo.source, await Image.loadAsync(photo.source, { maxWidth: 1280, maxHeight: 720 }));
  }));
}

export function postPhoto(id: string, preferDecoded = false) {
  const photo = postPhotos[id];
  if (!photo) return undefined;
  return { ...photo, source: (preferDecoded ? decoded.get(photo.source) : undefined) ?? photo.source };
}
