import { create } from 'zustand';
import type { ViewerAdapter } from '@/viewer/core/contracts/viewer-adapter';
import type { CameraState } from '@/viewer/core/types/geo.types';
import type { MapStylePresetKey } from '@/shared/config/map-style-presets';
import type { CesiumImageryPresetKey } from '@/viewer/cesium/config/cesium-imagery-presets';
import type { MapboxStylePresetKey } from '@/viewer/mapbox/config/mapbox-style-presets';
import type { SelectedMapFeature } from '@/viewer/core/types/viewer.types';

interface ViewerStoreState {
  adapter: ViewerAdapter | null;
  setAdapter: (adapter: ViewerAdapter | null) => void;
  /** Last known camera after move end; single source of truth for permalinks/panels. */
  camera: CameraState | null;
  setCamera: (camera: CameraState | null) => void;
  /** MapLibre: selected style preset (default, streets, satellite, terrain, dark). */
  mapStyleKey: MapStylePresetKey;
  setMapStyleKey: (key: MapStylePresetKey) => void;
  /** Cesium: selected imagery preset; can include Cesium-only options (e.g. ion-world-imagery). */
  mapStyleKeyCesium: CesiumImageryPresetKey;
  setMapStyleKeyCesium: (key: CesiumImageryPresetKey) => void;
  /** Mapbox: selected style preset (default, streets, satellite, etc.). */
  mapStyleKeyMapbox: MapboxStylePresetKey;
  setMapStyleKeyMapbox: (key: MapboxStylePresetKey) => void;
  /** Feature selected by clicking the map (MapLibre/Mapbox). Cleared when switching viewer or clicking empty space. */
  selectedFeature: SelectedMapFeature | null;
  setSelectedFeature: (feature: SelectedMapFeature | null) => void;
  /** Use case: Argentina demographics overlay (deck.gl on 2D, GeoJsonDataSource on Cesium). */
  argentinaDemographicsEnabled: boolean;
  setArgentinaDemographicsEnabled: (enabled: boolean) => void;
  /** Terra Draw: drawing enabled (MapLibre/Mapbox only). */
  drawingEnabled: boolean;
  setDrawingEnabled: (enabled: boolean) => void;
  /** Terra Draw: current draw mode (point, linestring, polygon). */
  drawingMode: 'point' | 'linestring' | 'polygon';
  setDrawingMode: (mode: 'point' | 'linestring' | 'polygon') => void;
}

export const useViewerStore = create<ViewerStoreState>((set) => ({
  adapter: null,
  setAdapter: (adapter) => set({ adapter }),
  camera: null,
  setCamera: (camera) => set({ camera }),
  mapStyleKey: 'default',
  setMapStyleKey: (mapStyleKey) => set({ mapStyleKey }),
  mapStyleKeyCesium: 'default',
  setMapStyleKeyCesium: (mapStyleKeyCesium) => set({ mapStyleKeyCesium }),
  mapStyleKeyMapbox: 'default',
  setMapStyleKeyMapbox: (mapStyleKeyMapbox) => set({ mapStyleKeyMapbox }),
  selectedFeature: null,
  setSelectedFeature: (selectedFeature) => set({ selectedFeature }),
  argentinaDemographicsEnabled: false,
  setArgentinaDemographicsEnabled: (argentinaDemographicsEnabled) => set({ argentinaDemographicsEnabled }),
  drawingEnabled: false,
  setDrawingEnabled: (drawingEnabled) => set({ drawingEnabled }),
  drawingMode: 'point',
  setDrawingMode: (drawingMode) => set({ drawingMode }),
}));
