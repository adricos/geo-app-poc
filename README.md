# Geo App

**Technical architecture (for engineers):** see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — mental model, layers, data flow, and POC boundaries.

## Purpose

This project is a React + TypeScript geospatial application that supports **MapLibre (2D)**, **Mapbox (2D)**, and **Cesium (3D)** viewers behind a shared abstraction. The app is MapLibre-first for day-to-day 2D workflows, with Mapbox and Cesium available as alternative 2D and 3D options.

The implementation includes:

- a modular application shell with a viewer switcher (MapLibre / Mapbox / Cesium)
- a viewer abstraction layer (contracts, store, registry)
- **MapLibre** implementation using `react-map-gl` (maplibre), with a consolidated map controls widget (style + layers)
- **Mapbox** implementation using `react-map-gl` (mapbox) + mapbox-gl; same style/layer widget pattern (requires Mapbox access token)
- **Cesium** implementation using Resium, with the same style/layer controls pattern
- map style presets per viewer (MapLibre, Mapbox, Cesium) stored separately in the viewer store
- **Argentina demographics** use case: city-level population (INDEC 2022) as a **deck.gl** overlay on 2D viewers and a **Cesium** GeoJSON layer on the 3D viewer; feature is decoupled from viewers via **MapOverlayContext** and composition (overlay/layer passed as viewer `children` from the app)
- **Map interaction**: click on the map fills **Property insights** with basemap/vector feature attributes (MapLibre/Mapbox via `queryRenderedFeatures`) or Cesium picks (entities, 3D Tiles, or globe position); Argentina layer uses **hover tooltips** on 2D/3D for city stats
- clear layering between viewer infrastructure and user-facing features

---

## Architectural decisions

### 1. MapLibre first, Mapbox and Cesium available

The primary rendering engine is **MapLibre GL JS** via **`react-map-gl`**, with **Mapbox** (also via **`react-map-gl`**) and **Cesium** (via **Resium**) as additional viewers. The sidebar lets users switch between “MapLibre (2D)”, “Mapbox (2D)”, and “Cesium (3D)”.

MapLibre remains the default because the main workflows are:

- map-first 2D
- imagery and boundary overlays
- parcel/property exploration
- customer-facing SaaS workflows

Cesium is implemented so 3D globe use cases are supported without restructuring the app. Feature logic depends on `viewer/core` contracts so it can stay engine-agnostic where possible.

### 2. One application, modular internals

The project is intentionally a **single frontend application** rather than multiple apps or microfrontends.

Reasoning:

- same team ownership
- simpler routing, auth, state, and deployment model
- lower coordination overhead
- better developer experience during the early product phase

If the 3D experience later becomes substantial enough, it can be introduced as a dedicated module or route without restructuring the whole app.

### 3. Viewer abstraction boundary

A shared viewer contract lives under `src/viewer/core/contracts`.

Feature modules should depend on this abstraction instead of directly depending on the underlying rendering engine.

This makes the codebase more resilient if:

- the rendering engine changes
- a second rendering engine is added
- common feature logic needs to work across 2D and 3D viewers

This does **not** make engine migration free, but it reduces the blast radius.

### 4. Clear separation of concerns

The project is organized into distinct layers:

- `app/` → bootstrap, providers, composition
- `shared/` → generic application-wide utilities and shell components
- `domain/` → business/domain models and schemas _(add `src/domain/` when the first models land; see [`docs/PROJECT-SCAFFOLDING.md`](docs/PROJECT-SCAFFOLDING.md))_
- `viewer/` → viewer contracts and concrete implementations
- `features/` → user-facing product capabilities

The intent is to keep:

- domain concepts out of viewer internals
- feature behavior out of shared utilities
- engine-specific code out of feature modules

### 5. Kebab-case for files and folders

To reduce inconsistency across contributors and avoid case-sensitivity issues across filesystems, the project uses:

- **kebab-case** for files and folders
- **PascalCase** for React component/type exports
- **camelCase** for functions and hooks

---

## Project structure

**Target layout as the app grows** (layers, per-engine folders, feature slices) is documented in **[`docs/PROJECT-SCAFFOLDING.md`](docs/PROJECT-SCAFFOLDING.md)**. Empty placeholder directories are not kept in the repo—add `router/`, `domain/property/`, `features/map-explorer/`, etc. when the first file belongs there.

