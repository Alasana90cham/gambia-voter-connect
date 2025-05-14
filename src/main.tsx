
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

// Create an optimized query client with high-performance settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - increase cache lifetime
      gcTime: 30 * 60 * 1000, // 30 minutes - keep garbage collection infrequent
      retry: 3,
      networkMode: 'online',
      refetchOnWindowFocus: import.meta.env.PROD ? false : true,
      refetchOnMount: true,
      refetchOnReconnect: 'always',
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Added support for large datasets
      structuralSharing: false, // Disable structural sharing for large objects
      keepPreviousData: true, // Keep previous data while fetching new data
    },
    mutations: {
      networkMode: 'online',
      retry: 2,
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

// Performance monitoring
const setupPerformanceMonitoring = () => {
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

// Execute initialization with optimization for large apps
if (document.readyState === 'loading') {
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

// Add memory management for large datasets
if ('performance' in window && 'memory' in performance) {
  setInterval(() => {
    const memoryInfo = (performance as any).memory;
    if (memoryInfo && memoryInfo.usedJSHeapSize > 0.8 * memoryInfo.jsHeapSizeLimit) {
      console.warn('High memory usage detected. Consider optimizing data handling.');
    }
  }, 30000); // Check every 30 seconds
}
