
import { GambiaRegion, UserRole, VoterFormData } from "@/types/form";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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
    'Old Yundum', // Added missing comma here
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
    'Lower Fulladu'  // Removed trailing comma
  ],
  'Upper River': [
    'Basse',
    'Sandu', // Added missing comma here
    'Jimara',
    'Kantora',
    'Tumana',
    'Wuli East',
    'Wuli West'
  ]
};

// Supabase functions for admin authentication and data fetching
export const verifyAdminLogin = async (email: string, password: string): Promise<boolean> => {
  try {
    console.log("Calling admin_login function with email:", email);
    
    // First try to use the RPC function
    const { data: rpcData, error: rpcError } = await supabase.rpc('admin_login', { 
      admin_email: email, 
      admin_password: password 
    });
    
    if (rpcError) {
      console.error("RPC login error:", rpcError);
      
      // Fallback to direct query if RPC fails
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
    console.error("Error during login:", error);
    return false;
  }
};

export const fetchAdmins = async (): Promise<UserRole[]> => {
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
      password: admin.password // Note: In production, passwords should not be sent to client
    }));
  } catch (error) {
    console.error("Error fetching admins:", error);
    return [];
  }
};

export const addAdminUser = async (id: string, email: string, password: string): Promise<UserRole | null> => {
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
    
    return {
      id: data.id,
      email: data.email,
      isAdmin: data.is_admin,
      password: data.password
    };
  } catch (error) {
    console.error("Error adding admin:", error);
    return null;
  }
};

export const removeAdminUser = async (id: string): Promise<boolean> => {
  try {
    console.log("Removing admin with ID:", id);
    
    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error("Error deleting admin:", error);
      throw error;
    }
    
    console.log("Admin deleted successfully");
    
    return true;
  } catch (error) {
    console.error("Error deleting admin:", error);
    return false;
  }
};

export const fetchVoterData = async () => {
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
    return [];
  }
};

export const submitVoterRegistration = async (formData: VoterFormData) => {
  try {
    console.log("Submitting voter registration:", formData);
    
    if (!formData.dateOfBirth) {
      throw new Error("Date of birth is required");
    }
    
    // Format the Date object to a string for database storage
    const { data, error } = await supabase
      .from('voters')
      .insert({
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
      })
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
};
