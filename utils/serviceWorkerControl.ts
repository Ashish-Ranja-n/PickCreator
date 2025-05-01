/**
 * Service Worker Control Utilities
 * 
 * This file contains functions to communicate with the service worker
 * for login/logout events and cache management.
 */

/**
 * Notify the service worker about a user login event
 * 
 * @param {string} userId - The ID of the logged in user
 * @param {string} role - The role of the user (admin, brand, influencer)
 * @returns {Promise<boolean>} - Success status
 */
export const notifyServiceWorkerLogin = async (userId: string, role: string): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported in this browser');
    return false;
  }
  
  try {
    // Set cookie for role (service worker can't access localStorage across sessions)
    document.cookie = `userRole=${role}; path=/; max-age=31536000; SameSite=Strict`; // 1 year
    
    // Also store in localStorage for redundancy
    localStorage.setItem('pickcreator-user-role', role);
    localStorage.setItem('pickcreator-user-id', userId);
    
    // Save login timestamp
    localStorage.setItem('pickcreator-login-timestamp', Date.now().toString());
    
    // Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready;
    
    // Notify service worker
    registration.active?.postMessage({
      type: 'LOGIN',
      userId,
      role
    });
    
    return true;
  } catch (error) {
    console.error('Error notifying service worker about login:', error);
    return false;
  }
};

/**
 * Notify the service worker about a user logout event
 * This will clear user-specific caches for security and privacy
 * 
 * @returns {Promise<boolean>} - Success status
 */
export const notifyServiceWorkerLogout = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    // Clear role cookie
    document.cookie = 'userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Clear from localStorage
    localStorage.removeItem('pickcreator-user-role');
    localStorage.removeItem('pickcreator-user-id');
    localStorage.removeItem('pickcreator-login-timestamp');
    
    // Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready;
    
    // Notify service worker
    registration.active?.postMessage({
      type: 'LOGOUT'
    });
    
    return true;
  } catch (error) {
    console.error('Error notifying service worker about logout:', error);
    return false;
  }
};

/**
 * Refresh the user's token to extend the session
 * Should be called periodically to ensure the session doesn't expire
 */
export const refreshUserSession = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Check if we have a user ID
    const userId = localStorage.getItem('pickcreator-user-id');
    if (!userId) return false;
    
    // Call the check-auth endpoint to keep the session alive
    const response = await fetch('/api/auth/check-auth', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for sending cookies
    });
    
    if (response.ok) {
      // Update login timestamp
      localStorage.setItem('pickcreator-login-timestamp', Date.now().toString());
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error refreshing user session:', error);
    return false;
  }
};

/**
 * Update service worker with latest version
 * Call this function when you want to force service worker update
 */
export const updateServiceWorker = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
  } catch (error) {
    console.error('Error updating service worker:', error);
  }
}; 