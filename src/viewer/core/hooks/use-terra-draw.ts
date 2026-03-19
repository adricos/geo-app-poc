import { useEffect, useRef, useCallback } from 'react';
import {
  TerraDraw,
  TerraDrawPointMode,
  TerraDrawLineStringMode,
  TerraDrawPolygonMode,
  TerraDrawSelectMode,
} from 'terra-draw';
import { useViewerStore } from '@/shared/state/viewer-store';

type TerraDrawMode = 'point' | 'linestring' | 'polygon';

/** Adapter type that TerraDraw accepts (from constructor options). */
type TerraDrawAdapterType = ConstructorParameters<typeof TerraDraw>[0]['adapter'];

/**
 * Map interface required for Terra Draw init: style load lifecycle.
 * MapLibre and Mapbox map instances both satisfy this.
 * isStyleLoaded may return boolean | void (e.g. react-map-gl MapRef).
 */
export interface TerraDrawStyleLoadableMap {
  isStyleLoaded(): boolean | void;
  once(event: 'style.load', fn: () => void): void;
  off(event: 'style.load', fn: () => void): void;
}

/**
 * Ref-like object that exposes the underlying map (MapLibre or Mapbox).
 */
interface TerraDrawMapRef {
  getMap(): TerraDrawStyleLoadableMap | null;
}

type CreateTerraDrawAdapter = (map: TerraDrawStyleLoadableMap) => TerraDrawAdapterType;

/**
 * Shared Terra Draw integration. Must be called after the map has loaded;
 * initialization runs on map 'style.load' to avoid missing source errors.
 * When enabled is false, the hook does nothing. When toggled off, draw.stop() is called.
 *
 * Use from viewer-specific hooks (e.g. MapLibre/Mapbox) by passing the correct adapter factory.
 */
export function useTerraDraw(
  mapRef: TerraDrawMapRef | null,
  enabled: boolean,
  createAdapter: CreateTerraDrawAdapter,
) {
  const drawRef = useRef<TerraDraw | null>(null);
  const drawingMode = useViewerStore((s) => s.drawingMode);
  const setDrawingMode = useViewerStore((s) => s.setDrawingMode);

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

      const adapter = createAdapter(map);
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
  }, [enabled, mapRef, createAdapter]);

  useEffect(() => {
    if (!enabled || !drawRef.current) return;
    drawRef.current.setMode(drawingMode);
  }, [enabled, drawingMode]);

  const setMode = useCallback(
    (mode: TerraDrawMode) => {
      setDrawingMode(mode);
      if (drawRef.current) drawRef.current.setMode(mode);
    },
    [setDrawingMode],
  );

  const getSnapshot = useCallback(() => {
    return drawRef.current?.getSnapshot() ?? [];
  }, []);

  const clear = useCallback(() => {
    drawRef.current?.clear();
  }, []);

  return { setMode, getSnapshot, clear };
}
