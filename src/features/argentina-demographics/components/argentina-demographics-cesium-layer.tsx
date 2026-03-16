import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useCesium } from 'resium';
import { useArgentinaDemographicsData } from '../hooks/use-argentina-demographics-data';
import { rankToRgba } from '../utils/rank-color';

function getEntityProp(entity: Cesium.Entity, name: string): string | number | undefined {
  const p = (entity.properties as Record<string, { getValue?: () => unknown }>)?.[name];
  if (!p) return undefined;
  const v = typeof (p as { getValue?: () => unknown }).getValue === 'function'
    ? (p as { getValue: () => unknown }).getValue()
    : p;
  return v as string | number | undefined;
}

/**
 * Cesium analog to the deck.gl Argentina demographics layer.
 * City-level (localidades) by population.
 */
export function ArgentinaDemographicsCesiumLayer() {
  const { viewer } = useCesium();
  const { geojson, populationExtent, loading, error } = useArgentinaDemographicsData();
  const dataSourceRef = useRef<Cesium.GeoJsonDataSource | null>(null);
  const n = geojson?.features?.length ?? 0;

  useEffect(() => {
    if (!viewer || !geojson || loading || error || n < 2) return;

    const [minPop, maxPop] = populationExtent;
    let cancelled = false;
    const dataSourcePromise = Cesium.GeoJsonDataSource.load(geojson, {
      stroke: Cesium.Color.BLACK,
      strokeWidth: 1,
      fill: Cesium.Color.WHITE.withAlpha(0.5),
      clampToGround: true,
    });

    dataSourcePromise.then((dataSource) => {
      if (cancelled || !viewer) return;
      dataSourceRef.current = dataSource;
      viewer.dataSources.add(dataSource);

      const rectangle = Cesium.Rectangle.fromDegrees(-73.5, -55, -53.5, -21);
      viewer.camera.flyTo({ destination: rectangle, duration: 1 });

      const entities = dataSource.entities.values;
      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const nombre = String(getEntityProp(entity, 'nombre') ?? entity.name ?? '');
        const provincia = getEntityProp(entity, 'provincia');
        const pop = Number(getEntityProp(entity, 'poblacion') ?? 0);
        const rank = Number(getEntityProp(entity, 'rank') ?? 1);
        const colorT = (rank - 1) / (n - 1);
        const [r, g, b, a] = rankToRgba(colorT);
        const color = Cesium.Color.fromBytes(r, g, b, a);
        const outlineColor = Cesium.Color.BLACK.withAlpha(0.5);

        const sizeT = maxPop > minPop ? (pop - minPop) / (maxPop - minPop) : 0;
        const radiusMeters = 15000 + sizeT * 120000;

        if (entity.polygon) {
          entity.polygon.material = new Cesium.ColorMaterialProperty(color);
          entity.polygon.outline = new Cesium.ConstantProperty(true);
          entity.polygon.outlineColor = new Cesium.ConstantProperty(outlineColor);
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
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          });
        } else if (entity.ellipse) {
          entity.ellipse.semiMajorAxis = new Cesium.ConstantProperty(radiusMeters);
          entity.ellipse.semiMinorAxis = new Cesium.ConstantProperty(radiusMeters);
          entity.ellipse.material = new Cesium.ColorMaterialProperty(color);
          entity.ellipse.outline = new Cesium.ConstantProperty(true);
          entity.ellipse.outlineColor = new Cesium.ConstantProperty(outlineColor);
        }

        const provLabel = provincia ? `, ${provincia}` : '';
        const description = `${nombre}${provLabel}<br/><strong>${pop.toLocaleString('es-AR')}</strong> hab. (Censo 2022)`;
        entity.description = new Cesium.ConstantProperty(description);
      }
    });

    return () => {
      cancelled = true;
      const ds = dataSourceRef.current;
      if (ds && viewer?.dataSources?.contains(ds)) {
        viewer.dataSources.remove(ds);
      }
      dataSourceRef.current = null;
    };
  }, [viewer, geojson, populationExtent, loading, error, n]);

  return null;
}
