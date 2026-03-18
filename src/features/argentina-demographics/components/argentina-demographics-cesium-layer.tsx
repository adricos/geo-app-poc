import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { useCesium } from 'resium';
import { useViewerStore } from '@/shared/state/viewer-store';
import { useArgentinaDemographicsData } from '../hooks/use-argentina-demographics-data';
import {
  createDemographicsTooltipMouseAction,
  detachArgentinaDemographicsLayer,
  flyToArgentinaBoundsOnce,
  getPopulationExtent,
  styleArgentinaDemographicsEntities,
} from '../utils/argentina-demographics-cesium-layer-utils';
import './argentina-demographics-tooltip.css';

function shouldShowArgentinaDemographicsLayer(
  enabled: boolean,
  geojson: unknown,
  loading: boolean,
  error: unknown,
  featureCount: number,
): geojson is NonNullable<typeof geojson> {
  return Boolean(enabled && geojson && !loading && !error && featureCount >= 2);
}

/**
 * Cesium analog to the deck.gl Argentina demographics layer.
 * City-level (localidades) by population.
 */
export function ArgentinaDemographicsCesiumLayer() {
  const { viewer } = useCesium();
  const enabled = useViewerStore((s) => s.argentinaDemographicsEnabled);
  const { geojson, loading, error } = useArgentinaDemographicsData();
  const dataSourceRef = useRef<Cesium.GeoJsonDataSource | null>(null);
  const cancelledRef = useRef(false);
  const clearTooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFlownToRef = useRef(false);
  /** Incremented each effect run so only the latest run's promise adds the layer (avoids stale add after viewer switch). */
  const runIdRef = useRef(0);
  const n = geojson?.features?.length ?? 0;
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!viewer) return;

    if (!shouldShowArgentinaDemographicsLayer(enabled, geojson, loading, error, n)) {
      detachArgentinaDemographicsLayer(viewer, dataSourceRef.current);
      dataSourceRef.current = null;
      return;
    }

    const prev = dataSourceRef.current;
    detachArgentinaDemographicsLayer(viewer, prev);
    dataSourceRef.current = null;

    runIdRef.current += 1;
    const currentRunId = runIdRef.current;
    const populationExtent = getPopulationExtent(geojson);
    cancelledRef.current = false;

    const dataSourcePromise = Cesium.GeoJsonDataSource.load(geojson, {
      stroke: Cesium.Color.BLACK,
      strokeWidth: 1,
      fill: Cesium.Color.WHITE.withAlpha(0.5),
      clampToGround: true,
    });

    dataSourcePromise.then((dataSource) => {
      if (currentRunId !== runIdRef.current || !viewer) return;
      dataSourceRef.current = dataSource;
      viewer.dataSources.add(dataSource);

      flyToArgentinaBoundsOnce(viewer, hasFlownToRef);
      styleArgentinaDemographicsEntities(dataSource, n, populationExtent);

      const action = createDemographicsTooltipMouseAction(
        viewer,
        dataSource,
        clearTooltipTimeoutRef,
        () => cancelledRef.current,
        setTooltip,
      );
      viewer.screenSpaceEventHandler.setInputAction(action, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    });

    return () => {
      cancelledRef.current = true;
      if (clearTooltipTimeoutRef.current) {
        clearTimeout(clearTooltipTimeoutRef.current);
        clearTooltipTimeoutRef.current = null;
      }
      setTooltip(null);
      detachArgentinaDemographicsLayer(viewer, dataSourceRef.current);
      dataSourceRef.current = null;
    };
  }, [viewer, geojson, loading, error, n, enabled]);

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
