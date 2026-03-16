import { useCallback, useState } from 'react';
import { useViewerStore } from '@/shared/state/viewer-store';
import { Shell, type ViewerType } from '@/shared/ui/shell';
import { MapLibreViewer } from '@/viewer/maplibre/components/map-libre-viewer';
import { MapboxViewer } from '@/viewer/mapbox/components/mapbox-viewer';
import { CesiumViewer } from '@/viewer/cesium/components/cesium-viewer';
import { ArgentinaDemographicsDeckOverlay } from '@/features/argentina-demographics/components/argentina-demographics-deck-overlay';
import { ArgentinaDemographicsCesiumLayer } from '@/features/argentina-demographics/components/argentina-demographics-cesium-layer';

export function App() {
  const [viewerType, setViewerTypeState] = useState<ViewerType>('maplibre');
  const setSelectedFeature = useViewerStore((s) => s.setSelectedFeature);
  const argentinaDemographicsEnabled = useViewerStore((s) => s.argentinaDemographicsEnabled);

  const setViewerType = useCallback(
    (type: ViewerType) => {
      setSelectedFeature(null);
      setViewerTypeState(type);
    },
    [setSelectedFeature],
  );

  const demographicsOverlay = argentinaDemographicsEnabled ? <ArgentinaDemographicsDeckOverlay /> : null;
  const demographicsCesiumLayer = argentinaDemographicsEnabled ? <ArgentinaDemographicsCesiumLayer /> : null;

  return (
    <Shell viewerType={viewerType} onViewerTypeChange={setViewerType}>
      {viewerType === 'maplibre' && <MapLibreViewer>{demographicsOverlay}</MapLibreViewer>}
      {viewerType === 'mapbox' && <MapboxViewer>{demographicsOverlay}</MapboxViewer>}
      {viewerType === 'cesium' && <CesiumViewer>{demographicsCesiumLayer}</CesiumViewer>}
    </Shell>
  );
}
