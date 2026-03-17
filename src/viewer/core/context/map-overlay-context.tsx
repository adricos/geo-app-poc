import { createContext, type ReactNode } from 'react';
import type { Bounds } from '@/viewer/core/types/geo.types';

export interface MapOverlayViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

export type MapPointerMoveHandler = ((x: number, y: number) => void) | null;

export interface MapOverlayContextValue {
  viewState: MapOverlayViewState | null;
  width: number;
  height: number;
  requestFitBounds: (bounds: Bounds, options?: { padding?: number; maxZoom?: number }) => void;
  /** Register a handler to be called on map pointer move (x, y in overlay pixels). Call with null to unregister. */
  setMapPointerMoveHandler: (handler: MapPointerMoveHandler) => void;
}

export const MapOverlayContext = createContext<MapOverlayContextValue | null>(null);

interface MapOverlayProviderProps {
  value: MapOverlayContextValue;
  children: ReactNode;
}

export function MapOverlayProvider({ value, children }: MapOverlayProviderProps) {
  return (
    <MapOverlayContext.Provider value={value}>
      {children}
    </MapOverlayContext.Provider>
  );
}
