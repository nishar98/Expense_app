/* ============================================================
   SERVICE WORKER
   Enables offline support and PWA installability
   ============================================================ */

const CACHE_NAME = 'cache-app-v2';

// Files to cache for offline use
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/manifest.json',
    '/icons/favicon.svg',
    '/icons/icon-192.svg',
    '/icons/icon-512.svg',
    '/icons/wordmark.svg'
];

// Install: Cache all essential files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// Activate: Clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Network first, fall back to cache (ensures updates are picked up)
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Update cache with fresh response
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // Network failed, serve from cache
                return caches.match(event.request);
            })
    );
});
