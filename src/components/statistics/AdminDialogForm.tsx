
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus } from 'lucide-react';
import { validateAdminForm, checkExistingAdmin, createAdmin } from '@/utils/adminOperations';

interface AdminDialogFormProps {
  onAdminAdded: () => void;
}

const AdminDialogForm: React.FC<AdminDialogFormProps> = ({ onAdminAdded }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminId, setNewAdminId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddAdmin = async () => {
    if (!validateAdminForm(newAdminEmail, newAdminPassword, newAdminId)) return;
    
    try {
      setIsSubmitting(true);
      await checkExistingAdmin(newAdminEmail, newAdminId);
      await createAdmin(newAdminId, newAdminEmail, newAdminPassword);
      
      // Reset form
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminId('');
      setOpenDialog(false);
      
      // Notify parent component
      onAdminAdded();
    } catch (error) {
      console.error("Error in admin operation:", error);
      // Errors are already handled by the utility functions with toast messages
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
  );
};

export default AdminDialogForm;
