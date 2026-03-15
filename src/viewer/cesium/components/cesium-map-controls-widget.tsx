import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useCesium } from 'resium';
import { useViewerStore } from '@/shared/state/viewer-store';
import {
  getCesiumImageryPresets,
  getCesiumImageryLabel,
  type CesiumImageryPresetKey,
} from '@/viewer/cesium/config/cesium-imagery-presets';

type ViewState = 'icon' | 'styles' | 'full';

interface CesiumImageryLayerInfo {
  index: number;
  id: string;
  name: string;
  show: boolean;
}

function LayersIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: 'right' | 'down' | 'up' }) {
  const rotate = direction === 'right' ? 0 : direction === 'down' ? 90 : -90;
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function CesiumMapControlsWidget() {
  const { viewer } = useCesium();
  const mapStyleKeyCesium = useViewerStore((s) => s.mapStyleKeyCesium);
  const setMapStyleKeyCesium = useViewerStore((s) => s.setMapStyleKeyCesium);
  const cesiumPresets = getCesiumImageryPresets();
  const effectiveStyleKey = cesiumPresets.some((p) => p.key === mapStyleKeyCesium)
    ? mapStyleKeyCesium
    : cesiumPresets[0]?.key ?? 'default';
  const [viewState, setViewState] = useState<ViewState>('icon');
  const [layers, setLayers] = useState<CesiumImageryLayerInfo[]>([]);

  const cycleViewState = useCallback(() => {
    setViewState((prev) => {
      if (prev === 'icon') return 'styles';
      if (prev === 'styles') return 'full';
      return 'icon';
    });
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
  }, [viewer, mapStyleKeyCesium, effectiveStyleKey]);

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

  const visibleCount = layers.filter((l) => l.show).length;
  const allVisible = layers.length > 0 && visibleCount === layers.length;
  const noneVisible = visibleCount === 0;
  const someVisible = !allVisible && !noneVisible;

  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    const el = selectAllCheckboxRef.current;
    if (el) el.indeterminate = someVisible;
  }, [someVisible]);

  const handleSelectAllChange = useCallback(() => {
    setAllLayersVisibility(allVisible ? false : true);
  }, [allVisible, setAllLayersVisibility]);

  const handleStyleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setMapStyleKeyCesium(e.target.value as CesiumImageryPresetKey);
    },
    [setMapStyleKeyCesium],
  );

  const showStyles = viewState === 'styles' || viewState === 'full';
  const showLayers = viewState === 'full' && layers.length > 0;
  const chevronDirection: 'right' | 'down' | 'up' =
    viewState === 'icon' ? 'right' : viewState === 'styles' ? 'down' : 'up';

  if (!viewer) return null;

  return (
    <div
      className="map-controls-widget"
      role="region"
      aria-label="Map style and layers"
    >
      <div className="map-controls-widget__header">
        <button
          type="button"
          className={`map-controls-widget__icon-btn map-controls-widget__icon-btn--${viewState}`}
          onClick={cycleViewState}
          data-state={viewState}
          title={
            viewState === 'icon'
              ? 'Show map style and layers'
              : viewState === 'styles'
                ? 'Show layers list'
                : 'Collapse'
          }
          aria-expanded={viewState !== 'icon'}
          aria-label={
            viewState === 'icon'
              ? 'Expand to choose map style'
              : viewState === 'styles'
                ? 'Show layers'
                : 'Collapse to icon'
          }
        >
          <LayersIcon size={14} />
          <span className="map-controls-widget__chevron">
            <ChevronIcon direction={chevronDirection} />
          </span>
        </button>
        {showStyles && (
          <div className="map-controls-widget__styles">
            <select
              id="cesium-map-controls-style-select"
              value={effectiveStyleKey}
              onChange={handleStyleChange}
              className="map-controls-widget__select"
              title="Style"
              aria-label="Map style"
            >
              {cesiumPresets.map((preset) => (
                <option key={preset.key} value={preset.key}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {showLayers && (
        <div
          className={`map-controls-widget__layers ${layers.length <= 1 ? 'map-controls-widget__layers--single' : ''}`}
          title="Layers"
          aria-label="Layers"
        >
          {layers.length > 1 && (
            <div className="map-controls-widget__layers-header">
              <label className="map-controls-widget__select-all">
                <input
                  ref={selectAllCheckboxRef}
                  type="checkbox"
                  checked={allVisible}
                  onChange={handleSelectAllChange}
                  className="map-controls-widget__checkbox"
                  title={
                    allVisible ? 'Hide all layers' : noneVisible ? 'Show all layers' : 'Show all layers'
                  }
                  aria-label={
                    allVisible
                      ? 'All layers visible; click to hide all'
                      : noneVisible
                        ? 'No layers visible; click to show all'
                        : 'Some layers visible; click to show all'
                  }
                />
                <span className="map-controls-widget__select-all-text">
                  {allVisible ? 'All' : noneVisible ? 'None' : 'Some'}
                </span>
              </label>
            </div>
          )}
          <div className="map-controls-widget__list-scroll">
            <ul className="map-controls-widget__list">
              {layers.map((layer) => (
                <li key={layer.id} className="map-controls-widget__item">
                  <label className="map-controls-widget__label">
                    <input
                      type="checkbox"
                      checked={layer.show}
                      onChange={(e) => setLayerVisibility(layer.index, e.target.checked)}
                      className="map-controls-widget__checkbox"
                    />
                    <span className="map-controls-widget__name">{layer.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

