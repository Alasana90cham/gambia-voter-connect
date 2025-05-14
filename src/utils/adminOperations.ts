
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { UserRole } from '@/types/form';

export const checkInitialAdminSetup = async (): Promise<boolean> => {
  const { data, error } = await supabase
    .from('admins')
    .select('id')
    .eq('email', 'alasanacham04@gmail.com' as any)
    .maybeSingle();
    
  if (error) {
    console.error("Error checking initial admin setup:", error);
    return false;
  }
  
  return !!data;
};

export const validateAdminForm = (email: string, password: string, id: string): boolean => {
  if (!email || !password || !id) {
    toast({
      title: "Missing Information",
      description: "Please fill all fields to add a new admin",
      variant: "destructive",
    });
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    toast({
      title: "Invalid Email",
      description: "Please enter a valid email address",
      variant: "destructive",
    });
    return false;
  }
  
  return true;
};

export const checkExistingAdmin = async (email: string, id: string) => {
  const { data: existingAdmin, error: checkError } = await supabase
    .from('admins')
    .select('id, email')
    .or(`email.eq.${email},id.eq.${id}`)
    .maybeSingle();
  
  if (checkError) {
    console.error("Error checking admin:", checkError);
    toast({
      title: "Error",
      description: "Failed to check if admin already exists",
      variant: "destructive",
    });
    throw new Error("Failed to check if admin exists");
  }
  
  if (existingAdmin) {
    // Fix TS2339 error by checking if email property exists
    const emailMatches = existingAdmin && 'email' in existingAdmin ? existingAdmin.email === email : false;
    toast({
      title: "Admin Already Exists",
      description: emailMatches 
        ? "An admin with this email already exists" 
        : "An admin with this ID already exists",
      variant: "destructive",
    });
    throw new Error("Admin already exists");
  }
};

export const createAdmin = async (id: string, email: string, password: string) => {
  const { error } = await supabase.rpc('create_admin', {
    admin_id: id,
    admin_email: email,
    admin_password: password
  });
  
  if (error) {
    console.error("Error adding admin:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to add new admin",
      variant: "destructive",
    });
    throw new Error("Failed to add admin");
  }
  
  toast({
    title: "Admin Added",
    description: `New admin ${email} added successfully`,
  });
};

export const deleteAdmin = async (id: string, adminCount: number) => {
  if (adminCount <= 1) {
    toast({
      title: "Cannot Delete Admin",
      description: "At least one admin must remain in the system",
      variant: "destructive",
    });
    throw new Error("Cannot delete last admin");
  }
  
  const { error } = await supabase.rpc('delete_admin', { admin_id: id });
  
  if (error) {
    console.error("Error deleting admin:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to delete admin",
      variant: "destructive",
    });
    throw new Error("Failed to delete admin");
  }
  
  toast({
    title: "Admin Deleted",
    description: "Admin has been deleted successfully",
  });
};

export const addInitialAdmins = async () => {
  const { error } = await supabase.rpc('add_initial_admins');
  
  if (error) {
    console.error("Error adding initial admins:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to add initial admin accounts",
      variant: "destructive",
    });
    throw new Error("Failed to add initial admins");
  }
  
  toast({
    title: "Admins Added",
    description: "All requested admin accounts have been added successfully",
  });
};
