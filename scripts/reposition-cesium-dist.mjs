#!/usr/bin/env node
/**
 * After `vite build`, vite-plugin-cesium leaves assets under `<outDir>/<base-segment>/cesium/`.
 * They must live at `<outDir>/cesium/` so URLs like `/geo-app-poc/cesium/*` resolve when `outDir`
 * is deployed as the site root for that app (same layout as `index.html` + `assets/`).
 *
 * Uses `VITE_BASE` (same as Vite `loadEnv` / `vite.config`). If unset or `/`, no-op.
 * Override output dir with `VITE_BUILD_OUT_DIR` (default: `dist`).
 */
import { readFileSync, existsSync } from 'node:fs';
import { cp, readdir, rm, rmdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function loadEnvVar(name) {
  if (process.env[name]?.trim()) return process.env[name].trim();
  for (const file of ['.env.local', '.env']) {
    const p = path.join(root, file);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m || m[1] !== name) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      return v;
    }
  }
  return '';
}

const rawBase = (process.env.VITE_BASE?.trim() || loadEnvVar('VITE_BASE'))?.trim();
if (!rawBase || rawBase === '/' || rawBase === './') {
  process.exit(0);
}

const segment = rawBase.replace(/^\/+|\/+$/g, '');
if (!segment) process.exit(0);

const outDir = process.env.VITE_BUILD_OUT_DIR?.trim() || 'dist';
const nestedCesium = path.join(outDir, segment, 'cesium');
const flatCesium = path.join(outDir, 'cesium');

if (!existsSync(nestedCesium)) {
  process.exit(0);
}
if (nestedCesium === flatCesium) {
  process.exit(0);
}

if (existsSync(flatCesium)) {
  await rm(flatCesium, { recursive: true, force: true });
}
await cp(nestedCesium, flatCesium, { recursive: true });
await rm(nestedCesium, { recursive: true, force: true });

const segmentDir = path.join(outDir, segment);
try {
  const rest = await readdir(segmentDir);
  if (rest.length === 0) {
    await rmdir(segmentDir);
  }
} catch {
  // ignore
}
