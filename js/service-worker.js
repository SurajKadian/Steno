// Service Worker

const CACHE_NAME = 'steno-cache-v2';
const FILES_TO_CACHE = [
  '/index.html',
  '/style.css',
  '/js/script.js',
  '/js/db.js',
  '/js/service-worker.js',
  '/manifest.json',
  '/img/surajkadian.jpg'
];

// INSTALL
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ACTIVATE
self.addEventListener('activate', event => {
  console.log('Service worker activated');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// FETCH
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;
      return fetch(event.request).catch(() => {
        if (event.request.destination === 'image') {
          return caches.match('/img/surajkadian.jpg');
        }
      });
    })
  );
});
