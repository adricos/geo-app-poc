import type { ViewerLayerDefinition } from '@/viewer/core/contracts/viewer-layer';

export class ViewerRegistry {
  private readonly layers = new Map<string, ViewerLayerDefinition>();

  registerLayer(layer: ViewerLayerDefinition) {
    this.layers.set(layer.id, layer);
  }
}
