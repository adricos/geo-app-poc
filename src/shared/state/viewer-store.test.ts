import { afterEach, describe, expect, it } from 'vitest';
import { useViewerStore } from './viewer-store';

describe('viewer-store', () => {
  afterEach(() => {
    useViewerStore.setState({
      adapter: null,
      camera: null,
      mapStyleKey: 'default',
      mapStyleKeyCesium: 'default',
      mapStyleKeyMapbox: 'default',
    });
  });

  it('has initial state', () => {
    const state = useViewerStore.getState();
    expect(state.adapter).toBeNull();
    expect(state.camera).toBeNull();
    expect(state.mapStyleKey).toBe('default');
    expect(state.mapStyleKeyCesium).toBe('default');
    expect(state.mapStyleKeyMapbox).toBe('default');
  });

  it('setAdapter updates adapter', () => {
    const mock = {
      getCamera: () => ({ lng: 0, lat: 0, zoom: 1 }),
      setCamera: () => {},
      flyTo: () => {},
      destroy: () => {},
    };
    useViewerStore.getState().setAdapter(mock);
    expect(useViewerStore.getState().adapter).toBe(mock);
  });

  it('setCamera updates camera', () => {
    const camera = { lng: 1, lat: 2, zoom: 10, bearing: 0, pitch: 0 };
    useViewerStore.getState().setCamera(camera);
    expect(useViewerStore.getState().camera).toEqual(camera);
  });

  it('setMapStyleKey updates mapStyleKey', () => {
    useViewerStore.getState().setMapStyleKey('satellite');
    expect(useViewerStore.getState().mapStyleKey).toBe('satellite');
  });

  it('setMapStyleKeyCesium updates mapStyleKeyCesium', () => {
    useViewerStore.getState().setMapStyleKeyCesium('satellite');
    expect(useViewerStore.getState().mapStyleKeyCesium).toBe('satellite');
  });

  it('setMapStyleKeyMapbox updates mapStyleKeyMapbox', () => {
    useViewerStore.getState().setMapStyleKeyMapbox('dark');
    expect(useViewerStore.getState().mapStyleKeyMapbox).toBe('dark');
  });
});
