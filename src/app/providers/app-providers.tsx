import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ViewerRegistryProvider } from '@/viewer/core/context/viewer-registry-context';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <ViewerRegistryProvider>{children}</ViewerRegistryProvider>
    </QueryClientProvider>
  );
}
