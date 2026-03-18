import { useEffect, useMemo } from 'react';
import type { Viewer } from 'cesium';
import { useViewerStore } from '@/shared/state/viewer-store';
import { CesiumViewerAdapter } from '@/viewer/cesium/adapter/cesium-viewer-adapter';

export function useCesiumViewerAdapter(viewer: Viewer | undefined) {
  const setAdapter = useViewerStore((s) => s.setAdapter);
  const adapter = useMemo(
    () => (viewer ? new CesiumViewerAdapter(viewer) : null),
    [viewer],
  );
  useEffect(() => {
    setAdapter(adapter);
    return () => {
      adapter?.destroy();
      setAdapter(null);
    };
  }, [adapter, setAdapter]);
  return adapter;
}
