const CACHE_NAME = 'cannabis-grow-guide-v4.1.0';

const strainFiles = 'abcdefghijklmnopqrstuvwxyz'.split('').concat(['numeric']).map(char => `/data/strains/${char}.json`);

const urlsToCache = [
  '/',
  '/index.html',
  '/App.css',
  '/index.tsx',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Key CDN assets from importmap
  "https://aistudiocdn.com/jspdf-autotable@^5.0.2",
  "https://aistudiocdn.com/jspdf@^3.0.2",
  "https://aistudiocdn.com/@google/genai@^1.19.0",
  "https://aistudiocdn.com/react-dom@^19.1.1",
  "https://aistudiocdn.com/react-dom@^19.1.1/",
  "https://aistudiocdn.com/react@^19.1.1/",
  "https://aistudiocdn.com/react@^19.1.1",
  ...strainFiles,
];

self.addEventListener('install', event => {
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching files');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of open clients
  )
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            if(!response || response.status < 200 || response.status >= 400 ) {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                if(event.request.method === 'GET') {
                    cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        );
      })
    );
});