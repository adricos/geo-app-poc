import { useEffect, useMemo } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';
import { useViewerStore } from '@/shared/state/viewer-store';
import { MapboxViewerAdapter } from '@/viewer/mapbox/adapter/mapbox-viewer-adapter';

export function useMapboxViewerAdapter(mapRef: MapRef | null) {
  const setAdapter = useViewerStore((state) => state.setAdapter);

  const adapter = useMemo(() => {
    if (!mapRef) return null;
    return new MapboxViewerAdapter(mapRef);
  }, [mapRef]);

  useEffect(() => {
    setAdapter(adapter);
    return () => {
      adapter?.destroy();
      setAdapter(null);
    };
  }, [adapter, setAdapter]);

  return adapter;
}
