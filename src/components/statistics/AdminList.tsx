
import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Trash2 } from 'lucide-react';
import { UserRole } from '@/types/form';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdminListProps {
  adminList: UserRole[];
  onAdminDeleted: () => void;
}

const AdminList: React.FC<AdminListProps> = ({ adminList, onAdminDeleted }) => {
  const handleDeleteAdmin = async (id: string) => {
    try {
      console.log("Attempting to delete admin:", id);
      
      // First attempt to delete using the utility function that calls RPC
      try {
        const { error } = await supabase.rpc('delete_admin', { admin_id: id });
        
        if (error) {
          console.error("RPC delete error:", error);
          // Fall through to direct delete
        } else {
          // Success with RPC
          console.log("Admin deleted successfully via RPC");
          onAdminDeleted();
          toast({
            title: "Admin Deleted",
            description: "Admin user has been successfully removed",
          });
          return;
        }
      } catch (rpcError) {
        console.error("Exception in RPC delete:", rpcError);
        // Fall through to direct delete
      }
      
      // Fallback: Directly delete from the database
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Direct deletion error:", error);
        throw error;
      }
      
      console.log("Admin deleted successfully via direct deletion");
      
      // Notify parent component to refresh the admin list
      onAdminDeleted();
      
      toast({
        title: "Admin Deleted",
        description: "Admin user has been successfully removed",
      });
    } catch (error) {
      console.error("Error during admin deletion:", error);
      toast({
        title: "Deletion Failed",
        description: "There was an error deleting the admin. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
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
  );
};

export default AdminList;
