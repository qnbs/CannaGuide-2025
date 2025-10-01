const CACHE_NAME = 'cannaguide-v3-stable';

// Install-Event: Sofort aktivieren, ohne auf Caching zu warten.
self.addEventListener('install', event => {
  console.log('[Service Worker] Install Event - Skipping wait...');
  event.waitUntil(self.skipWaiting());
});

// Activate-Event: Alte Caches löschen und Kontrolle übernehmen.
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate Event - Clearing old caches...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch-Event: "Network-First"-Strategie.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Do not cache any Google API calls to ensure fresh data from Gemini
  if (event.request.url.includes('googleapis.com')) {
    return; // Let the browser handle the request normally, bypassing the service worker.
  }

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // If successful, store a copy in the cache for offline use
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      })
      .catch(() => {
        // If the network fails, try to respond from the cache
        return caches.match(event.request);
      })
  );
});