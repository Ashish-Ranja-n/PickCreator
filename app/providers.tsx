'use client';

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ReactNode, useState, useEffect } from 'react';
import { startCacheMonitoring } from '@/utils/cacheMonitor';
import { setupCacheDebugging } from '@/utils/cacheDebugger';

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
        staleTime: Infinity, // Cache indefinitely until logout
        gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep data longer
        refetchOnWindowFocus: false,
        retry: 2, // Limit retries
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 1, // Limit mutation retries
      },
    },
    // Add cache size limits to prevent unlimited growth
    queryCache: new QueryCache({
      onError: (error: any) => {
        console.error('Query error:', error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error: any) => {
        console.error('Mutation error:', error);
      },
    }),
  }));
  
  // Set the global query client reference
  useEffect(() => {
    globalQueryClient = queryClient;

    // Add it to window for debugging and manual clearing if needed
    if (typeof window !== 'undefined') {
      (window as any).__REACT_QUERY_GLOBAL_CACHE__ = {
        clear: () => queryClient.clear(),
        getQueryCache: () => queryClient.getQueryCache(),
        getMutationCache: () => queryClient.getMutationCache(),
        // Add cache monitoring functions
        getCacheSize: () => {
          const cache = queryClient.getQueryCache();
          const queries = cache.getAll();
          let totalSize = 0;
          queries.forEach(query => {
            if (query.state.data) {
              totalSize += JSON.stringify(query.state.data).length;
            }
          });
          return {
            queryCount: queries.length,
            estimatedSizeBytes: totalSize,
            estimatedSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
          };
        },
        clearOldQueries: () => {
          // Manual cleanup function - only called when needed
          const cache = queryClient.getQueryCache();
          const queries = cache.getAll();
          let removedCount = 0;

          queries.forEach(query => {
            // Only remove queries with no active observers
            if (query.getObserversCount() === 0) {
              queryClient.removeQueries({ queryKey: query.queryKey });
              removedCount++;
            }
          });

          console.log(`Removed ${removedCount} inactive queries`);
          return removedCount;
        }
      };
    }

    // Only start essential cache monitoring (no frequent intervals)
    const stopCacheMonitoring = startCacheMonitoring();

    // Setup cache debugging tools in development
    if (process.env.NODE_ENV === 'development') {
      setupCacheDebugging();
    }

    return () => {
      globalQueryClient = null;
      stopCacheMonitoring();
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