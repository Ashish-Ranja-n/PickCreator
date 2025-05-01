'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState, useEffect } from 'react';

// Create a global queryClient that can be accessed from anywhere
let globalQueryClient: QueryClient | null = null;

// Export a function to clear the cache that can be called from anywhere
export function clearQueryCache() {
  if (globalQueryClient) {
    console.log('Clearing global query client cache');
    globalQueryClient.clear();
    return true;
  } else {
    console.warn('No global query client available to clear');
    return false;
  }
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
      },
    },
  }));
  
  // Set the global query client reference
  useEffect(() => {
    globalQueryClient = queryClient;
    
    // Add it to window for debugging and manual clearing if needed
    if (typeof window !== 'undefined') {
      (window as any).__REACT_QUERY_GLOBAL_CACHE__ = {
        clear: () => queryClient.clear(),
        getQueryCache: () => queryClient.getQueryCache(),
        getMutationCache: () => queryClient.getMutationCache()
      };
    }
    
    return () => {
      globalQueryClient = null;
      if (typeof window !== 'undefined') {
        delete (window as any).__REACT_QUERY_GLOBAL_CACHE__;
      }
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
} 