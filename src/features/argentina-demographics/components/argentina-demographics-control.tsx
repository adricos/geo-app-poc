import { useViewerStore } from '@/shared/state/viewer-store';
import styles from './argentina-demographics-control.module.css';

type ViewerType = 'maplibre' | 'mapbox' | 'cesium';

interface ArgentinaDemographicsControlProps {
  /** Used for subtitle: "deck.gl" vs "Cesium" */
  viewerType?: ViewerType;
}

/**
 * Sidebar control: checkbox to enable Argentina demographics and legend.
 */
export function ArgentinaDemographicsControl({
  viewerType = 'maplibre',
}: ArgentinaDemographicsControlProps) {
  const enabled = useViewerStore((s) => s.argentinaDemographicsEnabled);
  const setEnabled = useViewerStore((s) => s.setArgentinaDemographicsEnabled);
  const subtitle = viewerType === 'cesium' ? 'Cesium' : 'deck.gl';

  return (
    <div className={`viewer-switcher ${styles.root}`}>
      <label className='viewer-switcher__label' htmlFor='argentina-demographics'>
        Use case
      </label>
      <label className={styles.checkboxLabel} htmlFor='argentina-demographics'>
        <input
          id='argentina-demographics'
          type='checkbox'
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          aria-label='Show Argentina demographics (deck.gl / Cesium)'
        />
        <span>Argentina demographics</span>
      </label>
      <p className={styles.subtitle}>{subtitle} · INDEC 2022</p>
      {enabled && (
        <div
          className={styles.legend}
          role='img'
          aria-label='Legend: circle size is population; color by city rank'
        >
          <div className={styles.legendTitle}>Legend (cities)</div>
          <p className={styles.legendRow}>
            <strong>Circle size</strong> = population (proportional)
          </p>
          <p className={styles.legendRow}>
            <strong>Color</strong> = population rank (by city, for variety)
          </p>
          <div className={styles.gradientRow}>
            <span className={styles.gradientLow}>low</span>
            <div className={styles.gradientBar} />
            <span className={styles.gradientHigh}>high</span>
          </div>
          <p className={styles.legendFooter}>Cities · ~25k – 3.1M hab. (Censo 2022)</p>
        </div>
      )}
    </div>
  );
}
