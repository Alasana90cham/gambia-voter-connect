
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { toast } from "@/components/ui/use-toast";
import { UserRole } from "@/types/form";
import { FilterState } from './RegistrationTableProps';
import { processChartData } from './utils/chartDataUtils';
import { loadVoterData, loadAdmins, setupRealtimeSubscriptions } from './utils/dataLoadingUtils';
import { createDebouncedFilterFn } from './utils/filterUtils';
import { handleExcelExport as exportToExcel } from './utils/exportUtils';
import { useDataRefresh } from './hooks/useDataRefresh';
import { usePagination } from './hooks/usePagination';

export interface ChartData {
  name: string;
  value: number;
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
  // State for data
  const [voterData, setVoterData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [adminList, setAdminList] = useState<UserRole[]>([]);
  
  // State for chart data
  const [genderData, setGenderData] = useState<ChartData[]>([]);
  const [regionData, setRegionData] = useState<ChartData[]>([]);
  const [constituencyData, setConstituencyData] = useState<{[key: string]: ChartData[]}>({});
  
  // UI state
  const [selectedRegion, setSelectedRegion] = useState('Banjul');
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    fullName: '',
    organization: '',
    dateOfBirth: '',
    gender: '',
    region: '',
    constituency: '',
    identificationType: '',
    identificationNumber: ''
  });
  
  // Meta state
  const [updateCount, setUpdateCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  
  // Total records for pagination
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Helper function to update state after filtering
  const updateFilterResults = (result: any[]) => {
    console.log(`Updating filtered results: ${result.length} records after filtering`);
    setFilteredData(result);
    setTotalRecords(result.length);
    setCurrentPage(1); // Reset to first page when filters change
    setIsLoading(false);
    
    // Also update chart data based on filtered results
    const chartData = processChartData(result);
    setGenderData(chartData.genderData);
    setRegionData(chartData.regionData);
    setConstituencyData(chartData.constituencyData);
  };
  
  // Load voter data with error handling
  const fetchVoterData = async () => {
    setIsLoading(true);
    
    try {
      const voters = await loadVoterData();
      
      if (voters && voters.length > 0) {
        // Record fetch time for reference
        const fetchTime = new Date();
        setLastFetchTime(fetchTime);
        setUpdateCount(prev => prev + 1);
        
        // Set all data states
        setVoterData(voters);
        setFilteredData(voters);
        setTotalRecords(voters.length);
        
        // Process chart data with all records
        const chartData = processChartData(voters);
        setGenderData(chartData.genderData);
        setRegionData(chartData.regionData);
        setConstituencyData(chartData.constituencyData);
        
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
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load admins data
  const fetchAdminData = async () => {
    try {
      const admins = await loadAdmins();
      setAdminList(admins);
    } catch (error) {
      console.error("Error loading admin data:", error);
    }
  };
  
  // Get pagination-related hooks
  const { 
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages
  } = usePagination(totalRecords);
  
  // Get data refresh hooks
  const { handleDeleteSuccess } = useDataRefresh(fetchVoterData, fetchAdminData);

  // Create the debounced filter function
  const debouncedApplyFilters = useMemo(
    () => createDebouncedFilterFn(voterData, filters, updateFilterResults),
    [voterData, filters]
  );

  // Apply filters when filters or source data changes
  useEffect(() => {
    if (debouncedApplyFilters) {
      debouncedApplyFilters();
    }
    return () => {
      if (debouncedApplyFilters.cancel) {
        debouncedApplyFilters.cancel();
      }
    };
  }, [filters, voterData, debouncedApplyFilters]);

  // CSV export functionality wrapped in a useCallback
  const handleExcelExport = () => {
    setIsLoading(true);
    exportToExcel(filteredData);
    setIsLoading(false);
  };
  
  // Initial data loading
  useEffect(() => {
    console.log("Admin authenticated, loading data");
    
    const initializeData = async () => {
      try {
        // Load initial data in parallel
        await Promise.all([fetchVoterData(), fetchAdminData()]);
      } catch (error) {
        console.error("Error during initial data loading:", error);
      }
    };
    
    initializeData();
    
    // Set up realtime subscriptions with enhanced error handling
    const unsubscribe = setupRealtimeSubscriptions(
      fetchVoterData,
      fetchAdminData
    );
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Create the context value object
  const contextValue = useMemo(() => ({
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
  }), [
    voterData,
    filteredData,
    genderData,
    regionData,
    constituencyData,
    adminList,
    filters,
    isLoading,
    selectedRegion,
    currentPage,
    totalPages,
    totalRecords,
    pageSize,
    setPageSize,
    setCurrentPage,
    handleDeleteSuccess
  ]);

  return (
    <StatisticsContext.Provider value={contextValue}>
      {children}
    </StatisticsContext.Provider>
  );
};
