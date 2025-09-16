const CACHE_NAME = 'pwa-cache-v2'; // Bumped version to ensure update

// App Shell: The minimal resources needed for the app to start.
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  'index.tsx', // Relative path
  '/icon.svg',
  '/manifest.json'
];

// Third-party resources to cache, aligned with index.html importmap
const THIRD_PARTY_URLS = [
  'https://cdn.tailwindcss.com?plugins=typography',
  'https://aistudiocdn.com/jspdf-autotable@^5.0.2',
  'https://aistudiocdn.com/jspdf@^3.0.2',
  'https://aistudiocdn.com/@google/genai@^1.19.0',
  'https://aistudiocdn.com/react-dom@^19.1.1',
  'https://aistudiocdn.com/react-dom@^19.1.1/',
  'https://aistudiocdn.com/react@^19.1.1/',
  'https://aistudiocdn.com/react@^19.1.1'
];

const urlsToCache = [...APP_SHELL_URLS, ...THIRD_PARTY_URLS];

// Install event: cache the app shell and third-party resources.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching App Shell');
        const cachePromises = urlsToCache.map(urlToCache => {
            return cache.add(urlToCache).catch(err => {
                console.warn(`[Service Worker] Failed to cache: ${urlToCache}`, err);
            });
        });
        return Promise.all(cachePromises);
      })
      .then(() => self.skipWaiting()) // Force activation
      .catch(error => {
        console.error('[Service Worker] Failed to open cache:', error);
      })
  );
});

// Activate event: clean up old caches.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Claim clients immediately
  );
});

// Fetch event: serve from cache, falling back to network.
self.addEventListener('fetch', event => {
  // Ignore non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
      return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      
      const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
      }).catch(err => {
          console.log('[Service Worker] Fetch failed, returning cached response if available.', err);
          return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});