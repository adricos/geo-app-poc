import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { MapControlsHeader } from '@/viewer/core/map-controls-header';
import { MapControlsLayersPanel } from '@/viewer/core/map-controls-layers-panel';
import {
  cycleMapControlsViewState,
  type MapControlsViewState,
} from '@/viewer/core/map-controls-view-state';
import {
  getMapStyleLayerDisplayName,
  isMapStyleLayerVisible,
  type MapStyleLayer,
} from '@/viewer/core/map-style-layer-display';
import { useMapControlsSelectAll } from '@/viewer/core/use-map-controls-select-all';
import styles from '@/viewer/core/styles/map-controls-widget.module.css';

/** Minimal map API used for style layer toggling (Mapbox GL / MapLibre). */
type MapStyleLayersMapRef = {
  getMap: () => {
    /** MapLibre types this as `boolean | void`; Mapbox is `boolean`. */
    isStyleLoaded: () => boolean | void;
    getStyle: () => { layers?: unknown[] } | null | undefined;
    /** Only visibility is used; literal key/value matches Mapbox/MapLibre layout typings. */
    setLayoutProperty: (
      layerId: string,
      prop: 'visibility',
      value: 'visible' | 'none',
    ) => unknown;
    on: (event: string, fn: () => void) => void;
    off: (event: string, fn: () => void) => void;
  };
} | null | undefined;

interface MapStyleLayersPreset {
  key: string;
  label: string;
}

export function MapStyleLayersControlsWidget({
  mapRef,
  presets,
  styleKey,
  onStyleKeyChange,
  styleSelectId,
}: {
  mapRef: MapStyleLayersMapRef;
  presets: readonly MapStyleLayersPreset[];
  styleKey: string;
  onStyleKeyChange: (key: string) => void;
  styleSelectId: string;
}) {
  const [viewState, setViewState] = useState<MapControlsViewState>('icon');
  const [layers, setLayers] = useState<MapStyleLayer[]>([]);

  const cycleViewState = useCallback(() => {
    setViewState(cycleMapControlsViewState);
  }, []);

  const refreshLayers = useCallback(() => {
    if (!mapRef) return;
    const map = mapRef.getMap();
    const style = map.getStyle();
    if (!style?.layers) return;
    setLayers(style.layers as MapStyleLayer[]);
  }, [mapRef]);

  useEffect(() => {
    if (!mapRef) return;
    const map = mapRef.getMap();
    if (map.isStyleLoaded()) refreshLayers();
    const onStyleData = () => {
      const style = map.getStyle();
      if (style?.layers != null && style.layers.length > 0) refreshLayers();
    };
    map.on('style.load', refreshLayers);
    map.on('styledata', onStyleData);
    return () => {
      map.off('style.load', refreshLayers);
      map.off('styledata', onStyleData);
    };
  }, [mapRef, refreshLayers]);

  const setLayerVisibility = useCallback(
    (layerId: string, visible: boolean) => {
      if (!mapRef) return;
      const map = mapRef.getMap();
      try {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
        setLayers((prev) =>
          prev.map((l) =>
            l.id === layerId
              ? { ...l, layout: { ...l.layout, visibility: visible ? 'visible' : 'none' } }
              : l,
          ),
        );
      } catch {
        // Layer may not support layout.visibility
      }
    },
    [mapRef],
  );

  const setAllLayersVisibility = useCallback(
    (visible: boolean) => {
      if (!mapRef) return;
      layers.forEach((layer) => setLayerVisibility(layer.id, visible));
    },
    [mapRef, layers, setLayerVisibility],
  );

  const layersVisible = layers.map((l) => isMapStyleLayerVisible(l));
  const { selectAllCheckboxRef, allVisible, noneVisible, handleSelectAllChange } =
    useMapControlsSelectAll(layersVisible, setAllLayersVisibility);

  const handleStyleChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onStyleKeyChange(e.target.value);
    },
    [onStyleKeyChange],
  );

  const showStyles = viewState === 'styles' || viewState === 'full';
  const showLayers = viewState === 'full' && layers.length > 0;

  const panelRows = layers.map((layer) => ({
    id: layer.id,
    label: getMapStyleLayerDisplayName(layer),
    checked: isMapStyleLayerVisible(layer),
  }));

  return (
    <div className={styles.widget} role="region" aria-label="Map style and layers">
      <MapControlsHeader
        viewState={viewState}
        onCycleView={cycleViewState}
        showStyles={showStyles}
        styleSelectId={styleSelectId}
        styleValue={styleKey}
        onStyleChange={handleStyleChange}
        presets={presets}
      />
      {showLayers && (
        <MapControlsLayersPanel
          layers={panelRows}
          onLayerChange={setLayerVisibility}
          selectAllCheckboxRef={selectAllCheckboxRef}
          allVisible={allVisible}
          noneVisible={noneVisible}
          onSelectAllChange={handleSelectAllChange}
        />
      )}
    </div>
  );
}
