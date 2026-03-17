import { useViewerStore } from '@/shared/state/viewer-store';

type ViewerType = 'maplibre' | 'mapbox' | 'cesium';

type DrawingMode = 'point' | 'linestring' | 'polygon';

interface DrawingControlProps {
  viewerType?: ViewerType;
}

/**
 * Sidebar control: toggle Terra Draw and select draw mode (point, line, polygon).
 * Only active on MapLibre and Mapbox; shows a message when Cesium is selected.
 */
export function DrawingControl({ viewerType = 'maplibre' }: DrawingControlProps) {
  const enabled = useViewerStore((s) => s.drawingEnabled);
  const setEnabled = useViewerStore((s) => s.setDrawingEnabled);
  const mode = useViewerStore((s) => s.drawingMode);
  const setMode = useViewerStore((s) => s.setDrawingMode);

  const is2D = viewerType === 'maplibre' || viewerType === 'mapbox';

  const modes: { value: DrawingMode; label: string }[] = [
    { value: 'point', label: 'Point' },
    { value: 'linestring', label: 'Line' },
    { value: 'polygon', label: 'Polygon' },
  ];

  return (
    <div className="viewer-switcher" style={{ marginTop: 8 }}>
      <label className="viewer-switcher__label" htmlFor="drawing-enabled">
        Drawing
      </label>
      {is2D ? (
        <>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input
              id="drawing-enabled"
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              aria-label="Enable map drawing (Terra Draw)"
            />
            <span>Terra Draw</span>
          </label>
          {enabled && (
            <div style={{ marginTop: 8 }}>
              <label htmlFor="drawing-mode" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Mode
              </label>
              <select
                id="drawing-mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as DrawingMode)}
                className="viewer-switcher__select"
                style={{ width: '100%' }}
                aria-label="Drawing mode"
              >
                {modes.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <p style={{ margin: 6, fontSize: 11, color: 'var(--muted, #666)' }}>
                Click on the map to draw. Use <strong>Select</strong> mode to edit (select mode available in toolbar or add later).
              </p>
            </div>
          )}
        </>
      ) : (
        <p style={{ fontSize: 12, color: 'var(--muted, #666)' }}>Not available in 3D (Cesium).</p>
      )}
    </div>
  );
}
