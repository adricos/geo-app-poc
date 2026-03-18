import type { PropsWithChildren } from 'react';
import { ArgentinaDemographicsControl } from '@/features/argentina-demographics/components/argentina-demographics-control';
import { DrawingControl } from '@/features/drawing/components/drawing-control';
import { PropertyInsightsPanel } from '@/features/property-insights/components/property-insights-panel';
import { ViewerAdapterArchitectureDemo } from '@/viewer/core/viewer-adapter-architecture-demo';

export type ViewerType = 'maplibre' | 'mapbox' | 'cesium';

interface ShellProps extends PropsWithChildren {
  viewerType?: ViewerType;
  onViewerTypeChange?: (type: ViewerType) => void;
}

export function Shell({ children, viewerType = 'maplibre', onViewerTypeChange }: ShellProps) {
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to map
      </a>
      <aside className="sidebar" aria-label="App navigation and tools">
        <h1>Geo App POC</h1>
        {onViewerTypeChange && (
          <div className="viewer-switcher">
            <label htmlFor="viewer-type" className="viewer-switcher__label">
              View
            </label>
            <select
              id="viewer-type"
              value={viewerType}
              onChange={(e) => onViewerTypeChange(e.target.value as ViewerType)}
              className="viewer-switcher__select"
              aria-label="Select map viewer"
            >
              <option value="maplibre">MapLibre (2D)</option>
              <option value="mapbox">Mapbox (2D)</option>
              <option value="cesium">Cesium (3D)</option>
            </select>
          </div>
        )}
        <ArgentinaDemographicsControl viewerType={viewerType} />
        <DrawingControl viewerType={viewerType} />
        <ViewerAdapterArchitectureDemo />
        <PropertyInsightsPanel />
      </aside>
      <main id="main-content" className="content" role="main">
        {children}
      </main>
    </div>
  );
}
