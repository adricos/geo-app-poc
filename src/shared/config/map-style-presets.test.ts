import { describe, expect, it } from 'vitest';
import { MAP_STYLE_PRESETS, getMapStyleUrl } from './map-style-presets';

describe('map-style-presets', () => {
  it('exports all expected preset keys', () => {
    const keys = MAP_STYLE_PRESETS.map((p) => p.key);
    expect(keys).toContain('default');
    expect(keys).toContain('streets');
    expect(keys).toContain('satellite');
    expect(keys).toContain('terrain');
    expect(keys).toContain('dark');
    expect(keys).toHaveLength(5);
  });

  it('each preset has label and styleUrl', () => {
    for (const preset of MAP_STYLE_PRESETS) {
      expect(preset).toHaveProperty('key');
      expect(preset).toHaveProperty('label');
      expect(preset).toHaveProperty('styleUrl');
      expect(typeof preset.styleUrl).toBe('string');
      expect(preset.styleUrl.length).toBeGreaterThan(0);
    }
  });

  it('getMapStyleUrl returns preset URL for valid key', () => {
    const url = getMapStyleUrl('satellite');
    expect(url).toBeDefined();
    expect(typeof url).toBe('string');
    expect(url).toContain('satellite');
  });

  it('getMapStyleUrl returns default for unknown key', () => {
    const url = getMapStyleUrl('unknown' as 'default');
    expect(url).toBe(MAP_STYLE_PRESETS[0].styleUrl);
  });
});