**Implemented tree (summary):**

```text
src/
  app/           app.tsx, error-boundary, providers/
  shared/        config/, state/, ui/shell.tsx
  viewer/
    core/        contracts, context, types, services
    maplibre/    components, adapter, hooks, (config via shared presets)
    mapbox/      components, adapter, config, hooks
    cesium/      components, adapter, config, hooks, utils
  features/
    argentina-demographics/   components, hooks, utils, data
    drawing/                  components/drawing-control
    property-insights/        components/property-insights-panel
  styles/        global.css
  main.tsx
```

---

## Technology stack

### Core

- **React**
- **TypeScript**
- **Vite**

### Viewer

- **MapLibre GL JS** + **react-map-gl** (maplibre) — default 2D map
- **Mapbox GL JS** + **react-map-gl** (mapbox) — optional 2D map (requires `VITE_MAPBOX_ACCESS_TOKEN`)
- **Cesium** + **Resium** — 3D globe
- **vite-plugin-cesium** — Cesium build and assets for Vite

### State / data / validation

- **@tanstack/react-query**
- **zustand**
- **zod**

### Overlays and tooling

- **deck.gl** — used for the Argentina demographics overlay on 2D viewers (GeoJsonLayer, rank-based colors, population-proportional radius)
- **Turf** — planned for client-side geospatial calculations
- **Terra Draw** — used for drawing/editing on 2D viewers (MapLibre and Mapbox); see below.

### Terra Draw (implemented)

A simple drawing use case is implemented with Terra Draw on MapLibre and Mapbox:

- **Packages**: `terra-draw`, `terra-draw-maplibre-gl-adapter`, `terra-draw-mapbox-gl-adapter`
- **Viewer layer**: `viewer/maplibre/hooks/use-terra-draw.ts` and `viewer/mapbox/hooks/use-terra-draw.ts` create the Terra Draw instance after the map’s `style.load` event, with point, linestring, polygon, and select modes. The hooks are used in `MapLibreViewer` and `MapboxViewer` when `drawingEnabled` is true in the viewer store.
- **State**: `viewer-store` holds `drawingEnabled`, `drawingMode` (`point` | `linestring` | `polygon`).
- **Feature UI**: `features/drawing/components/drawing-control.tsx` — sidebar checkbox “Terra Draw” and mode dropdown; shows “Not available in 3D” when Cesium is active.
- **Cesium**: No Terra Draw adapter; the drawing control is disabled for the 3D viewer.

---

## Requirements

- **Node.js 20+**
- **npm 10+**

---

## Installation

From the project root:

```bash
npm install
```

---

## Running the application

### Base path (subdirectory deployment)

Optional env **`VITE_BASE`** sets where the app is served (Vite `base` → **`import.meta.env.BASE_URL`**, used for `public/` assets such as the MapLibre satellite style JSON). **If unset or empty, the app uses the site root `/`.**

Examples in `.env` or `.env.local`:

```bash
# Root (default) — e.g. http://localhost:5173/
# VITE_BASE=

# Subpath — e.g. http://localhost:5173/geo-app-poc/
VITE_BASE=/geo-app-poc/
```

Leading/trailing slashes are normalized in `vite.config.ts` (a trailing slash is added for non-root paths).

- **Cesium (3D):** `vite-plugin-cesium` copies Workers/Assets under `dist/<base-segment>/cesium/` when using a subpath. After `vite build`, **`scripts/reposition-cesium-dist.mjs`** moves that tree to **`dist/cesium/`** (next to `index.html` and `assets/`), matching how the app is usually deployed. The script reads **`VITE_BASE`** from the environment or `.env` / `.env.local` (same as the Vite build). Set **`VITE_BUILD_OUT_DIR`** if you change Vite’s `build.outDir` from `dist`.

- **Development:** with a subpath, open **`http://localhost:5173/<your-base>/`** (not the bare origin).
- **Production:** deploy so the app is available at that path, or use a reverse proxy.
- **React Router:** if you add a router later, set **`basename={import.meta.env.BASE_URL}`** (or strip the trailing slash if your API requires it).

---

Start the development server:

```bash
npm run dev
```

Run type checking:

```bash
npm run typecheck
```

Run tests:

```bash
npm run test
```

