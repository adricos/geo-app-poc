import { useEffect, useMemo } from 'react';
import * as Cesium from 'cesium';
import { Viewer, ImageryLayer, useCesium } from 'resium';
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

function CesiumViewerInner() {
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

  return <CesiumMapControlsWidget />;
}

export function CesiumViewer() {
  const mapStyleKeyCesium = useViewerStore((s) => s.mapStyleKeyCesium);

  const imageryProvider = useMemo(
    () => createCesiumImageryProvider(mapStyleKeyCesium),
    [mapStyleKeyCesium],
  );

  return (
    <div className="map-root" role="application" aria-label="3D Map">
      <Viewer full>
        <ImageryLayer imageryProvider={imageryProvider} />
        <CesiumViewerInner />
      </Viewer>
    </div>
  );
}
