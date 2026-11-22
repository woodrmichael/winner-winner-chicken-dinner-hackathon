import { Image, type ImageRef } from 'expo-image';
import { Link } from 'expo-router';
import { View } from 'react-native';
import { color, wrap } from '../../ui/kit';

const previews: Partial<Record<string, number>> = {
  'Moody Park': require('../../../assets/venue-maps/moody-park.webp'),
  'Central Library': require('../../../assets/venue-maps/central-library.webp'),
  'Martin Luther King Library': require('../../../assets/venue-maps/king-library.webp'),
  'Bay View Library': require('../../../assets/venue-maps/bay-view-library.webp'),
  'East Library': require('../../../assets/venue-maps/east-library.webp'),
  'Atkinson Library': require('../../../assets/venue-maps/atkinson-library.webp'),
  'Capitol Library': require('../../../assets/venue-maps/capitol-library.webp'),
};

const credits = [
  { label: '© OpenStreetMap', url: 'https://www.openstreetmap.org/copyright' },
  { label: '© OpenMapTiles', url: 'https://openmaptiles.org/' },
  { label: 'OpenFreeMap', url: 'https://openfreemap.org/' },
] as const;

const decoded = new Map<number, ImageRef>();
let warmup: Promise<unknown> | undefined;

export function warmVenueMaps() {
  warmup ??= Promise.allSettled(Object.values(previews).map(async (source) => {
    if (source) decoded.set(source, await Image.loadAsync(source));
  }));
  return warmup;
}

export default function VenueMap({ name }: { name: string }) {
  const source = previews[name];
  if (source === undefined) return null;

  return <View style={{ gap: 4 }}>
    <Image source={decoded.get(source) ?? source} accessibilityLabel={`Map of ${name}`}
      contentFit="cover" cachePolicy="memory-disk" transition={0}
      style={{ width: '100%', height: 176, borderRadius: 10, backgroundColor: '#e8eee5' }} />
    <View style={[wrap, { gap: 8, justifyContent: 'flex-end' }]}>
      {credits.map(({ label, url }) => <Link key={url} href={url} target="_blank"
        style={{ fontSize: 11, color: color.muted, textDecorationLine: 'underline' }}>{label}</Link>)}
    </View>
  </View>;
}
