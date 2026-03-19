import { useCallback } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter';
import {
  useTerraDraw as useTerraDrawCore,
  type TerraDrawStyleLoadableMap,
} from '@/viewer/core/hooks/use-terra-draw';

/**
 * Integrates Terra Draw with the MapLibre viewer. Must be called after the map
 * has loaded; initialization runs on map 'style.load' to avoid missing source errors.
 * When drawingEnabled is false, the hook does nothing. When toggled off, draw.stop() is called.
 */
export function useTerraDraw(mapRef: MapRef | null, enabled: boolean) {
  const createAdapter = useCallback((map: TerraDrawStyleLoadableMap) => {
    // map is the same instance as mapRef.getMap() (full MapLibre map)
    return new TerraDrawMapLibreGLAdapter({ map: map as never });
  }, []);

  return useTerraDrawCore(mapRef, enabled, createAdapter);
}
