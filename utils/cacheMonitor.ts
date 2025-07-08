// Cache monitoring and management utilities

export interface CacheStats {
  totalSizeBytes: number;
  totalSizeMB: number;
  itemCount: number;
  items: Array<{
    key: string;
    sizeBytes: number;
    sizeMB: number;
    age?: number;
  }>;
}

export interface LocalStorageStats extends CacheStats {
  quotaUsed: number;
  quotaAvailable: number;
}

/**
 * Get detailed localStorage usage statistics
 */
export function getLocalStorageStats(): LocalStorageStats {
  const items: Array<{ key: string; sizeBytes: number; sizeMB: number; age?: number }> = [];
  let totalSize = 0;

  // Calculate size of each localStorage item
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        const sizeBytes = new Blob([value]).size;
        totalSize += sizeBytes;
        
        // Try to get age for timestamp-based items
        let age: number | undefined;
        if (key.includes('Timestamp')) {
          const timestamp = parseInt(value, 10);
          if (!isNaN(timestamp)) {
            age = Date.now() - timestamp;
          }
        }
        
        items.push({
          key,
          sizeBytes,
          sizeMB: sizeBytes / (1024 * 1024),
          age
        });
      }
    }
  }

  // Sort by size (largest first)
  items.sort((a, b) => b.sizeBytes - a.sizeBytes);

  // Estimate quota usage (most browsers have ~5-10MB limit)
  const estimatedQuota = 10 * 1024 * 1024; // 10MB
  const quotaUsed = (totalSize / estimatedQuota) * 100;

  return {
    totalSizeBytes: totalSize,
    totalSizeMB: totalSize / (1024 * 1024),
    itemCount: items.length,
    items,
    quotaUsed,
    quotaAvailable: 100 - quotaUsed
  };
}

/**
 * Clean up old localStorage entries
 */
export function cleanupOldLocalStorage(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
  let removedCount = 0;
  const now = Date.now();
  const keysToRemove: string[] = [];

  // Find old entries
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      // Check timestamp-based entries
      if (key.includes('Timestamp')) {
        const value = localStorage.getItem(key);
        if (value) {
          const timestamp = parseInt(value, 10);
          if (!isNaN(timestamp) && (now - timestamp) > maxAgeMs) {
            // Remove both the timestamp and the associated data
            keysToRemove.push(key);
            const dataKey = key.replace('Timestamp', '');
            if (localStorage.getItem(dataKey)) {
              keysToRemove.push(dataKey);
            }
          }
        }
      }
      
      // Check React Query cache entries (they can accumulate)
      if (key.startsWith('rq-') || key.includes('query-cache')) {
        keysToRemove.push(key);
      }
    }
  }

  // Remove identified keys
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    removedCount++;
  });

  console.log(`Cleaned up ${removedCount} old localStorage entries`);
  return removedCount;
}

/**
 * Clean up localStorage if it exceeds size limit
 */
export function cleanupLocalStorageBySize(maxSizeMB: number = 5): number {
  const stats = getLocalStorageStats();
  
  if (stats.totalSizeMB <= maxSizeMB) {
    return 0;
  }

  console.warn(`localStorage size (${stats.totalSizeMB.toFixed(2)}MB) exceeds limit (${maxSizeMB}MB), cleaning up...`);
  
  let removedCount = 0;
  let currentSize = stats.totalSizeBytes;
  const targetSize = maxSizeMB * 1024 * 1024;

  // Remove largest non-essential items first
  for (const item of stats.items) {
    if (currentSize <= targetSize) break;
    
    // Don't remove essential user data
    if (item.key === 'currentUser' || item.key === 'currentUserTimestamp') {
      continue;
    }
    
    localStorage.removeItem(item.key);
    currentSize -= item.sizeBytes;
    removedCount++;
  }

  console.log(`Removed ${removedCount} items to reduce localStorage size`);
  return removedCount;
}

/**
 * Monitor and automatically clean cache
 */
export function startCacheMonitoring() {
  // Initial cleanup
  cleanupOldLocalStorage();
  cleanupLocalStorageBySize();

  // Set up periodic monitoring
  const monitorInterval = setInterval(() => {
    const stats = getLocalStorageStats();
    
    console.log('Cache monitoring:', {
      localStorage: `${stats.totalSizeMB.toFixed(2)}MB (${stats.itemCount} items)`,
      quotaUsed: `${stats.quotaUsed.toFixed(1)}%`
    });

    // Clean up if needed
    if (stats.quotaUsed > 80) {
      console.warn('localStorage quota usage high, cleaning up...');
      cleanupOldLocalStorage();
      cleanupLocalStorageBySize();
    }
  }, 5 * 60 * 1000); // Every 5 minutes

  // Return cleanup function
  return () => clearInterval(monitorInterval);
}

/**
 * Get cache debugging info for console
 */
export function debugCache() {
  const localStorageStats = getLocalStorageStats();
  
  console.group('🗄️ Cache Debug Info');
  console.log('📱 LocalStorage:', {
    size: `${localStorageStats.totalSizeMB.toFixed(2)}MB`,
    items: localStorageStats.itemCount,
    quotaUsed: `${localStorageStats.quotaUsed.toFixed(1)}%`,
    largestItems: localStorageStats.items.slice(0, 5).map(item => ({
      key: item.key,
      size: `${item.sizeMB.toFixed(2)}MB`
    }))
  });
  
  // React Query cache info
  if (typeof window !== 'undefined' && (window as any).__REACT_QUERY_GLOBAL_CACHE__) {
    const reactQueryStats = (window as any).__REACT_QUERY_GLOBAL_CACHE__.getCacheSize();
    console.log('⚛️ React Query Cache:', reactQueryStats);
  }
  
  console.groupEnd();
  
  return { localStorageStats };
}

// Add to window for debugging
if (typeof window !== 'undefined') {
  (window as any).debugCache = debugCache;
  (window as any).cleanupCache = () => {
    cleanupOldLocalStorage();
    cleanupLocalStorageBySize();
    if ((window as any).__REACT_QUERY_GLOBAL_CACHE__) {
      (window as any).__REACT_QUERY_GLOBAL_CACHE__.clearOldQueries();
    }
  };
}
