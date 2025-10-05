const CACHE_NAME = 'cannaguide-v11-pwa-cache';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-icon.svg',
  '/register-sw.js',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
  '/pwa-icon-maskable-512.png',
  '/favicon.ico',
];

// On install, precache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching App Shell');
        return cache.addAll(APP_SHELL_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// On activate, clean up old caches
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

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignore non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Ignore Google API calls
  if (request.url.includes('googleapis.com')) {
    return; // Let the browser handle it
  }

  // For navigation requests (HTML pages), use Network Falling Back to Cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // If the network is available, cache the new page and return it
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If the network fails, serve the cached index.html
          return caches.match('/');
        })
    );
    return;
  }

  // For CDN scripts and Tailwind, use Stale-While-Revalidate
  if (request.url.includes('aistudiocdn.com') || request.url.includes('cdn.tailwindcss.com')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(request).then(cachedResponse => {
          const fetchPromise = fetch(request).then(networkResponse => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
          // Return cached response immediately, then update cache in the background
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // For all other assets (app shell, icons), use Cache First
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      // Return from cache if found
      if (cachedResponse) {
        return cachedResponse;
      }
      // Otherwise, fetch from network, cache it, and return it
      return fetch(request).then(networkResponse => {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
