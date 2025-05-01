'use client'

import { useEffect, useState } from 'react'
import { useCurrentUser } from '@/hook/useCurrentUser'
import { setupAuthInterceptors, initializeAuthRefresh } from '@/utils/authUtils'

export function SessionRefresher() {
  const user = useCurrentUser()
  const [isInitialized, setIsInitialized] = useState(false)
  
  useEffect(() => {
    // Setup axios interceptors for token refresh on first render
    // This should happen regardless of auth state
    if (!isInitialized) {
      setupAuthInterceptors();
      setIsInitialized(true);
    }
  }, [isInitialized]);
  
  useEffect(() => {
    // Only run session refresher if user is logged in
    if (!user) return;
    
    // Initialize the periodic token refresh
    const cleanup = initializeAuthRefresh();
    
    // Return cleanup function
    return () => {
      cleanup();
    };
  }, [user]);
  
  // This is a hidden component with no visual rendering
  return null;
} 