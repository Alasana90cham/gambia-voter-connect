
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface IdentificationStepProps {
  idNumber: string;
  updateFormData: (data: { identificationNumber: string }) => void;
}

const IdentificationStep: React.FC<IdentificationStepProps> = ({ 
  idNumber, 
  updateFormData 
}) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Identification Verification</h2>
      
      <div className="bg-blue-50 p-4 rounded-md mb-6">
        <p className="text-gray-700 mb-3">
          Please provide your national ID number or passport number for verification purposes.
          This information will be used to validate your eligibility to vote.
        </p>
        <p className="text-gray-700 font-medium">
          Your identification information is protected and will only be used for voter registration verification.
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="idNumber" className="mb-2 block">Identification Number <span className="text-red-500">*</span></Label>
          <Input 
            id="idNumber"
            value={idNumber}
            onChange={(e) => updateFormData({ identificationNumber: e.target.value })}
            placeholder="Enter your ID number"
            className="w-full"
            required
          />
          <p className="text-sm text-muted-foreground mt-1">
            Enter your National ID card number, passport number, or other government-issued ID.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IdentificationStep;
