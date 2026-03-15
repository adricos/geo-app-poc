import type { Bounds, CameraState, LngLat } from '@/viewer/core/types/geo.types';

export interface ViewerFeature {
  id: string;
  source: string;
  sourceLayer?: string;
}

export interface ViewerAdapter {
  getCamera(): CameraState;
  setCamera(next: Partial<CameraState>): void;
  flyTo(target: Partial<CameraState> & LngLat): void;
  fitBounds(bounds: Bounds, options?: { padding?: number; maxZoom?: number }): void;
  highlightFeatures(features: ViewerFeature[]): void;
  clearHighlights(): void;
  destroy(): void;
}
