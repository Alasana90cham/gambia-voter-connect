
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface IdentificationStepProps {
  idNumber: string;
  idType: 'birth_certificate' | 'identification_document' | 'passport_number' | null;
  updateFormData: (data: { 
    identificationNumber?: string;
    identificationType?: 'birth_certificate' | 'identification_document' | 'passport_number';
  }) => void;
}

const IdentificationStep: React.FC<IdentificationStepProps> = ({ 
  idNumber, 
  idType,
  updateFormData 
}) => {
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only accept integers
    const value = e.target.value.replace(/[^0-9]/g, '');
    updateFormData({ identificationNumber: value });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Identification Verification</h2>
      
      <div className="bg-blue-50 p-4 rounded-md mb-6">
        <p className="text-gray-700 mb-3">
          Please provide your identification document type and number for verification purposes.
          This information will be used to validate your eligibility to vote.
        </p>
        <p className="text-gray-700 font-medium">
          Your identification information is protected and will only be used for voter registration verification.
        </p>
      </div>
      
      <div className="space-y-6">
        <div>
          <Label className="mb-3 block">Identification Document Type <span className="text-red-500">*</span></Label>
          <RadioGroup 
            value={idType || ''} 
            onValueChange={(value) => updateFormData({ identificationType: value as any })}
            className="grid gap-4"
          >
            <div className="flex items-center space-x-2 bg-white p-3 rounded-md border hover:border-primary transition-all">
              <RadioGroupItem value="birth_certificate" id="birth_certificate" />
              <Label htmlFor="birth_certificate" className="cursor-pointer w-full">Birth Certificate</Label>
            </div>
            <div className="flex items-center space-x-2 bg-white p-3 rounded-md border hover:border-primary transition-all">
              <RadioGroupItem value="identification_document" id="identification_document" />
              <Label htmlFor="identification_document" className="cursor-pointer w-full">Identification Document</Label>
            </div>
            <div className="flex items-center space-x-2 bg-white p-3 rounded-md border hover:border-primary transition-all">
              <RadioGroupItem value="passport_number" id="passport_number" />
              <Label htmlFor="passport_number" className="cursor-pointer w-full">Passport Number</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label htmlFor="idNumber" className="mb-2 block">Identification Number <span className="text-red-500">*</span></Label>
          <Input 
            id="idNumber"
            value={idNumber}
            onChange={handleNumberChange}
            placeholder="Enter your ID number (numbers only)"
            className="w-full"
            inputMode="numeric"
            pattern="[0-9]*"
            required
          />
          <p className="text-sm text-muted-foreground mt-1">
            Enter your document number (numbers only).
          </p>
        </div>
      </div>
    </div>
  );
};

export default IdentificationStep;
