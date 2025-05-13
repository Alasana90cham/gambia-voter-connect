
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { fetchAdmins, fetchVoterData } from '@/data/constituencies';
import { toast } from "@/components/ui/use-toast";
import { UserRole } from "@/types/form";
import { supabase } from "@/integrations/supabase/client";

// Import refactored components
import AdminLogin from '@/components/statistics/AdminLogin';
import GenderChart from '@/components/statistics/GenderChart';
import RegionChart from '@/components/statistics/RegionChart';
import RegistrationTable from '@/components/statistics/RegistrationTable';
import ConstituencyDetail from '@/components/statistics/ConstituencyDetail';
import AdminManagement from '@/components/statistics/AdminManagement';
import { StatisticsProvider } from '@/components/statistics/StatisticsContext';
import StatisticsContent from '@/components/statistics/StatisticsContent';

const Statistics = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  const handleLoginSuccess = () => {
    setIsAdmin(true);
  };

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
        <StatisticsContent onLogout={() => setIsAdmin(false)} />
      </StatisticsProvider>
      
      <Footer />
    </div>
  );
};

export default Statistics;
