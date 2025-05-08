import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { UserPlus, Trash2, Plus } from 'lucide-react';
import { UserRole } from '@/types/form';
import { supabase } from "@/integrations/supabase/client";

interface AdminManagementProps {
  adminList: UserRole[];
}

const AdminManagement: React.FC<AdminManagementProps> = ({ adminList }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminId, setNewAdminId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialAdminSetupDone, setInitialAdminSetupDone] = useState(false);
  
  useEffect(() => {
    // Check if initial admin setup has been done
    const checkInitialAdminSetup = async () => {
      const { data, error } = await supabase
        .from('admins')
        .select('id')
        .eq('email', 'alasanacham04@gmail.com')
        .maybeSingle();
        
      if (error) {
        console.error("Error checking initial admin setup:", error);
        return;
      }
      
      setInitialAdminSetupDone(!!data);
    };
    
    checkInitialAdminSetup();
  }, []);
  
  const validateForm = () => {
    if (!newAdminEmail || !newAdminPassword || !newAdminId) {
      toast({
        title: "Missing Information",
        description: "Please fill all fields to add a new admin",
        variant: "destructive",
      });
      return false;
    }
    
    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const handleAddAdmin = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      
      // Check if email or ID already exists
      const { data: existingAdmin, error: checkError } = await supabase
        .from('admins')
        .select('id, email')
        .or(`email.eq.${newAdminEmail},id.eq.${newAdminId}`)
        .maybeSingle();
      
      if (checkError) {
        console.error("Error checking admin:", checkError);
        toast({
          title: "Error",
          description: "Failed to check if admin already exists",
          variant: "destructive",
        });
        return;
      }
      
      if (existingAdmin) {
        toast({
          title: "Admin Already Exists",
          description: existingAdmin.email === newAdminEmail 
            ? "An admin with this email already exists" 
            : "An admin with this ID already exists",
          variant: "destructive",
        });
        return;
      }
      
      // Use a special RPC function to insert admin and bypass RLS
      const { data, error } = await supabase.rpc('create_admin', {
        admin_id: newAdminId,
        admin_email: newAdminEmail,
        admin_password: newAdminPassword
      });
      
      if (error) {
        console.error("Error adding admin:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to add new admin",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Admin Added",
        description: `New admin ${newAdminEmail} added successfully`,
      });
      
      // Reset form
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminId('');
      setOpenDialog(false);
    } catch (error) {
      console.error("Error adding admin:", error);
      toast({
        title: "Error",
        description: "Failed to add new admin",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteAdmin = async (id: string) => {
    // Don't allow deleting if there's only one admin left
    if (adminList.length <= 1) {
      toast({
        title: "Cannot Delete Admin",
        description: "At least one admin must remain in the system",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Use RPC function to delete admin and bypass RLS
      const { error } = await supabase.rpc('delete_admin', { admin_id: id });
        
      if (error) {
        console.error("Error deleting admin:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete admin",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Admin Deleted",
        description: "Admin has been deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting admin:", error);
      toast({
        title: "Error",
        description: "Failed to delete admin",
        variant: "destructive",
      });
    }
  };
  
  const addInitialAdmins = async () => {
    setIsSubmitting(true);
    try {
      // Use an RPC function to add initial admins and bypass RLS
      const { data, error } = await supabase.rpc('add_initial_admins');
      
      if (error) {
        console.error("Error adding initial admins:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to add initial admin accounts",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Admins Added",
        description: "All requested admin accounts have been added successfully",
      });
      
      setInitialAdminSetupDone(true);
    } catch (error) {
      console.error("Error adding initial admins:", error);
      toast({
        title: "Error",
        description: "Failed to add initial admin accounts",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl font-semibold">Admin Management</h2>
        
        <div className="flex gap-2">
          {!initialAdminSetupDone && (
            <Button 
              className="flex items-center gap-2" 
              variant="outline"
              onClick={addInitialAdmins}
              disabled={isSubmitting}
            >
              <Plus size={16} />
              Add Required Admins
            </Button>
          )}
          
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus size={16} />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Admin User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="admin-id">ID</Label>
                  <Input 
                    id="admin-id" 
                    value={newAdminId}
                    onChange={(e) => setNewAdminId(e.target.value)}
                    placeholder="Enter unique ID"
                  />
                </div>
                <div>
                  <Label htmlFor="admin-email">Email</Label>
                  <Input 
                    id="admin-email" 
                    type="email" 
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="Enter admin email"
                  />
                </div>
                <div>
                  <Label htmlFor="admin-password">Password</Label>
                  <Input 
                    id="admin-password" 
                    type="password" 
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleAddAdmin}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add Admin"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adminList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No admin users found
                </TableCell>
              </TableRow>
            ) : (
              adminList.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>{admin.id}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteAdmin(admin.id)}
                    >
                      <Trash2 size={16} />
                      <span className="ml-2">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default AdminManagement;
