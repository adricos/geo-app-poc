# Project scaffolding (target layout)

This document describes **how the repo is organized today** and **where to put code as the app grows**. Empty folders are not kept in the tree—**create a folder when the first file needs a home**.

## Layering model

| Layer         | Path            | Responsibility                                                           |
| ------------- | --------------- | ------------------------------------------------------------------------ |
| **App shell** | `src/app/`      | Bootstrap, root layout, providers, routing when added                    |
| **Shared**    | `src/shared/`   | Cross-cutting UI, config, global client state - not feature logic        |
| **Domain**    | `src/domain/`   | _(Create when needed.)_ Types, schemas, pure logic for business concepts |
| **Viewer**    | `src/viewer/`   | Map engines + shared viewer contracts (`core/`)                          |
| **Features**  | `src/features/` | User-facing product capabilities (sidebar, panels, overlays)             |

**Dependency direction (ideal):**  
`features` → `viewer/core` contracts + `domain` + `shared`  
`viewer/`\* engines → `viewer/core`  
Avoid: feature modules importing `maplibre-gl`, `mapbox-gl`, or `cesium` directly unless unavoidable (e.g. a dedicated engine-specific subfolder).

---

## `src/app/`

| Area                            | Purpose                                                          |
| ------------------------------- | ---------------------------------------------------------------- |
| `app.tsx`, `error-boundary.tsx` | Root UI                                                          |
| `providers/`                    | React Query, theme, future auth                                  |
| `router/`                       | **When you add routes:** `routes.tsx`, layout routes, lazy pages |

---

## `src/shared/`

| Area      | Purpose                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------- |
| `config/` | Env (Zod), env-agnostic presets                                                                         |
| `state/`  | App-wide client state (e.g. viewer store)                                                               |
| `ui/`     | Shell, layout primitives                                                                                |
| `lib/`    | **When needed:** small helpers (formatting, geo helpers)—keep thin; prefer `domain/` for business rules |

---

## `src/domain/`

One folder per **bounded concept**. Suggested growth path:

```text
domain/
  property/       # parcel, ownership, valuation types & zod schemas
  imagery/        # basemap, overlays, attribution
  annotation/     # user marks, comments tied to map features
```

Add `***.types.ts**`, `***.schemas.ts**`, and pure functions here. No React, no map SDK imports.

---

## `src/viewer/`

### `viewer/core/`

Contracts and shared behavior: `contracts/`, `context/` (e.g. overlay, registry), `types/`, `services/`.

### Per engine: `maplibre/`, `mapbox/`, `cesium/`

Typical subfolders as complexity grows:

| Subfolder                       | Use when                                                              |
| ------------------------------- | --------------------------------------------------------------------- |
| `components/`                   | Viewer root, controls                                                 |
| `adapter/`                      | Implements `viewer-adapter` contract                                  |
| `hooks/`                        | Engine-specific hooks                                                 |
| `config/`                       | Style/imagery presets                                                 |
| `layers/`                       | **Cesium:** entity layers, datasources colocated by engine            |
| `sources/`, `layers/`, `utils/` | **MapLibre:** GeoJSON sources, layer factories, pick/hit-test helpers |

---

## `src/features/`

Each feature is a **vertical slice** (UI + hooks + optional API client + data).

```text
features/
  <feature-name>/
    components/     # React UI
    hooks/          # useFeatureX, react-query keys
    api/            # fetchers, types for HTTP
    utils/          # feature-only helpers
    data/           # static JSON, small assets
```

Examples of **future** features (create the folder when you add the first file):

| Feature              | Role                                                  |
| -------------------- | ----------------------------------------------------- |
| `map-explorer/`      | Search, recents, layer catalog UX                     |
| `measurements/`      | Distance, area on map                                 |
| `annotations/`       | Save/edit user annotations                            |
| `property-insights/` | Panel in shell; add `hooks/`, `api/` when wiring data |

---

## Tests and styles

- **Tests:** colocated `*.test.ts(x)` or under `src/test/` for setup only.
- **Global CSS:** `src/styles/global.css`.

---

## Summary

1. **Don’t commit empty directories**—the structure above is the contract; recreate paths when implementing.
2. **New capability:** decide if it’s domain, viewer-core, engine-specific, or a feature—then place it once.
3. **New map engine:** mirror `maplibre/` (adapter, hooks, components, config).

For the **current** implemented surface area, see **Project structure** in the root `README.md`.
