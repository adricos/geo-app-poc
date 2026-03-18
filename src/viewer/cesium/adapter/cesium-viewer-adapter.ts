import type { Viewer } from 'cesium';
import * as Cesium from 'cesium';
import type { ViewerAdapter } from '@/viewer/core/contracts/viewer-adapter';
import type { CameraState } from '@/viewer/core/types/geo.types';

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
    return {
      lng,
      lat,
      zoom: heightToZoom(carto.height, lat),
      bearing: Cesium.Math.toDegrees(cam.heading),
      pitch: Cesium.Math.toDegrees(cam.pitch),
    };
  }

  setCamera(next: Partial<CameraState>): void {
    const cam = this.viewer.scene.camera;
    const cur = this.getCamera();
    const lng = next.lng ?? cur.lng;
    const lat = next.lat ?? cur.lat;
    const zoom = next.zoom ?? cur.zoom;
    const position = Cesium.Cartesian3.fromDegrees(lng, lat, zoomToHeight(zoom, lat));
    cam.setView({
      destination: position,
      orientation: {
        heading: next.bearing != null ? next.bearing * DEG2RAD : cam.heading,
        pitch: next.pitch != null ? next.pitch * DEG2RAD : cam.pitch,
        roll: cam.roll,
      },
    });
  }

  flyTo(target: Partial<CameraState> & { lng: number; lat: number }): void {
    const cam = this.viewer.scene.camera;
    const height =
      target.zoom != null ? zoomToHeight(target.zoom, target.lat) : 1500;
    cam.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(target.lng, target.lat, height),
      orientation: {
        heading: target.bearing != null ? target.bearing * DEG2RAD : 0,
        pitch: target.pitch != null ? target.pitch * DEG2RAD : -90 * DEG2RAD,
        roll: 0,
      },
      duration: 1.5,
    });
  }

  destroy(): void {}
}
