'use client'

import { useEffect, useState } from 'react'
import { useCurrentUser } from '@/hook/useCurrentUser'
import { setupAuthInterceptors, initializeEnhancedAuthRefresh } from '@/utils/authUtils'
import { initializeSessionRecovery } from '@/utils/sessionRecovery'
import { performStartupAuthCheck, initializePersistentAuthTracking } from '@/utils/persistentAuth'

export function SessionRefresher() {
  const user = useCurrentUser()
  const [isInitialized, setIsInitialized] = useState(false)
  const [sessionRecoveryAttempted, setSessionRecoveryAttempted] = useState(false)
  const [persistentAuthInitialized, setPersistentAuthInitialized] = useState(false)

  useEffect(() => {
    // Setup axios interceptors for token refresh on first render
    // This should happen regardless of auth state
    if (!isInitialized) {
      setupAuthInterceptors();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  useEffect(() => {
    // Initialize persistent auth tracking
    if (!persistentAuthInitialized) {
      const cleanup = initializePersistentAuthTracking();
      setPersistentAuthInitialized(true);

      // Return cleanup function
      return cleanup;
    }
  }, [persistentAuthInitialized]);

  useEffect(() => {
    // Attempt session recovery on app startup if no user is present
    if (!user && !sessionRecoveryAttempted && isInitialized) {
      setSessionRecoveryAttempted(true);

      // First check persistent auth state
      performStartupAuthCheck().then(({ shouldAttemptLogin, userInfo }) => {
        if (shouldAttemptLogin && userInfo) {
          console.log(`Persistent auth found for user ${userInfo.userId}, attempting recovery`);

          // Attempt session recovery
          return initializeSessionRecovery();
        } else {
          console.log('No persistent auth state found, skipping recovery');
          return false;
        }
      }).then((recovered) => {
        if (recovered) {
          console.log('Session recovery successful, user should be restored');
          // The user store will be updated by the recovery process
        } else {
          console.log('Session recovery not needed or failed');
        }
      }).catch((error) => {
        console.error('Session recovery error:', error);
      });
    }
  }, [user, sessionRecoveryAttempted, isInitialized]);
  
  useEffect(() => {
    // Only run session refresher if user is logged in
    if (!user) return;

    // Initialize the enhanced periodic token refresh with proactive refresh
    const cleanup = initializeEnhancedAuthRefresh();

    // Return cleanup function
    return () => {
      cleanup();
    };
  }, [user]);
  
  // This is a hidden component with no visual rendering
  return null;
} 