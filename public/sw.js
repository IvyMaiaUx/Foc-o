const CACHE_VERSION = 'focao-app-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('focao-app-') && cacheName !== CACHE_VERSION)
          .map((cacheName) => caches.delete(cacheName)),
      ),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', () => {
  // Intentionally no app-data caching. The app uses Firestore's own offline cache.
});
