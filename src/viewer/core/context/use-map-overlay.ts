import { useContext } from 'react';
import { MapOverlayContext } from './map-overlay-context';
import type { MapOverlayContextValue } from './map-overlay-context';

export function useMapOverlay(): MapOverlayContextValue | null {
  return useContext(MapOverlayContext);
}
