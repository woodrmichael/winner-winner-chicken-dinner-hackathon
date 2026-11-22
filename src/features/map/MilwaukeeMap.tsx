'use dom';

import type { DOMProps } from 'expo/dom';
import * as MapLibre from 'maplibre-gl';
import type { ExpressionSpecification } from 'maplibre-gl';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { neighborhoods, serviceNeighborhoods, type Neighborhood } from '../../domain/types';
import type { CommunityEventPin } from '../../domain/demoCommunity';
import { libraryDirectory, librarySource, type PublicLibrary } from '../../shared/publicLibraries';
import { styleUrl, workerUrl } from './basemap';
import { MapCredits } from './MapCredits';
import { eventColor, libraryColor } from './pointColors';
import geometry from './neighborhoods.geojson.json';
import './MilwaukeeMap.css';

const sourceId = 'milwaukee-neighborhoods';
const fillId = 'neighborhood-fill';
const outlineId = 'neighborhood-outline';
const homicideOutlineId = 'homicide-outline';
const shootingPointSource = 'shooting-points';
const shootingDotId = 'shooting-dot';
const selectionOutlineId = 'neighborhood-selection';

const features = geometry.features as Feature<Polygon | MultiPolygon, { area: string }>[];
const homeBounds = new MapLibre.LngLatBounds();
const areaBounds = new Map<string, MapLibre.LngLatBounds>();
for (const feature of features) {
  const bounds = new MapLibre.LngLatBounds();
  const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (const [longitude, latitude] of ring) bounds.extend([longitude, latitude]);
    }
  }
  areaBounds.set(feature.properties.area, bounds);
  homeBounds.extend(bounds);
}

const homeOptions = { padding: 38, maxZoom: 14, duration: 0 };
const neighborhoodLabelZoom = 12.25;
const nearbyLabels = new Set<Neighborhood>(neighborhoods);
const labelZoom = (area: string) => nearbyLabels.has(area as Neighborhood) ? neighborhoodLabelZoom : 14;
const baseFill = '#007767';
const baseOutline = '#6f8883';
const incidentPoints = features.flatMap(({ properties: { area } }) => {
  const center = areaBounds.get(area)?.getCenter();
  return center ? [{
    type: 'Feature' as const,
    properties: { area },
    geometry: { type: 'Point' as const, coordinates: [center.lng, center.lat] },
  }] : [];
});

function neighborhoodColors(colors: Record<string, string> | null, fallback: string): string | ExpressionSpecification {
  const [first, ...rest] = Object.entries(colors ?? {});
  return first ? ['match', ['get', 'area'], first[0], first[1], ...rest.flat(), fallback] : fallback;
}

function atLibrary(event: CommunityEventPin, { coordinates }: PublicLibrary) {
  return event.coordinates[0] === coordinates[0] && event.coordinates[1] === coordinates[1];
}

