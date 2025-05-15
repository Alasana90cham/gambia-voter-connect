
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminLogin from '@/components/statistics/AdminLogin';
import { StatisticsProvider } from '@/components/statistics/StatisticsContext';
import StatisticsContent from '@/components/statistics/StatisticsContent';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Session timeout in milliseconds (3 hours)
const SESSION_TIMEOUT = 3 * 60 * 60 * 1000;

const Statistics = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);

  // Reset the inactivity timer
  const resetInactivityTimer = () => {
    // Clear existing timer if any
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    
    // Set new timer for automatic logout after inactivity
    const timer = setTimeout(() => {
      handleLogout();
      toast({
        title: "Session Expired",
        description: "You have been logged out due to inactivity.",
      });
    }, SESSION_TIMEOUT);
    
    setInactivityTimer(timer);
  };

  // Setup event listeners for user activity
  useEffect(() => {
    if (isAdmin) {
      // Reset timer on user activity
      const activityEvents = ['mousedown', 'keypress', 'scroll', 'touchstart'];
      
      const handleUserActivity = () => {
        resetInactivityTimer();
      };
      
      // Add event listeners
      activityEvents.forEach(event => {
        document.addEventListener(event, handleUserActivity);
      });
      
      // Initial timer setup
      resetInactivityTimer();
      
      // Cleanup event listeners on unmount
      return () => {
        if (inactivityTimer) {
          clearTimeout(inactivityTimer);
        }
        
        activityEvents.forEach(event => {
          document.removeEventListener(event, handleUserActivity);
        });
      };
    }
  }, [isAdmin]);

  // Check for existing admin session on component mount
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const sessionData = localStorage.getItem('adminSession');
        if (sessionData) {
          const session = JSON.parse(sessionData);
          
          // Check if session has explicit expiry time
          if (session.expires) {
            const expiryTime = new Date(session.expires).getTime();
            const currentTime = new Date().getTime();
            
            if (currentTime < expiryTime) {
              console.log("Valid admin session found");
              setIsAdmin(true);
              
              // Refresh session expiry time
              const updatedSession = {
                ...session,
                expires: new Date(Date.now() + SESSION_TIMEOUT).toISOString()
              };
              localStorage.setItem('adminSession', JSON.stringify(updatedSession));
            } else {
              console.log("Admin session expired, logging out");
              localStorage.removeItem('adminSession');
            }
          } else {
            // Backward compatibility with older session format
            const sessionTime = new Date(session.timestamp).getTime();
            const currentTime = new Date().getTime();
            
            if (currentTime - sessionTime < SESSION_TIMEOUT) {
              console.log("Valid admin session found (legacy format)");
              setIsAdmin(true);
              
              // Upgrade to new session format with explicit expiry
              const updatedSession = {
                ...session,
                expires: new Date(Date.now() + SESSION_TIMEOUT).toISOString()
              };
              localStorage.setItem('adminSession', JSON.stringify(updatedSession));
            } else {
              console.log("Admin session expired, logging out");
              localStorage.removeItem('adminSession');
            }
          }
        }
      } catch (error) {
        console.error("Error checking admin session:", error);
        // Clear potentially corrupted session data
        localStorage.removeItem('adminSession');
      } finally {
        setIsInitializing(false);
      }
    };
    
    checkExistingSession();
    
    // Ensure Supabase is properly initialized with secure connection
    const checkSupabaseConnection = async () => {
      try {
        // Simple ping to check if Supabase connection is working
        const { error } = await supabase.from('admins').select('count').limit(1);
        if (error) {
          console.error("Supabase connection error:", error);
          toast({
            title: "Connection Error",
            description: "Could not connect to the database securely. Please refresh the page.",
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
    resetInactivityTimer();
    
    // Set session with explicit expiry
    const session = {
      timestamp: new Date().toISOString(),
      expires: new Date(Date.now() + SESSION_TIMEOUT).toISOString()
    };
    localStorage.setItem('adminSession', JSON.stringify(session));
    
    toast({
      title: "Login Successful",
      description: "Welcome to the admin dashboard.",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    setIsAdmin(false);
    
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      setInactivityTimer(null);
    }
    
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
            <p className="mt-2">Initializing secure dashboard...</p>
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
        <main className="flex-grow">
          <StatisticsContent onLogout={handleLogout} />
        </main>
      </StatisticsProvider>
      
      <Footer />
    </div>
  );
};

export default Statistics;
