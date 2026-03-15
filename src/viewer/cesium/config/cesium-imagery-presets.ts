import type { ImageryProvider } from 'cesium';
import * as Cesium from 'cesium';
import { env } from '@/shared/config/env';

/** Cesium-only preset keys. Kept separate from MapLibre so each viewer can have its own list and state. */
export type CesiumImageryPresetKey =
  | 'default'
  | 'streets'
  | 'satellite'
  | 'terrain'
  | 'dark'
  | 'ion-world-imagery';

export interface CesiumImageryPreset {
  key: CesiumImageryPresetKey;
  label: string;
  /** Requires VITE_CESIUM_ION_ACCESS_TOKEN to be set. */
  requiresIon?: boolean;
}

const BASE_PRESETS: CesiumImageryPreset[] = [
  { key: 'default', label: 'Default' },
  { key: 'streets', label: 'Streets' },
  { key: 'satellite', label: 'Satellite' },
  { key: 'terrain', label: 'Terrain' },
  { key: 'dark', label: 'Dark' },
  { key: 'ion-world-imagery', label: 'Cesium World Imagery', requiresIon: true },
];

/** Presets available in the Cesium style dropdown. Excludes Ion-only presets when no token is set. */
export function getCesiumImageryPresets(): CesiumImageryPreset[] {
  const hasToken = Boolean(env.cesiumIonAccessToken);
  return BASE_PRESETS.filter((p) => !p.requiresIon || hasToken);
}

function createOsmProvider(): ImageryProvider {
  return new Cesium.OpenStreetMapImageryProvider({
    url: 'https://a.tile.openstreetmap.org/',
  });
}

/** Create a Cesium imagery provider for the given preset key. Uses default (OSM) if Ion key is chosen but no token is set. */
export function createCesiumImageryProvider(key: CesiumImageryPresetKey): ImageryProvider {
  if (key === 'ion-world-imagery' && !env.cesiumIonAccessToken) {
    return createOsmProvider();
  }
  switch (key) {
    case 'satellite':
      return new Cesium.UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        credit: 'Esri',
      });
    case 'ion-world-imagery':
      return new Cesium.IonImageryProvider({ assetId: 2 });
    case 'default':
    case 'streets':
    case 'dark':
    case 'terrain':
    default:
      return createOsmProvider();
  }
}

/** Get display label for a Cesium preset key. */
export function getCesiumImageryLabel(key: CesiumImageryPresetKey): string {
  const preset = BASE_PRESETS.find((p) => p.key === key);
  return preset?.label ?? key;
}
