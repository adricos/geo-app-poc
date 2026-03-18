import { useEffect, useMemo } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';
import { useViewerStore } from '@/shared/state/viewer-store';
import { MapboxViewerAdapter } from '@/viewer/mapbox/adapter/mapbox-viewer-adapter';

export function useMapboxViewerAdapter(mapRef: MapRef | null) {
  const setAdapter = useViewerStore((s) => s.setAdapter);
  const adapter = useMemo(
    () => (mapRef ? new MapboxViewerAdapter(mapRef) : null),
    [mapRef],
  );
  useEffect(() => {
    setAdapter(adapter);
    return () => {
      adapter?.destroy();
      setAdapter(null);
    };
  }, [adapter, setAdapter]);
  return adapter;
}
