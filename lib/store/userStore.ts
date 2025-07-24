import { create } from 'zustand';
import axios from 'axios';
import { saveSessionState, clearSessionState, updateSessionActivity } from '@/utils/sessionRecovery';
import { savePersistentAuthState, clearPersistentAuthState, updatePersistentAuthActivity } from '@/utils/persistentAuth';

// Define the user interface
export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  isVerified: boolean;
  [key: string]: string | boolean | number | object | undefined; // More specific types for dynamic properties
}

// Define the user store state
interface UserState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  fetchUser: () => Promise<User | null>;
  clearUser: () => void;
}

// Helper function for retry logic
async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await fetchFn();
    } catch (error) {
      retries++;
      
      if (retries >= maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, retries) * 300;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // TypeScript needs this, but it should never reach here
  throw new Error('Unexpected error in fetchWithRetry');
}

// Create the store
export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  
  fetchUser: async () => {
    // If we're already loading, don't trigger another fetch
    if (get().isLoading) {
      return get().user;
    }

    // Check if we have cached user data
    let cachedUser = null;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        cachedUser = localStorage.getItem('currentUser');

        if (cachedUser && cachedUser !== 'undefined' && cachedUser !== 'null') {
          const parsedUser = JSON.parse(cachedUser);
          // Validate that the parsed data has the expected structure
          if (parsedUser && typeof parsedUser === 'object' && parsedUser._id) {
            console.log('Using cached user data');
            set({ user: parsedUser, isLoading: false, error: null });
            return parsedUser;
          } else {
            // Invalid user data structure - clear cache
            console.warn('Cached user data has invalid structure:', parsedUser);
            localStorage.removeItem('currentUser');
            localStorage.removeItem('currentUserTimestamp');
          }
        }
      } catch (parseError) {
        // If parsing fails, clear the invalid cache
        console.error('Failed to parse cached user data:', parseError);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentUserTimestamp');
      }
    }

    // No valid cache found, fetch from API
    return await fetchFromAPI();
  },
  
  clearUser: () => {
    console.log('UserStore: Clearing user data');
    
    // Clear localStorage items
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        // Core user items
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentUserTimestamp');
        
        // Clear any other related localStorage items
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.includes('user') || 
            key.includes('profile') || 
            key.includes('instagram') ||
            key.startsWith('rq-')
          )) {
            keysToRemove.push(key);
          }
        }
        
        // Remove all matched keys
        keysToRemove.forEach(key => {
          console.log(`UserStore: Removing localStorage key: ${key}`);
          localStorage.removeItem(key);
        });

        // Clear session recovery state
        clearSessionState();

        // Clear persistent auth state
        clearPersistentAuthState();
      } catch (e) {
        console.warn('Error removing items from localStorage:', e);
      }
    }
    
    // Reset all state in the store
    set({
      user: null,
      isLoading: false,
      error: null
    });
    
    // Force a state update to trigger component re-renders
    setTimeout(() => {
      set(state => ({ ...state }));
    }, 100);
    
    console.log('UserStore: User data cleared');
  }
}));

// Helper function to fetch from API - extracted to avoid code duplication
async function fetchFromAPI() {
  const store = useUserStore.getState();
  
  try {
    // Fetch with retry logic
    const userData = await fetchWithRetry(async () => {
      const response = await axios.get('/api/auth/currentUser');
      // Validate the response structure
      if (response.data && response.data.success && response.data.user) {
        return response.data.user;
      } else {
        throw new Error('Invalid response structure from currentUser API');
      }
    });
    
    // Validate user data before storing
    if (!userData || typeof userData !== 'object' || !userData._id) {
      throw new Error('Invalid user data received from API');
    }
    
    // Update state and cache
    store.fetchUser = store.fetchUser; // This is just to access the store without changing it
    useUserStore.setState({ user: userData, isLoading: false, error: null });
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('currentUserTimestamp', Date.now().toString());

        // Save session state for recovery
        saveSessionState(userData);

        // Save persistent auth state
        savePersistentAuthState(userData);

        // Update session activity
        updateSessionActivity();

        // Update persistent auth activity
        updatePersistentAuthActivity();
      } catch (e) {
        console.warn('Error saving to localStorage:', e);
      }
    }
    
    return userData;
  } catch (error) {
    console.error('Failed to fetch user from API:', error);
    useUserStore.setState({ error: error as Error, isLoading: false });
    return null;
  }
}

// Initialize the store when this module is imported - with protection against loops
let initializationAttempted = false;
if (typeof window !== 'undefined' && !initializationAttempted) {
  initializationAttempted = true;
  // Only run on client side
  // Use setTimeout to ensure this runs after hydration
  setTimeout(() => {
    useUserStore.getState().fetchUser();
  }, 100);
}
