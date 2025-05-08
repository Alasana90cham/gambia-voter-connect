
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { addInitialAdmins } from '@/utils/adminOperations';

interface InitialSetupButtonProps {
  onSetupComplete: () => void;
}

const InitialSetupButton: React.FC<InitialSetupButtonProps> = ({ onSetupComplete }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddInitialAdmins = async () => {
    setIsSubmitting(true);
    try {
      await addInitialAdmins();
      onSetupComplete();
    } catch (error) {
      // Error already handled with toast in the utility function
      console.error("Error during initial admin setup:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button 
      className="flex items-center gap-2" 
      variant="outline"
      onClick={handleAddInitialAdmins}
      disabled={isSubmitting}
    >
      <Plus size={16} />
      Add Required Admins
    </Button>
  );
};

export default InitialSetupButton;
