import { z } from 'zod';

const envSchema = z.object({
  VITE_MAP_STYLE_URL: z
    .string()
    .optional()
    .transform((s) => ((typeof s === 'string' ? s.trim() : '') || undefined))
    .pipe(z.url().optional()),
  VITE_CESIUM_ION_ACCESS_TOKEN: z
    .string()
    .optional()
    .transform((s) => (typeof s === 'string' ? s.trim() : undefined))
    .pipe(z.string().optional()),
  VITE_ARCGIS_ACCESS_TOKEN: z
    .string()
    .optional()
    .transform((s) => (typeof s === 'string' ? s.trim() : undefined))
    .pipe(z.string().optional()),
  VITE_MAPBOX_ACCESS_TOKEN: z
    .string()
    .optional()
    .transform((s) => (typeof s === 'string' ? s.trim() : undefined))
    .pipe(z.string().optional()),
});

const parsed = envSchema.safeParse({
  VITE_MAP_STYLE_URL: import.meta.env.VITE_MAP_STYLE_URL,
  VITE_CESIUM_ION_ACCESS_TOKEN: import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN,
  VITE_ARCGIS_ACCESS_TOKEN: import.meta.env.VITE_ARCGIS_ACCESS_TOKEN,
  VITE_MAPBOX_ACCESS_TOKEN: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
});

if (!parsed.success) {
  console.error(z.flattenError(parsed.error).fieldErrors);
  throw new Error('Invalid environment configuration');
}

export const env = {
  mapStyleUrl: parsed.data.VITE_MAP_STYLE_URL,
  /** Cesium Ion default access token. When set, enables Ion imagery/terrain in the Cesium viewer. */
  cesiumIonAccessToken: parsed.data.VITE_CESIUM_ION_ACCESS_TOKEN,
  /** ArcGIS API key. When set, assigned to Cesium.ArcGisMapService.defaultAccessToken to remove the default-token warning and use your own quota. */
  arcgisAccessToken: parsed.data.VITE_ARCGIS_ACCESS_TOKEN,
  /** Mapbox access token. Required for the Mapbox viewer. Get a token at https://account.mapbox.com/access-tokens/ */
  mapboxAccessToken: parsed.data.VITE_MAPBOX_ACCESS_TOKEN,
};
