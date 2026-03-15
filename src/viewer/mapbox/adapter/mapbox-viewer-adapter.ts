import type { MapRef } from 'react-map-gl/mapbox';
import type { ViewerAdapter, ViewerFeature } from '@/viewer/core/contracts/viewer-adapter';
import type { Bounds, CameraState } from '@/viewer/core/types/geo.types';

export class MapboxViewerAdapter implements ViewerAdapter {
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

  highlightFeatures(_features: ViewerFeature[]): void {
    // Placeholder.
  }

  clearHighlights(): void {
    // Placeholder.
  }

  destroy(): void {}
}
