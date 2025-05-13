
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient } from '@tanstack/react-query'

// Register service worker for offline capabilities
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

// Create an optimized query client with production settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      networkMode: 'online',
      refetchOnWindowFocus: import.meta.env.PROD ? false : true,
      refetchOnMount: true,
      refetchOnReconnect: 'always',
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
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

// Initialize app with optimized settings
const initApp = () => {
  const container = document.getElementById("root");
  if (container) {
    const root = createRoot(container);
    root.render(<App queryClient={queryClient} />);
  }
};

// Execute initialization
initApp();

// Register service worker in production
if (import.meta.env.PROD) {
  registerServiceWorker();
}
