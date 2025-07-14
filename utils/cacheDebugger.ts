// Cache debugging utilities for development

/**
 * Add cache debugging commands to window for easy console access
 */
export function setupCacheDebugging() {
  if (typeof window === 'undefined') return;

  // Add debugging functions to window
  (window as any).cacheDebug = {
    // Show all cache info
    showAll: () => {
      console.group('🗄️ Complete Cache Debug Report');
      
      // LocalStorage info
      const localStorageInfo = getLocalStorageDebugInfo();
      console.group('📱 LocalStorage');
      console.table(localStorageInfo.items);
      console.log('Total Size:', localStorageInfo.totalSizeMB.toFixed(2) + 'MB');
      console.log('Item Count:', localStorageInfo.itemCount);
      console.groupEnd();
      
      // React Query cache info
      if ((window as any).__REACT_QUERY_GLOBAL_CACHE__) {
        const reactQueryInfo = (window as any).__REACT_QUERY_GLOBAL_CACHE__.getCacheSize();
        console.group('⚛️ React Query Cache');
        console.log('Query Count:', reactQueryInfo.queryCount);
        console.log('Estimated Size:', reactQueryInfo.estimatedSizeMB + 'MB');
        console.groupEnd();
        
        // Show individual queries
        const queryCache = (window as any).__REACT_QUERY_GLOBAL_CACHE__.getQueryCache();
        const queries = queryCache.getAll();
        console.group('📋 Active Queries');
        queries.forEach((query: any, index: number) => {
          console.log(`${index + 1}.`, {
            key: query.queryKey,
            state: query.state.status,
            dataUpdatedAt: new Date(query.state.dataUpdatedAt || 0).toLocaleTimeString(),
            observers: query.getObserversCount(),
            dataSize: query.state.data ? JSON.stringify(query.state.data).length + ' bytes' : 'No data'
          });
        });
        console.groupEnd();
      }
      
      console.groupEnd();
    },
    
    // Show only large cache items
    showLarge: (minSizeKB = 100) => {
      console.group(`🔍 Cache Items > ${minSizeKB}KB`);
      const info = getLocalStorageDebugInfo();
      const largeItems = info.items.filter(item => item.sizeKB > minSizeKB);
      console.table(largeItems);
      console.groupEnd();
    },
    
    // Manual cache monitoring (no automatic intervals)
    checkGrowth: () => {
      const info = getLocalStorageDebugInfo();
      console.log(`📈 Current Cache Size: ${info.totalSizeMB.toFixed(2)}MB (${info.itemCount} items)`);
      return info;
    },
    
    // Clean up cache manually
    cleanup: () => {
      console.log('🧹 Starting manual cache cleanup...');
      
      // Clean localStorage
      const beforeLS = getLocalStorageDebugInfo();
      if ((window as any).cleanupCache) {
        (window as any).cleanupCache();
      }
      const afterLS = getLocalStorageDebugInfo();
      
      console.log('LocalStorage cleanup:', {
        before: beforeLS.totalSizeMB.toFixed(2) + 'MB',
        after: afterLS.totalSizeMB.toFixed(2) + 'MB',
        saved: (beforeLS.totalSizeMB - afterLS.totalSizeMB).toFixed(2) + 'MB'
      });
      
      // Clean React Query cache
      if ((window as any).__REACT_QUERY_GLOBAL_CACHE__) {
        const beforeRQ = (window as any).__REACT_QUERY_GLOBAL_CACHE__.getCacheSize();
        (window as any).__REACT_QUERY_GLOBAL_CACHE__.clearOldQueries();
        const afterRQ = (window as any).__REACT_QUERY_GLOBAL_CACHE__.getCacheSize();
        
        console.log('React Query cleanup:', {
          before: beforeRQ.queryCount + ' queries',
          after: afterRQ.queryCount + ' queries',
          removed: (beforeRQ.queryCount - afterRQ.queryCount) + ' queries'
        });
      }
    },
    
    // Find specific cache items
    find: (searchTerm: string) => {
      console.group(`🔍 Searching for: "${searchTerm}"`);
      const info = getLocalStorageDebugInfo();
      const matches = info.items.filter(item => 
        item.key.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.table(matches);
      console.groupEnd();
    },
    
    // Show cache performance impact
    performance: () => {
      console.group('⚡ Cache Performance Analysis');
      
      const info = getLocalStorageDebugInfo();
      
      // Estimate localStorage access time
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        localStorage.getItem('currentUser');
      }
      const end = performance.now();
      const avgAccessTime = (end - start) / 100;
      
      console.log('Average localStorage access time:', avgAccessTime.toFixed(3) + 'ms');
      console.log('Total localStorage size:', info.totalSizeMB.toFixed(2) + 'MB');
      console.log('Performance impact:', info.totalSizeMB > 5 ? '⚠️ HIGH' : info.totalSizeMB > 2 ? '⚠️ MEDIUM' : '✅ LOW');
      
      // React Query performance
      if ((window as any).__REACT_QUERY_GLOBAL_CACHE__) {
        const rqInfo = (window as any).__REACT_QUERY_GLOBAL_CACHE__.getCacheSize();
        console.log('React Query cache size:', rqInfo.estimatedSizeMB + 'MB');
        console.log('Active queries:', rqInfo.queryCount);
      }
      
      console.groupEnd();
    }
  };
  
  console.log('🛠️ Cache debugging tools loaded! Try:');
  console.log('• cacheDebug.showAll() - Complete cache overview');
  console.log('• cacheDebug.showLarge() - Show large cache items');
  console.log('• cacheDebug.cleanup() - Manual cache cleanup');
  console.log('• cacheDebug.checkGrowth() - Check current cache size');
  console.log('• cacheDebug.find("search") - Find specific cache items');
  console.log('• cacheDebug.performance() - Cache performance analysis');
}

function getLocalStorageDebugInfo() {
  const items: Array<{
    key: string;
    sizeBytes: number;
    sizeKB: number;
    sizeMB: number;
    type: string;
    age?: string;
  }> = [];
  
  let totalSize = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        const sizeBytes = new Blob([value]).size;
        totalSize += sizeBytes;
        
        // Determine type
        let type = 'unknown';
        if (key.includes('user') || key.includes('User')) type = 'user';
        else if (key.includes('query') || key.includes('rq-')) type = 'query';
        else if (key.includes('instagram')) type = 'instagram';
        else if (key.includes('deal')) type = 'deals';
        else if (key.includes('chat') || key.includes('conversation')) type = 'chat';
        else if (key.includes('Timestamp')) type = 'timestamp';
        
        // Calculate age for timestamp items
        let age: string | undefined;
        if (key.includes('Timestamp')) {
          const timestamp = parseInt(value, 10);
          if (!isNaN(timestamp)) {
            const ageMs = Date.now() - timestamp;
            age = formatAge(ageMs);
          }
        }
        
        items.push({
          key,
          sizeBytes,
          sizeKB: sizeBytes / 1024,
          sizeMB: sizeBytes / (1024 * 1024),
          type,
          age
        });
      }
    }
  }
  
  // Sort by size (largest first)
  items.sort((a, b) => b.sizeBytes - a.sizeBytes);
  
  return {
    items,
    totalSizeBytes: totalSize,
    totalSizeMB: totalSize / (1024 * 1024),
    itemCount: items.length
  };
}

function formatAge(ageMs: number): string {
  const seconds = Math.floor(ageMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// Auto-setup in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setupCacheDebugging();
}
