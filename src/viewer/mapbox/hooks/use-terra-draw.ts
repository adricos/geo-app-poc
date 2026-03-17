import { useEffect, useRef, useCallback } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';
import {
  TerraDraw,
  TerraDrawPointMode,
  TerraDrawLineStringMode,
  TerraDrawPolygonMode,
  TerraDrawSelectMode,
} from 'terra-draw';
import { TerraDrawMapboxGLAdapter } from 'terra-draw-mapbox-gl-adapter';
import { useViewerStore } from '@/shared/state/viewer-store';

export type TerraDrawMode = 'point' | 'linestring' | 'polygon';

/**
 * Integrates Terra Draw with the Mapbox viewer. Must be called after the map
 * has loaded; initialization runs on map 'style.load' to avoid missing source errors.
 * When drawingEnabled is false, the hook does nothing. When toggled off, draw.stop() is called.
 */
export function useTerraDraw(mapRef: MapRef | null, enabled: boolean) {
  const drawRef = useRef<TerraDraw | null>(null);
  const drawingMode = useViewerStore((s) => s.drawingMode);

  useEffect(() => {
    if (!enabled || !mapRef) {
      if (drawRef.current) {
        drawRef.current.stop();
        drawRef.current = null;
      }
      return;
    }

    const map = mapRef.getMap();
    if (!map) return;

    const onStyleLoad = () => {
      if (drawRef.current) {
        drawRef.current.stop();
        drawRef.current = null;
      }

      const adapter = new TerraDrawMapboxGLAdapter({
        map,
      });

      const draw = new TerraDraw({
        adapter,
        modes: [
          new TerraDrawPointMode(),
          new TerraDrawLineStringMode(),
          new TerraDrawPolygonMode(),
          new TerraDrawSelectMode(),
        ],
      });

      drawRef.current = draw;
      draw.start();
      draw.setMode(useViewerStore.getState().drawingMode);
    };

    if (map.isStyleLoaded()) {
      onStyleLoad();
    } else {
      map.once('style.load', onStyleLoad);
    }

    return () => {
      map.off('style.load', onStyleLoad);
      if (drawRef.current) {
        drawRef.current.stop();
        drawRef.current = null;
      }
    };
  }, [enabled, mapRef]);

  useEffect(() => {
    if (!enabled || !drawRef.current) return;
    drawRef.current.setMode(drawingMode);
  }, [enabled, drawingMode]);

  const setMode = useCallback(
    (mode: TerraDrawMode) => {
      useViewerStore.getState().setDrawingMode(mode);
      if (drawRef.current) drawRef.current.setMode(mode);
    },
    [],
  );

  const getSnapshot = useCallback(() => {
    return drawRef.current?.getSnapshot() ?? [];
  }, []);

  const clear = useCallback(() => {
    drawRef.current?.clear();
  }, []);

  return { setMode, getSnapshot, clear };
}
