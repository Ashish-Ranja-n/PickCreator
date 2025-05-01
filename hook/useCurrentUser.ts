import { useEffect, useState, useCallback, useRef } from "react";
import { useUserStore, User } from "@/lib/store/userStore";

// Add a logout flag to prevent auto-refetching after logout
let hasLoggedOut = false;

// Basic hook that returns just the user
export const useCurrentUser = () => {
  // Use the Zustand store instead of local state
  const { user, isLoading } = useUserStore();
  const fetchUserFn = useUserStore(state => state.fetchUser);
  const hasAttemptedFetchRef = useRef(false);
  
  useEffect(() => {
    // If no user is loaded yet, trigger a fetch, but only once
    // and only if we haven't just logged out
    if (!user && !isLoading && !hasAttemptedFetchRef.current && !hasLoggedOut) {
      hasAttemptedFetchRef.current = true;
      fetchUserFn();
    }
  }, [user, isLoading, fetchUserFn]);

  return user;
};

// Hook that returns user and status info
export const useCurrentUserWithStatus = () => {
  const { user, isLoading, error } = useUserStore();
  const fetchUserFn = useUserStore(state => state.fetchUser);
  const hasAttemptedFetchRef = useRef(false);
  
  // Use a stable callback reference that will always use the latest state
  const refetch = useCallback(() => {
    hasLoggedOut = false; // Reset the logout flag when manually refetching
    return fetchUserFn();
  }, [fetchUserFn]);
  
  useEffect(() => {
    // If no user is loaded yet, trigger a fetch, but only once
    // and only if we haven't just logged out
    if (!user && !isLoading && !hasAttemptedFetchRef.current && !hasLoggedOut) {
      hasAttemptedFetchRef.current = true;
      fetchUserFn();
    }
  }, [user, isLoading, fetchUserFn]);

  return { user, isLoading, error, refetch };
};

// Hook to clear user data (useful for logout)
export const useClearUser = () => {
  const clearUser = useUserStore(state => state.clearUser);
  
  return useCallback(() => {
    // Set the logout flag to prevent auto-refetching
    hasLoggedOut = true;
    clearUser();
  }, [clearUser]);
};
