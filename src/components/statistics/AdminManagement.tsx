
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { UserRole } from '@/types/form';
import { checkInitialAdminSetup } from '@/utils/adminOperations';
import AdminList from './AdminList';
import AdminDialogForm from './AdminDialogForm';
import InitialSetupButton from './InitialSetupButton';

interface AdminManagementProps {
  adminList: UserRole[];
}

const AdminManagement: React.FC<AdminManagementProps> = ({ adminList }) => {
  const [initialAdminSetupDone, setInitialAdminSetupDone] = useState(false);
  
  useEffect(() => {
    const checkSetupStatus = async () => {
      const isSetupDone = await checkInitialAdminSetup();
      setInitialAdminSetupDone(isSetupDone);
    };
    
    checkSetupStatus();
  }, []);
  
  const handleAdminAdded = () => {
    // The parent component (Statistics.tsx) will handle reload via Supabase subscriptions
  };
  
  const handleAdminDeleted = () => {
    // The parent component (Statistics.tsx) will handle reload via Supabase subscriptions
  };
  
  const handleSetupComplete = () => {
    setInitialAdminSetupDone(true);
    // The parent component (Statistics.tsx) will handle reload via Supabase subscriptions
  };

  return (
    <Card className="p-6 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl font-semibold">Admin Management</h2>
        
        <div className="flex gap-2">
          {!initialAdminSetupDone && (
            <InitialSetupButton onSetupComplete={handleSetupComplete} />
          )}
          
          <AdminDialogForm onAdminAdded={handleAdminAdded} />
        </div>
      </div>
      
      <AdminList adminList={adminList} onAdminDeleted={handleAdminDeleted} />
    </Card>
  );
};

export default AdminManagement;
