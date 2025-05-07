
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { UserPlus, Trash2 } from 'lucide-react';
import { UserRole } from '@/types/form';
import { addAdminUser, removeAdminUser } from '@/data/constituencies';

interface AdminManagementProps {
  adminList: UserRole[];
}

const AdminManagement: React.FC<AdminManagementProps> = ({ adminList }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminId, setNewAdminId] = useState('');
  
  const handleAddAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword || !newAdminId) {
      toast({
        title: "Missing Information",
        description: "Please fill all fields to add a new admin",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const newAdmin = await addAdminUser(newAdminId, newAdminEmail, newAdminPassword);
      
      if (newAdmin) {
        toast({
          title: "Admin Added",
          description: `New admin ${newAdminEmail} added successfully`,
        });
        
        // Reset form
        setNewAdminEmail('');
        setNewAdminPassword('');
        setNewAdminId('');
        setOpenDialog(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to add new admin",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding admin:", error);
      toast({
        title: "Error",
        description: "Failed to add new admin",
        variant: "destructive",
      });
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
      const success = await removeAdminUser(id);
      
      if (success) {
        toast({
          title: "Admin Deleted",
          description: "Admin has been deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete admin",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting admin:", error);
      toast({
        title: "Error",
        description: "Failed to delete admin",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl font-semibold">Admin Management</h2>
        
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
              <Button className="w-full" onClick={handleAddAdmin}>
                Add Admin
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
