import { AxiosError } from 'axios';

export interface InstagramApiError {
  code: number;
  type: string;
  message: string;
  isOAuthError: boolean;
  requiresReconnect: boolean;
}

// Instagram API error response interface
interface InstagramErrorResponse {
  error: {
    code?: number;
    type?: string;
    message?: string;
    [key: string]: any;
  };
}

// Error codes that indicate the user needs to reconnect their Instagram account
const RECONNECT_ERROR_CODES = [
  190, // Invalid OAuth access token
  200, // Permissions error
  10, // API permission issues
  102, // Session has expired
];

/**
 * Extracts and formats error information from Instagram API responses
 */
export const parseInstagramError = (error: unknown): InstagramApiError => {
  // Default error response
  const defaultError: InstagramApiError = {
    code: 500,
    type: 'UnknownError',
    message: 'An unknown error occurred with Instagram API',
    isOAuthError: false,
    requiresReconnect: false,
  };

  // Return default error if not an Axios error
  if (!error || !(error instanceof Error)) {
    return defaultError;
  }

  // Handle Axios errors
  if ('isAxiosError' in error && (error as AxiosError).isAxiosError) {
    const axiosError = error as AxiosError;
    const response = axiosError.response;
    
    if (response?.data && typeof response.data === 'object' && 'error' in response.data) {
      const errorData = response.data as InstagramErrorResponse;
      const apiError = errorData.error;
      
      const isOAuthError = apiError.type === 'OAuthException';
      const requiresReconnect = isOAuthError || 
        (apiError.code !== undefined && RECONNECT_ERROR_CODES.includes(apiError.code));

      return {
        code: apiError.code || 500,
        type: apiError.type || 'ApiError',
        message: apiError.message || 'Instagram API error occurred',
        isOAuthError,
        requiresReconnect,
      };
    }

    // Generic Axios error without specific Instagram error data
    return {
      code: response?.status || 500,
      type: 'NetworkError',
      message: axiosError.message || 'Network error occurred',
      isOAuthError: false,
      requiresReconnect: false,
    };
  }

  // Handle non-Axios errors
  return {
    ...defaultError,
    message: (error as Error).message || defaultError.message,
  };
};

/**
 * Returns a user-friendly error message based on the Instagram API error
 */
export const getInstagramErrorMessage = (error: InstagramApiError): string => {
  if (error.requiresReconnect) {
    return 'Your Instagram connection has expired. Please reconnect your account.';
  }

  switch (error.code) {
    case 4:
      return 'Instagram API rate limit exceeded. Please try again later.';
    case 10:
      return 'Permission error: We need additional permissions to access your Instagram data.';
    case 100:
      return 'Invalid parameter in Instagram request. Please try again.';
    case 190:
      return 'Your Instagram session has expired. Please reconnect your account.';
    default:
      return error.message || 'An error occurred with Instagram. Please try again later.';
  }
};

/**
 * Checks if the error requires the user to reconnect their Instagram account
 */
export const requiresInstagramReconnect = (error: unknown): boolean => {
  const parsedError = parseInstagramError(error);
  return parsedError.requiresReconnect;
}; 