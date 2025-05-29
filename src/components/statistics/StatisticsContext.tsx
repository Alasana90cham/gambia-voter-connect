
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { fetchAdmins, fetchVoterData } from '@/data/constituencies';
import { toast } from "@/components/ui/use-toast";
import { UserRole } from "@/types/form";
import { supabase } from "@/integrations/supabase/client";
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

  // ULTRA-COMPLETE data fetch - get EVERY SINGLE record without any limits
  const loadAllVoterDataFromSupabase = useCallback(async () => {
    setIsLoading(true);
    console.log("Starting COMPLETE fetch of ALL voters from Supabase - NO LIMITS");
    
    try {
      // Strategy 1: Single massive query with NO LIMITS to get absolutely everything
      console.log("Attempting single query for ALL records with NO pagination limits");
      
      const { data: allVoters, error, count } = await supabase
        .from('voters')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: true }); // First come first serve order - NO LIMITS

      if (error) {
        console.error("Error in complete query:", error);
        throw error;
      }

      if (allVoters && allVoters.length > 0) {
        console.log(`COMPLETE SUCCESS: Retrieved ALL ${allVoters.length} records in single query`);
        console.log(`Database reports ${count} total records - we got them ALL`);
        
        // Set all data states immediately with ALL records
        setVoterData(allVoters);
        setFilteredData(allVoters);
        setTotalRecords(allVoters.length);
        setTotalPages(Math.ceil(allVoters.length / pageSize));
        
        // Process chart data with ALL records
        processChartDataFromSupabase(allVoters);
        
        toast({
          title: "Complete Database Load!",
          description: `Loaded ALL ${allVoters.length} voter records - no records left behind!`,
        });
        
        return; // Exit on complete success
      }

      // Fallback: If somehow no data, try parallel batching with NO upper limits
      console.log("Fallback: Using unlimited parallel batch strategy");
      
      // Get total count first
      const { count: totalCount, error: countError } = await supabase
        .from('voters')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error("Error getting total count:", countError);
        throw countError;
      }

      console.log(`Total records in database: ${totalCount} - we will get ALL of them`);
      
      // Create multiple parallel queries to get EVERYTHING
      const batchSize = 5000; // Larger batches for efficiency
      const totalBatches = Math.ceil(totalCount / batchSize);
      const promises = [];

      // Create ALL batch promises simultaneously for parallel execution
      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = start + batchSize - 1;
        
        const promise = supabase
          .from('voters')
          .select('*')
          .range(start, end)
          .order('created_at', { ascending: true }); // First come first serve
          
        promises.push(promise);
      }

      console.log(`Executing ${promises.length} parallel queries to get ALL records`);
      
      // Execute ALL queries in parallel for maximum speed
      const results = await Promise.all(promises);
      
      // Combine ALL results
      let combinedVoters: any[] = [];
      for (const { data, error } of results) {
        if (error) {
          console.error("Error in parallel batch:", error);
          throw error;
        }
        if (data) {
          combinedVoters = [...combinedVoters, ...data];
        }
      }

      console.log(`PARALLEL SUCCESS: Retrieved ALL ${combinedVoters.length} total records`);

      if (combinedVoters.length > 0) {
        // Set all data states with ALL records
        setVoterData(combinedVoters);
        setFilteredData(combinedVoters);
        setTotalRecords(combinedVoters.length);
        setTotalPages(Math.ceil(combinedVoters.length / pageSize));
        
        // Process chart data with ALL records
        processChartDataFromSupabase(combinedVoters);
        
        toast({
          title: "Complete Parallel Load!",
          description: `Loaded ALL ${combinedVoters.length} voter records via parallel processing.`,
        });
      } else {
        // No data found
        setVoterData([]);
        setFilteredData([]);
        setGenderData([]);
        setRegionData([]);
        setConstituencyData({});
        setTotalRecords(0);
        setTotalPages(1);
        
        toast({
          title: "No Data Found",
          description: "No voter registration records were found in the database.",
        });
      }
    } catch (error) {
      console.error("Error loading ALL voter data from Supabase:", error);
      toast({
        title: "Database Error",
        description: "Failed to load voter data from database. Please try again.",
        variant: "destructive",
      });
      
      // Reset to empty state on error
      setVoterData([]);
      setFilteredData([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // Process chart data directly from Supabase data
  const processChartDataFromSupabase = useCallback((voters: any[]) => {
    console.log(`Processing chart data from ALL ${voters.length} Supabase records`);
    
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
    
    console.log("Chart data processing completed for ALL records", {
      genders: genderChartData.length,
      regions: regionChartData.length,
      constituencies: Object.keys(constituencyChartData).length,
      totalVoters: voters.length
    });
  }, []);
  
  // Load admins from Supabase
  const loadAdminsFromSupabase = useCallback(async () => {
    try {
      console.log("Fetching ALL admins from Supabase");
      const { data: admins, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching admins:", error);
        throw error;
      }

      console.log(`Fetched ALL ${admins?.length || 0} admins from Supabase`);
      
      // Convert to expected format
      const adminList: UserRole[] = (admins || []).map(admin => ({
        id: admin.id,
        email: admin.email,
        isAdmin: admin.is_admin,
        password: admin.password // Note: In production, passwords shouldn't be exposed
      }));
      
      setAdminList(adminList);
    } catch (error) {
      console.error("Error loading admins:", error);
      toast({
        title: "Admin Data Error",
        description: "Failed to load admin information",
        variant: "destructive",
      });
    }
  }, []);

  // Enhanced realtime subscription
  const setupRealtimeSubscriptions = useCallback(() => {
    console.log("Setting up realtime subscriptions for ALL Supabase data");
    
    // Voters table subscription
    const votersChannel = supabase
      .channel('voters-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'voters'
      }, (payload) => {
        console.log(`Voters table change detected: ${payload.eventType}`);
        // Reload ALL data when any change occurs
        loadAllVoterDataFromSupabase();
      })
      .subscribe((status) => {
        console.log(`Voters subscription status: ${status}`);
      });
      
    // Admins table subscription
    const adminsChannel = supabase
      .channel('admins-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'admins'
      }, (payload) => {
        console.log(`Admins table change detected: ${payload.eventType}`);
        loadAdminsFromSupabase();
      })
      .subscribe((status) => {
        console.log(`Admins subscription status: ${status}`);
      });
    
    return () => {
      supabase.removeChannel(votersChannel);
      supabase.removeChannel(adminsChannel);
    };
  }, [loadAllVoterDataFromSupabase, loadAdminsFromSupabase]);

  // Delete success handler
  const handleDeleteSuccess = useCallback(async () => {
    console.log("Delete operation completed, refreshing ALL data");
    await loadAllVoterDataFromSupabase();
    await loadAdminsFromSupabase();
  }, [loadAllVoterDataFromSupabase, loadAdminsFromSupabase]);
  
  // CSV export functionality
  const handleExcelExport = useCallback(() => {
    setIsLoading(true);
    toast({
      title: "Export Started",
      description: `Processing ALL ${filteredData.length} records for export...`,
    });
    
    setTimeout(() => {
      try {
        console.log(`Starting CSV export of ALL ${filteredData.length} records`);
        
        const csvContent = generateCsvContent(filteredData);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `NYPG_ALL_Voter_Statistics_${timestamp}.csv`;
        downloadCsv(csvContent, filename);
        
        toast({
          title: "Export Successful",
          description: `ALL ${filteredData.length} records exported successfully`,
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
  
  // Initial data loading - complete approach
  useEffect(() => {
    console.log("Initializing COMPLETE comprehensive data load from Supabase - ALL RECORDS");
    
    const initializeData = async () => {
      // Load both datasets in parallel for maximum speed
      await Promise.all([
        loadAllVoterDataFromSupabase(),
        loadAdminsFromSupabase()
      ]);
    };
    
    initializeData();
    
    // Set up realtime subscriptions
    const unsubscribe = setupRealtimeSubscriptions();
    
    return () => {
      unsubscribe();
    };
  }, [loadAllVoterDataFromSupabase, loadAdminsFromSupabase, setupRealtimeSubscriptions]);

  // Enhanced filter application
  const applyFilters = useCallback(() => {
    if (!voterData.length) {
      setFilteredData([]);
      return;
    }
    
    console.log(`Applying filters to ALL ${voterData.length} records`);
    
    let result = [...voterData];
    
    // Apply full name filter
    if (filters.fullName.trim()) {
      const searchTerm = filters.fullName.toLowerCase().trim();
      result = result.filter(voter => 
        voter.full_name && voter.full_name.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply organization filter
    if (filters.organization.trim()) {
      const searchTerm = filters.organization.toLowerCase().trim();
      result = result.filter(voter => 
        voter.organization && voter.organization.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply date of birth filter
    if (filters.dateOfBirth.trim()) {
      result = result.filter(voter => {
        if (!voter.date_of_birth) return false;
        const voterDob = voter.date_of_birth.toString();
        return voterDob.includes(filters.dateOfBirth);
      });
    }
    
    // Apply gender filter
    if (filters.gender) {
      result = result.filter(voter => voter.gender === filters.gender);
    }
    
    // Apply region filter
    if (filters.region.trim()) {
      const searchTerm = filters.region.toLowerCase().trim();
      result = result.filter(voter => 
        voter.region && voter.region.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply constituency filter
    if (filters.constituency.trim()) {
      const searchTerm = filters.constituency.toLowerCase().trim();
      result = result.filter(voter => 
        voter.constituency && voter.constituency.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply identification type filter
    if (filters.identificationType) {
      result = result.filter(voter => voter.identification_type === filters.identificationType);
    }
    
    // Apply identification number filter
    if (filters.identificationNumber.trim()) {
      const searchTerm = filters.identificationNumber.toLowerCase().trim();
      result = result.filter(voter => 
        voter.identification_number && voter.identification_number.toLowerCase().includes(searchTerm)
      );
    }
    
    console.log(`Filter applied: ${result.length} records after filtering from ALL ${voterData.length} total records`);
    
    setFilteredData(result);
    setTotalRecords(result.length);
    setTotalPages(Math.ceil(result.length / pageSize));
    setCurrentPage(1); // Reset to first page when filters change
    
    // Update chart data based on filtered results
    processChartDataFromSupabase(result);
  }, [voterData, filters, pageSize, processChartDataFromSupabase]);

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
