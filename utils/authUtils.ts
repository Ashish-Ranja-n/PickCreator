import axios from 'axios';

// Track consecutive refresh failures for better error handling
let consecutiveRefreshFailures = 0;
const MAX_REFRESH_FAILURES = 3;

// Retry function with exponential backoff - moved outside to be reusable
const retryWithBackoff = async (retryCount: number, maxRetries: number = 3): Promise<boolean> => {
  if (retryCount >= maxRetries) return false;

  const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 seconds
  await new Promise(resolve => setTimeout(resolve, delay));

  try {
    const response = await axios.get('/api/auth/refresh-token');
    if (response.data.success) {
      consecutiveRefreshFailures = 0; // Reset failure count on success
      return true;
    }
    return false;
  } catch (error) {
    console.warn(`Token refresh retry ${retryCount + 1} failed:`, error);
    return retryWithBackoff(retryCount + 1, maxRetries);
  }
};

/**
 * Setup axios interceptors to handle authentication errors
 * This will automatically refresh the token when it expires with retry logic
 */
export const setupAuthInterceptors = () => {
  let isRefreshing = false;
  let refreshQueue: Array<() => void> = [];

  // Function to process the queue of failed requests
  const processQueue = () => {
    refreshQueue.forEach(callback => callback());
    refreshQueue = [];
  };

  // Response interceptor with robust retry logic
  axios.interceptors.response.use(
    response => response,
    async error => {
      const originalRequest = error.config;

      // If we got a 401 error and haven't tried to refresh yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise(resolve => {
            refreshQueue.push(() => resolve(axios(originalRequest)));
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Try to refresh the token with retry logic
          let refreshSuccess = false;

          try {
            const response = await axios.get('/api/auth/refresh-token');
            refreshSuccess = response.data.success;
          } catch (refreshError) {
            // If initial refresh fails, try with backoff
            console.warn('Initial token refresh failed, attempting retry with backoff');
            refreshSuccess = await retryWithBackoff(0);
          }

          if (refreshSuccess) {
            consecutiveRefreshFailures = 0; // Reset failure count
            // Process the queued requests
            processQueue();

            // Retry the original request
            return axios(originalRequest);
          } else {
            consecutiveRefreshFailures++;
            console.error(`Token refresh failed. Consecutive failures: ${consecutiveRefreshFailures}`);

            // Only redirect to login after multiple consecutive failures
            if (consecutiveRefreshFailures >= MAX_REFRESH_FAILURES) {
              console.error('Max refresh failures reached, redirecting to login');
              processQueue();
              window.location.href = '/welcome';
              return Promise.reject(error);
            } else {
              // For fewer failures, just reject the request but don't logout
              processQueue();
              return Promise.reject(error);
            }
          }
        } catch (refreshError) {
          consecutiveRefreshFailures++;
          console.error(`Token refresh error. Consecutive failures: ${consecutiveRefreshFailures}`, refreshError);

          // Only redirect to login after multiple consecutive failures
          if (consecutiveRefreshFailures >= MAX_REFRESH_FAILURES) {
            console.error('Max refresh failures reached, redirecting to login');
            processQueue();
            window.location.href = '/welcome';
            return Promise.reject(error);
          } else {
            // For fewer failures, just reject the request but don't logout
            processQueue();
            return Promise.reject(error);
          }
        } finally {
          isRefreshing = false;
        }
      }

      // For other errors, just reject normally
      return Promise.reject(error);
    }
  );
};

/**
 * Function to check authentication status and refresh token if needed
 * Can be called periodically to keep the session alive with retry logic
 */
export const checkAndRefreshAuth = async (): Promise<boolean> => {
  try {
    const response = await axios.get('/api/auth/check-auth');
    if (response.data.authenticated) {
      consecutiveRefreshFailures = 0; // Reset failure count on successful auth check
      return true;
    }
    return false;
  } catch (error) {
    try {
      // Try to refresh token on auth check failure
      const refreshResponse = await axios.get('/api/auth/refresh-token');
      if (refreshResponse.data.success) {
        consecutiveRefreshFailures = 0; // Reset failure count on successful refresh
        return true;
      }
      return false;
    } catch (refreshError) {
      // Try with backoff on refresh failure
      console.warn('Auth check refresh failed, attempting retry with backoff');
      const retrySuccess = await retryWithBackoff(0);
      if (!retrySuccess) {
        consecutiveRefreshFailures++;
      }
      return retrySuccess;
    }
  }
};

/**
 * Function to periodically check and refresh authentication
 * Call this on app initialization to keep sessions alive
 * Increased frequency for native app-like behavior
 */
export const initializeAuthRefresh = () => {
  // First check immediately
  checkAndRefreshAuth();

  // Then check every 5 minutes for more proactive refresh
  const intervalId = setInterval(async () => {
    const isAuthenticated = await checkAndRefreshAuth();
    if (!isAuthenticated) {
      // Don't clear interval immediately - allow for temporary network issues
      console.warn('Auth check failed, but keeping refresh active for recovery');

      // Only clear interval after multiple consecutive failures
      if (consecutiveRefreshFailures >= MAX_REFRESH_FAILURES) {
        console.error('Max consecutive failures reached, stopping auth refresh');
        clearInterval(intervalId);
      }
    }
  }, 5 * 60 * 1000); // 5 minutes for more frequent checks

  return () => clearInterval(intervalId);
};

/**
 * Enhanced session management with proactive token refresh
 * This function checks if the token is close to expiring and refreshes it proactively
 */
export const proactiveTokenRefresh = async (): Promise<boolean> => {
  try {
    // Always try to refresh the token proactively
    const response = await axios.get('/api/auth/refresh-token');
    if (response.data.success) {
      consecutiveRefreshFailures = 0;
      console.log('Proactive token refresh successful');
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Proactive token refresh failed, attempting retry');
    return await retryWithBackoff(0);
  }
};

/**
 * Initialize enhanced background refresh with both periodic checks and proactive refresh
 */
export const initializeEnhancedAuthRefresh = () => {
  // First check immediately
  checkAndRefreshAuth();

  // Periodic auth checks every 5 minutes
  const authCheckInterval = setInterval(async () => {
    const isAuthenticated = await checkAndRefreshAuth();
    if (!isAuthenticated && consecutiveRefreshFailures >= MAX_REFRESH_FAILURES) {
      console.error('Max consecutive failures reached, stopping auth checks');
      clearInterval(authCheckInterval);
    }
  }, 5 * 60 * 1000);

  // Proactive token refresh every 2 minutes to prevent expiration
  const proactiveRefreshInterval = setInterval(async () => {
    await proactiveTokenRefresh();
  }, 2 * 60 * 1000);

  return () => {
    clearInterval(authCheckInterval);
    clearInterval(proactiveRefreshInterval);
  };
};