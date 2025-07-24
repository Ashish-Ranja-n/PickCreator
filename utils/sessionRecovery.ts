/**
 * Session Recovery Utilities
 * Provides mechanisms to recover user sessions from temporary failures
 * and maintain authentication state across app restarts
 */

interface SessionState {
  userId: string;
  role: string;
  email: string;
  lastActivity: number;
  recoveryAttempts: number;
  isRecovering: boolean;
}

const SESSION_STORAGE_KEY = 'pickcreator-session-recovery';
const MAX_RECOVERY_ATTEMPTS = 3;
const SESSION_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30 days
const RECOVERY_COOLDOWN = 5 * 60 * 1000; // 5 minutes between recovery attempts

/**
 * Save session state for recovery purposes
 */
export const saveSessionState = (user: any): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const sessionState: SessionState = {
      userId: user._id || user.id,
      role: user.role,
      email: user.email,
      lastActivity: Date.now(),
      recoveryAttempts: 0,
      isRecovering: false,
    };
    
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionState));
    console.log('Session state saved for recovery');
  } catch (error) {
    console.warn('Failed to save session state:', error);
  }
};

/**
 * Get saved session state
 */
export const getSessionState = (): SessionState | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!saved) return null;
    
    const sessionState: SessionState = JSON.parse(saved);
    
    // Check if session is expired
    if (Date.now() - sessionState.lastActivity > SESSION_TIMEOUT) {
      console.log('Session state expired, clearing');
      clearSessionState();
      return null;
    }
    
    return sessionState;
  } catch (error) {
    console.warn('Failed to get session state:', error);
    return null;
  }
};

/**
 * Clear session state
 */
export const clearSessionState = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    console.log('Session state cleared');
  } catch (error) {
    console.warn('Failed to clear session state:', error);
  }
};

/**
 * Update session activity timestamp
 */
export const updateSessionActivity = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const sessionState = getSessionState();
    if (sessionState) {
      sessionState.lastActivity = Date.now();
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionState));
    }
  } catch (error) {
    console.warn('Failed to update session activity:', error);
  }
};

/**
 * Check if session recovery should be attempted
 */
export const shouldAttemptRecovery = (): boolean => {
  const sessionState = getSessionState();
  if (!sessionState) return false;
  
  // Don't attempt if already recovering
  if (sessionState.isRecovering) return false;
  
  // Don't attempt if max attempts reached
  if (sessionState.recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) return false;
  
  // Check cooldown period
  const timeSinceLastActivity = Date.now() - sessionState.lastActivity;
  if (timeSinceLastActivity < RECOVERY_COOLDOWN) return false;
  
  return true;
};

/**
 * Mark session as recovering
 */
export const markSessionRecovering = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const sessionState = getSessionState();
    if (sessionState) {
      sessionState.isRecovering = true;
      sessionState.recoveryAttempts++;
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionState));
    }
  } catch (error) {
    console.warn('Failed to mark session as recovering:', error);
  }
};

/**
 * Mark session recovery as complete
 */
export const markSessionRecovered = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const sessionState = getSessionState();
    if (sessionState) {
      sessionState.isRecovering = false;
      sessionState.recoveryAttempts = 0;
      sessionState.lastActivity = Date.now();
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionState));
    }
  } catch (error) {
    console.warn('Failed to mark session as recovered:', error);
  }
};

/**
 * Attempt to recover session by calling auth endpoints
 */
export const attemptSessionRecovery = async (): Promise<boolean> => {
  if (!shouldAttemptRecovery()) {
    console.log('Session recovery not needed or not allowed');
    return false;
  }
  
  console.log('Attempting session recovery...');
  markSessionRecovering();
  
  try {
    // First try to check current auth status
    const checkResponse = await fetch('/api/auth/check-auth', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (checkResponse.ok) {
      console.log('Session recovery successful via auth check');
      markSessionRecovered();
      return true;
    }
    
    // If auth check fails, try token refresh
    const refreshResponse = await fetch('/api/auth/refresh-token', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      if (data.success) {
        console.log('Session recovery successful via token refresh');
        markSessionRecovered();
        return true;
      }
    }
    
    console.warn('Session recovery failed');
    return false;
  } catch (error) {
    console.error('Session recovery error:', error);
    return false;
  }
};

/**
 * Initialize session recovery on app startup
 */
export const initializeSessionRecovery = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  console.log('Initializing session recovery...');
  
  // Check if we have a saved session state
  const sessionState = getSessionState();
  if (!sessionState) {
    console.log('No session state found, skipping recovery');
    return false;
  }
  
  console.log(`Found session state for user ${sessionState.userId}, role: ${sessionState.role}`);
  
  // Attempt recovery
  const recovered = await attemptSessionRecovery();
  
  if (!recovered) {
    // If recovery failed and we've reached max attempts, clear the session
    const updatedState = getSessionState();
    if (updatedState && updatedState.recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
      console.log('Max recovery attempts reached, clearing session state');
      clearSessionState();
    }
  }
  
  return recovered;
};
