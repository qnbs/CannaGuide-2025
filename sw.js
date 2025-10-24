const CACHE_NAME = 'cannaguide-v16-pwa-cache';
const API_HOSTNAME = 'googleapis.com'; // Gemini API hostname

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.js',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/icon.svg',
  '/favicon.ico',
  '/register-sw.js',
];

const THIRD_PARTY_URLS = [
  'https://cdn.tailwindcss.com?plugins=typography',
  "https://aistudiocdn.com/zod@^3.23.8",
  "https://aistudiocdn.com/jspdf-autotable@^3.8.2",
  "https://aistudiocdn.com/jspdf@^2.5.1",
  "https://aistudiocdn.com/@google/genai@^1.19.0",
  "https://aistudiocdn.com/react-dom@^19.1.1",
  "https://aistudiocdn.com/react@^19.1.1",
  "https://aistudiocdn.com/i18next@^25.5.2",
  "https://aistudiocdn.com/react-i18next@^15.0.0",
  "https://aistudiocdn.com/reselect@^5.1.1",
  "https://aistudiocdn.com/immer@^10.1.3",
  "https://aistudiocdn.com/d3@^7.9.0",
  "https://aistudiocdn.com/@reduxjs/toolkit@^2.2.6",
  "https://aistudiocdn.com/react-redux@^9.1.2",
  "https://aistudiocdn.com/d3-hierarchy@^3.1.2",
];

const urlsToCache = [...APP_SHELL_URLS, ...THIRD_PARTY_URLS];

// --- BACKGROUND SYNC CONSTANTS ---
const DB_NAME = 'CannaGuideDB';
const DB_VERSION = 4;
const OFFLINE_ACTIONS_STORE = 'offline_actions';
const SYNC_API_ENDPOINT = '/api/sync-action'; // Placeholder for the backend endpoint

const offlineFallback = new Response(`
<!DOCTYPE html>
<html lang="en" style="height: 100%;">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - CannaGuide 2025</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
      background-color: #0F172A; 
      color: #CBD5E1; 
      text-align: center; 
      padding: 50px;
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
    h1 { color: #fff; }
    svg { width: 80px; height: 80px; margin-bottom: 20px; color: #4ade80; }
  </style>
</head>
<body>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <defs>
        <linearGradient id="cannaGuideLeafGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: rgb(74, 222, 128)"></stop>
            <stop offset="100%" style="stop-color: rgb(16, 185, 129)"></stop>
        </linearGradient>
    </defs>
    <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"></path>
    <g transform="translate(5.2, 5.2) scale(0.6)">
        <path fill="url(#cannaGuideLeafGradient)" stroke="none" d="M20.21,12.79a.78.78,0,0,0,0-1.11,5.27,5.27,0,0,1-3.79-3.79.78.78,0,0,0-1.11,0L12,11.16,8.69,7.89a.78.78,0,0,0-1.11,0A5.27,5.27,0,0,1,3.79,11.68a.78.78,0,0,0,0,1.11L7.06,16a.79.79,0,0,0,1.11,0,3.15,3.15,0,0,0,4.46,0,.79.79,0,0,0,1.11,0Z"></path>
        <path fill="url(#cannaGuideLeafGradient)" stroke="none" d="M16.94,16a.79.79,0,0,0,1.11,0L21.42,12a.79.79,0,0,0,0-1.12.78.78,0,0,0-1.11,0L18.05,13.2A5.28,5.28,0,0,1,16.94,16Z"></path>
        <path fill="url(#cannaGuideLeafGradient)" stroke="none" d="M12,21.9a.79.79,0,0,0,.55-.22l3.27-3.27a.78.78,0,0,0-1.11-1.11L12,20,9.29,17.31a.78.78,0,0,0-1.11,1.11L11.45,21.68A.79.79,0,0,0,12,21.9Z"></path>
        <path fill="url(#cannaGuideLeafGradient)" stroke="none" d="M2.58,12a.79.79,0,0,0,0-1.12.78.78,0,0,0-1.11,0L.1,12.21a.78.78,0,0,0,0,1.11.77.77,0,0,0,.55.22.79.79,0,0,0,.56-.22l1.37-1.37A5.28,5.28,0,0,1,2.58,12Z"></path>
    </g>
  </svg>
  <h1>You are offline</h1>
  <p>This page cannot be loaded right now. Please check your internet connection.</p>
  <p>Previously visited pages and data are still available.</p>
</body>
</html>`, {
  headers: { 'Content-Type': 'text/html; charset=utf-8' }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching App Shell');
      return cache.addAll(urlsToCache).catch(err => {
        console.error('[SW] App shell caching failed:', err);
      });
    }).then(() => {
      console.log('[SW] New service worker installed, calling skipWaiting().');
      return self.skipWaiting();
    })
  );
});

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
    }).then(() => {
        console.log('[SW] New service worker activated, claiming clients.');
        return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  if (url.hostname.includes(API_HOSTNAME)) {
    return;
  }
  
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
                cache.put(request, responseToCache);
            });
        }
        return networkResponse;
      }).catch(error => {
        console.error('[SW] Fetch failed:', error);
        if (request.mode === 'navigate') {
          return offlineFallback;
        }
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});


