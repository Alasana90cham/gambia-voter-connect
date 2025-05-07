
import { RegionConstituencies, UserRole } from "../types/form";
import { supabase } from "../integrations/supabase/client";

export const regionConstituencies: RegionConstituencies = {
  "Banjul": [
    "Banjul South",
    "Banjul Central", 
    "Banjul North"
  ],
  "Kanifing": [
    "Bakau",
    "Jeshwang",
    "Serekunda West",
    "Bundungka Kunda",
    "Latrikunda Sabijie",
    "Talinding Kunjang"
  ],
  "West Coast": [
    "Foni Jarrol",
    "Foni Brefet",
    "Foni Bintang",
    "Foni Bondali",
    "Foni Kansala",
    "Kombo East",
    "Kombo South",
    "Brikama North",
    "Brikama South",
    "Sanneh Mentereng",
    "Old Yundum",
    "Busumbala"
  ],
  "North Bank": [
    "Lower Nuimi",
    "Upper Nuimi",
    "Jokadu",
    "Lower Baddibu",
    "Central Baddibu",
    "Illiassa",
    "Sabach Sanjal"
  ],
  "Lower River": [
    "Jarra West",
    "Jarra East",
    "Jarra Central",
    "Kiang West",
    "Kiang East",
    "Kiang Central"
  ],
  "Central River": [
    "Janjanbureh",
    "Niani",
    "Nianija",
    "Niamina West",
    "Niamina East",
    "Niamina Dankunku",
    "Lower Fulladu West",
    "Upper Fulladu West",
    "Lower Saloum",
    "Upper Saloum",
    "Sami"
  ],
  "Upper River": [
    "Basse",
    "Jimara",
    "Tumana",
    "Kantora",
    "Sandu",
    "Wulli West",
    "Wulli East"
  ]
};

// Track registered emails in memory during the session
export const registeredEmails = new Set<string>();

// Check if an email exists in the database
export const checkIfEmailExists = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('voters')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 means not found
      console.error("Error checking email:", error);
      return false;
    }
    
    return !!data;
  } catch (err) {
    console.error("Error checking email:", err);
    return false;
  }
};

// Function to fetch all admins
export const fetchAdmins = async (): Promise<UserRole[]> => {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*');
      
    if (error) {
      console.error("Error fetching admins:", error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error("Error fetching admins:", err);
    return [];
  }
};

// Function to add a new admin user
export const addAdminUser = async (id: string, email: string, password: string): Promise<UserRole | null> => {
  try {
    const newAdmin = { id, email, password, isAdmin: true };
    
    const { data, error } = await supabase
      .from('admins')
      .insert([newAdmin])
      .select()
      .single();
      
    if (error) {
      console.error("Error adding admin:", error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error("Error adding admin:", err);
    return null;
  }
};

// Function to remove an admin user
export const removeAdminUser = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error("Error removing admin:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Error removing admin:", err);
    return false;
  }
};

// Function to verify admin login
export const verifyAdminLogin = async (email: string, password: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();
      
    if (error) {
      console.error("Error verifying admin:", error);
      return false;
    }
    
    return !!data;
  } catch (err) {
    console.error("Error verifying admin:", err);
    return false;
  }
};

// Function to fetch voter data
export const fetchVoterData = async () => {
  try {
    const { data, error } = await supabase
      .from('voters')
      .select('*');
      
    if (error) {
      console.error("Error fetching voter data:", error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error("Error fetching voter data:", err);
    return [];
  }
};
