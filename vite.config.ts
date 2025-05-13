
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    watch: {
      usePolling: false // Reduce CPU usage in development
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize chunk size and enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-label', '@radix-ui/react-popover', '@radix-ui/react-radio-group'],
          charts: ['recharts'],
          forms: ['react-hook-form'],
          database: ['@supabase/supabase-js', '@tanstack/react-query']
        }
      }
    },
    // Optimize CSS
    cssCodeSplit: true,
    // Optimize asset compression
    assetsInlineLimit: 4096,
    // Enable source maps for better error tracking
    sourcemap: mode !== 'production',
    // Minify output 
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // Remove console logs in production
        drop_debugger: true, // Remove debugger statements in production
        passes: 2 // Run multiple passes for better compression
      }
    },
    // Speed up build time
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js']
  },
  preview: {
    port: 4173,
    host: 'localhost'
  },
}));
