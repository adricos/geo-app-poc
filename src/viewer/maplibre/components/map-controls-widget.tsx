import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { useViewerStore } from '@/shared/state/viewer-store';
import {
  MAP_STYLE_PRESETS,
  type MapStylePresetKey,
} from '@/shared/config/map-style-presets';

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

  const showStyles = viewState === 'styles' || viewState === 'full';
  const showLayers = viewState === 'full' && layers.length > 0;
  const chevronDirection: 'right' | 'down' | 'up' =
    viewState === 'icon' ? 'right' : viewState === 'styles' ? 'down' : 'up';

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
              id="map-controls-style-select"
              value={mapStyleKey}
              onChange={handleStyleChange}
              className="map-controls-widget__select"
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
                      checked={isLayerVisible(layer)}
                      onChange={(e) => setLayerVisibility(layer.id, e.target.checked)}
                      className="map-controls-widget__checkbox"
                    />
                    <span className="map-controls-widget__name">{getLayerDisplayName(layer)}</span>
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
