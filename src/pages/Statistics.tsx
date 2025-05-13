
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

const Statistics = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('Banjul');
  
  // Filters state
  const [filters, setFilters] = useState({
    fullName: '',
    organization: '',
    dateOfBirth: '',
    gender: '',
    region: '',
    constituency: '',
    identificationType: '',
    identificationNumber: ''
  });
  
  // Voter data state
  const [voterData, setVoterData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  
  // Admin users state
  const [adminList, setAdminList] = useState<UserRole[]>([]);
  
  // Chart data state
  const [genderData, setGenderData] = useState<{ name: string; value: number }[]>([]);
  const [regionData, setRegionData] = useState<{ name: string; value: number }[]>([]);
  const [constituencyData, setConstituencyData] = useState<{[key: string]: { name: string; value: number }[]}>({}); 
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  
  // Process data for charts
  const processChartData = (voters: any[]) => {
    if (!voters || voters.length === 0) return;
    
    // Process gender data
    const genderCounts: Record<string, number> = {};
    voters.forEach((voter: any) => {
      const gender = voter.gender || 'Unknown';
      genderCounts[gender] = (genderCounts[gender] || 0) + 1;
    });
    
    const genderChartData = Object.keys(genderCounts).map(gender => ({
      name: gender.charAt(0).toUpperCase() + gender.slice(1), // Capitalize
      value: genderCounts[gender]
    }));
    setGenderData(genderChartData);
    
    // Process region data
    const regionCounts: Record<string, number> = {};
    voters.forEach((voter: any) => {
      const region = voter.region || 'Unknown';
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    });
    
    const regionChartData = Object.keys(regionCounts).map(region => ({
      name: region,
      value: regionCounts[region]
    }));
    setRegionData(regionChartData);
    
    // Process constituency data
    const constituenciesByRegion: Record<string, Record<string, number>> = {};
    voters.forEach((voter: any) => {
      const region = voter.region || 'Unknown';
      const constituency = voter.constituency || 'Unknown';
      
      if (!constituenciesByRegion[region]) {
        constituenciesByRegion[region] = {};
      }
      
      constituenciesByRegion[region][constituency] = (constituenciesByRegion[region][constituency] || 0) + 1;
    });
    
    const constituencyChartData: {[key: string]: { name: string; value: number }[]} = {};
    Object.keys(constituenciesByRegion).forEach(region => {
      constituencyChartData[region] = Object.keys(constituenciesByRegion[region]).map(constituency => ({
        name: constituency,
        value: constituenciesByRegion[region][constituency]
      }));
    });
    setConstituencyData(constituencyChartData);
  };
  
  // Fetch voter data with improved error handling
  const loadVoterData = async () => {
    setIsLoading(true);
    
    try {
      const voters = await fetchVoterData();
      console.log("Fetched voter data:", voters);
      setVoterData(voters);
      setFilteredData(voters);
      processChartData(voters);
      
    } catch (error) {
      console.error("Error loading voter data:", error);
      toast({
        title: "Data Loading Error",
        description: "Failed to load voter registration data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load admins with error handling
  const loadAdmins = async () => {
    try {
      const admins = await fetchAdmins();
      console.log("Fetched admin data:", admins);
      setAdminList(admins || []);
    } catch (error) {
      console.error("Error loading admins:", error);
      toast({
        title: "Admin Data Error",
        description: "Failed to load admin information",
        variant: "destructive",
      });
    }
  };
  
  // Enhanced realtime subscription setup with better error handling
  const setupRealtimeSubscriptions = () => {
    console.log("Setting up realtime subscriptions");
    
    // Create a channel for admins table with improved logging
    const adminsChannel = supabase
      .channel('admin-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'admins' 
      }, (payload) => {
        console.log('Admin change received:', payload);
        // Reload admins when any change happens
        loadAdmins();
      })
      .subscribe((status) => {
        console.log('Admins subscription status:', status);
      });
    
    // Create a channel for voters table with improved logging
    const votersChannel = supabase
      .channel('voters-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'voters' 
      }, (payload) => {
        console.log('Voter change received:', payload);
        // Reload voter data when any change happens
        loadVoterData();
      })
      .subscribe((status) => {
        console.log('Voters subscription status:', status);
      });
      
    return () => {
      console.log("Cleaning up realtime subscriptions");
      supabase.removeChannel(adminsChannel);
      supabase.removeChannel(votersChannel);
    };
  };
  
  // Initial data loading
  useEffect(() => {
    if (isAdmin) {
      console.log("Admin authenticated, loading data");
      // Load initial data
      loadVoterData();
      loadAdmins();
      
      // Set up realtime subscriptions
      const unsubscribe = setupRealtimeSubscriptions();
      
      return () => {
        unsubscribe();
      };
    }
  }, [isAdmin]);
  
  // Apply filters to the data
  useEffect(() => {
    if (!voterData.length) return;
    
    let result = voterData;
    
    if (filters.fullName) {
      result = result.filter(voter => 
        voter.full_name && voter.full_name.toLowerCase().includes(filters.fullName.toLowerCase())
      );
    }
    
    if (filters.organization) {
      result = result.filter(voter => 
        voter.organization && voter.organization.toLowerCase().includes(filters.organization.toLowerCase())
      );
    }
    
    if (filters.dateOfBirth) {
      result = result.filter(voter => 
        voter.date_of_birth && voter.date_of_birth.includes(filters.dateOfBirth)
      );
    }
    
    if (filters.gender) {
      result = result.filter(voter => 
        voter.gender === filters.gender
      );
    }
    
    if (filters.region) {
      result = result.filter(voter => 
        voter.region && voter.region.toLowerCase().includes(filters.region.toLowerCase())
      );
    }
    
    if (filters.constituency) {
      result = result.filter(voter => 
        voter.constituency && voter.constituency.toLowerCase().includes(filters.constituency.toLowerCase())
      );
    }
    
    if (filters.identificationType) {
      result = result.filter(voter => 
        voter.identification_type && voter.identification_type.includes(filters.identificationType)
      );
    }
    
    if (filters.identificationNumber) {
      result = result.filter(voter => 
        voter.identification_number && voter.identification_number.includes(filters.identificationNumber)
      );
    }
    
    setFilteredData(result);
  }, [filters, voterData]);
  
  const handleLoginSuccess = () => {
    setIsAdmin(true);
  };

  const handleExcelExport = () => {
    // Create a CSV string with the filtered data
    const headers = "Full Name,Email,Organization,Date Of Birth,Gender,Region,Constituency,ID Type,ID Number\n";
    let csvContent = headers;
    
    // Add the filtered data rows
    filteredData.forEach(voter => {
      const dob = voter.date_of_birth ? voter.date_of_birth.split('T')[0] : '';
      const idType = voter.identification_type === 'birth_certificate' ? 'Birth Certificate' : 
                    voter.identification_type === 'identification_document' ? 'ID Document' :
                    voter.identification_type === 'passport_number' ? 'Passport' : '';
      
      csvContent += `"${voter.full_name || ''}","${voter.email || ''}","${voter.organization || ''}","${dob}","${voter.gender || ''}","${voter.region || ''}","${voter.constituency || ''}","${idType}","${voter.identification_number || ''}"\n`;
    });
    
    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NYPG_Voter_Statistics_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: `${filteredData.length} records have been exported to CSV format`,
    });
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
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">NATIONAL YOUTH PARLIAMENT GAMBIA - Registration Statistics</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsAdmin(false)}>Logout</Button>
            <Button 
              onClick={handleExcelExport}
              className="flex items-center gap-2"
            >
              <Download size={18} />
              Export CSV
            </Button>
            <Button 
              onClick={() => {
                const printHandler = document.getElementById('printTable');
                if (printHandler) {
                  printHandler.click();
                }
              }}
              className="flex items-center gap-2"
            >
              <Printer size={18} />
              Print
            </Button>
          </div>
        </div>
        
        <div className="mb-8">
          <p className="text-lg text-gray-600">
            Welcome to the admin dashboard. Here you can view real-time statistics of voter registrations.
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading data...</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Gender Distribution */}
              <GenderChart 
                genderData={genderData} 
                totalCount={voterData.length} 
              />
              
              {/* Regional Distribution */}
              <RegionChart 
                regionData={regionData} 
              />
            </div>
            
            {/* Registration Data Table with Enhanced Filtering */}
            <RegistrationTable
              voterData={voterData}
              filteredData={filteredData}
              regionData={regionData}
              constituencyData={constituencyData}
              onUpdateFilters={setFilters}
              filters={filters}
            />
            
            {/* Constituency Details */}
            <ConstituencyDetail
              selectedRegion={selectedRegion}
              regionData={regionData}
              constituencyData={constituencyData}
              onRegionChange={setSelectedRegion}
            />
            
            {/* Admin Management */}
            <AdminManagement 
              adminList={adminList}
            />
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Statistics;
