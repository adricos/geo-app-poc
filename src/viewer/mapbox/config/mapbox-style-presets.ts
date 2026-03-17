/**
 * Mapbox-only style presets (Mapbox Styles API URLs).
 * Require VITE_MAPBOX_ACCESS_TOKEN to be set.
 */
export type MapboxStylePresetKey =
  | 'default'
  | 'streets'
  | 'satellite'
  | 'satellite-streets'
  | 'outdoors'
  | 'light'
  | 'dark';

interface MapboxStylePreset {
  key: MapboxStylePresetKey;
  label: string;
  styleUrl: string;
}

export const MAPBOX_STYLE_PRESETS: MapboxStylePreset[] = [
  { key: 'default', label: 'Default', styleUrl: 'mapbox://styles/mapbox/streets-v12' },
  { key: 'streets', label: 'Streets', styleUrl: 'mapbox://styles/mapbox/streets-v12' },
  { key: 'satellite', label: 'Satellite', styleUrl: 'mapbox://styles/mapbox/satellite-v9' },
  { key: 'satellite-streets', label: 'Satellite streets', styleUrl: 'mapbox://styles/mapbox/satellite-streets-v12' },
  { key: 'outdoors', label: 'Outdoors', styleUrl: 'mapbox://styles/mapbox/outdoors-v12' },
  { key: 'light', label: 'Light', styleUrl: 'mapbox://styles/mapbox/light-v11' },
  { key: 'dark', label: 'Dark', styleUrl: 'mapbox://styles/mapbox/dark-v11' },
];

export function getMapboxStyleUrl(presetKey: MapboxStylePresetKey): string {
  const preset = MAPBOX_STYLE_PRESETS.find((p) => p.key === presetKey);
  return preset?.styleUrl ?? MAPBOX_STYLE_PRESETS[0].styleUrl;
}
