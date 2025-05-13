
// Service Worker for caching and offline support
const CACHE_NAME = 'nypg-voter-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
  '/favicon.ico',
];

// Install the service worker and cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Network-first strategy with cache fallback
self.addEventListener('fetch', event => {
  // Skip non-HTTP/HTTPS requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Skip chrome-extension requests completely
  if (event.request.url.startsWith('chrome-extension:')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache the fetched response for future
        if (response.status === 200) {
          // Clone the response so we can return one and cache one
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            try {
              // Check for valid schemes before caching
              const url = new URL(event.request.url);
              if (url.protocol === 'http:' || url.protocol === 'https:') {
                cache.put(event.request, responseClone);
              }
            } catch (err) {
              console.error('Cache put error:', err);
            }
          });
        }
        return response;
      })
      .catch(() => {
        // If network request fails, serve from cache
        return caches.match(event.request);
      })
  );
});

// Clean up old caches when a new service worker is activated
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
