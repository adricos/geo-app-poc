import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { useViewerStore } from '@/shared/state/viewer-store';
import {
  MAP_STYLE_PRESETS,
  type MapStylePresetKey,
} from '@/shared/config/map-style-presets';
import styles from '@/viewer/core/styles/map-controls-widget.module.css';

type ViewState = 'icon' | 'styles' | 'full';

interface MapStyleLayer {
  id: string;
  type: string;
  layout?: { visibility?: 'visible' | 'none' };
  metadata?: Record<string, unknown>;
}

const FRIENDLY_NAME_KEYS = ['mapbox:name', 'maplibre:name', 'name'];

/** OpenMapTiles / OSM-based layer id → display name (used when style has no metadata). */
const OPENMAPTILES_LAYER_NAMES: Record<string, string> = {
  aerodrome_label: 'Aerodrome labels',
  aeroway: 'Aeroways',
  boundary: 'Boundaries',
  building: 'Buildings',
  housenumber: 'Housenumbers',
  landcover: 'Land cover',
  landuse: 'Land use',
  mountain_peak: 'Mountain peaks',
  park: 'Parks',
  place: 'Places',
  poi: 'Points of interest',
  transportation: 'Transportation',
  transportation_name: 'Road labels',
  water: 'Water',
  water_name: 'Water names',
  waterway: 'Waterways',
  background: 'Background',
};

function humanizeLayerId(id: string): string {
  return id
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getLayerDisplayName(layer: MapStyleLayer): string {
  const meta = layer.metadata;
  if (meta && typeof meta === 'object') {
    for (const key of FRIENDLY_NAME_KEYS) {
      const value = meta[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  const known = OPENMAPTILES_LAYER_NAMES[layer.id];
  if (known) return known;
  return humanizeLayerId(layer.id);
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

function ChevronIcon({
  direction,
  className,
}: {
  direction: 'right' | 'down' | 'up';
  className: string;
}) {
  return (
    <span className={className} data-direction={direction}>
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
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </span>
  );
}

export function MapControlsWidget() {
  const { current: mapRef } = useMap();
  const mapStyleKey = useViewerStore((s) => s.mapStyleKey);
  const setMapStyleKey = useViewerStore((s) => s.setMapStyleKey);
  const [viewState, setViewState] = useState<ViewState>('icon');
  const [layers, setLayers] = useState<MapStyleLayer[]>([]);

  const cycleViewState = useCallback(() => {
    setViewState((prev) => {
      if (prev === 'icon') return 'styles';
      if (prev === 'styles') return 'full';
      return 'icon';
    });
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
      if (map.getStyle().layers?.length) refreshLayers();
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

  const isLayerVisible = useCallback((layer: MapStyleLayer) => {
    const v = layer.layout?.visibility;
    return v === undefined || v === 'visible';
  }, []);

  const setAllLayersVisibility = useCallback(
    (visible: boolean) => {
      if (!mapRef) return;
      layers.forEach((layer) => setLayerVisibility(layer.id, visible));
    },
    [mapRef, layers, setLayerVisibility],
  );

  const visibleCount = layers.filter((l) => isLayerVisible(l)).length;
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
      setMapStyleKey(e.target.value as MapStylePresetKey);
    },
    [setMapStyleKey],
  );

  const handleLayerVisibilityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const id = e.currentTarget.dataset.layerId;
      if (id != null) setLayerVisibility(id, e.target.checked);
    },
    [setLayerVisibility],
  );

  const showStyles = viewState === 'styles' || viewState === 'full';
  const showLayers = viewState === 'full' && layers.length > 0;
  const chevronDirection: 'right' | 'down' | 'up' =
    viewState === 'icon' ? 'right' : viewState === 'styles' ? 'down' : 'up';

  return (
    <div
      className={styles.widget}
      role="region"
      aria-label="Map style and layers"
    >
      <div className={styles.header}>
        <button
          type="button"
          className={styles.iconBtn}
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
          <ChevronIcon direction={chevronDirection} className={styles.chevron} />
        </button>
        {showStyles && (
          <div className={styles.styles}>
            <select
              id="map-controls-style-select"
              value={mapStyleKey}
              onChange={handleStyleChange}
              className={styles.select}
              title="Style"
              aria-label="Map style"
            >
              {MAP_STYLE_PRESETS.map((preset) => (
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
          className={layers.length <= 1 ? `${styles.layers} ${styles.layersSingle}` : styles.layers}
          title="Layers"
          aria-label="Layers"
        >
          {layers.length > 1 && (
            <div className={styles.layersHeader}>
              <label className={styles.selectAll}>
                <input
                  ref={selectAllCheckboxRef}
                  type="checkbox"
                  checked={allVisible}
                  onChange={handleSelectAllChange}
                  className={styles.checkbox}
                  title={
                    allVisible
                      ? 'Hide all layers'
                      : noneVisible
                        ? 'Show all layers'
                        : 'Show all layers'
                  }
                  aria-label={
                    allVisible
                      ? 'All layers visible; click to hide all'
                      : noneVisible
                        ? 'No layers visible; click to show all'
                        : 'Some layers visible; click to show all'
                  }
                />
                <span className={styles.selectAllText}>
                  {allVisible ? 'All' : noneVisible ? 'None' : 'Some'}
                </span>
              </label>
            </div>
          )}
          <div className={styles.listScroll}>
            <ul className={styles.list}>
              {layers.map((layer) => (
                <li key={layer.id} className={styles.item}>
                  <label className={styles.label}>
                    <input
                      type="checkbox"
                      checked={isLayerVisible(layer)}
                      data-layer-id={layer.id}
                      onChange={handleLayerVisibilityChange}
                      className={styles.checkbox}
                    />
                    <span className={styles.name}>{getLayerDisplayName(layer)}</span>
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
