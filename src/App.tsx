
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Statistics from "./pages/Statistics";
import NotFound from "./pages/NotFound";
import { Suspense, lazy } from "react";

// Use prop to receive optimized queryClient from main.tsx
interface AppProps {
  queryClient: QueryClient;
}

// Implement route-based code splitting with lazy loading
const LazyStatistics = lazy(() => import("./pages/Statistics"));

const App = ({ queryClient = new QueryClient() }: AppProps) => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route 
            path="/statistics" 
            element={
              <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>
                <LazyStatistics />
              </Suspense>
            } 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
