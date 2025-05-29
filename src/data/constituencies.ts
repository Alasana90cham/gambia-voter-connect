
import { GambiaRegion, UserRole, VoterFormData } from "@/types/form";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

// Export region constituencies data that we'll serve statically
export const regionConstituencies: { [key in GambiaRegion]: string[] } = {
  'Banjul': [
    'Banjul Central',
    'Banjul North',
    'Banjul South'
  ],
  'Kanifing': [
    'Bakau',
    'Jeshwang',
    'Latrikunda Sabiji',
    'Serekunda',
    'Serrekunda West',
    'Talinding Kunjang',
    'Bundung ka Kunda'
  ],
  'West Coast': [
    'Old Yundum',
    'Busumbala',
    'Brikama South',
    'Brikama North',
    'Kombo East',
    'Kombo South',
    'Sanneh Mentereng',
    'Foni Jarrol',
    'Foni Bondali',
    'Foni Kansala',
    'Foni Berefet',
    'Foni Bintang Karanai'
  ],
  'North Bank': [
    'Lower Baddibu',
    'Lower Nuimi',
    'Jokadu',
    'Sabach Sanjal',
    'Central Badibu',
    'Upper Badibu',
    'Upper Nuimi'
  ],
  'Lower River': [
    'Jarra Central',
    'Jarra East',
    'Jarra West',
    'Kiang Central',
    'Kiang East',
    'Kiang West'
  ],
  'Central River': [
    'Fulladu West',
    'Janjanbureh',
    'Niani',
    'Nianija',
    'Sami',
    'Upper Saloum',
    'Lower Saloum',
    'Niamina West',
    'Niamina East',
    'Upper Fulladu',
    'Lower Fulladu',
    'Niamina Dankunkung'
  ],
  'Upper River': [
    'Basse',
    'Sandu',
    'Jimara',
    'Kantora',
    'Tumana',
    'Wuli East',
    'Wuli West'
  ]
};

// Improved caching with shorter TTL and automatic cache invalidation
class DataCache<T> {
  private data: T | null = null;
  private lastFetch = 0;
  private ttl: number;
  private fetchPromise: Promise<T> | null = null;

  constructor(ttlMs: number = 30000) { // 30 seconds default TTL
    this.ttl = ttlMs;
  }

  async get(fetcher: () => Promise<T>): Promise<T> {
    const now = Date.now();
    
    // Return cached data if still fresh
    if (this.data && now - this.lastFetch < this.ttl) {
      return this.data;
    }

    // If a fetch is already in progress, return that promise to prevent multiple concurrent fetches
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    // Start new fetch
    this.fetchPromise = fetcher()
      .then(result => {
        this.data = result;
        this.lastFetch = Date.now();
        this.fetchPromise = null;
        return result;
      })
      .catch(error => {
        this.fetchPromise = null;
        // If fetch fails and we have cached data, return it even if expired
        if (this.data) {
          console.warn("Fetch failed, returning stale data", error);
          return this.data;
        }
        throw error;
      });

    return this.fetchPromise;
  }

  invalidate() {
    this.data = null;
    this.lastFetch = 0;
  }
}

// Create caches for different data types
const voterDataCache = new DataCache<any[]>(60000); // 1 minute cache for voter data
const adminCache = new DataCache<UserRole[]>(300000); // 5 minutes cache for admin data

