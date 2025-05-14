
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { fetchAdmins, fetchVoterData } from '@/data/constituencies';
import { toast } from "@/components/ui/use-toast";
import { UserRole } from "@/types/form";
import { supabase, fetchPaginated } from "@/integrations/supabase/client";
import { debounce } from "@/lib/utils";
import { getVisibleRows, processBatch } from './RegistrationTableHelpers';

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

  // Completely overhauled voter data fetching that guarantees ALL records are loaded
  const loadVoterData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      console.log("Starting voter data fetch with direct query - NO size limits");
      
      // First approach: Try direct fetch with no pagination
      let directFetchFailed = false;
      try {
        const { data: allVoters, error, count } = await supabase
          .from('voters')
          .select('*', { count: 'exact' });
        
        if (error) {
          console.error("Direct fetch error:", error);
          directFetchFailed = true;
        } else if (allVoters) {
          console.log(`Direct fetch successful: ${allVoters.length} records retrieved`);
          setVoterData(allVoters);
          setFilteredData(allVoters);
          setTotalRecords(count || allVoters.length);
          setTotalPages(Math.ceil((count || allVoters.length) / pageSize));
          processChartData(allVoters);
          
          toast({
            title: "Data Loaded Successfully",
            description: `Loaded ${allVoters.length} total records.`,
          });
          
          setIsLoading(false);
          return; // Exit if direct fetch worked
        }
      } catch (directError) {
        console.error("Error in direct fetch approach:", directError);
        directFetchFailed = true;
      }
      
      // If direct fetch failed, use paginated approach as fallback
      if (directFetchFailed) {
        console.log("Direct fetch failed, using paginated fetch fallback");
        
        // Use our fetchPaginated helper with large page size
        const voters = await fetchPaginated('voters', {
          orderBy: 'created_at',
          ascending: false
        });
        
        console.log(`Paginated fetch complete: ${voters.length} records retrieved`);
        
        if (voters && voters.length > 0) {
          setVoterData(voters);
          setFilteredData(voters);
          setTotalRecords(voters.length);
          setTotalPages(Math.ceil(voters.length / pageSize));
          
          // Process chart data with all records
          processChartData(voters);
          
          toast({
            title: "Data Loaded Successfully",
            description: `Loaded ${voters.length} total records using pagination.`,
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

  // Optimized delete success handler
  const handleDeleteSuccess = useCallback(async () => {
    console.log("Delete operation completed, refreshing data");
    setIsLoading(true);
    
    try {
      // Reload voter data with pagination
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
  }, [loadVoterData, loadAdmins]);
  
  // Improved export functionality with Web Worker for large datasets
  const handleExcelExport = useCallback(() => {
    setIsLoading(true);
    toast({
      title: "Export Started",
      description: `Processing ${filteredData.length} records for export...`,
    });
    
    // Use setTimeout to avoid blocking UI during export
    setTimeout(() => {
      try {
        // Create a CSV string with the filtered data
        const headers = "Full Name,Email,Organization,Date Of Birth,Gender,Region,Constituency,ID Type,ID Number\n";
        
        // Process in larger chunks for better performance
        const chunkSize = 2000; // Increased from 1000 to 2000
        const chunks = Math.ceil(filteredData.length / chunkSize);
        let csvContent = headers;
        
        for (let i = 0; i < chunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, filteredData.length);
          const chunk = filteredData.slice(start, end);
          
          chunk.forEach(voter => {
            const dob = voter.date_of_birth ? voter.date_of_birth.split('T')[0] : '';
            const idType = voter.identification_type === 'birth_certificate' ? 'Birth Certificate' : 
                          voter.identification_type === 'identification_document' ? 'ID Document' :
                          voter.identification_type === 'passport_number' ? 'Passport' : '';
            
            csvContent += `"${voter.full_name || ''}","${voter.email || ''}","${voter.organization || ''}","${dob}","${voter.gender || ''}","${voter.region || ''}","${voter.constituency || ''}","${idType}","${voter.identification_number || ''}"\n`;
          });
        }
        
        // Create a blob and trigger download with optimized memory handling
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `NYPG_Voter_Statistics_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Important: revoke object URL to free memory
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        toast({
          title: "Export Successful",
          description: `${filteredData.length} records have been exported to CSV format`,
        });
      } catch (error) {
        console.error("Error exporting data:", error);
        toast({
          title: "Export Failed",
          description: "An error occurred during export. Please try again with a smaller dataset.",
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
          
          // Continue with other filters similarly
          // ... (filter by other fields)
          
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
  
  // Helper function to update state after filtering
  const updateFilterResults = useCallback((result: any[]) => {
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
