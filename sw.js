const CACHE_NAME = 'cannaguide-v10-pwa-cache';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx', // Kritische Datei für die Offline-Funktionalität hinzugefügt
  '/manifest.json',
  '/icon.svg',
  '/pwa-icon.svg',
  '/register-sw.js',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
  '/pwa-icon-maskable-512.png',
  '/favicon.ico',
];

// Install-Event: Cacht die grundlegende App-Shell.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell on install');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate-Event: Alte Caches löschen und Kontrolle übernehmen.
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

// Fetch-Event: Implementiert die "Network-First, then Cache"-Strategie.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignoriere Google API-Aufrufe, um immer frische Daten von Gemini sicherzustellen
  if (event.request.url.includes('googleapis.com')) {
    return; // Lässt den Browser die Anfrage normal ohne Service Worker handhaben.
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Wenn erfolgreich, speichere eine Kopie im Cache für die Offline-Nutzung
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      })
      .catch(() => {
        // Wenn das Netzwerk fehlschlägt, versuche aus dem Cache zu antworten
        return caches.match(event.request).then(cachedResponse => {
          return cachedResponse || new Response("You are offline and this resource is not cached.", {
            status: 404,
            statusText: "Offline and not in cache"
          });
        });
      })
  );
});