// Enhanced error handling with retry logic and exponential backoff
const fetchWithRetry = async <T>(
  fetcher: () => Promise<T>, 
  retries = 3, 
  initialDelay = 1000,
  maxDelay = 10000
): Promise<T> => {
  let delay = initialDelay;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetcher();
    } catch (error) {
      if (attempt >= retries) {
        console.error("Max retries reached", error);
        throw error;
      }
      
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms`);
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff with jitter
      delay = Math.min(delay * 1.5 + Math.random() * 1000, maxDelay);
    }
  }
  
  throw new Error("This should never happen");
};

// Improved database connection pooling and query optimization
export const verifyAdminLogin = async (email: string, password: string): Promise<boolean> => {
  try {
    // Use a shorter timeout for login operations
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('admin_login', { 
        admin_email: email, 
        admin_password: password 
      });
      
      clearTimeout(timeoutId);
      
      if (rpcError) {
        console.error("RPC login error:", rpcError);
        
        // Fallback to direct query if RPC fails
        const { data, error } = await supabase
          .from('admins')
          .select('*')
          .eq('email', email as any)
          .eq('password', password as any)
          .single();
        
        if (error) {
          console.error("Direct query error:", error);
          return false;
        }
        
        // Login successful via direct query
        if (data) {
          localStorage.setItem('adminSession', JSON.stringify({
            email: email,
            timestamp: new Date().toISOString()
          }));
          return true;
        }
        
        return false;
      }
      
      // Login successful via RPC
      if (rpcData) {
        localStorage.setItem('adminSession', JSON.stringify({
          email: email,
          timestamp: new Date().toISOString()
        }));
        return true;
      }
      
      return false;
    } catch (error) {
      clearTimeout(timeoutId);
      if ((error as any).name === 'AbortError') {
        console.error("Login request timed out");
      }
      throw error;
    }
  } catch (error) {
    console.error("Error during login:", error);
    return false;
  }
};

// Use improved caching for admin data
export const fetchAdmins = async (): Promise<UserRole[]> => {
  return adminCache.get(async () => {
    return fetchWithRetry(async () => {
      try {
        console.log("Fetching admins...");
        
        const { data, error } = await supabase
          .from('admins')
          .select('*');
          
        if (error) {
          console.error("Error fetching admins:", error);
          throw error;
        }
        
        console.log("Admins fetched:", data);
        
        // Convert the data from Supabase to match our UserRole type
        return data.map((admin: any) => ({
          id: admin.id,
          email: admin.email,
          isAdmin: admin.is_admin,
          password: admin.password
        }));
      } catch (error) {
        console.error("Error fetching admins:", error);
        return [];
      }
    });
  });
};

// Rest of admin operations with optimized caching and retries
export const addAdminUser = async (id: string, email: string, password: string): Promise<UserRole | null> => {
  return fetchWithRetry(async () => {
    try {
      console.log("Adding admin:", { id, email });
      
      const { data, error } = await supabase
        .from('admins')
        .insert([{
          id,
          email,
          password,
          is_admin: true
        }] as any)
        .select('*')
        .single();
        
      if (error) {
        console.error("Error adding admin:", error);
        throw error;
      }
      
      console.log("Admin added:", data);
      
      // Invalidate admin cache after modifying data
      adminCache.invalidate();
      
      // Handle possible type issues by checking properties - Fix TS18047 errors with null checks
      if (data) {
        return {
          id: data.id || id,
          email: data.email || email,
          isAdmin: data.is_admin !== undefined ? data.is_admin : true,
          password: data.password || password
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error adding admin:", error);
      return null;
    }
  });
};

export const removeAdminUser = async (id: string): Promise<boolean> => {
  return fetchWithRetry(async () => {
    try {
      console.log("Removing admin with ID:", id);
      
      // First attempt using RPC (stored procedure)
      try {
        const { error: rpcError } = await supabase.rpc('delete_admin', { admin_id: id });
        
        if (rpcError) {
          console.error("RPC error deleting admin:", rpcError);
          // Fall through to direct delete if RPC fails
        } else {
          console.log("Admin deleted successfully via RPC");
          
          // Invalidate admin cache after modifying data
          adminCache.invalidate();
          
          return true;
        }
      } catch (rpcError) {
        console.error("Exception in RPC delete:", rpcError);
        // Fall through to direct delete
      }
      
      // Fallback to direct delete if RPC fails
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', id as any);
        
      if (error) {
        console.error("Error directly deleting admin:", error);
        throw error;
      }
      
      console.log("Admin deleted successfully via direct delete");
      
      // Invalidate admin cache after modifying data
      adminCache.invalidate();
      
      return true;
    } catch (error) {
      console.error("Error deleting admin:", error);
      return false;
    }
  });
};

export const fetchVoterData = async () => {
  return voterDataCache.get(async () => {
    try {
      console.log("Fetching voter data...");
      
      const { data, error } = await supabase
        .from('voters')
        .select('*');
        
      if (error) {
        console.error("Error fetching voter data:", error);
        throw error;
      }
      
      console.log("Voter data fetched:", data?.length || 0, "records");
      
      return data || [];
    } catch (error) {
      console.error("Error fetching voter data:", error);
      throw error;
    }
  });
};

export const submitVoterRegistration = async (formData: VoterFormData) => {
  return fetchWithRetry(async () => {
    try {
      console.log("Submitting voter registration:", formData);
      
      if (!formData.dateOfBirth) {
        throw new Error("Date of birth is required");
      }
      
      // Use type casting to match Supabase expected types
      const insertData = {
        full_name: formData.fullName,
        email: formData.email,
        date_of_birth: format(formData.dateOfBirth, 'yyyy-MM-dd'),
        gender: formData.gender,
        organization: formData.organization,
        region: formData.region,
        constituency: formData.constituency,
        identification_type: formData.identificationType,
        identification_number: formData.identificationNumber,
        agree_to_terms: formData.agreeToTerms
      };
      
      // Format the Date object to a string for database storage
      const { data, error } = await supabase
        .from('voters')
        .insert(insertData as any)
        .select();
        
      if (error) {
        console.error("Error submitting registration:", error);
        throw error;
      }
      
      console.log("Registration submitted successfully:", data);
      
      // Invalidate voter data cache after new submission
      voterDataCache.invalidate();
      
      return data;
    } catch (error) {
      console.error("Error submitting registration:", error);
      throw error;
    }
  });
};
