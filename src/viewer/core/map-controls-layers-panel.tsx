import type { RefObject } from 'react';
import styles from '@/viewer/core/styles/map-controls-widget.module.css';

interface MapControlsLayerRow {
  id: string;
  label: string;
  checked: boolean;
}

export function MapControlsLayersPanel({
  layers,
  onLayerChange,
  selectAllCheckboxRef,
  allVisible,
  noneVisible,
  onSelectAllChange,
}: {
  layers: MapControlsLayerRow[];
  onLayerChange: (id: string, checked: boolean) => void;
  selectAllCheckboxRef: RefObject<HTMLInputElement | null>;
  allVisible: boolean;
  noneVisible: boolean;
  onSelectAllChange: () => void;
}) {
  const showHeader = layers.length > 1;

  return (
    <div
      className={layers.length <= 1 ? `${styles.layers} ${styles.layersSingle}` : styles.layers}
      title="Layers"
      aria-label="Layers"
    >
      {showHeader && (
        <div className={styles.layersHeader}>
          <label className={styles.selectAll}>
            <input
              ref={selectAllCheckboxRef}
              type="checkbox"
              checked={allVisible}
              onChange={onSelectAllChange}
              className={styles.checkbox}
              title={allVisible ? 'Hide all layers' : noneVisible ? 'Show all layers' : 'Show all layers'}
              aria-label={
                allVisible
                  ? 'All layers visible; click to hide all'
                  : noneVisible
                    ? 'No layers visible; click to show all'
                    : 'Some layers visible; click to show all'
              }
            />
            <span className={styles.selectAllText}>
              {allVisible ? 'All' : noneVisible ? 'None' : 'Some'}
            </span>
          </label>
        </div>
      )}
      <div className={styles.listScroll}>
        <ul className={styles.list}>
          {layers.map((layer) => (
            <li key={layer.id} className={styles.item}>
              <label className={styles.label}>
                <input
                  type="checkbox"
                  checked={layer.checked}
                  data-layer-id={layer.id}
                  onChange={(e) => onLayerChange(layer.id, e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.name}>{layer.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
