export interface ViewerRuntimeState {
  ready: boolean;
  engine: 'maplibre' | 'cesium';
}

/** Feature picked from the map (e.g. via queryRenderedFeatures). Used by property insights. */
export interface SelectedMapFeature {
  id: string;
  source: string;
  sourceLayer?: string;
  layer?: string;
  properties: Record<string, unknown>;
}
