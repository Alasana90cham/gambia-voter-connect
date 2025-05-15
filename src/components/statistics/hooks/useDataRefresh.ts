
import { useCallback } from 'react';
import { toast } from "@/components/ui/use-toast";

/**
 * Custom hook for handling data refresh actions
 */
export const useDataRefresh = (
  fetchVoterData: () => Promise<void>,
  fetchAdminData: () => Promise<void>
) => {
  const handleDeleteSuccess = useCallback(async () => {
    console.log("Delete operation completed, performing full data refresh");
    
    try {
      // Force full reload with delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchVoterData();
      await fetchAdminData();
      
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
    }
  }, [fetchVoterData, fetchAdminData]);
  
  return { handleDeleteSuccess };
};
