
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchAdmins, fetchVoterData } from '@/data/constituencies';
import { toast } from "@/components/ui/use-toast";
import { UserRole } from "@/types/form";
import { supabase } from "@/integrations/supabase/client";

interface ChartData {
  name: string;
  value: number;
}

interface FilterState {
  fullName: string;
  organization: string;
  dateOfBirth: string;
  gender: string;
  region: string;
  constituency: string;
  identificationType: string;
  identificationNumber: string;
}

interface StatisticsContextType {
  // Voter data
  voterData: any[];
  filteredData: any[];
  // Chart data
  genderData: ChartData[];
  regionData: ChartData[];
  constituencyData: {[key: string]: ChartData[]};
  // Admin data
  adminList: UserRole[];
  // Filters
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  // Status
  isLoading: boolean;
  // Region selection
  selectedRegion: string;
  setSelectedRegion: (region: string) => void;
  // Actions
  handleDeleteSuccess: () => void;
  handleExcelExport: () => void;
}

const StatisticsContext = createContext<StatisticsContextType | undefined>(undefined);

export const useStatistics = () => {
  const context = useContext(StatisticsContext);
  if (context === undefined) {
    throw new Error('useStatistics must be used within a StatisticsProvider');
  }
  return context;
};

export const StatisticsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
  const [genderData, setGenderData] = useState<ChartData[]>([]);
  const [regionData, setRegionData] = useState<ChartData[]>([]);
  const [constituencyData, setConstituencyData] = useState<{[key: string]: ChartData[]}>({});
  
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
    
    const constituencyChartData: {[key: string]: ChartData[]} = {};
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

  // Handle delete success function
  const handleDeleteSuccess = () => {
    // Reload data to ensure consistency
    loadVoterData();
  };

  // Export functionality
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

  // Initial data loading
  useEffect(() => {
    console.log("Admin authenticated, loading data");
    // Load initial data
    loadVoterData();
    loadAdmins();
    
    // Set up realtime subscriptions
    const unsubscribe = setupRealtimeSubscriptions();
    
    return () => {
      unsubscribe();
    };
  }, []);

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

  return (
    <StatisticsContext.Provider
      value={{
        voterData,
        filteredData,
        genderData,
        regionData,
        constituencyData,
        adminList,
        filters,
        setFilters,
        isLoading,
        selectedRegion,
        setSelectedRegion,
        handleDeleteSuccess,
        handleExcelExport
      }}
    >
      {children}
    </StatisticsContext.Provider>
  );
};
