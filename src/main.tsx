
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient } from '@tanstack/react-query'

// Register service worker for offline capabilities and caching
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(error => {
          console.error('ServiceWorker registration failed: ', error);
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

// Create an optimized query client with platform-specific settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - increase cache lifetime
      gcTime: 30 * 60 * 1000, // 30 minutes - keep garbage collection infrequent
      retry: detectBrowser().iOSSafari ? 5 : 3, // More retries for iOS Safari
      networkMode: 'online',
      refetchOnWindowFocus: import.meta.env.PROD ? false : true,
      refetchOnMount: true,
      refetchOnReconnect: 'always',
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      structuralSharing: false, // Disable structural sharing for large objects
    },
    mutations: {
      networkMode: 'online',
      retry: detectBrowser().iOSSafari ? 4 : 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 15000)
    }
  }
});

// Performance optimization: Detect memory leaks in development
if (import.meta.env.DEV) {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (args[0]?.includes?.('findDOMNode')) return;
    if (args[0]?.includes?.('React does not recognize the')) return;
    originalConsoleError(...args);
  };
}

// Cross-platform performance monitoring
const setupPerformanceMonitoring = () => {
  // Skip heavy monitoring on iOS devices
  if (detectBrowser().iOSSafari) {
    console.log('Limited performance monitoring for iOS Safari');
    return;
  }

  if ('PerformanceObserver' in window) {
    // Monitor large layout shifts
    const layoutShiftObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // @ts-ignore - LayoutShift is not yet in TypeScript's lib
        if (entry.value > 0.1) {
          console.warn('Large layout shift detected:', entry);
        }
      }
    });
    
    try {
      layoutShiftObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.warn('Layout Shift API not supported');
    }
    
    // Monitor long tasks
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) { // Tasks blocking the main thread for 50ms or more
          console.warn('Long task detected:', entry.duration.toFixed(2), 'ms');
        }
      }
    });
    
    try {
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.warn('Long Task API not supported');
    }
  }
};

// Initialize app with optimized settings
const initApp = () => {
  // Use requestIdleCallback for non-critical initialization
  const startTime = performance.now();
  
  const container = document.getElementById("root");
  if (container) {
    const root = createRoot(container);
    root.render(<App queryClient={queryClient} />);
    
    // Log render time in development
    if (import.meta.env.DEV) {
      const renderTime = performance.now() - startTime;
      console.log(`Initial render took: ${renderTime.toFixed(2)}ms`);
    }
  }
  
  // Setup performance monitoring in development
  if (import.meta.env.DEV) {
    setupPerformanceMonitoring();
  }
};

// Platform-optimized execution
const browser = detectBrowser();
if (browser.iOSSafari) {
  // iOS needs immediate execution for reliable startup
  initApp();
} else if (document.readyState === 'loading') {
  // For other platforms, use standard optimization pattern
  document.addEventListener('DOMContentLoaded', () => {
    requestIdleCallback ? requestIdleCallback(initApp) : setTimeout(initApp, 1);
  });
} else {
  requestIdleCallback ? requestIdleCallback(initApp) : setTimeout(initApp, 1);
}

// Register service worker in production
if (import.meta.env.PROD) {
  registerServiceWorker();
}

// Add platform-appropriate memory management
if ('performance' in window && 'memory' in performance) {
  const memoryCheckInterval = browser.iOSSafari ? 60000 : 30000; // Less frequent checks on iOS
  setInterval(() => {
    const memoryInfo = (performance as any).memory;
    if (memoryInfo && memoryInfo.usedJSHeapSize > 0.8 * memoryInfo.jsHeapSizeLimit) {
      console.warn('High memory usage detected. Consider optimizing data handling.');
    }
  }, memoryCheckInterval);
}

// Add iOS Safari specific fixes
if (browser.iOSSafari) {
  // Fix for iOS height calculation issues with 100vh
  const fixIOSHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  window.addEventListener('resize', fixIOSHeight);
  fixIOSHeight();
}
