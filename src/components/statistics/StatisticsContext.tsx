import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { fetchAdmins, fetchVoterData } from '@/data/constituencies';
import { toast } from "@/components/ui/use-toast";
import { UserRole } from "@/types/form";
import { supabase, fetchPaginated } from "@/integrations/supabase/client";
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
  
  // Filters state with memoization
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
  
  // Chart data state with memoization
  const [genderData, setGenderData] = useState<ChartData[]>([]);
  const [regionData, setRegionData] = useState<ChartData[]>([]);
  const [constituencyData, setConstituencyData] = useState<{[key: string]: ChartData[]}>({});
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  
  // Last fetch timestamp and update count
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);

  // Process data for charts with optimization for large datasets
  const processChartData = useCallback((voters: any[]) => {
    if (!voters || voters.length === 0) return;
    
    console.log(`Processing chart data for ${voters.length} records`);
    
    // Use direct approach for better performance with large datasets
    const genderMap = new Map<string, number>();
    const regionMap = new Map<string, number>();
    const constituencyMap = new Map<string, Map<string, number>>();
    
    // Process all data directly for accurate chart representation
    voters.forEach(voter => {
      // Process gender data
      const gender = voter.gender || 'Unknown';
      genderMap.set(gender, (genderMap.get(gender) || 0) + 1);
      
      // Process region data
      const region = voter.region || 'Unknown';
      regionMap.set(region, (regionMap.get(region) || 0) + 1);
      
      // Process constituency data
      const constituency = voter.constituency || 'Unknown';
      
      if (!constituencyMap.has(region)) {
        constituencyMap.set(region, new Map<string, number>());
      }
      
      const regionConstituencies = constituencyMap.get(region)!;
      regionConstituencies.set(constituency, (regionConstituencies.get(constituency) || 0) + 1);
    });
    
    // Convert maps to required format
    const genderChartData: ChartData[] = Array.from(genderMap.entries()).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
    
    const regionChartData: ChartData[] = Array.from(regionMap.entries()).map(([name, value]) => ({
      name,
      value
    }));
    
    const constituencyChartData: {[key: string]: ChartData[]} = {};
    constituencyMap.forEach((constituencies, region) => {
      constituencyChartData[region] = Array.from(constituencies.entries()).map(([name, value]) => ({
        name,
        value
      }));
    });
    
    // Update chart data state
    setGenderData(genderChartData);
    setRegionData(regionChartData);
    setConstituencyData(constituencyChartData);
    
    console.log("Chart data processing completed successfully");
  }, []);

  // ULTRA-RELIABLE: Complete overhaul of voter data fetching with multiple fallback strategies
  const loadVoterData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      console.log("Starting ultra-reliable voter data fetch with NO LIMITS");
      
      // First attempt: Use enhanced fetchPaginated function with improved reliability
      let voters;
      let attemptCount = 0;
      const maxAttempts = 3;
      
      while (attemptCount < maxAttempts) {
        try {
          console.log(`Fetch attempt ${attemptCount + 1}/${maxAttempts}`);
          voters = await fetchPaginated('voters', {
            orderBy: 'created_at',
            ascending: false
          });
          
          if (voters && voters.length > 0) {
            break;
          }
          
          attemptCount++;
        } catch (error) {
          console.error(`Error on fetch attempt ${attemptCount + 1}:`, error);
          attemptCount++;
          
          if (attemptCount >= maxAttempts) {
            throw error;
          }
          
          // Add exponential backoff delay between attempts
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attemptCount - 1)));
        }
      }
      
      // FALLBACK MECHANISM: If fetchPaginated fails, use direct query as last resort
      if (!voters || voters.length === 0) {
        console.warn("Primary fetch method failed, trying direct query fallback");
        
        try {
          const { data: directData, error: directError } = await supabase
            .from('voters')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (directError) {
            console.error("Direct query fallback error:", directError);
          } else if (directData && directData.length > 0) {
            console.log(`Fallback method succeeded: retrieved ${directData.length} records`);
            voters = directData;
          }
        } catch (fallbackError) {
          console.error("Fallback query failed:", fallbackError);
        }
      }
      
      console.log(`Data fetch complete: ${voters?.length || 0} records retrieved`);
      
      if (voters && voters.length > 0) {
        // Record fetch time for reference
        const fetchTime = new Date();
        setLastFetchTime(fetchTime);
        setUpdateCount(prev => prev + 1);
        
        // Set all data states
        setVoterData(voters);
        setFilteredData(voters);
        setTotalRecords(voters.length);
        setTotalPages(Math.ceil(voters.length / pageSize));
        
        // Process chart data with all records
        processChartData(voters);
        
        toast({
          title: "Data Loaded Successfully",
          description: `Loaded ${voters.length} total records.`,
        });
      } else {
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
      console.error("Error loading voter data:", error);
      toast({
        title: "Data Loading Error",
        description: "Failed to load voter registration data. Please try again.",
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
  }, [pageSize, processChartData]);
  
  // Load admins with enhanced error handling and retry
  const loadAdmins = useCallback(async () => {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const admins = await fetchAdmins();
        console.log("Fetched admin data:", admins?.length || 0, "records");
        setAdminList(admins || []);
        break;
      } catch (error) {
        attempts++;
        console.error(`Error loading admins (attempt ${attempts}/${maxAttempts}):`, error);
        
        if (attempts >= maxAttempts) {
          toast({
            title: "Admin Data Error",
            description: "Failed to load admin information after multiple attempts",
            variant: "destructive",
          });
          break;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
      }
    }
  }, []);

  // Enhanced realtime subscription setup to detect new registrations
  const setupRealtimeSubscriptions = useCallback(() => {
    console.log("Setting up realtime subscriptions for unlimited data");
    
    // Create channel with improved error handling
    const votersChannel = supabase
      .channel('voters-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'voters'
      }, (payload) => {
        console.log(`Voter data change detected (${payload.eventType}), refreshing all data`);
        // Always reload all data to ensure charts reflect current state
        loadVoterData();
      })
      .subscribe((status) => {
        console.log(`Voters subscription status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to voter changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error with voter changes subscription');
          toast({
            title: "Sync Error",
            description: "Unable to subscribe to data changes. Changes may not update in real-time.",
            variant: "destructive",
          });
        }
      });
      
    // Create channel for admin changes
    const adminsChannel = supabase
      .channel('admin-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'admins'
      }, (payload) => {
        console.log(`Admin data change detected (${payload.eventType})`);
        loadAdmins();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(votersChannel);
      supabase.removeChannel(adminsChannel);
    };
  }, [loadVoterData, loadAdmins]);

  // Improved delete success handler with forced complete reload
  const handleDeleteSuccess = useCallback(async () => {
    console.log("Delete operation completed, performing full data refresh");
    setIsLoading(true);
    
    try {
      // Force full reload with delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadVoterData();
      await loadAdmins();
      
      toast({
        title: "Data Refreshed",
        description: "The latest data has been loaded from the database",
      });
    } catch (error) {
      console.error("Error refreshing data after deletion:", error);
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh data. Please reload the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadVoterData]);
  
  // ULTRA-RELIABLE CSV export functionality guaranteed to work with ANY data size
  const handleExcelExport = useCallback(() => {
    setIsLoading(true);
    toast({
      title: "Export Started",
      description: `Processing ${filteredData.length} records for export...`,
    });
    
    // Use setTimeout to avoid blocking UI during export
    setTimeout(() => {
      try {
        console.log(`Starting CSV export of ${filteredData.length} records`);
        
        // Generate the CSV content in memory-efficient chunks
        const csvContent = generateCsvContent(filteredData);
        
        // Download the file with current timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `NYPG_Voter_Statistics_${timestamp}.csv`;
        downloadCsv(csvContent, filename);
        
        toast({
          title: "Export Successful",
          description: `${filteredData.length} records have been exported to CSV format`,
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
    }, 100); // Small delay to allow toast to render first
  }, [filteredData]);
  
  // Initial data loading with better error handling
  useEffect(() => {
    console.log("Admin authenticated, loading data");
    
    const initializeData = async () => {
      try {
        // Force a refresh of database connection
        try {
          await supabase.auth.refreshSession();
        } catch (refreshError) {
          console.log("Session refresh not needed or failed:", refreshError);
        }
        
        // Load initial data in parallel
        await Promise.all([loadVoterData(), loadAdmins()]);
      } catch (error) {
        console.error("Error during initial data loading:", error);
      }
    };
    
    initializeData();
    
    // Set up realtime subscriptions with enhanced error handling
    const unsubscribe = setupRealtimeSubscriptions();
    
    return () => {
      unsubscribe();
    };
  }, [loadVoterData, loadAdmins, setupRealtimeSubscriptions]);

  // Debounced filter application with improved performance for large datasets
  const debouncedApplyFilters = useCallback(
    debounce(() => {
      if (!voterData.length) return;
      
      console.log("Applying filters to", voterData.length, "records");
      setIsLoading(true);
      
      // Process filtering in background
      setTimeout(() => {
        try {
          let result = voterData;
          
          // Apply each filter sequentially with early termination for performance
          if (filters.fullName) {
            const searchTerm = filters.fullName.toLowerCase();
            result = result.filter(voter => 
              voter.full_name && voter.full_name.toLowerCase().includes(searchTerm)
            );
            
            // Early termination if no results
            if (result.length === 0) {
              updateFilterResults(result);
              return;
            }
          }
          
          if (filters.organization) {
            const searchTerm = filters.organization.toLowerCase();
            result = result.filter(voter => 
              voter.organization && voter.organization.toLowerCase().includes(searchTerm)
            );
            
            if (result.length === 0) {
              updateFilterResults(result);
              return;
            }
          }
          
          if (filters.dateOfBirth) {
            result = result.filter(voter => 
              voter.date_of_birth && voter.date_of_birth.includes(filters.dateOfBirth)
            );
            
            if (result.length === 0) {
              updateFilterResults(result);
              return;
            }
          }
          
          if (filters.gender) {
            result = result.filter(voter => 
              voter.gender === filters.gender
            );
            
            if (result.length === 0) {
              updateFilterResults(result);
              return;
            }
          }
          
          if (filters.region) {
            const searchTerm = filters.region.toLowerCase();
            result = result.filter(voter => 
              voter.region && voter.region.toLowerCase().includes(searchTerm)
            );
            
            if (result.length === 0) {
              updateFilterResults(result);
              return;
            }
          }
          
          if (filters.constituency) {
            const searchTerm = filters.constituency.toLowerCase();
            result = result.filter(voter => 
              voter.constituency && voter.constituency.toLowerCase().includes(searchTerm)
            );
            
            if (result.length === 0) {
              updateFilterResults(result);
              return;
            }
          }
          
          if (filters.identificationType) {
            result = result.filter(voter => 
              voter.identification_type && voter.identification_type.includes(filters.identificationType)
            );
            
            if (result.length === 0) {
              updateFilterResults(result);
              return;
            }
          }
          
          if (filters.identificationNumber) {
            result = result.filter(voter => 
              voter.identification_number && voter.identification_number.includes(filters.identificationNumber)
            );
          }
          
          updateFilterResults(result);
          
        } catch (error) {
          console.error("Error applying filters:", error);
          toast({
            title: "Filter Error",
            description: "An error occurred while filtering the data",
            variant: "destructive",
          });
          setIsLoading(false);
        }
      }, 0);
    }, 300),
    [voterData, pageSize]
  );
  
  // Helper function to update state after filtering with improved logging
  const updateFilterResults = useCallback((result: any[]) => {
    console.log(`Updating filtered results: ${result.length} records after filtering`);
    setFilteredData(result);
    setTotalRecords(result.length);
    setTotalPages(Math.ceil(result.length / pageSize));
    setCurrentPage(1); // Reset to first page when filters change
    setIsLoading(false);
    
    // Also update chart data based on filtered results
    processChartData(result);
    
  }, [pageSize, processChartData]);

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
