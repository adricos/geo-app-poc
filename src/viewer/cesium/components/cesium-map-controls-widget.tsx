import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { useCesium } from 'resium';
import { useViewerStore } from '@/shared/state/viewer-store';
import {
  getCesiumImageryPresets,
  getCesiumImageryLabel,
  type CesiumImageryPresetKey,
} from '@/viewer/cesium/config/cesium-imagery-presets';
import { MapControlsHeader } from '@/viewer/core/map-controls-header';
import { MapControlsLayersPanel } from '@/viewer/core/map-controls-layers-panel';
import {
  cycleMapControlsViewState,
  type MapControlsViewState,
} from '@/viewer/core/map-controls-view-state';
import { useMapControlsSelectAll } from '@/viewer/core/use-map-controls-select-all';
import styles from '@/viewer/core/styles/map-controls-widget.module.css';

interface CesiumImageryLayerInfo {
  index: number;
  id: string;
  name: string;
  show: boolean;
}

export function CesiumMapControlsWidget() {
  const { viewer } = useCesium();
  const mapStyleKeyCesium = useViewerStore((s) => s.mapStyleKeyCesium);
  const setMapStyleKeyCesium = useViewerStore((s) => s.setMapStyleKeyCesium);
  const cesiumPresets = getCesiumImageryPresets();
  const effectiveStyleKey = cesiumPresets.some((p) => p.key === mapStyleKeyCesium)
    ? mapStyleKeyCesium
    : (cesiumPresets[0]?.key ?? 'default');
  const [viewState, setViewState] = useState<MapControlsViewState>('icon');
  const [layers, setLayers] = useState<CesiumImageryLayerInfo[]>([]);

  const cycleViewState = useCallback(() => {
    setViewState(cycleMapControlsViewState);
  }, []);

  const refreshLayers = useCallback(() => {
    if (!viewer) return;
    const collection = viewer.imageryLayers;
    const list: CesiumImageryLayerInfo[] = [];
    for (let i = 0; i < collection.length; i++) {
      const layer = collection.get(i);
      const name = i === 0 ? getCesiumImageryLabel(effectiveStyleKey) : `Layer ${i}`;
      list.push({
        index: i,
        id: `cesium-imagery-${i}`,
        name,
        show: layer.show,
      });
    }
    setLayers(list);
  }, [viewer, effectiveStyleKey]);

  useEffect(() => {
    if (!viewer) return;
    refreshLayers();
    const removeListener = viewer.imageryLayers.layerAdded.addEventListener(() => refreshLayers());
    const removeUpdated = viewer.imageryLayers.layerRemoved.addEventListener(() => refreshLayers());
    return () => {
      removeListener();
      removeUpdated();
    };
  }, [viewer, refreshLayers]);

  const setLayerVisibility = useCallback(
    (index: number, visible: boolean) => {
      if (!viewer) return;
      const layer = viewer.imageryLayers.get(index);
      if (layer) layer.show = visible;
      setLayers((prev) => prev.map((l) => (l.index === index ? { ...l, show: visible } : l)));
    },
    [viewer],
  );

  const setAllLayersVisibility = useCallback(
    (visible: boolean) => {
      if (!viewer) return;
      layers.forEach((l) => setLayerVisibility(l.index, visible));
    },
    [viewer, layers, setLayerVisibility],
  );

  const layersVisible = layers.map((l) => l.show);
  const { selectAllCheckboxRef, allVisible, noneVisible, handleSelectAllChange } =
    useMapControlsSelectAll(layersVisible, setAllLayersVisibility);

  const handleStyleChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setMapStyleKeyCesium(e.target.value as CesiumImageryPresetKey);
    },
    [setMapStyleKeyCesium],
  );

  const showStyles = viewState === 'styles' || viewState === 'full';
  const showLayers = viewState === 'full' && layers.length > 0;

  const panelRows = layers.map((l) => ({
    id: String(l.index),
    label: l.name,
    checked: l.show,
  }));

  if (!viewer) return null;

  return (
    <div className={styles.widget} role='region' aria-label='Map style and layers'>
      <MapControlsHeader
        viewState={viewState}
        onCycleView={cycleViewState}
        showStyles={showStyles}
        styleSelectId='cesium-map-controls-style-select'
        styleValue={effectiveStyleKey}
        onStyleChange={handleStyleChange}
        presets={cesiumPresets}
      />
      {showLayers && (
        <MapControlsLayersPanel
          layers={panelRows}
          onLayerChange={(id, checked) => setLayerVisibility(Number(id), checked)}
          selectAllCheckboxRef={selectAllCheckboxRef}
          allVisible={allVisible}
          noneVisible={noneVisible}
          onSelectAllChange={handleSelectAllChange}
        />
      )}
    </div>
  );
}
