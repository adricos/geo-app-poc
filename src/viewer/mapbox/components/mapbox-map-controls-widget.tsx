import { useMap } from 'react-map-gl/mapbox';
import { useViewerStore } from '@/shared/state/viewer-store';
import {
  MAPBOX_STYLE_PRESETS,
  type MapboxStylePresetKey,
} from '@/viewer/mapbox/config/mapbox-style-presets';
import { MapStyleLayersControlsWidget } from '@/viewer/core/map-style-layers-controls-widget';

export function MapboxMapControlsWidget() {
  const { current: mapRef } = useMap();
  const mapStyleKeyMapbox = useViewerStore((s) => s.mapStyleKeyMapbox);
  const setMapStyleKeyMapbox = useViewerStore((s) => s.setMapStyleKeyMapbox);

  return (
    <MapStyleLayersControlsWidget
      mapRef={mapRef}
      presets={MAPBOX_STYLE_PRESETS}
      styleKey={mapStyleKeyMapbox}
      onStyleKeyChange={(key) => setMapStyleKeyMapbox(key as MapboxStylePresetKey)}
      styleSelectId='mapbox-map-controls-style-select'
    />
  );
}
