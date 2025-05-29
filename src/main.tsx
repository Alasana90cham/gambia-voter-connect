
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient } from '@tanstack/react-query'

// Simplified service worker registration
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registration successful');
          
          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker is available
                  newWorker.postMessage('SKIP_WAITING');
                }
              });
            }
          });
        })
        .catch(error => {
          console.error('ServiceWorker registration failed:', error);
        });
    });
  }
};

// Detect browser for platform-specific optimizations
const detectBrowser = () => {
  const ua = window.navigator.userAgent;
  const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
  const webkit = !!ua.match(/WebKit/i);
  const iOSSafari = iOS && webkit && !ua.match(/CriOS/i) && !ua.match(/FxiOS/i);
  const isAndroid = ua.indexOf('Android') > -1;
  
  return {
    iOSSafari,
    isAndroid,
    isMobile: iOS || isAndroid
  };
};

// Create an optimized query client with simplified settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 2, // Reduced retries to avoid connection issues
      networkMode: 'online',
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: 'always',
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
    mutations: {
      networkMode: 'online',
      retry: 1, // Minimal retries for mutations
      retryDelay: 2000
    }
  }
});

// Initialize app
const initApp = () => {
  const container = document.getElementById("root");
  if (container) {
    const root = createRoot(container);
    root.render(<App queryClient={queryClient} />);
  }
};

// Platform-optimized execution
const browser = detectBrowser();
if (browser.iOSSafari) {
  // iOS needs immediate execution
  initApp();
} else if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Register service worker in production only
if (import.meta.env.PROD) {
  registerServiceWorker();
}

// iOS Safari height fix
if (browser.iOSSafari) {
  const fixIOSHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  window.addEventListener('resize', fixIOSHeight);
  fixIOSHeight();
}
