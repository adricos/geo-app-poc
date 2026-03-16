import '@testing-library/jest-dom/vitest';

// jsdom does not provide ResizeObserver (used by map viewers)
class ResizeObserverMock {
  observe = () => undefined;
  unobserve = () => undefined;
  disconnect = () => undefined;
}
globalThis.ResizeObserver = ResizeObserverMock;

// jsdom does not provide URL.createObjectURL (used by MapLibre GL worker)
if (typeof globalThis.URL !== 'undefined' && !globalThis.URL.createObjectURL) {
  globalThis.URL.createObjectURL = () => 'blob:mock-object-url';
}
