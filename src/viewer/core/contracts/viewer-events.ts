import type { LngLat } from '@/viewer/core/types/geo.types';

export interface ViewerClickEvent {
  screen: { x: number; y: number };
  location: LngLat;
}

export interface ViewerMoveEndEvent {
  center: LngLat;
  zoom: number;
}
