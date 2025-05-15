
import { supabase, fetchPaginated } from "@/integrations/supabase/client";
import { fetchAdmins } from "@/data/constituencies";
import { toast } from "@/components/ui/use-toast";

/**
 * Load voter data with error handling and multiple retry mechanisms
 */
export const loadVoterData = async () => {
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
      // Return the data
      return voters;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error loading voter data:", error);
    throw error;
  }
};

/**
 * Load admin data with enhanced error handling and retry
 */
export const loadAdmins = async () => {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      const admins = await fetchAdmins();
      console.log("Fetched admin data:", admins?.length || 0, "records");
      return admins || [];
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
  
  return [];
};

/**
 * Setup realtime subscriptions for live data updates
 */
export const setupRealtimeSubscriptions = (
  loadVoterData: () => Promise<void>,
  loadAdmins: () => Promise<void>
) => {
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
};
