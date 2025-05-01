import axios from 'axios';

/**
 * Setup axios interceptors to handle authentication errors
 * This will automatically refresh the token when it expires
 */
export const setupAuthInterceptors = () => {
  let isRefreshing = false;
  let refreshQueue: Array<() => void> = [];

  // Function to process the queue of failed requests
  const processQueue = (token: string | null) => {
    refreshQueue.forEach(callback => callback());
    refreshQueue = [];
  };

  // Response interceptor
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
          // Try to refresh the token
          const response = await axios.get('/api/auth/refresh-token');
          
          if (response.data.success) {
            // Process the queued requests
            processQueue(null);
            
            // Retry the original request
            return axios(originalRequest);
          } else {
            // If refresh failed, clear the queue and throw
            processQueue(null);
            window.location.href = '/log-in';
            return Promise.reject(error);
          }
        } catch (refreshError) {
          // If refresh failed, clear the queue and redirect to login
          processQueue(null);
          window.location.href = '/log-in';
          return Promise.reject(error);
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
 * Can be called periodically to keep the session alive
 */
export const checkAndRefreshAuth = async (): Promise<boolean> => {
  try {
    const response = await axios.get('/api/auth/check-auth');
    return response.data.authenticated;
  } catch (error) {
    try {
      // Try to refresh token on auth check failure
      const refreshResponse = await axios.get('/api/auth/refresh-token');
      return refreshResponse.data.success;
    } catch (refreshError) {
      return false;
    }
  }
};

/**
 * Function to periodically check and refresh authentication
 * Call this on app initialization to keep sessions alive
 */
export const initializeAuthRefresh = () => {
  // First check immediately
  checkAndRefreshAuth();
  
  // Then check every 15 minutes
  const intervalId = setInterval(async () => {
    const isAuthenticated = await checkAndRefreshAuth();
    if (!isAuthenticated) {
      clearInterval(intervalId);
    }
  }, 15 * 60 * 1000); // 15 minutes
  
  return () => clearInterval(intervalId);
}; 