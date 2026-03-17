import type { ReactNode } from 'react';
import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import Map, { NavigationControl, type ViewState, type ViewStateChangeEvent } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import { env } from '@/shared/config/env';
import { useViewerStore } from '@/shared/state/viewer-store';
import { useViewerRegistry } from '@/viewer/core/context/use-viewer-registry';
import { MapOverlayProvider } from '@/viewer/core/context/map-overlay-context';
import type { Bounds } from '@/viewer/core/types/geo.types';
import { useMapboxViewerAdapter } from '@/viewer/mapbox/hooks/use-mapbox-viewer-adapter';
import { useTerraDraw } from '@/viewer/mapbox/hooks/use-terra-draw';
import { getMapboxStyleUrl } from '@/viewer/mapbox/config/mapbox-style-presets';
import { MapboxMapControlsWidget } from '@/viewer/mapbox/components/mapbox-map-controls-widget';

const INITIAL_VIEW_STATE: ViewState = {
  longitude: -58.3816,
  latitude: -34.6037,
  zoom: 10,
  bearing: 0,
  pitch: 0,
  padding: { top: 0, bottom: 0, left: 0, right: 0 },
};

interface MapboxViewerProps {
  children?: ReactNode;
}

export function MapboxViewer({ children }: MapboxViewerProps) {
  const [mapRef, setMapRef] = useState<MapRef | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [overlaySize, setOverlaySize] = useState({ width: 800, height: 600 });
  const setCamera = useViewerStore((s) => s.setCamera);
  const setSelectedFeature = useViewerStore((s) => s.setSelectedFeature);
  const mapStyleKeyMapbox = useViewerStore((s) => s.mapStyleKeyMapbox);
  const camera = useViewerStore((s) => s.camera);
  const drawingEnabled = useViewerStore((s) => s.drawingEnabled);
  const registry = useViewerRegistry();

  useTerraDraw(mapRef, drawingEnabled);

  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;
    const updateSize = () => setOverlaySize({ width: el.offsetWidth, height: el.offsetHeight });
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useMapboxViewerAdapter(mapRef);

  useEffect(() => {
    registry.registerLayer({
      id: 'base',
      type: 'raster',
      sourceId: 'default',
      visible: true,
    });
  }, [registry]);

  const mapStyle = useMemo(
    () => getMapboxStyleUrl(mapStyleKeyMapbox),
    [mapStyleKeyMapbox],
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

  const overlayContextValue = useMemo(
    () => ({
      viewState: overlayViewState,
      width: overlaySize.width,
      height: overlaySize.height,
      requestFitBounds,
    }),
    [overlayViewState, overlaySize.width, overlaySize.height, requestFitBounds],
  );

  if (!env.mapboxAccessToken) {
    return (
      <div className="map-root" role="application" aria-label="Map">
        <div className="map-token-message">
          <p>Mapbox viewer requires a Mapbox access token.</p>
          <p>Set <code>VITE_MAPBOX_ACCESS_TOKEN</code> in your <code>.env</code> or <code>.env.local</code>.</p>
          <p><a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noreferrer">Get a token at mapbox.com</a></p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className="map-root"
      role="application"
      aria-label="Map"
    >
      <Map
        ref={(instance) => setMapRef(instance)}
        mapboxAccessToken={env.mapboxAccessToken}
        mapLib={import('mapbox-gl')}
        mapStyle={mapStyle}
        reuseMaps
        initialViewState={INITIAL_VIEW_STATE}
        onMoveEnd={handleMoveEnd}
        onMove={handleViewStateChange}
        onClick={handleClick}
      >
        <NavigationControl position="top-right" />
        <MapboxMapControlsWidget />
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
