const CACHE_NAME = 'pwa-cache-v1';

// App Shell: The minimal resources needed for the app to start.
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/types.ts',
  '/constants.ts',
  '/manifest.json',
  '/App.tsx',
  '/components/common/Button.tsx',
  '/components/common/Card.tsx',
  '/components/common/Tabs.tsx',
  '/components/icons/PhosphorIcons.tsx',
  '/components/icons/CannabisLeafIcon.tsx',
  '/components/navigation/Header.tsx',
  '/components/navigation/BottomNav.tsx',
  '/components/views/StrainsView.tsx',
  '/components/views/PlantsView.tsx',
  '/components/views/EquipmentView.tsx',
  '/components/views/KnowledgeView.tsx',
  '/components/views/SettingsView.tsx',
  '/components/views/HelpView.tsx',
  '/services/storageService.ts',
  '/services/strainService.ts',
  '/data/strains/index.ts',
  // All other app files will be cached on first load via the fetch handler.
];

// Third-party resources to cache
const THIRD_PARTY_URLS = [
  'https://cdn.tailwindcss.com?plugins=typography',
  'https://aistudiocdn.com/react@^19.1.1',
  'https://aistudiocdn.com/react-dom@^19.1.1',
  'https://aistudiocdn.com/@google/genai@^1.19.0',
  'https://aistudiocdn.com/jspdf@^2.5.1',
  'https://aistudiocdn.com/jspdf-autotable@^3.8.2',
];

const urlsToCache = [...APP_SHELL_URLS, ...THIRD_PARTY_URLS];

// Install event: cache the app shell and third-party resources.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching App Shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[Service Worker] Failed to open cache or pre-cache:', error);
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

// Fetch event: serve from cache, falling back to network (Cache First strategy).
self.addEventListener('fetch', event => {
  // Ignore non-GET requests and chrome-extension requests
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
        
        const isApiCall = event.request.url.includes('googleapis.com');
        const isAppUrl = event.request.url.startsWith(self.origin);
        const isThirdPartyUrl = THIRD_PARTY_URLS.some(url => event.request.url.startsWith(url));
        
        // Only cache successful GET requests that are part of the app shell or known 3rd party CDNs.
        // Explicitly do not cache API calls.
        if (networkResponse && networkResponse.status === 200 && !isApiCall && (isAppUrl || isThirdPartyUrl)) {
          await cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        console.error('[Service Worker] Fetch failed; returning offline fallback if available.', error);
        // If the fetch fails (e.g., user is offline) and it's a navigation request,
        // return the cached index.html as a fallback.
        if (event.request.mode === 'navigate') {
            const indexPage = await cache.match('/index.html');
            if (indexPage) return indexPage;
        }
      }
    })
  );
});