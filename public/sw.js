
// Service Worker for caching and offline support
const CACHE_NAME = 'nypg-voter-cache-v5';
const STATIC_CACHE = 'nypg-static-cache-v5';
const DYNAMIC_CACHE = 'nypg-dynamic-cache-v5';

// Assets to cache immediately on install
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install the service worker and cache core assets
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installing version v5');
  self.skipWaiting(); // Ensure new service workers activate immediately
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[ServiceWorker] Caching static assets');
        return Promise.all(
          urlsToCache.map(url => 
            cache.add(url).catch(err => 
              console.log(`[ServiceWorker] Failed to cache ${url}: ${err}`)
            )
          )
        );
      }),
      // Pre-create dynamic cache
      caches.open(DYNAMIC_CACHE)
    ])
  );
});

// Simplified fetch handler to avoid connection issues
self.addEventListener('fetch', event => {
  // Skip cross-origin requests, non-HTTP/HTTPS, and extension requests
  if (!event.request.url.startsWith(self.location.origin) || 
      !event.request.url.startsWith('http') || 
      event.request.url.startsWith('chrome-extension:')) {
    return;
  }

  // Skip Supabase API requests to avoid interference with QUIC protocol
  if (event.request.url.includes('supabase.co')) {
    console.log('[ServiceWorker] Bypassing Supabase request:', event.request.url);
    return;
  }

  // Apply specific strategies based on request type
  const url = new URL(event.request.url);
  
  // Cache-first strategy for static assets only
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
    event.respondWith(cacheFirstStrategy(event.request));
    return;
  }
  
  // For HTML requests, try network first with quick fallback
  event.respondWith(networkFirstStrategy(event.request));
});

// Cache-first strategy implementation
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[ServiceWorker] Cache-first failed:', error);
    // Return a simple fallback for failed requests
    return new Response('Resource unavailable', { status: 503 });
  }
}

// Simplified network-first strategy
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    
    if (response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[ServiceWorker] Network request failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Last resort fallback for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      const indexResponse = await caches.match('/index.html');
      if (indexResponse) {
        return indexResponse;
      }
    }
    
    return new Response('Network error', { status: 503 });
  }
}

// Clean up old caches when a new service worker is activated
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activating version v5');
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => !cacheWhitelist.includes(cacheName))
          .map(cacheName => {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('[ServiceWorker] Claiming clients');
      return self.clients.claim(); // Take control of clients immediately
    })
  );
});

// Handle service worker updates
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
