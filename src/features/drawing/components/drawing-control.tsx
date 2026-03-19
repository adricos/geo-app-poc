import { useViewerStore } from '@/shared/state/viewer-store';
import styles from './drawing-control.module.css';

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
    <div className={`viewer-switcher ${styles.root}`}>
      <label className='viewer-switcher__label' htmlFor='drawing-enabled'>
        Drawing
      </label>
      {is2D ? (
        <>
          <label className={styles.checkboxLabel} htmlFor='drawing-enabled'>
            <input
              id='drawing-enabled'
              type='checkbox'
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              aria-label='Enable map drawing (Terra Draw)'
            />
            <span>Terra Draw</span>
          </label>
          {enabled && (
            <div className={styles.modeWrap}>
              <label htmlFor='drawing-mode' className={styles.modeLabel}>
                Mode
              </label>
              <select
                id='drawing-mode'
                value={mode}
                onChange={(e) => setMode(e.target.value as DrawingMode)}
                className={`viewer-switcher__select ${styles.select}`}
                aria-label='Drawing mode'
              >
                {modes.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <p className={styles.hint}>
                Click on the map to draw. Use <strong>Select</strong> mode to edit (select mode
                available in toolbar or add later).
              </p>
            </div>
          )}
        </>
      ) : (
        <p className={styles.unavailable}>Not available in 3D (Cesium).</p>
      )}
    </div>
  );
}
