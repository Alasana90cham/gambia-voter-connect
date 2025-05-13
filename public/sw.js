
// Service Worker for caching and offline support
const CACHE_NAME = 'nypg-voter-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
];

// Install the service worker and cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened successfully');
        // Use individual add() operations instead of addAll() to prevent failures
        return Promise.all(
          urlsToCache.map(url => 
            cache.add(url).catch(err => 
              console.error(`Failed to cache ${url}: ${err}`)
            )
          )
        );
      })
  );
});

// Network-first strategy with cache fallback
self.addEventListener('fetch', event => {
  // Skip non-HTTP/HTTPS and extension requests
  if (!event.request.url.startsWith('http') || 
      event.request.url.startsWith('chrome-extension:')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Only cache successful responses
        if (response.status === 200) {
          try {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              // Check for valid schemes before caching
              const url = new URL(event.request.url);
              if (url.protocol === 'http:' || url.protocol === 'https:') {
                cache.put(event.request, responseClone);
              }
            });
          } catch (err) {
            console.error('Cache put error:', err);
          }
        }
        return response;
      })
      .catch(() => {
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
