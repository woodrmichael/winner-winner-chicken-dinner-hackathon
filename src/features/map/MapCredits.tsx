import type { PropsWithChildren } from 'react';
import './MilwaukeeMap.css';

export function MapCredits({ children }: PropsWithChildren) {
  return (
    <details className="milwaukee-map-credits">
      <summary aria-label="Map credits for OpenStreetMap and other sources">
        © OpenStreetMap
        <span aria-hidden="true">i</span>
      </summary>
      <div>
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>
        <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a>
        <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">© OpenMapTiles</a>
        {children}
      </div>
    </details>
  );
}
