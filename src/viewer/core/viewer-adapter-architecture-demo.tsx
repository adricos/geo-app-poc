import { useViewerStore } from '@/shared/state/viewer-store';

/** POC: any feature can call the active engine via {@link ViewerAdapter} (flyTo, getCamera, …). */
export function ViewerAdapterArchitectureDemo() {
  const adapter = useViewerStore((s) => s.adapter);

  return (
    <section className="viewer-adapter-demo" aria-labelledby="viewer-adapter-demo-title">
      <h2 id="viewer-adapter-demo-title" className="viewer-adapter-demo__title">
        Viewer adapter
      </h2>
      <p className="viewer-adapter-demo__text">
        <code>ViewerAdapter</code> in <code>viewer/core/contracts</code> — implementations in{' '}
        <code>maplibre/</code>, <code>mapbox/</code>, <code>cesium/</code>. The store holds whichever
        viewer is mounted.
      </p>
      <button
        type="button"
        className="viewer-adapter-demo__btn"
        disabled={!adapter}
        onClick={() => {
          adapter?.flyTo({ lng: -58.3816, lat: -34.6037, zoom: 16 });
        }}
      >
        Fly to Obelisco (via adapter)
      </button>
      {!adapter && (
        <p className="viewer-adapter-demo__muted">Switch away and back if the map is still loading.</p>
      )}
    </section>
  );
}
