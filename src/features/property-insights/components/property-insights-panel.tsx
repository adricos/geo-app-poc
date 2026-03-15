import { useViewerStore } from '@/shared/state/viewer-store';

export function PropertyInsightsPanel() {
  const selectedFeature = useViewerStore((s) => s.selectedFeature);
  const setSelectedFeature = useViewerStore((s) => s.setSelectedFeature);

  if (!selectedFeature) {
    return (
      <section className="property-insights-panel" aria-label="Property insights">
        <h2 className="property-insights-panel__title">Property insights</h2>
        <p className="property-insights-panel__empty">
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
    <section className="property-insights-panel" aria-label="Property insights">
      <h2 className="property-insights-panel__title">Property insights</h2>
      <div className="property-insights-panel__content">
        <div className="property-insights-panel__meta">
          {layer && (
            <span className="property-insights-panel__layer" title="Layer">
              {layer}
            </span>
          )}
          {id && (
            <span className="property-insights-panel__id" title="Feature ID">
              #{id}
            </span>
          )}
        </div>
        {entries.length > 0 ? (
          <dl className="property-insights-panel__properties">
            {entries.map(([key, value]) => (
              <div key={key} className="property-insights-panel__row">
                <dt className="property-insights-panel__key">{key}</dt>
                <dd className="property-insights-panel__value">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="property-insights-panel__no-props">No properties for this feature.</p>
        )}
        <p className="property-insights-panel__source">
          Source: {source}
          {sourceLayer ? ` / ${sourceLayer}` : ''}
        </p>
        <button
          type="button"
          className="property-insights-panel__clear"
          onClick={() => setSelectedFeature(null)}
          aria-label="Clear selection"
        >
          Clear selection
        </button>
      </div>
    </section>
  );
}
