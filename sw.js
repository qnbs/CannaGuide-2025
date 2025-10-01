const CACHE_NAME = 'cannaguide-v4-cache-first';
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

self.addEventListener('fetch', event => {
    // Let the browser handle requests for API calls
    if (event.request.method !== 'GET' || event.request.url.includes('googleapis.com')) {
        return;
    }

    // For other GET requests, try cache first, then network
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Return from cache if found
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetch(event.request).then(networkResponse => {
                    // Check if we received a valid response
                    if (!networkResponse || networkResponse.status !== 200) {
                        return networkResponse;
                    }

                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return networkResponse;
                }).catch(error => {
                    console.error('[SW] Fetch failed; returning offline fallback if available.', error);
                    // Optionally, return an offline fallback page here
                });
            })
    );
});
