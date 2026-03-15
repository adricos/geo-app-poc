import type { MapRef } from 'react-map-gl/maplibre';
import type { ViewerAdapter, ViewerFeature } from '@/viewer/core/contracts/viewer-adapter';
import type { Bounds, CameraState } from '@/viewer/core/types/geo.types';

export class MapLibreViewerAdapter implements ViewerAdapter {
  constructor(private readonly mapRef: MapRef) {}

  getCamera(): CameraState {
    const center = this.mapRef.getCenter();

    return {
      lng: center.lng,
      lat: center.lat,
      zoom: this.mapRef.getZoom(),
      bearing: this.mapRef.getBearing(),
      pitch: this.mapRef.getPitch(),
    };
  }

  setCamera(next: Partial<CameraState>): void {
    this.mapRef.jumpTo({
      center:
        next.lng !== undefined && next.lat !== undefined
          ? [next.lng, next.lat]
          : undefined,
      zoom: next.zoom,
      bearing: next.bearing,
      pitch: next.pitch,
    });
  }

  flyTo(target: Partial<CameraState> & { lng: number; lat: number }): void {
    this.mapRef.flyTo({
      center: [target.lng, target.lat],
      zoom: target.zoom,
      bearing: target.bearing,
      pitch: target.pitch,
      essential: true,
    });
  }

  fitBounds(bounds: Bounds, options?: { padding?: number; maxZoom?: number }): void {
    this.mapRef.fitBounds(
      [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]],
      ],
      {
        padding: options?.padding ?? 32,
        maxZoom: options?.maxZoom,
      },
    );
  }

  /** Optional / engine-specific. Implement via feature-state or temporary layer when needed. */
  highlightFeatures(_features: ViewerFeature[]): void {
    // Placeholder.
  }

  /** Optional / engine-specific. Clear highlight layer or feature-state. */
  clearHighlights(): void {
    // Placeholder.
  }

  /**
   * No-op for React-owned map: MapLibre instance is managed by react-map-gl.
   * Other adapters (e.g. Cesium) may perform real cleanup here.
   */
  destroy(): void {}
}
