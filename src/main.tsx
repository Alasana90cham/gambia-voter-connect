
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient } from '@tanstack/react-query'

// Create an optimized query client with production settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      networkMode: 'online',
      refetchOnWindowFocus: false, // Disable refetches on window focus in production
      refetchOnMount: true
    },
    mutations: {
      networkMode: 'online',
      retry: 2
    }
  }
});

// Use this client in the App component
createRoot(document.getElementById("root")!).render(<App queryClient={queryClient} />);
