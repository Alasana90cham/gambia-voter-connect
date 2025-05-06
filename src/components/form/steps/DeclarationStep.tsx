
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface DeclarationStepProps {
  agreeToTerms: boolean;
  updateFormData: (data: { agreeToTerms: boolean }) => void;
}

const DeclarationStep: React.FC<DeclarationStepProps> = ({ agreeToTerms, updateFormData }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Declaration</h2>
      
      <div className="bg-blue-50 p-4 rounded-md mb-6">
        <p className="text-gray-700 mb-4">
          This form will be used for voter registration purposes in The Gambia. By proceeding, 
          you acknowledge that the information provided is accurate and true.
        </p>
        
        <p className="text-gray-700 mb-4">
          The Electoral Commission of The Gambia is committed to protecting your personal information
          and will use it solely for the purpose of voter registration and electoral processes.
        </p>
      </div>
      
      <div className="flex items-start space-x-2 mt-6">
        <Checkbox 
          id="terms" 
          checked={agreeToTerms}
          onCheckedChange={(checked) => updateFormData({ agreeToTerms: checked as boolean })}
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="terms" className="text-base">
            I agree to the terms and conditions of using this platform for voter registration purposes
            and confirm that all information I provide will be accurate and true.
          </Label>
          <p className="text-sm text-muted-foreground">
            This acknowledgment is required to proceed with the registration.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeclarationStep;
