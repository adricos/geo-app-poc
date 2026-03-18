import type { CameraState, LngLat } from '@/viewer/core/types/geo.types';

/**
 * Viewer-agnostic map API. MapLibre / Mapbox / Cesium each provide an implementation;
 * the active adapter lives on the store so sidebar/features use one interface.
 */
export interface ViewerAdapter {
  getCamera(): CameraState;
  setCamera(next: Partial<CameraState>): void;
  flyTo(target: Partial<CameraState> & LngLat): void;
  destroy(): void;
}
