import * as Cesium from 'cesium';
import type { SelectedMapFeature } from '@/viewer/core/types/viewer.types';

/**
 * Map a Cesium picked object (from scene.pick) to SelectedMapFeature for the property insights panel.
 * Returns null if the picked object should not show details (e.g. globe with no metadata).
 */
export function cesiumPickedToSelectedFeature(picked: unknown): SelectedMapFeature | null {
  if (picked == null || !Cesium.defined(picked)) return null;

  if (picked instanceof Cesium.Entity) {
    const entity = picked as Cesium.Entity;
    const desc =
      entity.description && typeof entity.description.getValue === 'function'
        ? entity.description.getValue(Cesium.JulianDate.now())
        : undefined;
    const properties: Record<string, unknown> = {
      id: entity.id,
      name: entity.name ?? undefined,
      ...(desc != null && desc !== '' && { description: desc }),
    };
    return {
      id: String(entity.id ?? ''),
      source: 'entity',
      layer: entity.name ?? 'Entity',
      properties,
    };
  }

  if (picked instanceof Cesium.Cesium3DTileFeature) {
    const feature = picked as Cesium.Cesium3DTileFeature;
    const ids = feature.getPropertyIds();
    const properties: Record<string, unknown> = {};
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const value = feature.getProperty(id);
      if (value !== undefined && value !== null) properties[id] = value;
    }
    const tilesetName =
      feature.tileset?.url != null
        ? feature.tileset.url.split('/').pop() ?? '3D Tiles'
        : '3D Tiles';
    return {
      id: String(feature.featureId ?? ''),
      source: '3dtiles',
      sourceLayer: tilesetName,
      layer: tilesetName,
      properties: Object.keys(properties).length > 0 ? properties : { featureId: feature.featureId },
    };
  }

  // Other primitives (e.g. Globe): caller can use cesiumGlobePickToFeature(scene, position).
  return null;
}

/**
 * Build SelectedMapFeature for a globe/terrain pick (no entity or 3D Tiles feature).
 * Tries scene.pickPosition first (depth buffer), then ray + globe.pick.
 */
export function cesiumGlobePickToFeature(
  scene: Cesium.Scene,
  position: Cesium.Cartesian2,
): SelectedMapFeature | null {
  let cartesian: Cesium.Cartesian3 | undefined;

  if (scene.pickPositionSupported) {
    cartesian = scene.pickPosition(position) ?? undefined;
  }
  if (!cartesian) {
    const ray = scene.camera.getPickRay(position);
    if (!ray) return null;
    cartesian = scene.globe.pick(ray, scene) ?? undefined;
  }
  if (!cartesian) return null;

  const carto = Cesium.Cartographic.fromCartesian(cartesian);
  const lat = Cesium.Math.toDegrees(carto.latitude);
  const lng = Cesium.Math.toDegrees(carto.longitude);
  const height = carto.height;
  return {
    id: 'globe',
    source: 'globe',
    layer: 'Globe',
    properties: { latitude: lat, longitude: lng, height },
  };
}
