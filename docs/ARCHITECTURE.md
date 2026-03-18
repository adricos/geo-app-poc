# Geo App POC — Technical architecture

This document is for engineers who need a **mental model** of the project: why it is shaped this way, what each layer does, and how data and UI flow through the app. It complements the root `README.md` (run instructions, env vars, checklist of features).

---

## 1. What problem this POC solves

**Challenge:** Build a single geospatial web app that can:

- Default to **open 2D** mapping (MapLibre) for typical SaaS workflows.
- Optionally use **Mapbox 2D** (same interaction model, proprietary tiles/styles).
- Support **3D globe** (Cesium) without forking the product into separate apps.

**Constraint:** Product features (demographics overlay, property inspection, drawing) should not be hard-wired to one engine, or every new engine doubles maintenance.

**Approach:** One React app with a **viewer abstraction**, **composition at the app root**, and **strict folder boundaries** so features talk to contracts and store—not to `maplibre-gl` / `mapbox-gl` / `cesium` directly.

---

## 2. High-level architecture

```text
┌──────────────────────────────────────────────────────────────────────┐
│  app.tsx                                                         │
│  • Chooses which viewer component is mounted (MapLibre/Mapbox/   │
│    Cesium)                                                       │
│  • Injects feature UI as children (e.g. Argentina deck overlay   │
│    on 2D, Cesium layer component on 3D)                          │
└──────────────────────────────┬───────────────────────────────────────┘
                             │
         ┌────────────────────┼──────────────────────┐
         ▼                   ▼                   ▼
   MapLibreViewer      MapboxViewer        CesiumViewer
   (react-map-gl)      (react-map-gl)      (Resium)
         │                   │                    │
         └────────────────────┼─────────────────────┘
                             │
                    Registers ViewerAdapter
                    + updates camera on move
                             │
                             ▼
                    useViewerStore (Zustand)
                    • adapter, camera, styles per engine
                    • selectedFeature, flags (demographics, draw)
                             ▲
                             │
   Shell (sidebar) ───────────┘
   • Viewer switcher, feature toggles, Property insights panel
```

**Key idea:** The **mounted viewer** is the only place that touches a concrete map SDK. It **registers** a small `ViewerAdapter` on the global store. Sidebar and features read **store + `viewer/core` types**, not raw map instances.

---

## 3. Layered folder model


| Layer              | Path                     | Role                                                                                                     |
| ------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------- |
| **App**            | `src/app/`               | Bootstrap, providers, root composition (`app.tsx` wires viewer + children).                              |
| **Shared**         | `src/shared/`            | Shell UI, env/config (Zod), **viewer store** (Zustand)—cross-cutting, not business features.             |
| **Viewer core**    | `src/viewer/core/`       | **Contracts** (`ViewerAdapter`), geo types, shared map controls UI, **MapOverlayContext** (2D overlays). |
| **Viewer engines** | `src/viewer/maplibre`    | mapbox                                                                                                   |
| **Features**       | `src/features/*/`        | Product capabilities: panels, toggles, **decoupled** overlays/layers composed from `app.tsx`.            |


**Dependency rule (target):**  
`features` → `viewer/core` + `shared` (+ future `domain`).  
Avoid importing engine packages from `features/` unless you isolate engine-specific code.

---

## 4. Viewer abstraction: `ViewerAdapter`

Defined in `src/viewer/core/contracts/viewer-adapter.ts`:

- `getCamera()` / `setCamera()` / `flyTo()` — minimal, engine-agnostic camera API.
- `destroy()` — cleanup when the viewer unmounts.

Each engine implements this in its **adapter** (`map-libre-viewer-adapter.ts`, `mapbox-viewer-adapter.ts`, `cesium-viewer-adapter.ts`). Hooks like `useMapLibreViewerAdapter` run inside the viewer component, create the adapter when the map/globe is ready, and call `setAdapter` / `setCamera` on the store.

**Why it matters:** Sidebar demos (e.g. “fly to” via adapter) and future permalink/sync logic can target **one interface** regardless of 2D vs 3D.

**Limitation:** This is intentionally small. Full parity (every MapLibre concept in Cesium) is not the goal; the goal is **contained** engine swap and shared **product** state (`selectedFeature`, style keys per engine, etc.).

---

## 5. Global viewer state (`viewer-store`)

`src/shared/state/viewer-store.ts` holds:


| State                                                     | Purpose                                                                                              |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `adapter`                                                 | Active `ViewerAdapter` (null when no viewer mounted).                                                |
| `camera`                                                  | Last camera after move — single place for “where is the map”.                                        |
| `mapStyleKey` / `mapStyleKeyMapbox` / `mapStyleKeyCesium` | Separate style presets per engine so switching viewers doesn’t clobber choices.                      |
| `selectedFeature`                                         | Result of map pick (basemap/vector on 2D; Cesium pick pipeline on 3D). Drives **Property insights**. |
| `argentinaDemographicsEnabled`                            | Toggles demographics use case.                                                                       |
| `drawingEnabled` / `drawingMode`                          | Terra Draw (2D only).                                                                                |


The store is the **integration bus** between map interactions and sidebar UI.

---

## 6. How features attach without importing engines

### 6.1 Composition from `App`

`app.tsx` does **not** put demographics inside MapLibre’s source files. It passes **React children**:

