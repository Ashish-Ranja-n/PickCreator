// Add React Query global cache types to Window interface
declare global {
  interface Window {
    // Standard React Query global cache
    __REACT_QUERY_GLOBAL_CACHE__?: {
      clear: () => void;
      getQueryCache?: () => any;
      getMutationCache?: () => any;
    };
    
    // For newer versions of React Query (Tanstack Query)
    __TANSTACK_QUERY_CACHE__?: {
      clear: () => void;
      getQueryCache?: () => any;
      getMutationCache?: () => any;
    };
    
    // For React Query v3
    __REACT_QUERY_DEVTOOLS__?: {
      queryCache?: {
        clear: () => void;
      };
    };
  }
}

export {}; 