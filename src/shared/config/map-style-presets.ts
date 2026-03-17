export type MapStylePresetKey = 'default' | 'streets' | 'satellite' | 'terrain' | 'dark';

interface MapStylePreset {
  key: MapStylePresetKey;
  label: string;
  styleUrl: string;
}

const baseUrl = typeof import.meta.env?.BASE_URL === 'string' ? import.meta.env.BASE_URL : '/';

/**
 * MapLibre-only preset map styles (style JSON URLs).
 * Cesium uses its own presets; see viewer/cesium/config/cesium-imagery-presets.ts.
 * All use free, no-API-key sources:
 * - Default: MapLibre demotiles
 * - Streets / Terrain / Dark: OpenFreeMap (bright, fiord, dark)
 * - Satellite: local style with ESRI World Imagery
 */
export const MAP_STYLE_PRESETS: MapStylePreset[] = [
  { key: 'default', label: 'Default', styleUrl: 'https://demotiles.maplibre.org/style.json' },
  { key: 'streets', label: 'Streets', styleUrl: 'https://tiles.openfreemap.org/styles/bright' },
  { key: 'satellite', label: 'Satellite', styleUrl: `${baseUrl}styles/satellite.json` },
  { key: 'terrain', label: 'Terrain', styleUrl: 'https://tiles.openfreemap.org/styles/fiord' },
  { key: 'dark', label: 'Dark', styleUrl: 'https://tiles.openfreemap.org/styles/dark' },
];

export function getMapStyleUrl(presetKey: MapStylePresetKey): string {
  const preset = MAP_STYLE_PRESETS.find((p) => p.key === presetKey);
  return preset?.styleUrl ?? MAP_STYLE_PRESETS[0].styleUrl;
}