// --- BACKGROUND SYNC IMPLEMENTATION ---

/**
 * Opens a connection to the IndexedDB.
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        // Migrations are handled by the main app thread.
    });
}

/**
 * Retrieves all queued actions from the offline store.
 * @returns {Promise<any[]>} A promise that resolves with an array of actions, including their DB keys.
 */
function getQueuedActions() {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(OFFLINE_ACTIONS_STORE, 'readonly');
            const store = transaction.objectStore(OFFLINE_ACTIONS_STORE);
            const request = store.getAll();
            const keysRequest = store.getAllKeys();

            let items = [];
            let keys = [];

            transaction.oncomplete = () => {
                // Combine keys with items
                const result = items.map((item, index) => ({ id: keys[index], ...item }));
                resolve(result);
            };
            transaction.onerror = () => reject(transaction.error);
            
            request.onsuccess = () => { items = request.result; };
            keysRequest.onsuccess = () => { keys = keysRequest.result; };
        });
    });
}

/**
 * Deletes a specific action from the queue by its ID.
 * @param {number} id The primary key of the item to delete.
 * @returns {Promise<void>}
 */
function deleteQueuedAction(id) {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(OFFLINE_ACTIONS_STORE, 'readwrite');
            const store = transaction.objectStore(OFFLINE_ACTIONS_STORE);
            const request = store.delete(id);
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    });
}

/**
 * The core sync logic. Retrieves actions and attempts to POST them.
 */
async function syncData() {
  console.log('[SW] Attempting to sync data...');
  try {
    const queuedActions = await getQueuedActions();
    if (!queuedActions || queuedActions.length === 0) {
      console.log('[SW] No actions to sync.');
      return;
    }

    console.log(`[SW] Found ${queuedActions.length} action(s) to sync.`);

    for (const action of queuedActions) {
      const { id, ...actionToSync } = action;
      
      // In a real app, you would POST this to your server.
      // We simulate this with a fetch that will likely fail, as the endpoint doesn't exist.
      // The browser's SyncManager will automatically retry on failure.
      const response = await fetch(SYNC_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionToSync),
      });

      if (response.ok) {
        console.log(`[SW] Successfully synced action with id ${id}.`);
        // If synced successfully, remove it from the IndexedDB queue.
        await deleteQueuedAction(id);
      } else {
        console.error(`[SW] Server error syncing action ${id}. Status: ${response.status}`);
        // Throw an error to signal failure to the SyncManager, prompting a retry.
        throw new Error('server-sync-error');
      }
    }
    console.log('[SW] All queued actions synced successfully.');
  } catch (error) {
    console.error('[SW] Sync failed, will retry later.', error);
    // Re-throw the error to ensure the SyncManager retries. This is crucial.
    throw error;
  }
}

// Background Sync event listener
self.addEventListener('sync', (event) => {
  if (event.tag === 'data-sync') {
    console.log('[SW] Sync event received for "data-sync"');
    event.waitUntil(syncData());
  }
});