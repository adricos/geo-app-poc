import { useViewerStore } from '@/shared/state/viewer-store';

type ViewerType = 'maplibre' | 'mapbox' | 'cesium';

interface ArgentinaDemographicsControlProps {
  /** Used for subtitle: "deck.gl" vs "Cesium" */
  viewerType?: ViewerType;
}

/**
 * Sidebar control: checkbox to enable Argentina demographics and legend.
 */
export function ArgentinaDemographicsControl({ viewerType = 'maplibre' }: ArgentinaDemographicsControlProps) {
  const enabled = useViewerStore((s) => s.argentinaDemographicsEnabled);
  const setEnabled = useViewerStore((s) => s.setArgentinaDemographicsEnabled);
  const subtitle = viewerType === 'cesium' ? 'Cesium' : 'deck.gl';

  return (
    <div className="viewer-switcher" style={{ marginTop: 8 }}>
      <label className="viewer-switcher__label" htmlFor="argentina-demographics">
        Use case
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
        <input
          id="argentina-demographics"
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          aria-label="Show Argentina demographics (deck.gl / Cesium)"
        />
        <span>Argentina demographics</span>
      </label>
      <p style={{ margin: 4, fontSize: 12, color: 'var(--muted, #666)' }}>
        {subtitle} · INDEC 2022
      </p>
      {enabled && (
        <div
          className="argentina-demographics-legend"
          style={{
            marginTop: 10,
            padding: 10,
            fontSize: 12,
            background: 'var(--legend-bg, #f0f4f8)',
            borderRadius: 6,
            color: '#333',
          }}
          role="img"
          aria-label="Legend: circle size is population; color by city rank"
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Legend (cities)</div>
          <p style={{ margin: 0, marginBottom: 4 }}>
            <strong>Circle size</strong> = population (proportional)
          </p>
          <p style={{ margin: 0, marginBottom: 4 }}>
            <strong>Color</strong> = population rank (by city, for variety)
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 6,
              fontSize: 11,
            }}
          >
            <span style={{ color: '#6496dc' }}>low</span>
            <div
              style={{
                flex: 1,
                height: 8,
                borderRadius: 4,
                background: 'linear-gradient(to right, #6496dc, #96e6e6, #e6c832, #e07828, #dc3232)',
              }}
            />
            <span style={{ color: '#dc3232' }}>high</span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 11, color: '#666' }}>
            Cities · ~25k – 3.1M hab. (Censo 2022)
          </p>
        </div>
      )}
    </div>
  );
}