Run tests with coverage (report in `coverage/` and terminal summary):

```bash
npm run test:coverage
```

Coverage uses Vitest’s v8 provider; reports include text summary, HTML (`coverage/index.html`), and lcov. Only `src/` is measured; test files and config are excluded.

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

## Environment variables

The project currently supports:

| Variable                       | Description                                                                                                                                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_BASE`                    | Optional. Public path when the app is **not** served at the domain root (e.g. `/geo-app-poc/`). Sets Vite’s `base` and `import.meta.env.BASE_URL`. **Omit or leave empty for `/`.**                                                   |
| `VITE_BUILD_OUT_DIR`           | Optional. Used only by `scripts/reposition-cesium-dist.mjs` after `vite build`. Set if `build.outDir` is not `dist` (must match Vite).                                                                                                |
| `VITE_MAP_STYLE_URL`           | Optional. Overrides the selected map style for MapLibre when set. When unset, the app uses the chosen preset from the viewer store for MapLibre (Mapbox and Cesium use their own store keys).                                         |
| `VITE_CESIUM_ION_ACCESS_TOKEN` | Optional. Cesium Ion default access token. When set, enables Ion imagery and terrain in the Cesium (3D) viewer. Get a token at [ion.cesium.com/tokens](https://ion.cesium.com/tokens).                                                |
| `VITE_ARCGIS_ACCESS_TOKEN`     | Optional. ArcGIS API key. When set, assigned to `Cesium.ArcGisMapService.defaultAccessToken` so the app stops using the default token and the warning goes away. Get a key at [developers.arcgis.com](https://developers.arcgis.com). |
| `VITE_MAPBOX_ACCESS_TOKEN`     | Required for the Mapbox (2D) viewer. When set, the Mapbox viewer is usable; otherwise a placeholder message is shown. Get a token at [account.mapbox.com/access-tokens](https://account.mapbox.com/access-tokens/).                   |

Create a local environment file if needed:

```bash
cp .env.example .env.local
```

Example:

```bash
# Optional subdirectory deploy (omit for root)
# VITE_BASE=/geo-app-poc/
VITE_MAP_STYLE_URL=https://demotiles.maplibre.org/style.json
# Optional, for Cesium (3D viewer)
VITE_CESIUM_ION_ACCESS_TOKEN=your_ion_token_here
VITE_ARCGIS_ACCESS_TOKEN=your_arcgis_key_here
# Required for Mapbox (2D) viewer
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

---

## Current state of the scaffold

What is implemented:

- Vite + React + TypeScript setup
- App shell with optional viewer switcher (MapLibre / Mapbox / Cesium)
- Query client provider and environment parsing (Zod)
- Viewer adapter contract and viewer store (Zustand); camera and map style key in store
- **MapLibre**: `MapLibreViewer`, `MapLibreViewerAdapter`, and a consolidated **map controls widget** (icon → style dropdown → full panel with layer list, tri-state select all/none, friendly layer names). Accepts `children` for overlay composition; provides **MapOverlayContext** (viewState, size, `requestFitBounds`).
- **Mapbox**: `MapboxViewer`, `MapboxViewerAdapter`, and **MapboxMapControlsWidget** (same pattern; requires `VITE_MAPBOX_ACCESS_TOKEN`). Mapbox style presets (default, streets, satellite, satellite-streets, outdoors, light, dark) via `mapStyleKeyMapbox`. Same overlay `children` + **MapOverlayContext** pattern as MapLibre.
- **Cesium**: `CesiumViewer`, `CesiumViewerAdapter`, and the same **map controls widget** pattern (style presets, imagery layer visibility). Accepts `children` (e.g. feature layers) for composition.
- **MapLibre** style presets (default, streets, satellite, terrain, dark) via style JSON URLs; **Mapbox** style presets via Mapbox Styles API; **Cesium** imagery presets (same labels plus optional “Cesium World Imagery” when Ion token is set). Each viewer has its own store key (`mapStyleKey` / `mapStyleKeyMapbox` / `mapStyleKeyCesium`) so switching viewers keeps the correct style per engine.
- Viewer registry and layer registration (MapLibre and Mapbox)
- **Argentina demographics** feature (decoupled from viewers):
  - **Data**: city-level GeoJSON (localidades, INDEC 2022) with population; rank computed in `useArgentinaDemographicsData`.
  - **2D (MapLibre/Mapbox)**: `ArgentinaDemographicsDeckOverlay` — deck.gl GeoJsonLayer, uses `useMapOverlay()` for viewState/size and `requestFitBounds` to fly to Argentina when enabled; circle size by population, color by rank (shared `rankToRgba`).
  - **3D (Cesium)**: `ArgentinaDemographicsCesiumLayer` — GeoJsonDataSource with ellipses and info balloon; same color/size logic.
  - **Shell**: `ArgentinaDemographicsControl` in the sidebar (checkbox + legend). App composes overlay/layer as viewer `children` when the store flag is enabled; viewers do not import the feature.
  - **Inspect**: hover tooltips on localidades (deck.gl `pickObject` on 2D; Cesium `MOUSE_MOVE` on 3D).
