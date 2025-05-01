// This service worker handles push notifications and provides offline functionality
const CACHE_NAME = 'pickcreator-cache-v1';
const DYNAMIC_CACHE = 'pickcreator-dynamic-v1';
const USER_ROLE_KEY = 'pickcreator-user-role';
let userRole = '';

// Authentication routes that should never be cached
const AUTH_ROUTES = [
  '/api/auth/',
  '/api/auth/log-in',
  '/api/auth/log-out',
  '/api/auth/check-auth',
  '/api/auth/currentUser'
];

// Role-specific pages to pre-cache for offline use
const ROLE_PAGES = [
  '/brand',
  '/brand/',
  '/influencer',
  '/influencer/',
  '/admin',
  '/admin/'
];

// Assets to pre-cache for offline use
const PRECACHE_ASSETS = [
  '/',
  '/icon.png',
  '/manifest.json',
  ...ROLE_PAGES,
  // Add critical assets here
];

// Function to get user role from storage
const getUserRole = async () => {
  // First try memory
  if (userRole) {
    return userRole;
  }
  
  try {
    // Try localStorage
    if (self.caches) {
      try {
        const cache = await caches.open('pickcreator-user-data');
        const response = await cache.match('user-role');
        if (response) {
          const data = await response.text();
          if (data) return data;
        }
      } catch (e) {
        console.error('Error reading from cache:', e);
      }
    }
    
    return '';
  } catch (error) {
    console.error('Error getting user role:', error);
    return '';
  }
};

// Store user role in cache for offline access
const storeUserRole = async (role) => {
  if (!role) return;
  
  try {
    userRole = role; // Store in memory first
    
    if (self.caches) {
      const cache = await caches.open('pickcreator-user-data');
      await cache.put('user-role', new Response(role));
    }
  } catch (e) {
    console.error('Error storing user role:', e);
  }
};

// Check if a URL is an auth route that shouldn't be cached
const isAuthRoute = (url) => {
  return AUTH_ROUTES.some(route => url.pathname.includes(route));
};

// Install event - pre-cache essential assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== 'pickcreator-user-data') {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - implement network-first strategy for API and cache-first for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Never cache auth endpoints - always use network only
  if (isAuthRoute(url)) {
    return; // Let browser handle auth requests normally without SW interference
  }
  
  // Handle API requests with network-first approach (for authentication)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response
          const responseToCache = response.clone();
          
          // Check if it's a successful response
          if (response.ok) {
            // Store in dynamic cache
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          
          return response;
        })
        .catch(() => {
          // If network fails, try to get from cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful navigation responses
          if (response.ok) {
            // For role pages, store them in cache for offline access
            if (ROLE_PAGES.some(page => url.pathname.startsWith(page))) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
          }
          return response;
        })
        .catch(async () => {
          // If fetch fails (offline), redirect based on user role
          try {
            // Try to get role-specific page first
            const role = await getUserRole();
            console.log('Offline navigation, user role:', role);
            
            if (role && role.length > 0) {
              // Try role-specific pages from cache
              const rolePageUrl = `/${role.toLowerCase()}`;
              console.log('Trying to serve cached role page:', rolePageUrl);
              
              // Try exact match first
              let rolePageResponse = await caches.match(new Request(rolePageUrl));
              
              // If not found, try with trailing slash
              if (!rolePageResponse) {
                rolePageResponse = await caches.match(new Request(`${rolePageUrl}/`));
              }
              
              if (rolePageResponse) {
                console.log('Found cached role page');
                return rolePageResponse;
              }
              
              console.log('No cached role page found');
            }
            
            // Fallback to home page if role page not in cache
            console.log('Falling back to home page');
            return caches.match('/');
          } catch (error) {
            console.error('Error in offline fallback:', error);
            return caches.match('/');
          }
        })
    );
    return;
  }
  
  // Standard assets - cache first strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If not in cache, fetch from network
        return fetch(event.request).then(response => {
          // Don't cache non-successful responses or non-GET requests
          if (!response || response.status !== 200 || event.request.method !== 'GET') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Store in cache
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
  );
});

// Listen for message events to handle user actions like login/logout
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle login - store user role
  if (event.data && event.data.type === 'LOGIN') {
    if (event.data.role) {
      // Store the role for offline access
      storeUserRole(event.data.role);
      
      // Pre-cache the role-specific landing page
      const roleUrl = `/${event.data.role.toLowerCase()}`;
      caches.open(CACHE_NAME).then(cache => {
        cache.add(new Request(roleUrl));
        cache.add(new Request(`${roleUrl}/`));
      });
    }
  }
  
  // Handle logout - clear caches for privacy/security
  if (event.data && event.data.type === 'LOGOUT') {
    // Clear role
    userRole = '';
    
    // Remove from cache
    if (self.caches) {
      caches.open('pickcreator-user-data').then(cache => {
        cache.delete('user-role');
      });
    }
    
    // Clear dynamic cache that may contain user-specific data
    caches.open(DYNAMIC_CACHE).then(cache => {
      cache.keys().then(keys => {
        keys.forEach(request => {
          // Only clear API responses and user-specific pages
          if (request.url.includes('/api/') || 
              request.url.includes('/admin/') ||
              request.url.includes('/brand/') ||
              request.url.includes('/influencer/')) {
            cache.delete(request);
          }
        });
      });
    });
  }
});

// Push notification event handler - keeping existing functionality
self.addEventListener('push', function(event) {
  try {
    // Parse the data from the push event
    let data = {
      title: 'New Notification',
      body: 'You have a new notification',
      icon: '/icon.png',
    };
    
    // Try to parse the data if it exists
    if (event.data) {
      try {
        data = event.data.json();
      } catch (e) {
        console.error('Error parsing push notification data:', e);
        // Use default data if parsing fails
      }
    }
    
    const options = {
      body: data.body,
      icon: data.icon || '/icon.png',
      badge: data.badge || '/icon.png',
      image: data.image,
      vibrate: [100, 50, 100],
      silent: false,
      timestamp: Date.now(),
      requireInteraction: true,
      data: data.data || {},
      actions: data.actions || []
    };

    // Show the notification
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

// Handle notification click - with Chrome on iOS fix
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Handle notification click
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      self.clients.openWindow(event.notification.data.url)
    );
  } else {
    // Default to opening the main app if no URL is provided
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
}); 