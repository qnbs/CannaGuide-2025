const CACHE_NAME = 'cannaguide-v22-pwa-cache';
const IMAGE_CACHE_NAME = 'cannaguide-v22-image-cache';
const API_HOSTNAME = 'googleapis.com'; // Gemini API hostname

const APP_SHELL_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './favicon.ico',
];

// THIRD_PARTY_URLS: The app is Vite-bundled; all dependencies are self-hosted in /assets/.
// No external CDN URLs need to be pre-cached.
const THIRD_PARTY_URLS = [];

// Workbox injects the precache manifest into __WB_MANIFEST at build time.
// The variable must appear exactly once for workbox-build's injectManifest to work.
const workboxManifest = self.__WB_MANIFEST || [];
const workboxUrls = workboxManifest.map((entry) => (typeof entry === 'string' ? entry : entry.url));
const urlsToCache = [...new Set([...APP_SHELL_URLS, ...THIRD_PARTY_URLS, ...workboxUrls])];
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg', '.ico'];

// --- BACKGROUND SYNC CONSTANTS ---
const DB_NAME = 'CannaGuideDB';
const DB_VERSION = 4;
const OFFLINE_ACTIONS_STORE = 'offline_actions';
// Note: This app is client-only (no backend). The background sync handler notifies
// open clients to replay queued actions locally rather than POSTing to a server.
const REMINDER_DB_NAME = 'CannaGuideReminderDB';
const REMINDER_DB_VERSION = 1;
const REMINDER_STORE = 'grow_reminders';
const REMINDER_COOLDOWN_MS = 4 * 60 * 60 * 1000;

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
  // Auto-activate: skip waiting so updates apply immediately.
  // The app's controllerchange listener will reload the page.
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching App Shell');
      return cache.addAll(urlsToCache).catch(err => {
        console.error('[SW] App shell caching failed:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
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

  const isImageRequest = request.destination === 'image' || IMAGE_EXTENSIONS.some((extension) => url.pathname.toLowerCase().endsWith(extension));

  if (isImageRequest) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          console.error('[SW] Image fetch failed:', error);
          return new Response('', { status: 408 });
        }
      }),
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && url.origin === self.location.origin) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          return cachedResponse || offlineFallback;
        }),
    );
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
        return new Response('Network error', { status: 408 });
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'UPDATE_REMINDERS' && Array.isArray(event.data.payload)) {
    event.waitUntil(replaceReminders(event.data.payload));
  }

  if (event.data?.type === 'REQUEST_REMINDER_CHECK') {
    event.waitUntil(notifyDueReminders());
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

function openReminderDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(REMINDER_DB_NAME, REMINDER_DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(REMINDER_STORE)) {
        db.createObjectStore(REMINDER_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function replaceReminders(reminders) {
  return openReminderDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(REMINDER_STORE, 'readwrite');
      const store = tx.objectStore(REMINDER_STORE);
      const clearReq = store.clear();

      clearReq.onsuccess = () => {
        reminders.forEach((reminder) => {
          store.put({ ...reminder, lastNotifiedAt: reminder.lastNotifiedAt || 0 });
        });
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

function getStoredReminders() {
  return openReminderDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(REMINDER_STORE, 'readonly');
      const store = tx.objectStore(REMINDER_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  });
}

function updateReminderNotificationTime(id, timestamp) {
  return openReminderDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(REMINDER_STORE, 'readwrite');
      const store = tx.objectStore(REMINDER_STORE);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const existing = getReq.result;
        if (existing) {
          store.put({ ...existing, lastNotifiedAt: timestamp });
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

async function notifyDueReminders() {
  const reminders = await getStoredReminders();
  if (!reminders.length) return;

  const now = Date.now();

  for (const reminder of reminders) {
    const dueAt = reminder.dueAt || now;
    const lastNotifiedAt = reminder.lastNotifiedAt || 0;
    const isDue = dueAt <= now;
    const isCooledDown = now - lastNotifiedAt >= REMINDER_COOLDOWN_MS;

    if (!isDue || !isCooledDown) {
      continue;
    }

    await self.registration.showNotification(reminder.title || 'Grow Reminder', {
      body: reminder.body || 'You have a pending grow reminder.',
      icon: './icon.svg',
      badge: './icon.svg',
      tag: `grow-reminder-${reminder.id}`,
      data: { plantId: reminder.plantId, reminderId: reminder.id },
    });

    await updateReminderNotificationTime(reminder.id, now);
  }
}

/**
 * The core sync logic. Notifies all open clients about queued offline actions
 * so they can replay them locally. This app is client-only — there is no backend
 * server to POST to. Adding a real server endpoint here is left as a future extension.
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
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

    for (const action of queuedActions) {
      const { id, ...actionData } = action;
      // Notify all open app windows so they can replay the action in Redux.
      for (const client of clients) {
        client.postMessage({ type: 'REPLAY_OFFLINE_ACTION', payload: actionData });
      }
      await deleteQueuedAction(id);
    }
    console.log('[SW] All queued actions dispatched to clients.');
  } catch (error) {
    console.error('[SW] Sync failed, will retry later.', error);
    throw error;
  }
}

// Background Sync event listener
self.addEventListener('sync', (event) => {
  if (event.tag === 'data-sync') {
    console.log('[SW] Sync event received for "data-sync"');
    event.waitUntil(syncData());
    return;
  }

  if (event.tag === 'grow-reminders-sync') {
    console.log('[SW] Sync event received for "grow-reminders-sync"');
    event.waitUntil(notifyDueReminders());
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'grow-reminders') {
    console.log('[SW] Periodic sync event for grow reminders');
    event.waitUntil(notifyDueReminders());
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow('./');
    })
  );
});