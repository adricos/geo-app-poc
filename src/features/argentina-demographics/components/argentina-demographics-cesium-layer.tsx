import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { useCesium } from 'resium';
import { useArgentinaDemographicsData } from '../hooks/use-argentina-demographics-data';
import { rankToRgba } from '../utils/rank-color';
import './argentina-demographics-tooltip.css';

const TOOLTIP_OFFSET = 12;
const TOOLTIP_HIDE_DELAY_MS = 80;
/** Scale fill alpha so Cesium matches deck.gl visual (Cesium tends to appear more opaque). */
const CESIUM_FILL_ALPHA_SCALE = 0.8;
/** Radius range in meters; kept small so circles don't overlap into huge blobs (deck.gl uses 10–52 px). */
const RADIUS_METERS_MIN = 2000;
const RADIUS_METERS_MAX = 100000;

function getEntityProp(entity: Cesium.Entity, name: string): string | number | undefined {
  const p = (entity.properties as Record<string, { getValue?: () => unknown }>)?.[name];
  if (!p) return undefined;
  const v = typeof (p as { getValue?: () => unknown }).getValue === 'function'
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

function getPopulationExtent(geojson: { features: Array<{ properties?: unknown }> }): [number, number] {
  const pops = geojson.features
    .map((f) => (f.properties as { poblacion?: number } | null)?.poblacion)
    .filter((p): p is number => typeof p === 'number');
  if (pops.length === 0) return [0, 1];
  return [Math.min(...pops), Math.max(...pops)];
}

/**
 * Cesium analog to the deck.gl Argentina demographics layer.
 * City-level (localidades) by population.
 */
export function ArgentinaDemographicsCesiumLayer() {
  const { viewer } = useCesium();
  const { geojson, loading, error } = useArgentinaDemographicsData();
  const dataSourceRef = useRef<Cesium.GeoJsonDataSource | null>(null);
  const cancelledRef = useRef(false);
  const clearTooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFlownToRef = useRef(false);
  const n = geojson?.features?.length ?? 0;
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!viewer || !geojson || loading || error || n < 2) return;

    const [minPop, maxPop] = getPopulationExtent(geojson);
    cancelledRef.current = false;
    const dataSourcePromise = Cesium.GeoJsonDataSource.load(geojson, {
      stroke: Cesium.Color.BLACK,
      strokeWidth: 1,
      fill: Cesium.Color.WHITE.withAlpha(0.5),
      clampToGround: true,
    });

    dataSourcePromise.then((dataSource) => {
      if (cancelledRef.current || !viewer) return;
      dataSourceRef.current = dataSource;
      viewer.dataSources.add(dataSource);

      if (!hasFlownToRef.current) {
        hasFlownToRef.current = true;
        const rectangle = Cesium.Rectangle.fromDegrees(-73.5, -55, -53.5, -21);
        viewer.camera.flyTo({ destination: rectangle, duration: 1 });
      }

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
        const outlineColor = Cesium.Color.WHITE;
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

      const handler = viewer.screenSpaceEventHandler;
      const action = (movement: { endPosition: Cesium.Cartesian2 }) => {
        if (cancelledRef.current) return;
        if (clearTooltipTimeoutRef.current) {
          clearTimeout(clearTooltipTimeoutRef.current);
          clearTooltipTimeoutRef.current = null;
        }
        const picked = viewer.scene.pick(movement.endPosition);
        const rawEntity = picked && Cesium.defined(picked) ? (picked instanceof Cesium.Entity ? picked : (picked as { id?: Cesium.Entity }).id) : undefined;
        const entity =
          rawEntity instanceof Cesium.Entity && dataSource.entities.contains(rawEntity) ? rawEntity : null;
        if (entity) {
          setTooltip({
            text: formatTooltipFromEntity(entity),
            x: movement.endPosition.x + TOOLTIP_OFFSET,
            y: movement.endPosition.y + TOOLTIP_OFFSET,
          });
        } else {
          clearTooltipTimeoutRef.current = setTimeout(() => {
            clearTooltipTimeoutRef.current = null;
            setTooltip(null);
          }, TOOLTIP_HIDE_DELAY_MS);
        }
      };
      handler.setInputAction(action, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    });

    return () => {
      cancelledRef.current = true;
      if (clearTooltipTimeoutRef.current) {
        clearTimeout(clearTooltipTimeoutRef.current);
        clearTooltipTimeoutRef.current = null;
      }
      setTooltip(null);
      const ds = dataSourceRef.current;
      if (ds && viewer?.dataSources?.contains(ds)) {
        viewer.dataSources.remove(ds);
      }
      dataSourceRef.current = null;
      if (viewer?.screenSpaceEventHandler) {
        viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      }
    };
  }, [viewer, geojson, loading, error, n]);

  if (!tooltip) return null;
  return (
    <div
      className="argentina-demographics-tooltip"
      role="tooltip"
      style={{ left: tooltip.x, top: tooltip.y }}
    >
      {tooltip.text}
    </div>
  );
}
