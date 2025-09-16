const CACHE_NAME = 'pwa-cache-v1';

// App Shell: The minimal resources needed for the app to start.
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.tsx',
  'data:image/svg+xml,%3csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3e%3cg stroke=\'%234ade80\' stroke-width=\'8\' stroke-linecap=\'round\'%3e%3cline x1=\'50\' y1=\'80\' x2=\'50\' y2=\'20\'/%3e%3cline x1=\'50\' y1=\'80\' x2=\'30\' y2=\'35\'/%3e%3cline x1=\'50\' y1=\'80\' x2=\'70\' y2=\'35\'/%3e%3cline x1=\'50\' y1=\'80\' x2=\'15\' y2=\'55\'/%3e%3cline x1=\'50\' y1=\'80\' x2=\'85\' y2=\'55\'/%3e%3c/g%3e%3ccircle cx=\'50\' cy=\'50\' r=\'46\' stroke=\'currentColor\' stroke-width=\'8\' fill=\'none\'/%3e%3c/svg%3e'
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