
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
    'Coastal Road',
    'Kololi',
    'Latrikunda Sabiji',
    'Manjai Kunda',
    'Pipeline',
    'Serekunda',
    'Talinding Kunjang',
    'Bundung Six Junction'
  ],
  'West Coast': [
    'Brikama North',
    'Brikama South',
    'Busumbala',
    'Kombo Central',
    'Kombo East',
    'Kombo North',
    'Old Yundum'
  ],
  'North Bank': [
    'Essau',
    'Jokadu',
    'Lower Baddibu',
    'Upper Baddibu'
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
    'Lower Saloum'
  ],
  'Upper River': [
    'Basse',
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
    // Use raw SQL query to avoid RLS issues
    // This bypasses RLS policies by using service role and direct SQL query
    const { data, error } = await supabase.rpc('admin_login', { 
      admin_email: email, 
      admin_password: password 
    });
    
    if (error) {
      console.error("Login error:", error);
      return false;
    }
    
    // The function will return true if login is successful
    if (data) {
      // Store admin session info in localStorage
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
    const { data, error } = await supabase
      .from('admins')
      .select('*');
      
    if (error) {
      throw error;
    }
    
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
      throw error;
    }
    
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
    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', id);
      
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting admin:", error);
    return false;
  }
};

export const fetchVoterData = async () => {
  try {
    const { data, error } = await supabase
      .from('voters')
      .select('*');
      
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching voter data:", error);
    return [];
  }
};

export const submitVoterRegistration = async (formData: VoterFormData) => {
  try {
    // Format the Date object to a string for database storage
    const formattedData = {
      ...formData,
      date_of_birth: formData.dateOfBirth ? format(formData.dateOfBirth, 'yyyy-MM-dd') : null,
      agree_to_terms: formData.agreeToTerms
    };
    
    const { data, error } = await supabase
      .from('voters')
      .insert({
        full_name: formData.fullName,
        email: formData.email,
        date_of_birth: format(formData.dateOfBirth as Date, 'yyyy-MM-dd'),
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
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error submitting registration:", error);
    throw error;
  }
};
