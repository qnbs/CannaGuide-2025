const CACHE_NAME = 'cannaguide-v8-pwa-cache'; // New version to force update
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-icon.svg',
  '/register-sw.js',
  '/favicon.ico',
];

// Install the service worker and cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        // Add core assets required for the app to run offline
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate the service worker and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercept fetch requests and serve from cache first (Cache-First strategy)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If we have a cached response, return it immediately.
      if (cachedResponse) {
        return cachedResponse;
      }

      // If the resource is not in the cache, fetch it from the network.
      return fetch(event.request).then((networkResponse) => {
        // We don't cache API calls to Google or other dynamic resources.
        if (!networkResponse || networkResponse.status !== 200 || event.request.url.includes('googleapis.com')) {
          return networkResponse;
        }
        
        // For other resources (like from the CDN), clone the response and cache it for future use.
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(error => {
        console.error('[SW] Fetch failed; returning offline fallback if available.', error);
        // As a last resort for navigation requests, return the cached root page.
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        // For other failed requests, the browser's default offline error will show.
        throw error;
      });
    })
  );
});