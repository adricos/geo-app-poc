import type { ChangeEvent } from 'react';
import type { MapControlsViewState } from '@/viewer/core/map-controls-view-state';
import {
  MapControlsChevronIcon,
  MapControlsLayersIcon,
} from '@/viewer/core/map-controls-icons';
import { mapControlsChevronDirection } from '@/viewer/core/map-controls-view-state';
import styles from '@/viewer/core/styles/map-controls-widget.module.css';

interface MapControlsStylePresetOption {
  key: string;
  label: string;
}

export function MapControlsHeader({
  viewState,
  onCycleView,
  showStyles,
  styleSelectId,
  styleValue,
  onStyleChange,
  presets,
}: {
  viewState: MapControlsViewState;
  onCycleView: () => void;
  showStyles: boolean;
  styleSelectId: string;
  styleValue: string;
  onStyleChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  presets: readonly MapControlsStylePresetOption[];
}) {
  const chevronDirection = mapControlsChevronDirection(viewState);

  return (
    <div className={styles.header}>
      <button
        type="button"
        className={styles.iconBtn}
        onClick={onCycleView}
        data-state={viewState}
        title={
          viewState === 'icon'
            ? 'Show map style and layers'
            : viewState === 'styles'
              ? 'Show layers list'
              : 'Collapse'
        }
        aria-expanded={viewState !== 'icon'}
        aria-label={
          viewState === 'icon'
            ? 'Expand to choose map style'
            : viewState === 'styles'
              ? 'Show layers'
              : 'Collapse to icon'
        }
      >
        <MapControlsLayersIcon size={14} />
        <MapControlsChevronIcon direction={chevronDirection} className={styles.chevron} />
      </button>
      {showStyles && (
        <div className={styles.styles}>
          <select
            id={styleSelectId}
            value={styleValue}
            onChange={onStyleChange}
            className={styles.select}
            title="Style"
            aria-label="Map style"
          >
            {presets.map((preset) => (
              <option key={preset.key} value={preset.key}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
