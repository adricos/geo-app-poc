export interface ViewerLayerDefinition {
  id: string;
  type: 'fill' | 'line' | 'symbol' | 'circle' | 'raster' | 'custom';
  sourceId: string;
  visible?: boolean;
}
