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
        },
    },
});
