const CACHE_NAME = 'cannaguide-v2-stable';

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

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Wenn erfolgreich, speichere eine Kopie im Cache für Offline-Nutzung
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      })
      .catch(() => {
        // Wenn das Netzwerk fehlschlägt, versuche, aus dem Cache zu antworten
        return caches.match(event.request);
      })
  );
});