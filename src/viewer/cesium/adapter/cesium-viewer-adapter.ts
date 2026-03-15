import type { Viewer } from 'cesium';
import * as Cesium from 'cesium';
import type { ViewerAdapter, ViewerFeature } from '@/viewer/core/contracts/viewer-adapter';
import type { Bounds, CameraState } from '@/viewer/core/types/geo.types';

const WGS84_RADIUS = 6378137;
const DEG2RAD = Math.PI / 180;

function heightToZoom(heightMeters: number, latDeg: number): number {
  const cosLat = Math.cos(latDeg * DEG2RAD);
  const tilesAtZoom0 = (2 * Math.PI * WGS84_RADIUS * cosLat) / 256;
  const zoom = Math.log2((tilesAtZoom0 * 2) / (heightMeters / 256));
  return Math.max(0, Math.min(25, zoom));
}

function zoomToHeight(zoom: number, latDeg: number): number {
  const cosLat = Math.cos(latDeg * DEG2RAD);
  const tilesAtZoom0 = (2 * Math.PI * WGS84_RADIUS * cosLat) / 256;
  return (tilesAtZoom0 * 2) / Math.pow(2, zoom);
}

export class CesiumViewerAdapter implements ViewerAdapter {
  constructor(private readonly viewer: Viewer) {}

  getCamera(): CameraState {
    const cam = this.viewer.scene.camera;
    const carto = cam.positionCartographic;
    const lng = Cesium.Math.toDegrees(carto.longitude);
    const lat = Cesium.Math.toDegrees(carto.latitude);
    const height = carto.height;
    const zoom = heightToZoom(height, lat);
    const heading = cam.heading;
    const pitch = cam.pitch;
    const bearing = Cesium.Math.toDegrees(heading);
    const pitchDeg = Cesium.Math.toDegrees(pitch);
    return {
      lng,
      lat,
      zoom,
      bearing,
      pitch: pitchDeg,
    };
  }

  setCamera(next: Partial<CameraState>): void {
    const cam = this.viewer.scene.camera;
    const current = this.getCamera();
    const lng = next.lng ?? current.lng;
    const lat = next.lat ?? current.lat;
    const zoom = next.zoom ?? current.zoom;
    const height = zoomToHeight(zoom, lat);
    const position = Cesium.Cartesian3.fromDegrees(lng, lat, height);
    cam.setView({
      destination: position,
      orientation: {
        heading: next.bearing != null ? (next.bearing * DEG2RAD) : cam.heading,
        pitch: next.pitch != null ? (next.pitch * DEG2RAD) : cam.pitch,
        roll: cam.roll,
      },
    });
  }

  flyTo(target: Partial<CameraState> & { lng: number; lat: number }): void {
    const cam = this.viewer.scene.camera;
    const height = target.zoom != null ? zoomToHeight(target.zoom, target.lat) : 10000;
    const destination = Cesium.Cartesian3.fromDegrees(target.lng, target.lat, height);
    cam.flyTo({
      destination,
      orientation: {
        heading: target.bearing != null ? target.bearing * DEG2RAD : 0,
        pitch: target.pitch != null ? target.pitch * DEG2RAD : -90 * DEG2RAD,
        roll: 0,
      },
      duration: 1.5,
    });
  }

  fitBounds(bounds: Bounds, _options?: { padding?: number; maxZoom?: number }): void {
    const [west, south, east, north] = bounds;
    const rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);
    this.viewer.camera.flyTo({
      destination: rectangle,
      duration: 1,
    });
  }

  highlightFeatures(_features: ViewerFeature[]): void {
    // Placeholder.
  }

  clearHighlights(): void {
    // Placeholder.
  }

  destroy(): void {
    // Viewer is owned by React/Resium.
  }
}
