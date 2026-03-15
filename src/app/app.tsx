import { useCallback, useState } from 'react';
import { useViewerStore } from '@/shared/state/viewer-store';
import { Shell, type ViewerType } from '@/shared/ui/shell';
import { MapLibreViewer } from '@/viewer/maplibre/components/map-libre-viewer';
import { MapboxViewer } from '@/viewer/mapbox/components/mapbox-viewer';
import { CesiumViewer } from '@/viewer/cesium/components/cesium-viewer';

export function App() {
  const [viewerType, setViewerTypeState] = useState<ViewerType>('maplibre');
  const setSelectedFeature = useViewerStore((s) => s.setSelectedFeature);

  const setViewerType = useCallback(
    (type: ViewerType) => {
      setSelectedFeature(null);
      setViewerTypeState(type);
    },
    [setSelectedFeature],
  );

  return (
    <Shell viewerType={viewerType} onViewerTypeChange={setViewerType}>
      {viewerType === 'maplibre' && <MapLibreViewer />}
      {viewerType === 'mapbox' && <MapboxViewer />}
      {viewerType === 'cesium' && <CesiumViewer />}
    </Shell>
  );
}
