import { useMemo, useCallback, useState, useEffect } from 'react';
import Map, { NavigationControl, type ViewState, type ViewStateChangeEvent } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import { env } from '@/shared/config/env';
import { getMapStyleUrl } from '@/shared/config/map-style-presets';
import { useViewerStore } from '@/shared/state/viewer-store';
import { useViewerRegistry } from '@/viewer/core/context/use-viewer-registry';
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

export function MapLibreViewer() {
  const [mapRef, setMapRef] = useState<MapRef | null>(null);
  const setCamera = useViewerStore((s) => s.setCamera);
  const setSelectedFeature = useViewerStore((s) => s.setSelectedFeature);
  const mapStyleKey = useViewerStore((s) => s.mapStyleKey);
  const registry = useViewerRegistry();

  useMapLibreViewerAdapter(mapRef);

  useEffect(() => {
    registry.registerLayer({
      id: 'base',
      type: 'raster',
      sourceId: 'default',
      visible: true,
    });
  }, [registry]);

  const mapStyle = useMemo(
    () => env.mapStyleUrl ?? getMapStyleUrl(mapStyleKey),
    [mapStyleKey],
  );

  const handleMoveEnd = useCallback(
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

  const handleClick = useCallback(
    (e: { point: { x: number; y: number }; lngLat?: { lng: number; lat: number } }) => {
      const map = mapRef?.getMap();
      if (!map) return;
      const lngLat = e.lngLat ?? map.unproject(e.point);
      const lat = lngLat.lat;
      const lng = lngLat.lng;
      const features = map.queryRenderedFeatures(e.point);
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
          source: f.source,
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

  return (
    <div className="map-root" role="application" aria-label="Map">
      <Map
        ref={(instance) => setMapRef(instance)}
        mapLib={import('maplibre-gl')}
        mapStyle={mapStyle}
        reuseMaps
        initialViewState={INITIAL_VIEW_STATE}
        onMoveEnd={handleMoveEnd}
        onClick={handleClick}
      >
        <NavigationControl position="top-right" />
        <MapControlsWidget />
      </Map>
    </div>
  );
}
