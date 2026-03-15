import type { PropsWithChildren } from 'react';
import { useMemo, useRef } from 'react';
import { ViewerRegistry } from '@/viewer/core/services/viewer-registry';
import { ViewerRegistryContext } from '@/viewer/core/context/use-viewer-registry';

export function ViewerRegistryProvider({ children }: PropsWithChildren) {
  const registryRef = useRef<ViewerRegistry | null>(null);
  const registry = useMemo(() => {
    if (!registryRef.current) {
      registryRef.current = new ViewerRegistry();
    }
    return registryRef.current;
  }, []);

  return (
    <ViewerRegistryContext.Provider value={registry}>
      {children}
    </ViewerRegistryContext.Provider>
  );
}
