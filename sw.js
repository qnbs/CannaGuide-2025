const CACHE_NAME = 'cannaguide-v13-pwa-cache';
const API_HOSTNAME = 'googleapis.com'; // Gemini API hostname

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.tsx',
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
    })
  );
  self.skipWaiting();
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
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Ignore Google API calls to allow them to go through to the network
  if (url.hostname.includes(API_HOSTNAME)) {
    return;
  }
  
  // Strategy: Cache first, then Network, with offline fallback for navigation.
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
