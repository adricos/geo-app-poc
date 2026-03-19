import * as Cesium from 'cesium';
import { rankToRgba } from './rank-color';

const TOOLTIP_OFFSET = 12;
const TOOLTIP_HIDE_DELAY_MS = 80;
/** Scale fill alpha so Cesium matches deck.gl visual (Cesium tends to appear more opaque). */
const CESIUM_FILL_ALPHA_SCALE = 0.8;
/** Radius range in meters; kept small so circles don't overlap into huge blobs (deck.gl uses 10–52 px). */
const RADIUS_METERS_MIN = 2000;
const RADIUS_METERS_MAX = 100000;

const ARGENTINA_RECTANGLE_DEGREES = {
  west: -73.5,
  south: -55,
  east: -53.5,
  north: -21,
} as const;

function getEntityProp(entity: Cesium.Entity, name: string): string | number | undefined {
  const p = (entity.properties as Record<string, { getValue?: () => unknown }>)?.[name];
  if (!p) return undefined;
  const v =
    typeof (p as { getValue?: () => unknown }).getValue === 'function'
      ? (p as { getValue: () => unknown }).getValue()
      : p;
  return v as string | number | undefined;
}

function formatTooltipFromEntity(entity: Cesium.Entity): string {
  const nombre = String(getEntityProp(entity, 'nombre') ?? entity.name ?? 'Unknown');
  const provincia = getEntityProp(entity, 'provincia');
  const pop = Number(getEntityProp(entity, 'poblacion') ?? 0);
  const label = provincia ? `${nombre}, ${provincia}` : nombre;
  return `${label}: ${pop.toLocaleString('es-AR')} hab.`;
}

export function getPopulationExtent(geojson: {
  features: Array<{ properties?: unknown }>;
}): [number, number] {
  const pops = geojson.features
    .map((f) => (f.properties as { poblacion?: number } | null)?.poblacion)
    .filter((p): p is number => typeof p === 'number');
  if (pops.length === 0) return [0, 1];
  return [Math.min(...pops), Math.max(...pops)];
}

function removeDataSource(
  viewer: Cesium.Viewer | undefined,
  dataSource: Cesium.GeoJsonDataSource | null,
): void {
  if (!viewer || !dataSource) return;
  if (viewer.dataSources.contains(dataSource)) {
    viewer.dataSources.remove(dataSource);
  }
}

/** Stops picking tooltips for this layer (MOUSE_MOVE). Safe if handler missing. */
function removeDemographicsMouseMoveHandler(viewer: Cesium.Viewer | undefined): void {
  viewer?.screenSpaceEventHandler?.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}

export function detachArgentinaDemographicsLayer(
  viewer: Cesium.Viewer | undefined,
  dataSource: Cesium.GeoJsonDataSource | null,
): void {
  removeDataSource(viewer, dataSource);
  removeDemographicsMouseMoveHandler(viewer);
}

function pickEntityInDataSource(
  viewer: Cesium.Viewer,
  screenPosition: Cesium.Cartesian2,
  dataSource: Cesium.GeoJsonDataSource,
): Cesium.Entity | null {
  const picked = viewer.scene.pick(screenPosition);
  const rawEntity =
    picked && Cesium.defined(picked)
      ? picked instanceof Cesium.Entity
        ? picked
        : (picked as { id?: Cesium.Entity }).id
      : undefined;
  return rawEntity instanceof Cesium.Entity && dataSource.entities.contains(rawEntity)
    ? rawEntity
    : null;
}

/**
 * Styles GeoJSON-loaded entities: rank-based fill, population-scaled ellipses, description HTML.
 */
