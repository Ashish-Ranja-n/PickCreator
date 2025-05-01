import { useRouter } from 'next/navigation';
import { useClearUser } from './useCurrentUser';
import { clearAllCacheData } from '@/utils/clearCache';
import { clearQueryCache } from '@/app/providers';
import axios from 'axios';
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notifyServiceWorkerLogout } from '@/utils/serviceWorkerControl';

/**
 * Custom hook that handles both client-side cache clearing and server-side logout
 * Improved for reliability and smooth transitions
 * @param redirectTo - Where to redirect after logout (default: '/log-in')
 * @returns logout function
 */
export const useLogout = (redirectTo = '/log-in') => {
  const router = useRouter();
  const clearUserStore = useClearUser();
  const queryClient = useQueryClient();
  
  // Use useCallback to ensure stable function reference
  const logout = useCallback(async (showLoadingUI = true) => {
    console.log("Starting logout process...");
    
    // Show loading indicator if requested
    if (showLoadingUI && typeof document !== 'undefined') {
      // Create a temporary full-screen loading overlay
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      overlay.style.zIndex = '9999';
      overlay.style.display = 'flex';
      overlay.style.justifyContent = 'center';
      overlay.style.alignItems = 'center';
      overlay.innerHTML = '<div style="color: white; font-size: 18px;">Logging out...</div>';
      document.body.appendChild(overlay);
    }
    
    try {
      // 1. Call server logout endpoint first to ensure the token is invalidated
      console.log("Calling server logout endpoint...");
      try {
        await axios.get('/api/auth/log-out');
      } catch (error) {
        console.warn("Error during server logout, continuing with client logout:", error);
      }
      
      // 2. Clear React Query cache
      console.log("Clearing React Query cache...");
      // Start with specific queries first
      queryClient.invalidateQueries();
      queryClient.removeQueries();
      queryClient.clear();
      clearQueryCache(); 
      
      // 3. Clear all browser cache/storage
      console.log("Clearing browser cache...");
      clearAllCacheData();
      
      // 4. Clear Zustand store state
      console.log("Clearing user store...");
      clearUserStore();
      
      // 5. Notify service worker about logout to clear user-specific caches
      console.log("Notifying service worker about logout...");
      try {
        await notifyServiceWorkerLogout();
      } catch (error) {
        console.warn("Error notifying service worker, continuing:", error);
      }
      
      // 6. Remove any cached data with direct localStorage operations
      console.log("Manually removing any remaining data...");
      try {
        // First clear all items we know are related to user state
        const keysToRemove = [
          // Auth-related
          'pickcreator-user-role',
          'pickcreator-user-id',
          'pickcreator-login-timestamp',
          
          // Feature-specific data
          'instagram-data',
          'profile-data',
          'influencer-data',
          'brand-data',
        ];
        
        // Remove the known keys
        keysToRemove.forEach(key => {
          try { localStorage.removeItem(key); } catch (e) {}
        });
        
        // Then look for any keys that match patterns
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (
            key.includes('instagram') || 
            key.includes('user') || 
            key.includes('profile') || 
            key.includes('query') ||
            key.includes('auth') ||
            key.includes('token') ||
            key.includes('influencer') ||
            key.includes('brand')
          )) {
            try { localStorage.removeItem(key); } catch (e) {}
          }
        }
      } catch (storageError) {
        console.warn("Error clearing localStorage, continuing:", storageError);
      }
      
      // 7. Clear cookies directly (as a backup to the API call)
      console.log("Clearing cookies directly...");
      try {
        document.cookie.split(";").forEach(cookie => {
          const trimmedCookie = cookie.replace(/^\s+/g, "");
          const cookieName = trimmedCookie.split("=")[0];
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
        });
      } catch (cookieError) {
        console.warn("Error clearing cookies directly, continuing:", cookieError);
      }
      
      // 8. Add a small delay to ensure all clearing operations complete
      console.log("Waiting for all operations to complete...");
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 9. Reset the page completely
      console.log("Performing full page reset...");
      if (typeof window !== 'undefined') {
        // Force a full page reload to clear any in-memory state
        window.location.href = redirectTo;
      } else {
        router.push(redirectTo);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error during logout:', error);
      
      // Even if logout fails, still redirect
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      } else {
        router.push(redirectTo);
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during logout'
      };
    }
  }, [clearUserStore, queryClient, router, redirectTo]);
  
  return logout;
}; 