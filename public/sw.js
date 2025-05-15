
// Service Worker for caching and offline support
const CACHE_NAME = 'nypg-voter-cache-v4';
const STATIC_CACHE = 'nypg-static-cache-v4';
const DYNAMIC_CACHE = 'nypg-dynamic-cache-v4';

// Assets to cache immediately on install
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

// iOS Safari requires special handling for service workers
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

// Install the service worker and cache core assets
self.addEventListener('install', event => {
  self.skipWaiting(); // Ensure new service workers activate immediately
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[ServiceWorker] Caching static assets');
        return Promise.all(
          urlsToCache.map(url => 
            cache.add(url).catch(err => 
              console.error(`[ServiceWorker] Failed to cache ${url}: ${err}`)
            )
          )
        );
      }),
      // Pre-create dynamic cache
      caches.open(DYNAMIC_CACHE)
    ])
  );
});

// Enhanced network-first strategy with improved cache fallback and iOS optimizations
self.addEventListener('fetch', event => {
  // Skip cross-origin requests, non-HTTP/HTTPS, and extension requests
  if (!event.request.url.startsWith(self.location.origin) || 
      !event.request.url.startsWith('http') || 
      event.request.url.startsWith('chrome-extension:')) {
    return;
  }

  // Skip Supabase API requests (these should not be cached)
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  // Apply specific strategies based on request type
  const url = new URL(event.request.url);
  
  // Cache-first strategy for static assets
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
    event.respondWith(cacheFirstStrategy(event.request));
    return;
  }
  
  // Network-first strategy for HTML and API requests
  event.respondWith(networkFirstStrategy(event.request));
});

// Cache-first strategy implementation
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    return await fetchAndCache(request);
  } catch (error) {
    console.error('[ServiceWorker] Fetch failed:', error);
    // If fetch fails, return a fallback if possible
    return caches.match('/index.html');
  }
}

// Network-first strategy implementation with iOS optimizations
async function networkFirstStrategy(request) {
  try {
    // On iOS, use a more reliable timeout pattern
    if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Network request timed out')), 5000);
      });
      
      const fetchPromise = fetch(request);
      const response = await Promise.race([fetchPromise, timeoutPromise])
        .catch(() => {
          console.log('[ServiceWorker] Fetch timed out, falling back to cache');
          return caches.match(request);
        });
        
      if (response) {
        if (response.status === 200) {
          const responseClone = response.clone();
          const cache = await caches.open(DYNAMIC_CACHE);
          cache.put(request, responseClone);
        }
        return response;
      }
    } else {
      // Standard approach for other platforms
      return await fetchAndCache(request);
    }
  } catch (error) {
    console.log('[ServiceWorker] Fetch failed, falling back to cache:', error);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Last resort, return the index page as fallback
    return caches.match('/index.html');
  }
}

// Helper function to fetch and cache responses with timeout for reliability
async function fetchAndCache(request) {
  // Use AbortController with timeout for better reliability
  const controller = new AbortController();
  const signal = controller.signal;
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(request, { signal });
    clearTimeout(timeoutId);
    
    // Only cache valid responses
    if (response.status === 200) {
      try {
        const responseClone = response.clone();
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, responseClone);
      } catch (err) {
        console.error('[ServiceWorker] Cache put error:', err);
      }
    }
    
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// Clean up old caches when a new service worker is activated
self.addEventListener('activate', event => {
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

// Handle service worker updates with Safari compatibility
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Optimized background sync for pending operations
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Background sync implementation
async function syncData() {
  // Here you would implement logic to sync any pending operations
  console.log('[ServiceWorker] Performing background sync');
}
