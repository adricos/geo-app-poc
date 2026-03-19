import { useCallback, useEffect, useRef, useState } from 'react';
import { useViewerStore } from '@/shared/state/viewer-store';
import { Shell, type ViewerType } from '@/shared/ui/shell';
import styles from './app.module.css';
import { MapLibreViewer } from '@/viewer/maplibre/components/map-libre-viewer';
import { MapboxViewer } from '@/viewer/mapbox/components/mapbox-viewer';
import { CesiumViewer } from '@/viewer/cesium/components/cesium-viewer';
import { ArgentinaDemographicsDeckOverlay } from '@/features/argentina-demographics/components/argentina-demographics-deck-overlay';
import { ArgentinaDemographicsCesiumLayer } from '@/features/argentina-demographics/components/argentina-demographics-cesium-layer';

/** Delay (ms) before mounting the new viewer after a switch. Allows the previous viewer's WebGL context to be released and avoids "Too many active WebGL contexts" when switching from Cesium. */
const VIEWER_SWITCH_DELAY_MS = 150;

export function App() {
  const [viewerType, setViewerTypeState] = useState<ViewerType>('maplibre');
  const [mountedViewerType, setMountedViewerType] = useState<ViewerType | null>('maplibre');
  const viewerTypeRef = useRef<ViewerType>(viewerType);
  const setSelectedFeature = useViewerStore((s) => s.setSelectedFeature);
  const argentinaDemographicsEnabled = useViewerStore((s) => s.argentinaDemographicsEnabled);

  const setViewerType = useCallback(
    (type: ViewerType) => {
      setSelectedFeature(null);
      setViewerTypeState(type);
    },
    [setSelectedFeature],
  );

  useEffect(() => {
    if (viewerType === viewerTypeRef.current) return;
    viewerTypeRef.current = viewerType;
    setMountedViewerType(null);
    const t = setTimeout(() => {
      setMountedViewerType(viewerType);
    }, VIEWER_SWITCH_DELAY_MS);
    return () => clearTimeout(t);
  }, [viewerType]);

  const demographicsOverlay = argentinaDemographicsEnabled ? (
    <ArgentinaDemographicsDeckOverlay />
  ) : null;
  /** Always mount Cesium layer when on Cesium; it adds/removes the data source from the store flag so toggling doesn't stack layers. */
  const demographicsCesiumLayer = <ArgentinaDemographicsCesiumLayer />;

  const viewer =
    mountedViewerType === 'maplibre' ? (
      <MapLibreViewer key='maplibre'>{demographicsOverlay}</MapLibreViewer>
    ) : mountedViewerType === 'mapbox' ? (
      <MapboxViewer key='mapbox'>{demographicsOverlay}</MapboxViewer>
    ) : mountedViewerType === 'cesium' ? (
      <CesiumViewer key='cesium'>{demographicsCesiumLayer}</CesiumViewer>
    ) : (
      <div
        className={`map-root ${styles.mapRootLoading}`}
        role='application'
        aria-label='Loading map'
      />
    );

  return (
    <Shell viewerType={viewerType} onViewerTypeChange={setViewerType}>
      {viewer}
    </Shell>
  );
}
