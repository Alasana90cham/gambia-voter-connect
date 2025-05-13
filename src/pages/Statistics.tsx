
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AdminLogin } from '@/components/statistics/AdminLogin';
import { StatisticsProvider } from '@/components/statistics/StatisticsContext';
import StatisticsContent from '@/components/statistics/StatisticsContent';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Statistics = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Check for existing admin session on component mount
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const sessionData = localStorage.getItem('adminSession');
        if (sessionData) {
          const session = JSON.parse(sessionData);
          // Check if session is still valid (e.g., not expired)
          const sessionTime = new Date(session.timestamp).getTime();
          const currentTime = new Date().getTime();
          const twoHours = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
          
          if (currentTime - sessionTime < twoHours) {
            console.log("Valid admin session found");
            setIsAdmin(true);
          } else {
            console.log("Admin session expired, logging out");
            localStorage.removeItem('adminSession');
          }
        }
      } catch (error) {
        console.error("Error checking admin session:", error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    checkExistingSession();
    
    // Ensure Supabase is properly initialized
    const checkSupabaseConnection = async () => {
      try {
        // Simple ping to check if Supabase connection is working
        const { error } = await supabase.from('admins').select('count').limit(1);
        if (error) {
          console.error("Supabase connection error:", error);
          toast({
            title: "Connection Error",
            description: "Could not connect to the database. Please refresh the page.",
            variant: "destructive",
          });
        } else {
          console.log("Supabase connection established successfully");
        }
      } catch (e) {
        console.error("Error checking Supabase connection:", e);
      }
    };
    
    checkSupabaseConnection();
  }, []);

  const handleLoginSuccess = () => {
    setIsAdmin(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    setIsAdmin(false);
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };

  // Show loading state while checking for existing session
  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
            </div>
            <p className="mt-2">Initializing dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Component rendering based on authentication state
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <AdminLogin onLoginSuccess={handleLoginSuccess} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <StatisticsProvider>
        <StatisticsContent onLogout={handleLogout} />
      </StatisticsProvider>
      
      <Footer />
    </div>
  );
};

export default Statistics;
