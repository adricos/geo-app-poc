import type { MapRef } from 'react-map-gl/mapbox';
import type { ViewerAdapter } from '@/viewer/core/contracts/viewer-adapter';
import type { CameraState } from '@/viewer/core/types/geo.types';

export class MapboxViewerAdapter implements ViewerAdapter {
  constructor(private readonly mapRef: MapRef) {}

  getCamera(): CameraState {
    const c = this.mapRef.getCenter();
    return {
      lng: c.lng,
      lat: c.lat,
      zoom: this.mapRef.getZoom(),
      bearing: this.mapRef.getBearing(),
      pitch: this.mapRef.getPitch(),
    };
  }

  setCamera(next: Partial<CameraState>): void {
    this.mapRef.jumpTo({
      center:
        next.lng !== undefined && next.lat !== undefined ? [next.lng, next.lat] : undefined,
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

  destroy(): void {}
}
