
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

  // OPTIMIZED: Ultimate data fetching function with multiple fallback strategies
  const loadCompleteVoterDatabase = useCallback(async () => {
    setIsLoading(true);
    console.log("=== STARTING OPTIMIZED COMPLETE DATABASE FETCH ===");
    
    try {
      let allVoters: any[] = [];
      let actualTotalCount = 0;
      
      // Strategy 1: Get exact count first using the most reliable method
      console.log("Step 1: Getting exact database count...");
      try {
        const { count: exactCount, error: countError } = await supabase
          .from('voters')
          .select('id', { count: 'exact', head: true });

        if (countError) {
          console.warn("Count query failed:", countError);
        } else {
          actualTotalCount = exactCount || 0;
          console.log(`✅ Database contains exactly ${actualTotalCount} voter records`);
        }
      } catch (countErr) {
        console.warn("Count strategy failed, will determine count during fetch");
      }

      // Strategy 2: Ultra-aggressive batched fetching with multiple retry mechanisms
      const ULTRA_BATCH_SIZE = 2000; // Larger batches for efficiency
      const MAX_RETRIES_PER_BATCH = 5;
      let currentOffset = 0;
      let hasMoreData = true;
      let consecutiveEmptyBatches = 0;
      const MAX_EMPTY_BATCHES = 3;

      console.log("Step 2: Starting ultra-aggressive batch fetching...");

      while (hasMoreData && consecutiveEmptyBatches < MAX_EMPTY_BATCHES) {
        let batchSuccess = false;
        let retryCount = 0;
        let batchData: any[] = [];

        // Retry mechanism for each batch
        while (!batchSuccess && retryCount < MAX_RETRIES_PER_BATCH) {
          try {
            console.log(`Fetching batch: offset ${currentOffset}, size ${ULTRA_BATCH_SIZE} (attempt ${retryCount + 1}/${MAX_RETRIES_PER_BATCH})`);
            
            const { data, error } = await supabase
              .from('voters')
              .select('*')
              .range(currentOffset, currentOffset + ULTRA_BATCH_SIZE - 1)
              .order('created_at', { ascending: false });

            if (error) {
              throw error;
            }

            batchData = data || [];
            batchSuccess = true;
            console.log(`✅ Batch successful: received ${batchData.length} records`);
            
          } catch (batchError) {
            retryCount++;
            console.warn(`❌ Batch failed (attempt ${retryCount}):`, batchError);
            
            if (retryCount < MAX_RETRIES_PER_BATCH) {
              // Exponential backoff with jitter
              const delay = Math.min(1000 * Math.pow(2, retryCount) + Math.random() * 500, 10000);
              console.log(`Retrying batch in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }

        if (!batchSuccess) {
          console.error(`❌ Failed to fetch batch after ${MAX_RETRIES_PER_BATCH} attempts. Offset: ${currentOffset}`);
          
          // Try smaller batch size as final fallback
          if (ULTRA_BATCH_SIZE > 100) {
            console.log("Attempting smaller batch size fallback...");
            try {
              const { data: fallbackData, error: fallbackError } = await supabase
                .from('voters')
                .select('*')
                .range(currentOffset, currentOffset + 99)
                .order('created_at', { ascending: false });

              if (!fallbackError && fallbackData) {
                batchData = fallbackData;
                console.log(`✅ Fallback successful: ${batchData.length} records`);
              }
            } catch (fallbackErr) {
              console.error("Even fallback failed:", fallbackErr);
            }
          }
        }

        // Process the batch data
        if (batchData && batchData.length > 0) {
          allVoters = [...allVoters, ...batchData];
          consecutiveEmptyBatches = 0;
          console.log(`📊 Total collected so far: ${allVoters.length} records`);
          
          // Continue if we got a full batch
          hasMoreData = batchData.length >= ULTRA_BATCH_SIZE;
          currentOffset += batchData.length;
        } else {
          consecutiveEmptyBatches++;
          console.log(`Empty batch detected (${consecutiveEmptyBatches}/${MAX_EMPTY_BATCHES})`);
          
          if (consecutiveEmptyBatches < MAX_EMPTY_BATCHES) {
            // Try skipping ahead in case of gaps
            currentOffset += ULTRA_BATCH_SIZE;
          }
        }

        // Safety check to prevent infinite loops
        if (currentOffset > 1000000) { // Reasonable upper limit
          console.warn("Safety limit reached, stopping fetch");
          break;
        }
      }

      // Strategy 3: Final verification and gap detection
      console.log("Step 3: Final verification...");
      
      if (actualTotalCount > 0 && allVoters.length !== actualTotalCount) {
        const missingCount = actualTotalCount - allVoters.length;
        console.warn(`⚠️ DATA MISMATCH: Expected ${actualTotalCount}, got ${allVoters.length}. Missing: ${missingCount} records`);
        
        // Attempt to find missing records using a different approach
        if (missingCount > 0 && missingCount < 1000) {
          console.log("Attempting to find missing records...");
          try {
            // Get all IDs first, then fetch missing ones
            const { data: allIds } = await supabase
              .from('voters')
              .select('id')
              .order('created_at', { ascending: false });

            if (allIds) {
              const fetchedIds = new Set(allVoters.map(v => v.id));
              const missingIds = allIds.filter(v => !fetchedIds.has(v.id)).map(v => v.id);
              
              if (missingIds.length > 0) {
                console.log(`Found ${missingIds.length} missing IDs, fetching them...`);
                
                for (let i = 0; i < missingIds.length; i += 100) {
                  const idBatch = missingIds.slice(i, i + 100);
                  const { data: missingRecords } = await supabase
                    .from('voters')
                    .select('*')
                    .in('id', idBatch);
                  
                  if (missingRecords) {
                    allVoters = [...allVoters, ...missingRecords];
                    console.log(`✅ Recovered ${missingRecords.length} missing records`);
                  }
                }
              }
            }
          } catch (recoveryError) {
            console.warn("Recovery attempt failed:", recoveryError);
          }
        }
      }

      // Remove duplicates based on ID
      const uniqueVoters = allVoters.reduce((acc, voter) => {
        if (!acc.find(v => v.id === voter.id)) {
          acc.push(voter);
        }
        return acc;
      }, []);

      const finalCount = uniqueVoters.length;
      console.log(`🎯 FINAL RESULT: Successfully fetched ${finalCount} unique voter records`);
      
      if (actualTotalCount > 0) {
        const accuracy = ((finalCount / actualTotalCount) * 100).toFixed(2);
        console.log(`📈 Data accuracy: ${accuracy}% (${finalCount}/${actualTotalCount})`);
      }

      if (finalCount > 0) {
        // Set all data states
        setVoterData(uniqueVoters);
        setFilteredData(uniqueVoters);
        setTotalRecords(finalCount);
        setTotalPages(Math.ceil(finalCount / pageSize));
        
        // Process chart data with all records
        processChartDataFromSupabase(uniqueVoters);
        
        toast({
          title: "✅ Complete Database Loaded",
          description: `Successfully loaded all ${finalCount} voter records from database.`,
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
          title: "No Registration Data",
          description: "No voter registration records were found in the database.",
        });
      }
      
    } catch (error) {
      console.error("❌ CRITICAL ERROR in complete database fetch:", error);
      toast({
        title: "Database Error",
        description: "Failed to load complete voter database. Please try again.",
        variant: "destructive",
      });
      
      // Reset to empty state on error
      setVoterData([]);
      setFilteredData([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
      console.log("=== OPTIMIZED DATABASE FETCH COMPLETE ===");
    }
  }, [pageSize]);

  // Process chart data directly from Supabase data
  const processChartDataFromSupabase = useCallback((voters: any[]) => {
    console.log(`Processing chart data from ${voters.length} Supabase records`);
    
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
    
    console.log("Chart data processing completed", {
      genders: genderChartData.length,
      regions: regionChartData.length,
      constituencies: Object.keys(constituencyChartData).length,
      totalVoters: voters.length
    });
  }, []);
  
  // Load admins from Supabase
  const loadAdminsFromSupabase = useCallback(async () => {
    try {
      console.log("Fetching admins from Supabase");
      const { data: admins, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching admins:", error);
        throw error;
      }

      console.log(`Fetched ${admins?.length || 0} admins from Supabase`);
      
      // Convert to expected format
      const adminList: UserRole[] = (admins || []).map(admin => ({
        id: admin.id,
        email: admin.email,
        isAdmin: admin.is_admin,
        password: admin.password
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
    console.log("Setting up realtime subscriptions for complete database monitoring");
    
    // Voters table subscription
    const votersChannel = supabase
      .channel('voters-realtime-complete')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'voters'
      }, (payload) => {
        console.log(`Real-time voters change: ${payload.eventType}`);
        // Reload complete database when any change occurs
        loadCompleteVoterDatabase();
      })
      .subscribe((status) => {
        console.log(`Complete voters subscription status: ${status}`);
      });
      
    // Admins table subscription
    const adminsChannel = supabase
      .channel('admins-realtime-complete')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'admins'
      }, (payload) => {
        console.log(`Real-time admins change: ${payload.eventType}`);
        loadAdminsFromSupabase();
      })
      .subscribe((status) => {
        console.log(`Complete admins subscription status: ${status}`);
      });
    
    return () => {
      supabase.removeChannel(votersChannel);
      supabase.removeChannel(adminsChannel);
    };
  }, [loadCompleteVoterDatabase, loadAdminsFromSupabase]);

  // Delete success handler
  const handleDeleteSuccess = useCallback(async () => {
    console.log("Delete operation completed, refreshing complete database");
    await loadCompleteVoterDatabase();
    await loadAdminsFromSupabase();
  }, [loadCompleteVoterDatabase, loadAdminsFromSupabase]);
  
  // CSV export functionality
  const handleExcelExport = useCallback(() => {
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
        const filename = `NYPG_Complete_Voter_Statistics_${timestamp}.csv`;
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
  
  // Initial data loading
  useEffect(() => {
    console.log("Initializing OPTIMIZED complete database load from Supabase");
    
    const initializeCompleteData = async () => {
      await Promise.all([
        loadCompleteVoterDatabase(),
        loadAdminsFromSupabase()
      ]);
    };
    
    initializeCompleteData();
    
    // Set up realtime subscriptions
    const unsubscribe = setupRealtimeSubscriptions();
    
    return () => {
      unsubscribe();
    };
  }, [loadCompleteVoterDatabase, loadAdminsFromSupabase, setupRealtimeSubscriptions]);

  // Enhanced filter application
  const applyFilters = useCallback(() => {
    if (!voterData.length) {
      setFilteredData([]);
      return;
    }
    
    console.log(`Applying filters to ${voterData.length} complete records`);
    
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
    
    console.log(`Filter applied: ${result.length} records after filtering from ${voterData.length} total`);
    
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
