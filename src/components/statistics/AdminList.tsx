
import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Trash2 } from 'lucide-react';
import { UserRole } from '@/types/form';
import { deleteAdmin } from '@/utils/adminOperations';

interface AdminListProps {
  adminList: UserRole[];
  onAdminDeleted: () => void;
}

const AdminList: React.FC<AdminListProps> = ({ adminList, onAdminDeleted }) => {
  const handleDeleteAdmin = async (id: string) => {
    try {
      await deleteAdmin(id, adminList.length);
      onAdminDeleted();
    } catch (error) {
      // Error already handled with toast in the utility function
      console.error("Error during admin deletion:", error);
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
