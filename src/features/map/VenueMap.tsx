'use dom';

import type { DOMProps } from 'expo/dom';
import * as MapLibre from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState } from 'react';
import { styleUrl, workerUrl } from './basemap';
import { MapCredits } from './MapCredits';

export default function VenueMap({ name, longitude, latitude }: {
  name: string;
  longitude: number;
  latitude: number;
  dom?: DOMProps;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');

  useEffect(() => {
    const element = container.current;
    if (!element) return;

    let map: MapLibre.Map;
    try {
      MapLibre.setWorkerUrl(workerUrl);
      map = new MapLibre.Map({
        container: element,
        style: styleUrl,
        center: [longitude, latitude],
        zoom: 15.5,
        interactive: false,
        attributionControl: false,
      });
    } catch {
      element.replaceChildren();
      const frame = window.requestAnimationFrame(() => setStatus('unavailable'));
      return () => window.cancelAnimationFrame(frame);
    }
    const timer = window.setTimeout(() => setStatus('unavailable'), 12000);
    map.once('idle', () => {
      window.clearTimeout(timer);
      new MapLibre.Marker({ color: '#005e50' }).setLngLat([longitude, latitude]).addTo(map);
      setStatus('ready');
    });
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(element);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      map.remove();
    };
  }, [latitude, longitude]);

  return (
    <div className="milwaukee-map" role="region" aria-label={'Map of ' + name}>
      <div ref={container} className="milwaukee-map-canvas" inert={status !== 'ready'} />
      {status === 'ready' && <MapCredits />}
      {status === 'unavailable' && <span className="milwaukee-map-status" role="status">Map preview unavailable</span>}
    </div>
  );
}
