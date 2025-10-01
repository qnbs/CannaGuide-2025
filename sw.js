const CACHE_NAME = 'cannaguide-v4-app-shell';
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/index.tsx',
    '/manifest.json',
    '/icon.svg',
    '/pwa-icon.svg',
    '/pwa-icon-192.png',
    '/pwa-icon-512.png',
    '/register-sw.js'
];

// Install event: Cache the application shell.
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching app shell');
                // Use addAll with a catch to prevent install failure if one resource fails
                const requests = URLS_TO_CACHE.map(url => new Request(url, { cache: 'reload' }));
                return cache.addAll(requests).catch(err => {
                    console.warn('[SW] Caching failed for some resources, but continuing install.', err);
                });
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event: Clean up old caches.
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event: Implement cache-first strategy.
self.addEventListener('fetch', event => {
    // Let the browser handle non-GET requests or API calls
    if (event.request.method !== 'GET' || event.request.url.includes('googleapis.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // If the response is in the cache, return it
                if (cachedResponse) {
                    return cachedResponse;
                }

                // If not in cache, fetch from the network
                return fetch(event.request).then(networkResponse => {
                    // Check if we received a valid response
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }

                    // Clone the response and cache it
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return networkResponse;
                }).catch(error => {
                    console.error('[SW] Fetch failed; returning offline fallback if available.', error);
                    // Optionally, you can return a fallback offline page here:
                    // return caches.match('/offline.html');
                });
            })
    );
});
