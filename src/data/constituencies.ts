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

// Improved caching with shorter TTL
class DataCache<T> {
  private data: T | null = null;
  private lastFetch = 0;
  private ttl: number;
  private fetchPromise: Promise<T> | null = null;

  constructor(ttlMs: number = 30000) {
    this.ttl = ttlMs;
  }

  async get(fetcher: () => Promise<T>): Promise<T> {
    const now = Date.now();
    
    if (this.data && now - this.lastFetch < this.ttl) {
      return this.data;
    }

    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    this.fetchPromise = fetcher()
      .then(result => {
        this.data = result;
        this.lastFetch = Date.now();
        this.fetchPromise = null;
        return result;
      })
      .catch(error => {
        this.fetchPromise = null;
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

const adminCache = new DataCache<UserRole[]>(300000);

// Enhanced error handling with retry logic
const fetchWithRetry = async <T>(
  fetcher: () => Promise<T>, 
  retries = 2, 
  initialDelay = 1000
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
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * 1.5, 10000);
    }
  }
  
  throw new Error("This should never happen");
};

// Improved admin login with proper error handling
export const verifyAdminLogin = async (email: string, password: string): Promise<boolean> => {
  try {
    console.log("Attempting admin login...");
    
    // Try RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc('admin_login', { 
      admin_email: email, 
      admin_password: password 
    });
    
    if (rpcError) {
      console.error("RPC login error:", rpcError);
      
      // Fallback to direct query
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();
      
      if (error) {
        console.error("Direct query error:", error);
        return false;
      }
      
      if (data) {
        localStorage.setItem('adminSession', JSON.stringify({
          email: email,
          timestamp: new Date().toISOString(),
          expires: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
        }));
        return true;
      }
      
      return false;
    }
    
    // Login successful via RPC
    if (rpcData) {
      localStorage.setItem('adminSession', JSON.stringify({
        email: email,
        timestamp: new Date().toISOString(),
        expires: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
      }));
      return true;
    }
    
    return false;
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
        
        console.log("Admins fetched:", data?.length || 0);
        
        return (data || []).map((admin: any) => ({
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
        }])
        .select('*')
        .single();
        
      if (error) {
        console.error("Error adding admin:", error);
        throw error;
      }
      
      console.log("Admin added:", data);
      adminCache.invalidate();
      
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
      
      // Try RPC first
      try {
        const { error: rpcError } = await supabase.rpc('delete_admin', { admin_id: id });
        
        if (rpcError) {
          console.error("RPC error deleting admin:", rpcError);
        } else {
          console.log("Admin deleted successfully via RPC");
          adminCache.invalidate();
          return true;
        }
      } catch (rpcError) {
        console.error("Exception in RPC delete:", rpcError);
      }
      
      // Fallback to direct delete
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Error directly deleting admin:", error);
        throw error;
      }
      
      console.log("Admin deleted successfully via direct delete");
      adminCache.invalidate();
      return true;
    } catch (error) {
      console.error("Error deleting admin:", error);
      return false;
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
      
      const { data, error } = await supabase
        .from('voters')
        .insert(insertData)
        .select();
        
      if (error) {
        console.error("Error submitting registration:", error);
        throw error;
      }
      
      console.log("Registration submitted successfully:", data);
      return data;
    } catch (error) {
      console.error("Error submitting registration:", error);
      throw error;
    }
  });
};
