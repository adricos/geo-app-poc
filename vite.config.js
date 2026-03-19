import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
import cesium from 'vite-plugin-cesium';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
var __dirname = fileURLToPath(new URL('.', import.meta.url));
/**
 * Public base path for the app (`import.meta.env.BASE_URL`).
 * Set `VITE_BASE` in `.env` (e.g. `/geo-app-poc/`). Empty/unset → site root `/`.
 */
function resolveBase(raw) {
  var trimmed = raw === null || raw === void 0 ? void 0 : raw.trim();
  if (!trimmed) return '/';
  var withLeading = trimmed.startsWith('/') ? trimmed : '/'.concat(trimmed);
  return withLeading.endsWith('/') ? withLeading : ''.concat(withLeading, '/');
}
export default defineConfig(function (_a) {
  var mode = _a.mode;
  var env = loadEnv(mode, process.cwd(), '');
  return {
    base: resolveBase(env.VITE_BASE),
    plugins: [react(), cesium(), checker({ typescript: true })],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // Ensure mapbox-gl CSS resolves (some setups fail on bare subpath)
        'mapbox-gl/dist/mapbox-gl.css': path.resolve(
          __dirname,
          'node_modules/mapbox-gl/dist/mapbox-gl.css',
        ),
      },
    },
  };
});
