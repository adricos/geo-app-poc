import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
import cesium from 'vite-plugin-cesium';
import path from 'node:path';
export default defineConfig({
    plugins: [react(), cesium(), checker({ typescript: true })],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            // Ensure mapbox-gl CSS resolves (some setups fail on bare subpath)
            'mapbox-gl/dist/mapbox-gl.css': path.resolve(__dirname, 'node_modules/mapbox-gl/dist/mapbox-gl.css'),
        },
    },
});