- **Property insights** (`features/property-insights`): sidebar panel bound to `viewer-store.selectedFeature` — shows layer/source and properties, or lat/lng (and terrain height when available) on empty clicks; dismiss clears selection. Wired from **MapLibre**/**Mapbox** map clicks and **Cesium** left-click (`cesium-pick-to-feature`).
- **Terra Draw** (MapLibre/Mapbox only):
  - **Viewer**: `useTerraDraw(mapRef, drawingEnabled)` in `viewer/maplibre` and `viewer/mapbox` initializes Terra Draw after `style.load`, with point, linestring, polygon, and select modes.
  - **Store**: `drawingEnabled`, `drawingMode` in the viewer store.
  - **Shell**: `DrawingControl` in the sidebar (toggle + mode selector). When Cesium is selected, the control shows “Not available in 3D”.

What is still thin or to be built:

- **Visual highlight** on the map for the selected feature (panel works; no persistent map styling/selection ring yet)
- **Deck.gl → Property insights**: clicks on the Argentina overlay show tooltips on hover; clicking a city does not yet push that feature into `selectedFeature` (only basemap/vector picks do on 2D)
- Domain models under `src/domain/` (see scaffolding doc)

---

## Engineering guidelines

### Feature modules should not depend directly on a specific viewer engine

Prefer this:

- feature logic depends on `viewer/core/contracts` and the viewer store
- engine-specific behavior stays inside `viewer/maplibre`, `viewer/mapbox`, or `viewer/cesium`

Avoid this:

- importing `maplibre-gl`, `mapbox-gl`, or `cesium`/`resium` directly inside business feature modules unless there is a very strong reason

### Keep `shared/` small

`shared/` should not become a catch-all folder.

Before adding code there, ask whether it really belongs in:

- `domain/`
- `viewer/`
- `features/`

### Keep viewer engine code in viewer/maplibre, viewer/mapbox, and viewer/cesium

MapLibre, Mapbox, and Cesium are implemented. All engine-specific code (adapters, controls, imagery/style config) lives under `viewer/maplibre`, `viewer/mapbox`, or `viewer/cesium`. Shared concepts (style key, camera, adapter interface) live in `viewer/core` and the viewer store.

### Prefer explicit contracts over implicit coupling

If a feature needs something from the viewer, define it as a contract in `viewer/core` before wiring it to a specific engine.

---

## Suggested next steps

Recommended next implementation steps:

1. Extend the source/layer registration model in `viewer/core` and align Cesium with it where useful
2. Implement **map highlight** for the selected feature (2D + Cesium) and optionally wire **deck.gl picks** into `selectedFeature` for overlay-only features
3. Introduce domain schemas for property and imagery data
4. Add more overlay use cases via MapOverlayContext (2D) and viewer children (Cesium) as needed
5. Optionally add Cesium Ion terrain or more imagery options when 3D requirements grow

---

## Notes for contributors

When contributing:

- keep file and folder names in kebab-case
- preserve separation between feature code and engine-specific code
- prefer small, explicit abstractions over premature generalization
- avoid introducing Cesium-specific assumptions into shared viewer contracts unless they are truly cross-engine concepts

If you need to add a new viewer capability, start by asking:

1. Is this engine-agnostic? → put it in `viewer/core` or the viewer store.
2. Is it specific to MapLibre, Mapbox, or Cesium? → keep it in `viewer/maplibre`, `viewer/mapbox`, or `viewer/cesium` respectively.

That discipline keeps the project flexible as it grows.