export default function MilwaukeeMap({
  selected,
  needs,
  shading,
  libraries,
  events,
  onSelect,
  onOpenEvent,
}: {
  selected: string | null;
  needs: Record<string, string> | null;
  shading: { fatal: Record<string, string> | null; nonfatal: Record<string, string> | null };
  libraries: PublicLibrary[] | null;
  events: CommunityEventPin[] | null;
  onSelect: (area: string | null) => Promise<void>;
  onOpenEvent: (id: string) => Promise<void>;
  dom?: DOMProps;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibre.Map | null>(null);
  const labels = useRef(new Map<string, HTMLButtonElement>());
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [readyMap, setReadyMap] = useState<MapLibre.Map | null>(null);
  const [showLoading, setShowLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const select = useEffectEvent((area: string | null) => { void onSelect(area); });
  const openEvent = useEffectEvent((id: string) => { void onOpenEvent(id); });
  const showingLibraries = libraries != null;

  useEffect(() => {
    const element = container.current;
    if (!element) return;

    let map: MapLibre.Map;
    try {
      MapLibre.setWorkerUrl(workerUrl);
      map = new MapLibre.Map({
        container: element,
        style: styleUrl,
        bounds: homeBounds,
        fitBoundsOptions: { ...homeOptions, padding: 20 },
        minZoom: 9,
        maxZoom: 19,
        attributionControl: false,
        renderWorldCopies: false,
        dragRotate: false,
        touchPitch: false,
        scrollZoom: false,
      });
    } catch {
      element.replaceChildren();
      const frame = window.requestAnimationFrame(() => setStatus('unavailable'));
      return () => window.cancelAnimationFrame(frame);
    }

    mapRef.current = map;
    map.touchZoomRotate.disableRotation();
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(element);

    const loadingTimer = window.setTimeout(() => setShowLoading(true), 320);
    const timer = window.setTimeout(() => setStatus('unavailable'), 12000);
    map.on('error', (event) => {
      // A style request failure prevents every layer from loading.
      if ('url' in event.error && event.error.url === styleUrl) {
        window.clearTimeout(timer);
        setStatus('unavailable');
      }
    });
    map.on('webglcontextlost', () => setStatus('unavailable'));

    map.once('load', () => {
      window.clearTimeout(loadingTimer);
      window.clearTimeout(timer);
      const beforeLabels = map.getStyle().layers.find((layer) =>
        layer.type === 'symbol' && layer.layout?.['text-field'],
      )?.id;

      map.addSource(sourceId, { type: 'geojson', data: { type: 'FeatureCollection', features } });
      map.addLayer({
        id: fillId,
        source: sourceId,
        type: 'fill',
        paint: {
          'fill-color': baseFill,
          'fill-opacity': 0.04,
        },
      }, beforeLabels);
      map.addLayer({
        id: outlineId,
        source: sourceId,
        type: 'line',
        paint: {
          'line-color': baseOutline,
          'line-opacity': 0.36,
          'line-width': 1,
        },
      }, beforeLabels);
      map.addLayer({
        id: homicideOutlineId,
        source: sourceId,
        type: 'line',
        layout: { visibility: 'none', 'line-join': 'round' },
        paint: { 'line-width': 4 },
      }, beforeLabels);
      map.addSource(shootingPointSource, { type: 'geojson', data: { type: 'FeatureCollection', features: incidentPoints } });
      map.addLayer({
        id: shootingDotId,
        source: shootingPointSource,
        type: 'circle',
        layout: { visibility: 'none' },
        paint: {
          'circle-radius': 8,
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 2,
          // Offset neighborhood totals once labels become visible so both marks can be read.
          'circle-translate': ['step', ['zoom'], ['literal', [0, 0]], neighborhoodLabelZoom, ['literal', [24, -30]]],
          'circle-translate-anchor': 'viewport',
        },
      });
      map.addLayer({
        id: selectionOutlineId,
        source: sourceId,
        type: 'line',
        filter: ['==', ['get', 'area'], ''],
        paint: { 'line-color': baseFill, 'line-width': 2, 'line-gap-width': 4 },
      }, beforeLabels);

      map.on('click', (event) => {
        const target = event.originalEvent.target;
        if (target instanceof Element && target.closest('.maplibregl-marker, .maplibregl-popup')) return;
        const [feature] = map.queryRenderedFeatures(event.point, { layers: [fillId, outlineId] });
        const area = feature?.properties.area;
        select(typeof area === 'string' && areaBounds.has(area) ? area : null);
      });
      map.on('mouseenter', fillId, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', fillId, () => { map.getCanvas().style.cursor = ''; });

      for (const area of serviceNeighborhoods) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'milwaukee-neighborhood';
        button.textContent = area;
        button.setAttribute('aria-pressed', 'false');
        button.addEventListener('click', (event) => {
          event.stopPropagation();
          select(area);
        });
        labels.current.set(area, button);
        const bounds = areaBounds.get(area);
        if (bounds) new MapLibre.Marker({ element: button }).setLngLat(bounds.getCenter()).addTo(map);
      }

      const updateLabelVisibility = () => {
        for (const [area, label] of labels.current) {
          label.toggleAttribute('hidden', map.getZoom() < labelZoom(area) && label.getAttribute('aria-pressed') !== 'true');
        }
      };
      map.on('zoom', updateLabelVisibility);
      updateLabelVisibility();
      setReadyMap(map);
      setStatus('ready');
    });

    const labelButtons = labels.current;
    return () => {
      window.clearTimeout(loadingTimer);
      window.clearTimeout(timer);
      observer.disconnect();
      labelButtons.clear();
      mapRef.current = null;
      map.remove();
    };
  }, [attempt]);

  useEffect(() => {
    const map = readyMap;
    if (status !== 'ready' || !map || mapRef.current !== map || !libraries) return;

    const pins = libraries.map((library) => {
      const { name, address, coordinates } = library;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'milwaukee-library';
      button.style.setProperty('--marker-ink', libraryColor);
      button.style.setProperty('--event-ink', eventColor);
      button.setAttribute('aria-label', name);
      button.title = name;

      const details = document.createElement('div');
      details.className = 'milwaukee-library-details';
      const title = document.createElement('strong');
      title.textContent = name;
      const location = document.createElement('span');
      location.textContent = address;
      const link = document.createElement('a');
      link.href = libraryDirectory;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.textContent = 'Library hours and locations';
      details.append(title, location, link);
      for (const event of events?.filter((item) => atLibrary(item, library)) ?? []) {
        const eventLink = document.createElement('button');
        eventLink.type = 'button';
        eventLink.textContent = event.title;
        eventLink.addEventListener('click', () => openEvent(event.id));
        details.append(eventLink);
        button.classList.add('milwaukee-library-with-event');
      }

      const popup = new MapLibre.Popup({ offset: 18 }).setDOMContent(details);
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        if (popup.isOpen()) popup.remove();
        else popup.setLngLat(coordinates).addTo(map);
      });
      const marker = new MapLibre.Marker({ element: button }).setLngLat(coordinates).addTo(map);
      return { marker, popup };
    });

    return () => {
      for (const { marker, popup } of pins) {
        popup.remove();
        marker.remove();
      }
    };
  }, [events, libraries, readyMap, status]);

  useEffect(() => {
    const map = readyMap;
    if (status !== 'ready' || !map || mapRef.current !== map || !events) return;

    const venues = new Map<string, CommunityEventPin[]>();
    for (const event of events) {
      if (libraries?.some((library) => atLibrary(event, library))) continue;
      const key = event.coordinates.join(',');
      const atVenue = venues.get(key);
      if (atVenue) atVenue.push(event);
      else venues.set(key, [event]);
    }
    const pins = Array.from(venues.values(), (atVenue) => {
      const [{ id, title, coordinates }] = atVenue;
      const label = atVenue.length > 1 ? `${atVenue.length} community events` : title;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'milwaukee-event';
      button.style.setProperty('--marker-ink', eventColor);
      button.setAttribute('aria-label', label);
      button.title = label;
      const details = document.createElement('div');
      details.className = 'milwaukee-library-details';
      for (const event of atVenue) {
        const link = document.createElement('button');
        link.type = 'button';
        link.textContent = event.title;
        link.addEventListener('click', () => openEvent(event.id));
        details.append(link);
      }
      const popup = new MapLibre.Popup({ offset: 18 }).setDOMContent(details);
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        if (atVenue.length === 1) openEvent(id);
        else if (popup.isOpen()) popup.remove();
        else popup.setLngLat(coordinates).addTo(map);
      });
      return { marker: new MapLibre.Marker({ element: button }).setLngLat(coordinates).addTo(map), popup };
    });
    return () => pins.forEach(({ marker, popup }) => {
      popup.remove();
      marker.remove();
    });
  }, [events, libraries, readyMap, status]);

  useEffect(() => {
    const map = readyMap;
    if (status !== 'ready' || !map || mapRef.current !== map) return;
    map.setPaintProperty(fillId, 'fill-color', neighborhoodColors(needs, baseFill));
    map.setPaintProperty(fillId, 'fill-opacity', needs
      ? ['case', ['in', ['get', 'area'], ['literal', Object.keys(needs)]], 0.78, 0.04]
      : 0.04);
    map.setPaintProperty(homicideOutlineId, 'line-color', neighborhoodColors(shading.fatal, '#c0c8c9'));
    map.setFilter(homicideOutlineId, ['in', ['get', 'area'], ['literal', Object.keys(shading.fatal ?? {})]]);
    map.setLayoutProperty(homicideOutlineId, 'visibility', shading.fatal ? 'visible' : 'none');
    map.setPaintProperty(shootingDotId, 'circle-color', neighborhoodColors(shading.nonfatal, '#c0c8c9'));
    map.setFilter(shootingDotId, ['in', ['get', 'area'], ['literal', Object.keys(shading.nonfatal ?? {})]]);
    map.setLayoutProperty(shootingDotId, 'visibility', shading.nonfatal ? 'visible' : 'none');
  }, [needs, readyMap, shading, status]);

  useEffect(() => {
    const map = readyMap;
    if (status !== 'ready' || !map || mapRef.current !== map) return;
    map.setFilter(selectionOutlineId, ['==', ['get', 'area'], selected ?? '']);
    for (const [area, button] of labels.current) {
      const isSelected = area === selected;
      button.setAttribute('aria-pressed', String(isSelected));
      button.toggleAttribute('hidden', map.getZoom() < labelZoom(area) && !isSelected);
    }
    const bounds = selected ? areaBounds.get(selected) : undefined;
    if (bounds && (map.getZoom() < neighborhoodLabelZoom || !map.getBounds().contains(bounds.getCenter()))) {
      map.fitBounds(bounds, homeOptions);
    }
  }, [readyMap, selected, status]);

  return (
    <div className="milwaukee-map" role="region" aria-label="Milwaukee street map">
      <div ref={container} className="milwaukee-map-canvas" inert={status !== 'ready'} />
      {status === 'ready' ? (
        <MapCredits>
          <span>City of Milwaukee DCD and ITMD-GIS</span>
          {showingLibraries && (
            <a href={librarySource} target="_blank" rel="noreferrer">City of Milwaukee library data</a>
          )}
        </MapCredits>
      ) : status === 'unavailable' ? (
        <div className="milwaukee-map-status">
          <span role="status">Street map unavailable</span>
          <button type="button" onClick={() => {
            setShowLoading(false);
            setStatus('loading');
            setAttempt((previous) => previous + 1);
          }}>
            Retry map
          </button>
        </div>
      ) : showLoading ? <span className="milwaukee-map-loading" role="status">Loading map…</span> : null}
    </div>
  );
}
