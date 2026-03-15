export interface LngLat {
  lng: number;
  lat: number;
}

export interface CameraState extends LngLat {
  zoom: number;
  bearing?: number;
  pitch?: number;
}

export type Bounds = [west: number, south: number, east: number, north: number];
