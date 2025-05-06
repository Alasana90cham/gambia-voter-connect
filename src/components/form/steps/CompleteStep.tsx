
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoterFormData } from '@/types/form';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface CompleteStepProps {
  formData: VoterFormData;
  onReset: () => void;
}

const CompleteStep: React.FC<CompleteStepProps> = ({ formData, onReset }) => {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Complete</h2>
      <p className="text-gray-600 mb-6">
        Thank you for registering as a voter. Your information has been successfully submitted.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-6 text-left mb-6">
        <h3 className="font-semibold text-lg mb-3 text-gray-800">Registration Summary</h3>
        
        <div className="space-y-2">
          <div>
            <span className="font-medium">Name:</span> {formData.fullName}
          </div>
          <div>
            <span className="font-medium">Date of Birth:</span> {formData.dateOfBirth ? format(formData.dateOfBirth, 'PPP') : 'Not provided'}
          </div>
          <div>
            <span className="font-medium">Gender:</span> {formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : 'Not provided'}
          </div>
          <div>
            <span className="font-medium">Region:</span> {formData.region}
          </div>
          <div>
            <span className="font-medium">Constituency:</span> {formData.constituency}
          </div>
          <div>
            <span className="font-medium">ID Number:</span> {formData.identificationNumber ? 
              `${formData.identificationNumber.substring(0, 2)}****${formData.identificationNumber.substring(formData.identificationNumber.length - 2)}` : 
              'Not provided'}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button onClick={onReset} className="bg-primary hover:bg-primary/90">
          Register Another Voter
        </Button>
        <Link to="/statistics">
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
            View Registration Statistics
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default CompleteStep;
