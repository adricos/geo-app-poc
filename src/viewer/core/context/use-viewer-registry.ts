import { createContext, useContext } from 'react';
import type { ViewerRegistry } from '@/viewer/core/services/viewer-registry';

export const ViewerRegistryContext = createContext<ViewerRegistry | null>(null);

export function useViewerRegistry(): ViewerRegistry {
  const registry = useContext(ViewerRegistryContext);
  if (!registry) {
    throw new Error('useViewerRegistry must be used within ViewerRegistryProvider');
  }
  return registry;
}
