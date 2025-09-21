const CACHE_NAME = 'pwa-cache-v1';

// App Shell: The minimal resources needed for the app to start.
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.tsx',
  'data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'1.5\'%3e%3cdefs%3e%3clinearGradient id=\'g\' x1=\'0%25\' y1=\'0%25\' x2=\'0%25\' y2=\'100%25\'%3e%3cstop offset=\'0%25\' style=\'stop-color:rgb(74, 222, 128)\'/%3e%3cstop offset=\'100%25\' style=\'stop-color:rgb(16, 185, 129)\'/%3e%3c/linearGradient%3e%3c/defs%3e%3cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z\'/%3e%3cg transform=\'translate(5.2, 5.2) scale(0.6)\'%3e%3cpath fill=\'url(%23g)\' stroke=\'none\' d=\'M20.21,12.79a.78.78,0,0,0,0-1.11,5.27,5.27,0,0,1-3.79-3.79.78.78,0,0,0-1.11,0L12,11.16,8.69,7.89a.78.78,0,0,0-1.11,0A5.27,5.27,0,0,1,3.79,11.68a.78.78,0,0,0,0,1.11L7.06,16a.79.79,0,0,0,1.11,0,3.15,3.15,0,0,0,4.46,0,.79.79,0,0,0,1.11,0Z\'/%3e%3cpath fill=\'url(%23g)\' stroke=\'none\' d=\'M16.94,16a.79.79,0,0,0,1.11,0L21.42,12a.79.79,0,0,0,0-1.12.78.78,0,0,0-1.11,0L18.05,13.2A5.28,5.28,0,0,1,16.94,16Z\'/%3e%3cpath fill=\'url(%23g)\' stroke=\'none\' d=\'M12,21.9a.79.79,0,0,0,.55-.22l3.27-3.27a.78.78,0,0,0-1.11-1.11L12,20,9.29,17.31a.78.78,0,0,0-1.11,1.11L11.45,21.68A.79.79,0,0,0,12,21.9Z\'/%3e%3cpath fill=\'url(%23g)\' stroke=\'none\' d=\'M2.58,12a.79.79,0,0,0,0-1.12.78.78,0,0,0-1.11,0L.1,12.21a.78.78,0,0,0,0,1.11.77.77,0,0,0,.55.22.79.79,0,0,0,.56-.22l1.37-1.37A5.28,5.28,0,0,1,2.58,12Z\'/%3e%3c/g%3e%3c/svg%3e'
];

// Third-party resources to cache
const THIRD_PARTY_URLS = [
  'https://cdn.tailwindcss.com?plugins=typography',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lexend:wght@500;700&family=IBM+Plex+Mono:wght@400;700&display=swap',
  'https://aistudiocdn.com/react@^19.1.1',
  'https://aistudiocdn.com/react-dom@^19.1.1',
  'https://aistudiocdn.com/react-dom@^19.1.1/client',
  'https://aistudiocdn.com/@google/genai@^1.19.0',
  'https://aistudiocdn.com/jspdf@^3.0.2',
  'https://aistudiocdn.com/jspdf-autotable@^5.0.2'
];

const urlsToCache = [...APP_SHELL_URLS, ...THIRD_PARTY_URLS];

// Install event: cache the app shell and third-party resources.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching App Shell');
        // Use individual cache.add calls to prevent one failure from stopping the whole process.
        const cachePromises = urlsToCache.map(urlToCache => {
            return cache.add(urlToCache).catch(err => {
                console.warn(`[Service Worker] Failed to cache: ${urlToCache}`, err);
            });
        });
        return Promise.all(cachePromises);
      })
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
    })
  );
  return self.clients.claim();
});

// Fetch event: serve from cache, falling back to network.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
      return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1. Try to get the response from the cache
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. If not in cache, try to fetch from the network
      try {
        const networkResponse = await fetch(event.request);
        // If the fetch is successful, clone the response and store it in the cache
        if (networkResponse && networkResponse.status === 200) {
          await cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        console.error('[Service Worker] Fetch failed; returning offline page if available.', error);
        // If the fetch fails (e.g., user is offline) and it's a navigation request,
        // return the cached index.html as a fallback.
        if (event.request.mode === 'navigate') {
            const indexPage = await cache.match('/index.html');
            if (indexPage) return indexPage;
        }
        // For other failed requests, return a generic error response.
        return new Response(null, { status: 503, statusText: "Service Unavailable" });
      }
    })
  );
});