import { useViewerStore } from '@/shared/state/viewer-store';
import styles from './property-insights-panel.module.css';

export function PropertyInsightsPanel() {
  const selectedFeature = useViewerStore((s) => s.selectedFeature);
  const setSelectedFeature = useViewerStore((s) => s.setSelectedFeature);

  if (!selectedFeature) {
    return (
      <section className={styles.root} aria-label='Property insights'>
        <h2 className={styles.title}>Property insights</h2>
        <p className={styles.empty}>
          No property selected. Click a feature on the map to see details.
        </p>
      </section>
    );
  }

  const { id, source, sourceLayer, layer, properties } = selectedFeature;
  const entries = Object.entries(properties).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );

  return (
    <section className={styles.root} aria-label='Property insights'>
      <h2 className={styles.title}>Property insights</h2>
      <div className={styles.content}>
        <div className={styles.meta}>
          {layer && (
            <span className={styles.layer} title='Layer'>
              {layer}
            </span>
          )}
          {id && (
            <span className={styles.id} title='Feature ID'>
              #{id}
            </span>
          )}
        </div>
        {entries.length > 0 ? (
          <dl className={styles.properties}>
            {entries.map(([key, value]) => (
              <div key={key} className={styles.row}>
                <dt className={styles.key}>{key}</dt>
                <dd className={styles.value}>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className={styles.noProps}>No properties for this feature.</p>
        )}
        <p className={styles.source}>
          Source: {source}
          {sourceLayer ? ` / ${sourceLayer}` : ''}
        </p>
        <button
          type='button'
          className={styles.clear}
          onClick={() => setSelectedFeature(null)}
          aria-label='Clear selection'
        >
          Clear selection
        </button>
      </div>
    </section>
  );
}
