import { supabase, insuranceSubmit } from "@/integrations/supabase/client";
import { VoterFormData } from '@/types/form';
import { toast } from "@/components/ui/use-toast";
import { UserRole } from '@/types/form';
import { format } from 'date-fns';

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

export const submitVoterRegistration = async (formData: VoterFormData) => {
  try {
    // First validate the data
    if (!formData.dateOfBirth) {
      throw new Error("Date of birth is required");
    }

    // Create a submission ID to track this submission
    const submissionId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    
    // Store backup locally first
    const backupKey = `voter_submission_${submissionId}`;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(backupKey, JSON.stringify({
          formData,
          timestamp: new Date().toISOString()
        }));
      } catch (e) {
        console.warn('Could not create local backup:', e);
        // Continue anyway - this is just a backup
      }
    }
    
    // Format data for database insertion
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
    
    // Use the enhanced insurance submit method
    try {
      // First, try our enhanced submission method with built-in recovery
      const data = await insuranceSubmit('voters', insertData, 3);
      console.log("Registration submitted successfully via insurance method:", data);
      
      // Remove the backup on success
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.removeItem(backupKey);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      
      return data;
    } catch (insuranceError) {
      console.error("Insurance submit failed, trying direct method:", insuranceError);
      
      // Fall back to direct method if insurance method fails
      const { data, error } = await supabase
        .from('voters')
        .insert(insertData as any)
        .select();
        
      if (error) {
        console.error("Direct submit failed:", error);
        throw error;
      }
      
      console.log("Registration submitted successfully via direct method:", data);
      
      // Remove the backup on success
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.removeItem(backupKey);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      
      return data;
    }
  } catch (error: any) {
    console.error("Error submitting registration:", error);
    
    // Try to save details for recovery
    if (typeof localStorage !== 'undefined') {
      try {
        const failedSubmissionsKey = 'voters_backup_' + Date.now();
        localStorage.setItem(failedSubmissionsKey, JSON.stringify({
          table: 'voters',
          data: {
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
          },
          timestamp: Date.now(),
          error: error.message || 'Unknown error'
        }));
        
        toast({
          title: "Submission Saved Locally",
          description: "Your submission couldn't be sent to the server right now, but it's saved on your device and will be automatically submitted when connection is restored.",
        });
      } catch (e) {
        console.error("Failed to save backup:", e);
      }
    }
    
    throw new Error(`Failed to submit: ${error.message || 'Unknown error'}`);
  }
};
