import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { fetchAdmins } from '@/data/constituencies';
import { toast } from "@/components/ui/use-toast";
import { UserRole } from "@/types/form";
import { supabase, fetchAllRecords } from "@/integrations/supabase/client";
import { debounce } from "@/lib/utils";
import { 
  getVisibleRows, 
  processBatch, 
  generateCsvContent, 
  downloadCsv 
} from './RegistrationTableHelpers';

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
  // Pagination
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  setCurrentPage: (page: number) => void;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
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

  // Simplified voter data loading
  const loadAllVoterData = useCallback(async () => {
    console.log("Starting voter data load...");
    setIsLoading(true);
    
    try {
      const allVoters = await fetchAllRecords('voters');
      
      console.log(`Voter data loaded: ${allVoters.length} records`);
      
      if (allVoters && allVoters.length > 0) {
        setVoterData(allVoters);
        setFilteredData(allVoters);
        setTotalRecords(allVoters.length);
        setTotalPages(Math.ceil(allVoters.length / pageSize));
        
        // Process chart data
        processChartData(allVoters);
        
        toast({
          title: "Data Loaded Successfully",
          description: `Loaded ${allVoters.length} voter records.`,
        });
      } else {
        console.log("No voter data found");
        setVoterData([]);
        setFilteredData([]);
        setGenderData([]);
        setRegionData([]);
        setConstituencyData({});
        setTotalRecords(0);
        setTotalPages(1);
        
        toast({
          title: "No Data Found",
          description: "No voter registration records were found.",
        });
      }
    } catch (error) {
      console.error("Failed to load voter data:", error);
      
      setVoterData([]);
      setFilteredData([]);
      setGenderData([]);
      setRegionData([]);
      setConstituencyData({});
      setTotalRecords(0);
      setTotalPages(1);
      
      toast({
        title: "Database Error",
        description: "Failed to load voter data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // Process chart data from voter records
  const processChartData = useCallback((voters: any[]) => {
    console.log(`Processing chart data from ${voters.length} records`);
    
    // Gender distribution
    const genderCounts = new Map<string, number>();
    voters.forEach(voter => {
      const gender = voter.gender || 'Unknown';
      genderCounts.set(gender, (genderCounts.get(gender) || 0) + 1);
    });
    
    const genderChartData: ChartData[] = Array.from(genderCounts.entries()).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
    
    // Regional distribution
    const regionCounts = new Map<string, number>();
    voters.forEach(voter => {
      const region = voter.region || 'Unknown';
      regionCounts.set(region, (regionCounts.get(region) || 0) + 1);
    });
    
    const regionChartData: ChartData[] = Array.from(regionCounts.entries()).map(([name, value]) => ({
      name,
      value
    }));
    
    // Constituency distribution by region
    const constituencyByRegion = new Map<string, Map<string, number>>();
    voters.forEach(voter => {
      const region = voter.region || 'Unknown';
      const constituency = voter.constituency || 'Unknown';
      
      if (!constituencyByRegion.has(region)) {
        constituencyByRegion.set(region, new Map<string, number>());
      }
      
      const regionConstituencies = constituencyByRegion.get(region)!;
      regionConstituencies.set(constituency, (regionConstituencies.get(constituency) || 0) + 1);
    });
    
    const constituencyChartData: {[key: string]: ChartData[]} = {};
    constituencyByRegion.forEach((constituencies, region) => {
      constituencyChartData[region] = Array.from(constituencies.entries()).map(([name, value]) => ({
        name,
        value
      }));
    });
    
    // Update chart data state
    setGenderData(genderChartData);
    setRegionData(regionChartData);
    setConstituencyData(constituencyChartData);
    
    console.log("Chart data processing completed");
  }, []);
  
  // Load admins
  const loadAdmins = useCallback(async () => {
    try {
      console.log("Fetching admin users...");
      const admins = await fetchAdmins();
      setAdminList(admins);
      console.log(`Admins loaded: ${admins.length} records`);
    } catch (error) {
      console.error("Error loading admins:", error);
      toast({
        title: "Admin Data Error",
        description: "Failed to load admin information",
        variant: "destructive",
      });
    }
  }, []);

  // Setup realtime subscriptions for data updates
  const setupRealtimeSubscriptions = useCallback(() => {
    console.log("Setting up realtime subscriptions");
    
    const votersChannel = supabase
      .channel('voters-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'voters'
      }, (payload) => {
        console.log(`Voters table change detected: ${payload.eventType}`);
        loadAllVoterData();
      })
      .subscribe();
      
    const adminsChannel = supabase
      .channel('admins-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'admins'
      }, (payload) => {
        console.log(`Admins table change detected: ${payload.eventType}`);
        loadAdmins();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(votersChannel);
      supabase.removeChannel(adminsChannel);
    };
  }, [loadAllVoterData, loadAdmins]);

  // Delete success handler
  const handleDeleteSuccess = useCallback(async () => {
    console.log("Delete operation completed, refreshing data");
    await Promise.all([loadAllVoterData(), loadAdmins()]);
  }, [loadAllVoterData, loadAdmins]);
  
  // CSV export functionality
  const handleExcelExport = useCallback(() => {
    if (filteredData.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no records to export.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    toast({
      title: "Export Started",
      description: `Processing ${filteredData.length} records for export...`,
    });
    
    setTimeout(() => {
      try {
        console.log(`Starting CSV export of ${filteredData.length} records`);
        
        const csvContent = generateCsvContent(filteredData);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `NYPG_Voter_Statistics_${timestamp}.csv`;
        downloadCsv(csvContent, filename);
        
        toast({
          title: "Export Successful",
          description: `${filteredData.length} records exported successfully`,
        });
      } catch (error) {
        console.error("Error exporting data:", error);
        toast({
          title: "Export Failed",
          description: "An error occurred during export. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }, 100);
  }, [filteredData]);
  
  // Simplified initial data loading
  useEffect(() => {
    console.log("Initializing data load...");
    
    Promise.all([loadAllVoterData(), loadAdmins()]);
    
    // Set up realtime subscriptions
    const unsubscribe = setupRealtimeSubscriptions();
    
    return () => {
      unsubscribe();
    };
  }, [loadAllVoterData, loadAdmins, setupRealtimeSubscriptions]);

  // Enhanced filter application
  const applyFilters = useCallback(() => {
    if (!voterData.length) {
      setFilteredData([]);
      return;
    }
    
    console.log(`Applying filters to ${voterData.length} records`);
    
    let result = [...voterData];
    
    // Apply filters
    if (filters.fullName.trim()) {
      const searchTerm = filters.fullName.toLowerCase().trim();
      result = result.filter(voter => 
        voter.full_name && voter.full_name.toLowerCase().includes(searchTerm)
      );
    }
    
    if (filters.organization.trim()) {
      const searchTerm = filters.organization.toLowerCase().trim();
      result = result.filter(voter => 
        voter.organization && voter.organization.toLowerCase().includes(searchTerm)
      );
    }
    
    if (filters.dateOfBirth.trim()) {
      result = result.filter(voter => {
        if (!voter.date_of_birth) return false;
        const voterDob = voter.date_of_birth.toString();
        return voterDob.includes(filters.dateOfBirth);
      });
    }
    
    if (filters.gender) {
      result = result.filter(voter => voter.gender === filters.gender);
    }
    
    if (filters.region.trim()) {
      const searchTerm = filters.region.toLowerCase().trim();
      result = result.filter(voter => 
        voter.region && voter.region.toLowerCase().includes(searchTerm)
      );
    }
    
    if (filters.constituency.trim()) {
      const searchTerm = filters.constituency.toLowerCase().trim();
      result = result.filter(voter => 
        voter.constituency && voter.constituency.toLowerCase().includes(searchTerm)
      );
    }
    
    if (filters.identificationType) {
      result = result.filter(voter => voter.identification_type === filters.identificationType);
    }
    
    if (filters.identificationNumber.trim()) {
      const searchTerm = filters.identificationNumber.toLowerCase().trim();
      result = result.filter(voter => 
        voter.identification_number && voter.identification_number.toLowerCase().includes(searchTerm)
      );
    }
    
    console.log(`Filter applied: ${result.length} records after filtering`);
    
    setFilteredData(result);
    setTotalRecords(result.length);
    setTotalPages(Math.ceil(result.length / pageSize));
    setCurrentPage(1);
    
    // Update chart data based on filtered results
    processChartData(result);
  }, [voterData, filters, pageSize, processChartData]);

  // Debounced filter application
  const debouncedApplyFilters = useCallback(
    debounce(() => {
      applyFilters();
    }, 300),
    [applyFilters]
  );

  // Apply filters when filters or source data changes
  useEffect(() => {
    debouncedApplyFilters();
    return () => debouncedApplyFilters.cancel();
  }, [filters, voterData, debouncedApplyFilters]);

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
        currentPage,
        totalPages,
        totalRecords,
        pageSize,
        setPageSize,
        setCurrentPage,
        handleDeleteSuccess,
        handleExcelExport
      }}
    >
      {children}
    </StatisticsContext.Provider>
  );
};
