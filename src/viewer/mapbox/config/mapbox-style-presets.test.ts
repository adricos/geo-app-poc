import { describe, expect, it } from 'vitest';
import { MAPBOX_STYLE_PRESETS, getMapboxStyleUrl } from './mapbox-style-presets';

describe('mapbox-style-presets', () => {
  it('exports all expected preset keys', () => {
    const keys = MAPBOX_STYLE_PRESETS.map((p) => p.key);
    expect(keys).toContain('default');
    expect(keys).toContain('streets');
    expect(keys).toContain('satellite');
    expect(keys).toContain('satellite-streets');
    expect(keys).toContain('outdoors');
    expect(keys).toContain('light');
    expect(keys).toContain('dark');
    expect(keys).toHaveLength(7);
  });

  it('each preset has label and mapbox styleUrl', () => {
    for (const preset of MAPBOX_STYLE_PRESETS) {
      expect(preset).toHaveProperty('key');
      expect(preset).toHaveProperty('label');
      expect(preset).toHaveProperty('styleUrl');
      expect(preset.styleUrl).toMatch(/^mapbox:\/\//);
    }
  });

  it('getMapboxStyleUrl returns preset URL for valid key', () => {
    const url = getMapboxStyleUrl('dark');
    expect(url).toBe('mapbox://styles/mapbox/dark-v11');
  });

  it('getMapboxStyleUrl returns default for unknown key', () => {
    const url = getMapboxStyleUrl('unknown' as 'default');
    expect(url).toBe(MAPBOX_STYLE_PRESETS[0].styleUrl);
  });
});
