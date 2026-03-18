import type { ReactNode } from 'react';
import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import Map, { NavigationControl, type ViewState, type ViewStateChangeEvent } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import type { MapPointerMoveHandler } from '@/viewer/core/context/map-overlay-context';
import { env } from '@/shared/config/env';
import { getMapStyleUrl } from '@/shared/config/map-style-presets';
import { useViewerStore } from '@/shared/state/viewer-store';
import { MapOverlayProvider } from '@/viewer/core/context/map-overlay-context';
import type { Bounds } from '@/viewer/core/types/geo.types';
import { useTerraDraw } from '@/viewer/maplibre/hooks/use-terra-draw';
import { useMapLibreViewerAdapter } from '@/viewer/maplibre/hooks/use-map-libre-viewer-adapter';
import { MapControlsWidget } from '@/viewer/maplibre/components/map-controls-widget';

const INITIAL_VIEW_STATE: ViewState = {
  longitude: -58.3816,
  latitude: -34.6037,
  zoom: 10,
  bearing: 0,
  pitch: 0,
  padding: { top: 0, bottom: 0, left: 0, right: 0 },
};

interface MapLibreViewerProps {
  children?: ReactNode;
}

export function MapLibreViewer({ children }: MapLibreViewerProps) {
  const [mapRef, setMapRef] = useState<MapRef | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [overlaySize, setOverlaySize] = useState({ width: 800, height: 600 });
  const setCamera = useViewerStore((s) => s.setCamera);
  const setSelectedFeature = useViewerStore((s) => s.setSelectedFeature);
  const mapStyleKey = useViewerStore((s) => s.mapStyleKey);
  const camera = useViewerStore((s) => s.camera);
  const drawingEnabled = useViewerStore((s) => s.drawingEnabled);
  useTerraDraw(mapRef, drawingEnabled);
  useMapLibreViewerAdapter(mapRef);

  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;
    const updateSize = () => setOverlaySize({ width: el.offsetWidth, height: el.offsetHeight });
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);


  const mapStyle = useMemo(
    () => env.mapStyleUrl ?? getMapStyleUrl(mapStyleKey),
    [mapStyleKey],
  );

  const handleViewStateChange = useCallback(
    (event: ViewStateChangeEvent) => {
      const v = event.viewState;
      setCamera({
        lng: v.longitude,
        lat: v.latitude,
        zoom: v.zoom,
        bearing: v.bearing ?? 0,
        pitch: v.pitch ?? 0,
      });
    },
    [setCamera],
  );

  const handleMoveEnd = useCallback(
    (event: ViewStateChangeEvent) => handleViewStateChange(event),
    [handleViewStateChange],
  );

  const handleClick = useCallback(
    (e: { point: { x: number; y: number }; lngLat?: { lng: number; lat: number } }) => {
      const map = mapRef?.getMap();
      if (!map) return;
      const point: [number, number] = [e.point.x, e.point.y];
      const lngLat = e.lngLat ?? map.unproject(point);
      const lat = lngLat.lat;
      const lng = lngLat.lng;
      const features = map.queryRenderedFeatures(point);
      const f = features[0];
      const positionProps: Record<string, unknown> = {
        latitude: lat,
        longitude: lng,
      };
      if (typeof map.queryTerrainElevation === 'function') {
        const height = map.queryTerrainElevation([lng, lat]);
        if (height != null && Number.isFinite(height)) positionProps.height = height;
      }
      if (f) {
        setSelectedFeature({
          id: String(f.id ?? (f.properties && (f.properties as Record<string, unknown>).id) ?? ''),
          source: f.source ?? '',
          sourceLayer: f.sourceLayer ?? undefined,
          layer: typeof f.layer === 'object' && f.layer && 'id' in f.layer ? String((f.layer as { id: string }).id) : undefined,
          properties: { ...positionProps, ...((f.properties as Record<string, unknown>) ?? {}) },
        });
      } else {
        setSelectedFeature({
          id: 'click',
          source: 'map',
          layer: 'Click',
          properties: positionProps,
        });
      }
    },
    [mapRef, setSelectedFeature],
  );

  const overlayViewState = useMemo(() => {
    const c = camera;
    if (c)
      return {
        longitude: c.lng,
        latitude: c.lat,
        zoom: c.zoom,
        bearing: c.bearing ?? 0,
        pitch: c.pitch ?? 0,
      };
    return {
      longitude: INITIAL_VIEW_STATE.longitude,
      latitude: INITIAL_VIEW_STATE.latitude,
      zoom: INITIAL_VIEW_STATE.zoom,
      bearing: INITIAL_VIEW_STATE.bearing ?? 0,
      pitch: INITIAL_VIEW_STATE.pitch ?? 0,
    };
  }, [camera]);

  const requestFitBounds = useCallback(
    (bounds: Bounds, options?: { padding?: number; maxZoom?: number }) => {
      const map = mapRef?.getMap();
      if (!map) return;
      map.fitBounds(
        [
          [bounds[0], bounds[1]],
          [bounds[2], bounds[3]],
        ],
        { padding: options?.padding ?? 48, maxZoom: options?.maxZoom },
      );
    },
    [mapRef],
  );

  const pointerMoveHandlerRef = useRef<MapPointerMoveHandler>(null);
  const setMapPointerMoveHandler = useCallback((handler: MapPointerMoveHandler) => {
    pointerMoveHandlerRef.current = handler;
  }, []);
  const handleMapPointerMove = useCallback((e: { point: { x: number; y: number } }) => {
    pointerMoveHandlerRef.current?.(e.point.x, e.point.y);
  }, []);

  const overlayContextValue = useMemo(
    () => ({
      viewState: overlayViewState,
      width: overlaySize.width,
      height: overlaySize.height,
      requestFitBounds,
      setMapPointerMoveHandler,
    }),
    [overlayViewState, overlaySize.width, overlaySize.height, requestFitBounds, setMapPointerMoveHandler],
  );

  return (
    <div
      ref={mapContainerRef}
      className="map-root"
      role="application"
      aria-label="Map"
    >
      <Map
        ref={(instance) => setMapRef(instance)}
        mapLib={import('maplibre-gl')}
        mapStyle={mapStyle}
        reuseMaps={false}
        initialViewState={INITIAL_VIEW_STATE}
        onMoveEnd={handleMoveEnd}
        onMove={handleViewStateChange}
        onMouseMove={handleMapPointerMove}
        onClick={handleClick}
      >
        <NavigationControl position="top-right" />
        <MapControlsWidget />
      </Map>
      {children != null && (
        <div className="map-overlay" aria-hidden>
          <MapOverlayProvider value={overlayContextValue}>
            {children}
          </MapOverlayProvider>
        </div>
      )}
    </div>
  );
}
