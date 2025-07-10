/**
 * PWA Service Worker Registration
 * 
 * This utility helps register the service worker properly for PWA functionality.
 * Place this in your main layout or a component that loads on every page.
 */

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported in this browser or environment');
    return null;
  }
  
  try {
    // Register the service worker with the scope set to the root
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });
    
    console.log('Service Worker registered successfully with scope:', registration.scope);
    
    // Set up update checking logic
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;
      
      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New service worker available
            console.log('New service worker available - update ready');
            
            // You could notify the user that an update is available
            // or automatically refresh the page
          } else {
            // Service worker installed for the first time
            console.log('Service Worker installed for the first time');
          }
        }
      };
    };
    
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

/**
 * Check if the application is installed as a PWA
 * This can be used to customize the UI based on whether
 * the user is in a browser or has installed the app
 */
export const isPWAInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check if running in standalone mode (installed PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone
    || document.referrer.includes('android-app://');
    
  return isStandalone;
}; 