export function styleArgentinaDemographicsEntities(
  dataSource: Cesium.GeoJsonDataSource,
  entityCount: number,
  populationExtent: [number, number],
): void {
  const [minPop, maxPop] = populationExtent;
  const n = entityCount;
  const entities = dataSource.entities.values;

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const nombre = String(getEntityProp(entity, 'nombre') ?? entity.name ?? '');
    const provincia = getEntityProp(entity, 'provincia');
    const pop = Number(getEntityProp(entity, 'poblacion') ?? 0);
    const rank = Number(getEntityProp(entity, 'rank') ?? 1);
    const colorT = (rank - 1) / (n - 1);
    const [r, g, b, a] = rankToRgba(colorT);
    const fillAlpha = Math.round(a * CESIUM_FILL_ALPHA_SCALE);
    const color = Cesium.Color.fromBytes(r, g, b, fillAlpha);
    const outlineColor = Cesium.Color.BLACK;
    const outlineWidth = 2;

    const sizeT = maxPop > minPop ? (pop - minPop) / (maxPop - minPop) : 0;
    const radiusMeters = RADIUS_METERS_MIN + sizeT * (RADIUS_METERS_MAX - RADIUS_METERS_MIN);

    if (entity.polygon) {
      entity.polygon.material = new Cesium.ColorMaterialProperty(color);
      entity.polygon.outline = new Cesium.ConstantProperty(true);
      entity.polygon.outlineColor = new Cesium.ConstantProperty(outlineColor);
      entity.polygon.outlineWidth = new Cesium.ConstantProperty(outlineWidth);
    }
    if (entity.position) {
      if (entity.billboard) {
        entity.billboard.show = new Cesium.ConstantProperty(false);
      }
      if (entity.point) {
        entity.point.show = new Cesium.ConstantProperty(false);
      }
      entity.ellipse = new Cesium.EllipseGraphics({
        semiMajorAxis: new Cesium.ConstantProperty(radiusMeters),
        semiMinorAxis: new Cesium.ConstantProperty(radiusMeters),
        material: new Cesium.ColorMaterialProperty(color),
        outline: new Cesium.ConstantProperty(true),
        outlineColor: new Cesium.ConstantProperty(outlineColor),
        outlineWidth: new Cesium.ConstantProperty(outlineWidth),
        height: new Cesium.ConstantProperty(0),
      });
    } else if (entity.ellipse) {
      entity.ellipse.semiMajorAxis = new Cesium.ConstantProperty(radiusMeters);
      entity.ellipse.semiMinorAxis = new Cesium.ConstantProperty(radiusMeters);
      entity.ellipse.material = new Cesium.ColorMaterialProperty(color);
      entity.ellipse.outline = new Cesium.ConstantProperty(true);
      entity.ellipse.outlineColor = new Cesium.ConstantProperty(outlineColor);
      entity.ellipse.outlineWidth = new Cesium.ConstantProperty(outlineWidth);
      entity.ellipse.height = new Cesium.ConstantProperty(0);
    }

    const provLabel = provincia ? `, ${provincia}` : '';
    const description = `${nombre}${provLabel}<br/><strong>${pop.toLocaleString('es-AR')}</strong> hab. (Censo 2022)`;
    entity.description = new Cesium.ConstantProperty(description);
  }
}

export function flyToArgentinaBoundsOnce(
  viewer: Cesium.Viewer,
  hasFlownRef: { current: boolean },
): void {
  if (hasFlownRef.current) return;
  hasFlownRef.current = true;
  const rectangle = Cesium.Rectangle.fromDegrees(
    ARGENTINA_RECTANGLE_DEGREES.west,
    ARGENTINA_RECTANGLE_DEGREES.south,
    ARGENTINA_RECTANGLE_DEGREES.east,
    ARGENTINA_RECTANGLE_DEGREES.north,
  );
  viewer.camera.flyTo({ destination: rectangle, duration: 1 });
}

type HideTooltipTimeoutRef = { current: ReturnType<typeof setTimeout> | null };

/**
 * MOUSE_MOVE handler: show tooltip over our entities; delayed hide when pointer leaves.
 */
export function createDemographicsTooltipMouseAction(
  viewer: Cesium.Viewer,
  dataSource: Cesium.GeoJsonDataSource,
  hideTimeoutRef: HideTooltipTimeoutRef,
  isEffectCancelled: () => boolean,
  setTooltip: (value: { text: string; x: number; y: number } | null) => void,
): (movement: { endPosition: Cesium.Cartesian2 }) => void {
  return (movement) => {
    if (isEffectCancelled()) return;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    const entity = pickEntityInDataSource(viewer, movement.endPosition, dataSource);
    if (entity) {
      setTooltip({
        text: formatTooltipFromEntity(entity),
        x: movement.endPosition.x + TOOLTIP_OFFSET,
        y: movement.endPosition.y + TOOLTIP_OFFSET,
      });
    } else {
      hideTimeoutRef.current = setTimeout(() => {
        hideTimeoutRef.current = null;
        setTooltip(null);
      }, TOOLTIP_HIDE_DELAY_MS);
    }
  };
}
