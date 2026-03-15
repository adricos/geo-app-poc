import type { ViewerLayerDefinition } from '@/viewer/core/contracts/viewer-layer';

export class ViewerRegistry {
  private readonly layers = new Map<string, ViewerLayerDefinition>();

  registerLayer(layer: ViewerLayerDefinition) {
    this.layers.set(layer.id, layer);
  }

  getLayer(id: string) {
    return this.layers.get(id) ?? null;
  }

  listLayers() {
    return Array.from(this.layers.values());
  }
}
