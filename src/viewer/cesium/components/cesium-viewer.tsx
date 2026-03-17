import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { Viewer, ImageryLayer, useCesium } from 'resium';
import type { ImageryProvider } from 'cesium';
import { env } from '@/shared/config/env';
import { useViewerStore } from '@/shared/state/viewer-store';
import { useCesiumViewerAdapter } from '@/viewer/cesium/hooks/use-cesium-viewer-adapter';
import { createCesiumImageryProvider } from '@/viewer/cesium/config/cesium-imagery-presets';
import { CesiumMapControlsWidget } from '@/viewer/cesium/components/cesium-map-controls-widget';
import {
  cesiumPickedToSelectedFeature,
  cesiumGlobePickToFeature,
} from '@/viewer/cesium/utils/cesium-pick-to-feature';

if (env.cesiumIonAccessToken) {
  Cesium.Ion.defaultAccessToken = env.cesiumIonAccessToken;
}
if (env.arcgisAccessToken) {
  Cesium.ArcGisMapService.defaultAccessToken = env.arcgisAccessToken;
}

interface CesiumViewerInnerProps {
  children?: ReactNode;
}

function CesiumViewerInner({ children }: CesiumViewerInnerProps) {
  const { viewer } = useCesium();
  const setSelectedFeature = useViewerStore((s) => s.setSelectedFeature);
  useCesiumViewerAdapter(viewer);

  useEffect(() => {
    if (!viewer) return;
    const handler = viewer.screenSpaceEventHandler;
    const action = (movement: { position: Cesium.Cartesian2 }) => {
      const picked = viewer.scene.pick(movement.position);
      let feature = cesiumPickedToSelectedFeature(picked);
      if (!feature) {
        feature = cesiumGlobePickToFeature(viewer.scene, movement.position);
      }
      setSelectedFeature(feature);
    };
    handler.setInputAction(action, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    return () => handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }, [viewer, setSelectedFeature]);

  return (
    <>
      <CesiumMapControlsWidget />
      {children}
    </>
  );
}

interface CesiumViewerProps {
  children?: ReactNode;
}

/** Delay mounting Cesium Viewer until the container has non-zero size to avoid WebGL context/resize errors (e.g. maxTextureDimension2D). */
export function CesiumViewer({ children }: CesiumViewerProps) {
  const mapStyleKeyCesium = useViewerStore((s) => s.mapStyleKeyCesium);
  const [imageryProvider, setImageryProvider] = useState<ImageryProvider | null>(null);
  const [containerReady, setContainerReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const result = createCesiumImageryProvider(mapStyleKeyCesium);
    if (result instanceof Promise) {
      let cancelled = false;
      result.then((p) => {
        if (!cancelled) setImageryProvider(p);
      });
      return () => {
        cancelled = true;
      };
    }
    setImageryProvider(result);
    return undefined;
  }, [mapStyleKeyCesium]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let fallbackId: number | null = null;
    const checkSize = () => {
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        if (fallbackId != null) window.clearTimeout(fallbackId);
        setContainerReady(true);
        return true;
      }
      return false;
    };
    if (checkSize()) return;
    const ro = new ResizeObserver(() => {
      if (checkSize()) ro.disconnect();
    });
    ro.observe(el);
    fallbackId = window.setTimeout(() => {
      fallbackId = null;
      setContainerReady(true);
    }, 100);
    return () => {
      ro.disconnect();
      if (fallbackId != null) window.clearTimeout(fallbackId);
    };
  }, []);

  return (
    <div ref={containerRef} className="map-root" role="application" aria-label="3D Map">
      {containerReady && (
        <Viewer full baseLayer={false} infoBox={false}>
          {imageryProvider && (
            <ImageryLayer key={mapStyleKeyCesium} imageryProvider={imageryProvider} />
          )}
          <CesiumViewerInner>{children}</CesiumViewerInner>
        </Viewer>
      )}
    </div>
  );
}
