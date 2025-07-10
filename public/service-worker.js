// Enhanced service worker with improved error handling and caching strategies
const CACHE_VERSION = 'v2.1';
const CACHE_NAME = `pickcreator-cache-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `pickcreator-dynamic-${CACHE_VERSION}`;
const USER_DATA_CACHE = `pickcreator-user-data-${CACHE_VERSION}`;
let userRole = '';

// Authentication routes that should never be cached
const AUTH_ROUTES = [
  '/api/auth/',
  '/api/auth/log-in',
  '/api/auth/log-out',
  '/api/auth/check-auth',
  '/api/auth/currentUser'
];

// Routes that should bypass service worker completely
const BYPASS_ROUTES = [
  '/api/auth/',
  '/_next/',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml'
];

// Critical assets to pre-cache for offline use
const PRECACHE_ASSETS = [
  '/',
  '/welcome',
  '/manifest.json',
  '/icon.png',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png'
];

// Network timeout for fetch requests (in milliseconds)
const NETWORK_TIMEOUT = 5000;

// Enhanced utility functions with better error handling
const shouldBypassServiceWorker = (url) => {
  return BYPASS_ROUTES.some(route => url.pathname.startsWith(route));
};

const isAuthRoute = (url) => {
  return AUTH_ROUTES.some(route => url.pathname.includes(route));
};

const isNavigationRequest = (request) => {
  return request.mode === 'navigate' ||
         (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
};

// Enhanced fetch with timeout and better error handling
const fetchWithTimeout = async (request, timeout = NETWORK_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(request, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.warn('Request timed out:', request.url);
      throw new Error('Network timeout');
    }
    throw error;
  }
};

// Function to get user role from storage
const getUserRole = async () => {
  if (userRole) return userRole;

  try {
    const cache = await caches.open(USER_DATA_CACHE);
    const response = await cache.match('user-role');
    if (response) {
      const data = await response.text();
      if (data) {
        userRole = data;
        return data;
      }
    }
  } catch (error) {
    console.warn('Error getting user role from cache:', error);
  }

  return '';
};

// Store user role in cache for offline access
const storeUserRole = async (role) => {
  if (!role) return;

  try {
    userRole = role;
    const cache = await caches.open(USER_DATA_CACHE);
    await cache.put('user-role', new Response(role));
  } catch (error) {
    console.warn('Error storing user role:', error);
  }
};

// Install event - pre-cache essential assets with better error handling
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Pre-caching assets...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('Pre-caching completed successfully');
      })
      .catch((error) => {
        console.error('Pre-caching failed:', error);
        // Don't fail the installation if pre-caching fails
        return Promise.resolve();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('pickcreator-') &&
                cacheName !== CACHE_NAME &&
                cacheName !== DYNAMIC_CACHE &&
                cacheName !== USER_DATA_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker activated successfully');
    }).catch((error) => {
      console.error('Service Worker activation failed:', error);
    })
  );
});

// Enhanced fetch event with better error handling and routing
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip service worker for certain routes
  if (shouldBypassServiceWorker(url)) {
    return;
  }

  // Never intercept auth routes - let browser handle them directly
  if (isAuthRoute(url)) {
    return;
  }

  // Handle API requests with network-first approach
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  // Handle navigation requests
  if (isNavigationRequest(event.request)) {
    event.respondWith(handleNavigationRequest(event.request));
    return;
  }

  // Handle static assets
  event.respondWith(handleAssetRequest(event.request));
});

// Handle API requests with timeout and fallback
const handleApiRequest = async (request) => {
  try {
    const response = await fetchWithTimeout(request);

    // Cache successful responses (except auth routes)
    if (response.ok && !isAuthRoute(new URL(request.url))) {
      try {
        const cache = await caches.open(DYNAMIC_CACHE);
        await cache.put(request, response.clone());
      } catch (cacheError) {
        console.warn('Failed to cache API response:', cacheError);
      }
    }

    return response;
  } catch (error) {
    console.warn('API request failed, trying cache:', error);

    // Try to get from cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return a meaningful error response
    return new Response(
      JSON.stringify({
        error: 'Network unavailable',
        message: 'Please check your connection and try again'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// Handle navigation requests with offline fallback
const handleNavigationRequest = async (request) => {
  try {
    const response = await fetchWithTimeout(request);

    // Cache successful navigation responses
    if (response.ok) {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      } catch (cacheError) {
        console.warn('Failed to cache navigation response:', cacheError);
      }
    }

    return response;
  } catch (error) {
    console.warn('Navigation request failed, trying offline fallback:', error);

    // Try to get from cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try role-specific fallback
    try {
      const role = await getUserRole();
      if (role) {
        const rolePageUrl = `/${role.toLowerCase()}`;
        const rolePageResponse = await caches.match(rolePageUrl) ||
                                 await caches.match(`${rolePageUrl}/`);
        if (rolePageResponse) {
          return rolePageResponse;
        }
      }
    } catch (roleError) {
      console.warn('Error getting role for fallback:', roleError);
    }

    // Final fallback to home page
    const homeResponse = await caches.match('/') || await caches.match('/welcome');
    if (homeResponse) {
      return homeResponse;
    }

    // Return a basic offline page
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Offline - PickCreator</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline-message { max-width: 400px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <h1>You're Offline</h1>
            <p>Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
};

// Handle static asset requests with cache-first strategy
const handleAssetRequest = async (request) => {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If not in cache, fetch from network
    const response = await fetchWithTimeout(request);

    // Cache successful responses
    if (response.ok && request.method === 'GET') {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      } catch (cacheError) {
        console.warn('Failed to cache asset:', cacheError);
      }
    }

    return response;
  } catch (error) {
    console.warn('Asset request failed:', error);

    // Try to get from cache as final fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return a 404 response for missing assets
    return new Response('Asset not found', {
      status: 404,
      statusText: 'Not Found'
    });
  }
};

// Enhanced message event handler
self.addEventListener('message', (event) => {
  if (!event.data) return;

  const { type, role } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'LOGIN':
      handleLoginMessage(role);
      break;

    case 'LOGOUT':
      handleLogoutMessage();
      break;

    case 'CLEAR_CACHE':
      handleClearCacheMessage();
      break;

    default:
      console.log('Unknown message type:', type);
  }
});

// Handle login message
const handleLoginMessage = async (role) => {
  if (!role) return;

  try {
    // Store the role for offline access
    await storeUserRole(role);

    // Pre-cache the role-specific landing page
    const roleUrl = `/${role.toLowerCase()}`;
    const cache = await caches.open(CACHE_NAME);

    try {
      await cache.add(new Request(roleUrl));
      await cache.add(new Request(`${roleUrl}/`));
      console.log('Pre-cached role pages for:', role);
    } catch (cacheError) {
      console.warn('Failed to pre-cache role pages:', cacheError);
    }
  } catch (error) {
    console.error('Error handling login message:', error);
  }
};

// Handle logout message
const handleLogoutMessage = async () => {
  try {
    // Clear role from memory
    userRole = '';

    // Clear user data cache
    const userCache = await caches.open(USER_DATA_CACHE);
    await userCache.delete('user-role');

    // Clear dynamic cache that may contain user-specific data
    const dynamicCache = await caches.open(DYNAMIC_CACHE);
    const keys = await dynamicCache.keys();

    const clearPromises = keys
      .filter(request => {
        const url = request.url;
        return url.includes('/api/') ||
               url.includes('/admin/') ||
               url.includes('/brand/') ||
               url.includes('/influencer/');
      })
      .map(request => dynamicCache.delete(request));

    await Promise.all(clearPromises);
    console.log('Cleared user-specific cache data');
  } catch (error) {
    console.error('Error handling logout message:', error);
  }
};

// Handle cache clear message
const handleClearCacheMessage = async () => {
  try {
    const cacheNames = await caches.keys();
    const deletePromises = cacheNames
      .filter(name => name.startsWith('pickcreator-'))
      .map(name => caches.delete(name));

    await Promise.all(deletePromises);
    console.log('Cleared all application caches');
  } catch (error) {
    console.error('Error clearing caches:', error);
  }
};

// Enhanced push notification event handler
self.addEventListener('push', (event) => {
  console.log('Push notification received');

  try {
    // Default notification data
    let data = {
      title: 'PickCreator',
      body: 'You have a new notification',
      icon: '/icon.png',
      badge: '/icon.png'
    };

    // Parse the data from the push event
    if (event.data) {
      try {
        const pushData = event.data.json();
        data = { ...data, ...pushData };
      } catch (parseError) {
        console.warn('Error parsing push notification data:', parseError);
      }
    }

    const options = {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      image: data.image,
      vibrate: [200, 100, 200],
      silent: false,
      timestamp: Date.now(),
      requireInteraction: false,
      data: data.data || {},
      actions: data.actions || [],
      tag: data.tag || 'default'
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
        .catch(error => {
          console.error('Error showing notification:', error);
        })
    );
  } catch (error) {
    console.error('Error in push event handler:', error);
  }
});

// Enhanced notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked');
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        // Check if there's already a window open
        for (const client of clients) {
          if (client.url.includes(self.location.origin)) {
            // Focus existing window and navigate to target URL
            return client.focus().then(() => {
              if (targetUrl !== '/') {
                return client.navigate(targetUrl);
              }
            });
          }
        }

        // Open new window if none exists
        return self.clients.openWindow(targetUrl);
      })
      .catch(error => {
        console.error('Error handling notification click:', error);
        // Fallback to opening new window
        return self.clients.openWindow(targetUrl);
      })
  );
});

// Handle notification close event
self.addEventListener('notificationclose', () => {
  console.log('Notification closed');
  // You can track notification dismissals here if needed
});

// Global error handler for unhandled errors in service worker
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

// Global handler for unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent the default browser behavior
});