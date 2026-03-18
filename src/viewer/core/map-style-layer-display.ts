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

export interface MapStyleLayer {
  id: string;
  type: string;
  layout?: { visibility?: 'visible' | 'none' };
  metadata?: Record<string, unknown>;
}

function humanizeLayerId(id: string): string {
  return id.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getMapStyleLayerDisplayName(layer: MapStyleLayer): string {
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

export function isMapStyleLayerVisible(layer: MapStyleLayer): boolean {
  const v = layer.layout?.visibility;
  return v === undefined || v === 'visible';
}
