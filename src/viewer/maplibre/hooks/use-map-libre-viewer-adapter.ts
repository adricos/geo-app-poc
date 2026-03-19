import { useEffect, useMemo } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import { useViewerStore } from '@/shared/state/viewer-store';
import { MapLibreViewerAdapter } from '@/viewer/maplibre/adapter/map-libre-viewer-adapter';

export function useMapLibreViewerAdapter(mapRef: MapRef | null) {
  const setAdapter = useViewerStore((s) => s.setAdapter);
  const adapter = useMemo(() => (mapRef ? new MapLibreViewerAdapter(mapRef) : null), [mapRef]);
  useEffect(() => {
    setAdapter(adapter);
    return () => {
      adapter?.destroy();
      setAdapter(null);
    };
  }, [adapter, setAdapter]);
  return adapter;
}