- **MapLibre / Mapbox:** `ArgentinaDemographicsDeckOverlay` as child — rendered inside the map’s overlay tree where **MapOverlayContext** supplies `viewState`, size, and `requestFitBounds`.
- **Cesium:** `ArgentinaDemographicsCesiumLayer` as child — the feature component uses Cesium APIs internally, but the **viewer** only mounts it; the demographics feature lives under `features/`.

So: **viewers stay generic**; **app** decides which feature subtree is active.

### 6.2 MapOverlayContext (2D only)

`src/viewer/core/context/map-overlay-context.tsx` exposes:

- Current **view state** and **width/height** (for deck.gl and similar).
- `**requestFitBounds`** — fly map to a region (e.g. Argentina when enabling the layer).
- Optional pointer-move hook for hover tooltips.

MapLibre and Mapbox viewers wrap overlay children with this provider. Cesium does not use this pattern; 3D layers use different primitives (e.g. `GeoJsonDataSource`).

### 6.3 Same use case, two implementations

**Argentina demographics** illustrates the split:

- **2D:** deck.gl `GeoJsonLayer` in `argentina-demographics-deck-overlay.tsx` — rank-based color, population-scaled circles, hover picks.
- **3D:** Cesium GeoJSON + ellipses in `argentina-demographics-cesium-layer.tsx`.

Shared **data** and **color math** live in hooks/utils under the feature; **rendering** is per platform.

---

## 7. Map interaction → Property insights

- **MapLibre / Mapbox:** click → `queryRenderedFeatures` (or equivalent) → normalized `SelectedMapFeature` → store → **Property insights** panel.
- **Cesium:** click → `cesium-pick-to-feature` (entities, 3D Tiles, or globe position) → same store shape.

Empty clicks clear or set lat/lng. This shows how **one panel** stays dumb while **each viewer** implements pick semantics.

---

## 8. Drawing (Terra Draw)

- **Scope:** MapLibre and Mapbox only (`use-terra-draw.ts` per engine).
- **Flow:** Store holds `drawingEnabled` and `drawingMode`; **DrawingControl** in the shell toggles them; viewers subscribe and attach Terra Draw after style load.
- **Cesium:** No adapter — UI shows “not available in 3D”. This is an explicit product/engine boundary.

---

## 9. Shared map controls UI

Style and layer visibility controls are **partially shared** under `viewer/core/` (widgets, layer panel logic, icons) with **thin engine-specific wrappers** (e.g. `map-controls-widget.tsx` vs `cesium-map-controls-widget.tsx`). Same **interaction pattern** across engines; implementation reads different layer APIs.

---

## 10. Viewer switching and WebGL

Switching **MapLibre ↔ Mapbox ↔ Cesium** unmounts one WebGL-heavy viewer and mounts another. Browsers limit concurrent WebGL contexts; **Cesium** is especially heavy.

`app.tsx` uses a short **delay** (`VIEWER_SWITCH_DELAY_MS`) between “user selected new viewer” and mounting the new tree so the previous context can be released—reducing “too many WebGL contexts” errors.

On switch, **selected feature** is cleared to avoid showing stale pick data from another engine.

---

## 11. Technology map (concise)


| Concern                   | Choice                                            |
| ------------------------- | ------------------------------------------------- |
| App shell                 | React 19 + TypeScript + Vite                      |
| 2D (default)              | MapLibre GL + react-map-gl (maplibre)             |
| 2D (optional)             | Mapbox GL + react-map-gl (mapbox), token required |
| 3D                        | Cesium + Resium + vite-plugin-cesium              |
| Client state              | Zustand (viewer store)                            |
| Server/async              | React Query (ready for APIs)                      |
| Validation / env          | Zod                                               |
| 2D vector overlay example | deck.gl                                           |
| Drawing (2D)              | Terra Draw + engine adapters                      |


---

## 12. Where to look in the repo


| Question                         | Start here                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------- |
| Who mounts which viewer?         | `src/app/app.tsx`                                                             |
| Sidebar layout & viewer switcher | `src/shared/ui/shell.tsx`                                                     |
| Adapter contract                 | `src/viewer/core/contracts/viewer-adapter.ts`                                 |
| Store shape                      | `src/shared/state/viewer-store.ts`                                            |
| 2D overlay contract              | `src/viewer/core/context/map-overlay-context.tsx`                             |
| Engine viewers                   | `viewer/maplibre/components/map-libre-viewer.tsx`, `mapbox/...`, `cesium/...` |
| Demographics feature             | `src/features/argentina-demographics/`                                        |
| Property panel                   | `src/features/property-insights/`                                             |
| Target growth layout             | `docs/PROJECT-SCAFFOLDING.md`                                                 |


---

## 13. Known gaps (honest POC boundaries)

Useful for scoping conversations:

- Map highlight for selected feature not fully visualized on the map.
- Deck.gl overlay clicks may not yet feed `selectedFeature` the same way basemap picks do.
- `src/domain/` not yet populated — business models will land there later.

---

## Summary

This POC demonstrates **one app, multiple map engines**, with **features composed at the root**, **engine code isolated under `viewer/{maplibre,mapbox,cesium}`**, and **shared behavior** expressed through **Zustand**, `**ViewerAdapter`**, and **MapOverlayContext** (2D). The technological challenge is **not** “wrap every GL API”—it is **clear boundaries** so the team can ship MapLibre-first workflows while keeping Mapbox and Cesium as first-class alternatives without entangling product code in three SDKs.