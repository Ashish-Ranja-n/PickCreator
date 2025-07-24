/**
 * Persistent Authentication State Management
 * Provides robust login state persistence across app restarts and handles edge cases
 */

interface PersistentAuthState {
  isLoggedIn: boolean;
  userId: string;
  role: string;
  email: string;
  lastLoginTime: number;
  lastActivityTime: number;
  sessionId: string;
  deviceId: string;
  authVersion: number; // For handling auth system upgrades
}

const PERSISTENT_AUTH_KEY = 'pickcreator-persistent-auth';
const AUTH_VERSION = 1; // Increment when auth system changes
const MAX_INACTIVITY_TIME = 30 * 24 * 60 * 60 * 1000; // 30 days
const ACTIVITY_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Generate a unique device ID
const generateDeviceId = (): string => {
  if (typeof window === 'undefined') return 'server';
  
  // Try to get existing device ID
  let deviceId = localStorage.getItem('pickcreator-device-id');
  if (deviceId) return deviceId;
  
  // Generate new device ID
  deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('pickcreator-device-id', deviceId);
  return deviceId;
};

// Generate a unique session ID
const generateSessionId = (): string => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Save persistent authentication state
 */
export const savePersistentAuthState = (user: any): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const authState: PersistentAuthState = {
      isLoggedIn: true,
      userId: user._id || user.id,
      role: user.role,
      email: user.email,
      lastLoginTime: Date.now(),
      lastActivityTime: Date.now(),
      sessionId: generateSessionId(),
      deviceId: generateDeviceId(),
      authVersion: AUTH_VERSION,
    };
    
    // Save to multiple storage locations for redundancy
    localStorage.setItem(PERSISTENT_AUTH_KEY, JSON.stringify(authState));
    sessionStorage.setItem(PERSISTENT_AUTH_KEY, JSON.stringify(authState));
    
    console.log('Persistent auth state saved');
  } catch (error) {
    console.warn('Failed to save persistent auth state:', error);
  }
};

/**
 * Get persistent authentication state
 */
export const getPersistentAuthState = (): PersistentAuthState | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try localStorage first, then sessionStorage
    let saved = localStorage.getItem(PERSISTENT_AUTH_KEY);
    if (!saved) {
      saved = sessionStorage.getItem(PERSISTENT_AUTH_KEY);
    }
    
    if (!saved) return null;
    
    const authState: PersistentAuthState = JSON.parse(saved);
    
    // Check auth version compatibility
    if (authState.authVersion !== AUTH_VERSION) {
      console.log('Auth version mismatch, clearing persistent state');
      clearPersistentAuthState();
      return null;
    }
    
    // Check if session is expired due to inactivity
    const timeSinceActivity = Date.now() - authState.lastActivityTime;
    if (timeSinceActivity > MAX_INACTIVITY_TIME) {
      console.log('Persistent auth state expired due to inactivity');
      clearPersistentAuthState();
      return null;
    }
    
    return authState;
  } catch (error) {
    console.warn('Failed to get persistent auth state:', error);
    return null;
  }
};

/**
 * Update activity timestamp in persistent auth state
 */
export const updatePersistentAuthActivity = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const authState = getPersistentAuthState();
    if (authState) {
      authState.lastActivityTime = Date.now();
      
      // Update both storage locations
      localStorage.setItem(PERSISTENT_AUTH_KEY, JSON.stringify(authState));
      sessionStorage.setItem(PERSISTENT_AUTH_KEY, JSON.stringify(authState));
    }
  } catch (error) {
    console.warn('Failed to update persistent auth activity:', error);
  }
};

/**
 * Clear persistent authentication state
 */
export const clearPersistentAuthState = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(PERSISTENT_AUTH_KEY);
    sessionStorage.removeItem(PERSISTENT_AUTH_KEY);
    console.log('Persistent auth state cleared');
  } catch (error) {
    console.warn('Failed to clear persistent auth state:', error);
  }
};

/**
 * Check if user should be considered logged in based on persistent state
 */
export const isPersistentlyLoggedIn = (): boolean => {
  const authState = getPersistentAuthState();
  return authState?.isLoggedIn === true;
};

/**
 * Get user info from persistent state
 */
export const getPersistentUserInfo = (): { userId: string; role: string; email: string } | null => {
  const authState = getPersistentAuthState();
  if (!authState) return null;
  
  return {
    userId: authState.userId,
    role: authState.role,
    email: authState.email,
  };
};

/**
 * Initialize persistent auth activity tracking
 */
export const initializePersistentAuthTracking = (): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  
  // Update activity on various user interactions
  const updateActivity = () => updatePersistentAuthActivity();
  
  // Track user activity events
  const events = ['click', 'keydown', 'scroll', 'touchstart', 'mousemove'];
  events.forEach(event => {
    document.addEventListener(event, updateActivity, { passive: true });
  });
  
  // Periodic activity update
  const intervalId = setInterval(updateActivity, ACTIVITY_UPDATE_INTERVAL);
  
  // Track page visibility changes
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      updateActivity();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Cleanup function
  return () => {
    events.forEach(event => {
      document.removeEventListener(event, updateActivity);
    });
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    clearInterval(intervalId);
  };
};

/**
 * Validate persistent auth state against server
 */
export const validatePersistentAuthState = async (): Promise<boolean> => {
  const authState = getPersistentAuthState();
  if (!authState) return false;
  
  try {
    // Check with server if the session is still valid
    const response = await fetch('/api/auth/check-auth', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (response.ok) {
      // Update activity on successful validation
      updatePersistentAuthActivity();
      return true;
    } else {
      // Server says we're not authenticated, clear persistent state
      console.log('Server validation failed, clearing persistent auth state');
      clearPersistentAuthState();
      return false;
    }
  } catch (error) {
    console.warn('Failed to validate persistent auth state:', error);
    // Don't clear state on network errors, allow offline usage
    return true;
  }
};

/**
 * Enhanced startup authentication check
 */
export const performStartupAuthCheck = async (): Promise<{
  shouldAttemptLogin: boolean;
  userInfo: { userId: string; role: string; email: string } | null;
  persistentState: PersistentAuthState | null;
}> => {
  const persistentState = getPersistentAuthState();
  
  if (!persistentState) {
    return {
      shouldAttemptLogin: false,
      userInfo: null,
      persistentState: null,
    };
  }
  
  // Validate against server
  const isValid = await validatePersistentAuthState();
  
  return {
    shouldAttemptLogin: isValid,
    userInfo: isValid ? {
      userId: persistentState.userId,
      role: persistentState.role,
      email: persistentState.email,
    } : null,
    persistentState: isValid ? persistentState : null,
  };
};
