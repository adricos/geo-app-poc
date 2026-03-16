import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import type { Bounds } from '@/viewer/core/types/geo.types';

export interface MapOverlayViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

export interface MapOverlayContextValue {
  viewState: MapOverlayViewState | null;
  width: number;
  height: number;
  requestFitBounds: (bounds: Bounds, options?: { padding?: number; maxZoom?: number }) => void;
}

const MapOverlayContext = createContext<MapOverlayContextValue | null>(null);

export function useMapOverlay(): MapOverlayContextValue | null {
  return useContext(MapOverlayContext);
}

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
