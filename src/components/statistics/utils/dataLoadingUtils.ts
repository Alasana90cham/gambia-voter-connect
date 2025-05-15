
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/form";
import { toast } from "@/components/ui/use-toast";

/**
 * Loads voter data from Supabase with pagination to handle large datasets
 * @returns Promise that resolves to an array of voter records
 */
export const loadVoterData = async () => {
  try {
    console.log("Loading voter data");
    
    // We'll use a higher limit per page to get more records, with pagination
    const allRecords = [];
    const pageSize = 10000; // Increased from default
    let currentPage = 0;
    let hasMoreData = true;
    
    while (hasMoreData) {
      const from = currentPage * pageSize;
      const to = from + pageSize - 1;
      
      console.log(`Loading voter data page ${currentPage + 1}, range ${from}-${to}`);
      
      const { data, error } = await supabase
        .from('voters')
        .select('*')
        .range(from, to)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error loading voter data:", error);
        throw error;
      }
      
      if (data && data.length > 0) {
        // Add numbering to the records before adding them to the result
        const numberedData = data.map((record, idx) => ({
          ...record,
          rowNumber: from + idx + 1 // Add 1-based row numbering
        }));
        
        allRecords.push(...numberedData);
        currentPage++;
        
        // If we got less than pageSize records, we've reached the end
        if (data.length < pageSize) {
          hasMoreData = false;
        }
      } else {
        hasMoreData = false;
      }
    }
    
    console.log(`Total voter records loaded: ${allRecords.length}`);
    return allRecords;
    
  } catch (error) {
    console.error("Failed to load voter data:", error);
    toast({
      title: "Data Loading Error",
      description: "Could not load voter registration data. Please try again.",
      variant: "destructive",
    });
    throw error;
  }
};

/**
 * Loads admin data from Supabase
 * @returns Promise that resolves to an array of admin records
 */
export const loadAdmins = async (): Promise<UserRole[]> => {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*');
    
    if (error) {
      console.error("Error loading admin data:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Failed to load admin data:", error);
    return [];
  }
};

/**
 * Sets up realtime subscriptions to update data automatically when it changes
 * @param onVoterUpdate Function to call when voter data changes
 * @param onAdminUpdate Function to call when admin data changes
 * @returns Function to unsubscribe from realtime updates
 */
export const setupRealtimeSubscriptions = (
  onVoterUpdate: () => void,
  onAdminUpdate: () => void
) => {
  try {
    // Subscribe to voter table changes
    const voterSubscription = supabase
      .channel('voters_channel')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'voters',
        }, 
        () => {
          console.log("Realtime update detected for voters");
          onVoterUpdate();
        }
      )
      .subscribe();
    
    // Subscribe to admin table changes
    const adminSubscription = supabase
      .channel('admins_channel')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'admins',
        }, 
        () => {
          console.log("Realtime update detected for admins");
          onAdminUpdate();
        }
      )
      .subscribe();
    
    // Return unsubscribe function
    return () => {
      console.log("Unsubscribing from realtime channels");
      supabase.removeChannel(voterSubscription);
      supabase.removeChannel(adminSubscription);
    };
  } catch (error) {
    console.error("Error setting up realtime subscriptions:", error);
    return () => {};
  }
};
