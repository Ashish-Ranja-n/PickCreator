/**
 * Utility function to clear all cache data when a user logs out
 * This ensures no sensitive data remains in the browser after logout
 */

export const clearAllCacheData = () => {
  console.log('Clearing all cache data');
  
  if (typeof window === 'undefined') {
    return; // Only run on client side
  }
  
  try {
    // ----- 1. Clear specific known data items -----
    
    // Clear user data cache
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserTimestamp');
    
    // Clear profile data cache
    localStorage.removeItem('profileData');
    
    // Clear influencer-specific data
    localStorage.removeItem('instagramData');
    localStorage.removeItem('instagramToken');
    localStorage.removeItem('instagramTimestamp');
    localStorage.removeItem('instagram_access_token');
    localStorage.removeItem('instagram_user_id');
    localStorage.removeItem('instagram_connected');
    
    // Clear any other app-specific cache items
    localStorage.removeItem('onboardingData');
    localStorage.removeItem('dealsList');
    localStorage.removeItem('messageCache');
    localStorage.removeItem('notificationSettings');
    
    // ----- 2. Clear all React Query cache data -----
    
    // Find and remove all React Query cache keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('rq-') || key.includes('query') || key.includes('instagram')) {
        console.log(`Removing cache key: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    // Try multiple approaches to clear React Query cache
    if (window.__REACT_QUERY_GLOBAL_CACHE__) {
      console.log('Clearing React Query global cache');
      window.__REACT_QUERY_GLOBAL_CACHE__.clear();
    }
    
    // ----- 3. Clear all storage mechanisms -----
    
    // Clear session storage 
    sessionStorage.clear();
    
    // Attempt to clear IndexedDB
    try {
      indexedDB.databases().then(databases => {
        databases.forEach(database => {
          // Only proceed if database name is defined
          if (database.name) {
            console.log(`Deleting IndexedDB database: ${database.name}`);
            indexedDB.deleteDatabase(database.name);
          }
        });
      });
    } catch (e) {
      console.warn('Failed to clear IndexedDB:', e);
    }
    
    // ----- 4. Clear cookies -----
    
    // Clear cookies (except those that need to be handled by the server)
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      if (name && name !== 'token') { // Don't clear token here as it needs httpOnly flag handling
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
    
    console.log('Cache clearing completed');
  } catch (error) {
    console.error('Error clearing cache:', error);
    
    // Fallback: try a simpler approach if the detailed clearing failed
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log('Fallback cache clearing completed');
    } catch (e) {
      console.error('Even fallback cache clearing failed:', e);
    }
  }
}; 