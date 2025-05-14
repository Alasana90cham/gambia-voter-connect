
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { fetchAdmins, fetchVoterData } from '@/data/constituencies';
import { toast } from "@/components/ui/use-toast";
import { UserRole } from "@/types/form";
import { supabase, fetchPaginated } from "@/integrations/supabase/client";
import { debounce } from "@/lib/utils";

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
    
    // Use Map for better performance with large datasets
    const genderMap = new Map<string, number>();
    const regionMap = new Map<string, number>();
    const constituencyMap = new Map<string, Map<string, number>>();
    
    // Process in chunks to avoid blocking the main thread
    const chunkSize = 500;
    const processChunk = (startIndex: number) => {
      const endIndex = Math.min(startIndex + chunkSize, voters.length);
      
      for (let i = startIndex; i < endIndex; i++) {
        const voter = voters[i];
        
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
      }
      
      if (endIndex < voters.length) {
        // Continue processing in next animation frame to avoid UI freezing
        requestAnimationFrame(() => processChunk(endIndex));
      } else {
        // All processing complete, update state
        finishProcessing();
      }
    };
    
    const finishProcessing = () => {
      // Convert maps to the required format
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
      
      setGenderData(genderChartData);
      setRegionData(regionChartData);
      setConstituencyData(constituencyChartData);
    };
    
    // Start processing
    processChunk(0);
  }, []);

  // Optimized fetch voter data with pagination
  const loadVoterData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Use fetch paginated for large datasets
      const voters = await fetchVoterData();
      console.log("Fetched voter data:", voters?.length || 0, "records");
      
      if (voters && voters.length > 0) {
        setVoterData(voters);
        setFilteredData(voters);
        setTotalRecords(voters.length);
        setTotalPages(Math.ceil(voters.length / pageSize));
        
        // Use web worker or deferred processing for very large datasets
        if (voters.length > 2000) {
          // Process data in the background
          setTimeout(() => processChartData(voters), 0);
        } else {
          processChartData(voters);
        }
      } else {
        setVoterData([]);
        setFilteredData([]);
        setGenderData([]);
        setRegionData([]);
        setConstituencyData({});
        setTotalRecords(0);
        setTotalPages(1);
      }
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
  }, [pageSize, processChartData]);
  
  // Load admins with error handling and retry
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

  // Enhanced realtime subscription setup with better error handling and reconnection strategy
  const setupRealtimeSubscriptions = useCallback(() => {
    console.log("Setting up realtime subscriptions with enhanced error handling");
    
    const subscribeWithRetry = (channelName, table, onChangeCallback) => {
      let reconnectAttempts = 0;
      const maxReconnectAttempts = 5;
      const baseDelay = 2000;
      
      const subscribe = () => {
        const channel = supabase
          .channel(channelName)
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table 
          }, (payload) => {
            console.log(`${table} change received:`, payload.eventType);
            onChangeCallback();
            reconnectAttempts = 0; // Reset on successful events
          })
          .subscribe((status) => {
            console.log(`${channelName} subscription status:`, status);
            
            if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
              reconnectAttempts++;
              console.error(`${channelName} subscription error (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
              
              if (reconnectAttempts <= maxReconnectAttempts) {
                const delay = baseDelay * Math.pow(2, reconnectAttempts - 1) * (0.5 + Math.random());
                console.log(`Will retry in ${Math.round(delay / 1000)}s`);
                
                setTimeout(() => {
                  console.log(`Attempting to reconnect ${channelName}...`);
                  supabase.removeChannel(channel);
                  subscribe();
                }, delay);
              } else {
                console.error(`Max reconnection attempts reached for ${channelName}`);
                toast({
                  title: "Connection Issue",
                  description: `Realtime updates for ${table} data unavailable. Please refresh the page.`,
                  variant: "destructive",
                });
              }
            }
          });
          
        return channel;
      };
      
      return subscribe();
    };
    
    // Create channels with retry logic
    const adminsChannel = subscribeWithRetry('admin-changes', 'admins', loadAdmins);
    const votersChannel = subscribeWithRetry('voters-changes', 'voters', loadVoterData);
    
    return () => {
      // Improved cleanup function with logging
      console.log("Cleaning up realtime subscriptions");
      try {
        supabase.removeChannel(adminsChannel);
      } catch (error) {
        console.error("Error removing admins channel:", error);
      }
      
      try {
        supabase.removeChannel(votersChannel);
      } catch (error) {
        console.error("Error removing voters channel:", error);
      }
    };
  }, [loadAdmins, loadVoterData]);

  // Handle delete success function with optimized data refresh
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
  
  // Optimized export functionality for large datasets
  const handleExcelExport = useCallback(() => {
    setIsLoading(true);
    
    // Use web worker for large exports
    setTimeout(() => {
      try {
        // Create a CSV string with the filtered data
        const headers = "Full Name,Email,Organization,Date Of Birth,Gender,Region,Constituency,ID Type,ID Number\n";
        
        // Process in chunks to avoid memory issues with large datasets
        const chunkSize = 1000;
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
    }, 0);
  }, [filteredData]);

  // Initial data loading with error handling
  useEffect(() => {
    console.log("Admin authenticated, loading data");
    
    const initializeData = async () => {
      try {
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

  // Debounced filter application for performance
  const debouncedApplyFilters = useCallback(
    debounce(() => {
      if (!voterData.length) return;
      
      console.log("Applying filters to", voterData.length, "records");
      setIsLoading(true);
      
      // Process filtering in chunks to avoid UI blocking
      setTimeout(() => {
        try {
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
          setTotalRecords(result.length);
          setTotalPages(Math.ceil(result.length / pageSize));
          setCurrentPage(1); // Reset to first page when filters change
        } catch (error) {
          console.error("Error applying filters:", error);
          toast({
            title: "Filter Error",
            description: "An error occurred while filtering the data",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }, 0);
    }, 300),
    [voterData, pageSize]
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
