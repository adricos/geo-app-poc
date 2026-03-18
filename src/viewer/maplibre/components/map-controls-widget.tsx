import { useMap } from 'react-map-gl/maplibre';
import { MAP_STYLE_PRESETS, type MapStylePresetKey } from '@/shared/config/map-style-presets';
import { useViewerStore } from '@/shared/state/viewer-store';
import { MapStyleLayersControlsWidget } from '@/viewer/core/map-style-layers-controls-widget';

export function MapControlsWidget() {
  const { current: mapRef } = useMap();
  const mapStyleKey = useViewerStore((s) => s.mapStyleKey);
  const setMapStyleKey = useViewerStore((s) => s.setMapStyleKey);

  return (
    <MapStyleLayersControlsWidget
      mapRef={mapRef}
      presets={MAP_STYLE_PRESETS}
      styleKey={mapStyleKey}
      onStyleKeyChange={(key) => setMapStyleKey(key as MapStylePresetKey)}
      styleSelectId="map-controls-style-select"
    />
  );
}
