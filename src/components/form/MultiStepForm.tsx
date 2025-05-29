
import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormStep, VoterFormData, GambiaRegion } from '@/types/form';
import ProgressBar from './ProgressBar';
import DeclarationStep from './steps/DeclarationStep';
import PersonalInfoStep from './steps/PersonalInfoStep';
import RegionStep from './steps/RegionStep';
import ConstituencyStep from './steps/ConstituencyStep';
import IdentificationStep from './steps/IdentificationStep';
import CompleteStep from './steps/CompleteStep';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeftIcon, ArrowRightIcon, Ban } from 'lucide-react';
import { submitVoterRegistration } from '@/data/constituencies';

interface Props {
  onComplete?: () => void;
}

const steps: FormStep[] = [
  'declaration',
  'personal',
  'region',
  'constituency',
  'identification',
  'complete',
];

const stepLabels: Record<FormStep, string> = {
  'declaration': 'Terms & Conditions',
  'personal': 'Personal Information',
  'region': 'Region Selection',
  'constituency': 'Constituency',
  'identification': 'Verification',
  'complete': 'Complete',
};

const initialFormData: VoterFormData = {
  agreeToTerms: false,
  fullName: '',
  email: '',
  dateOfBirth: null,
  gender: null,
  organization: '',
  region: null,
  constituency: null,
  identificationType: null,
  identificationNumber: '',
};

const MultiStepForm: React.FC<Props> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<FormStep>('declaration');
  const [formData, setFormData] = useState<VoterFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistrationClosed, setIsRegistrationClosed] = useState(false);
  const currentStepIndex = steps.indexOf(currentStep);

  // Check if registration is closed (after Wednesday 11:59 PM)
  useEffect(() => {
    const checkRegistrationStatus = () => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 3 = Wednesday
      
      if (dayOfWeek === 3) {
        // If it's Wednesday, check if it's after 11:59 PM
        const todayAt1159 = new Date(now);
        todayAt1159.setHours(23, 59, 0, 0);
        setIsRegistrationClosed(now > todayAt1159);
      } else if (dayOfWeek > 3 || dayOfWeek === 0) {
        // If it's after Wednesday (Thursday-Sunday)
        setIsRegistrationClosed(true);
      } else {
        // If it's before Wednesday (Monday-Tuesday)
        setIsRegistrationClosed(false);
      }
    };

    checkRegistrationStatus();
    // Check every minute to update the status
    const interval = setInterval(checkRegistrationStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const updateFormData = useCallback((data: Partial<VoterFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  const isNextDisabled = useCallback(() => {
    if (isRegistrationClosed) return true;
    
    switch (currentStep) {
      case 'declaration':
        return !formData.agreeToTerms;
      case 'personal':
        return !formData.fullName || !formData.email || !formData.dateOfBirth || !formData.gender || !formData.organization;
      case 'region':
        return !formData.region;
      case 'constituency':
        return !formData.constituency;
      case 'identification':
        return !formData.identificationType || !formData.identificationNumber;
      default:
        return false;
    }
  }, [currentStep, formData, isRegistrationClosed]);

  const goToNextStep = async () => {
    if (isRegistrationClosed) {
      toast({
        title: 'Registration Closed',
        description: 'Voter registration has been closed.',
        variant: 'destructive',
      });
      return;
    }

    // If we're on the identification step (last step before complete)
    if (currentStep === 'identification') {
      try {
        setIsSubmitting(true);
        
        // Make sure gender is always one of the allowed values
        let validGender: 'male' | 'female';
        if (formData.gender === 'male' || formData.gender === 'female') {
          validGender = formData.gender;
        } else {
          // Default to male if somehow the gender is null
          validGender = 'male';
        }
        
        // Ensure all required fields are present
        const formDataToSubmit: VoterFormData = {
          ...formData,
          gender: validGender,
          region: formData.region || 'Banjul',
          constituency: formData.constituency || 'Banjul Central',
          identificationType: formData.identificationType || 'identification_document',
        };
        
        console.log("Submitting form data:", formDataToSubmit);
        
        // Submit the form data to the API
        await submitVoterRegistration(formDataToSubmit);
        
        // Move to complete step after successful submission
        setCurrentStep('complete');
        
        // Show success toast
        toast({
          title: 'Registration Successful',
          description: 'Your voter registration has been submitted.',
          variant: 'default',
        });
      } catch (error) {
        console.error('Error submitting form:', error);
        toast({
          title: 'Registration Failed',
          description: 'There was an error submitting your registration. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      const nextStep = steps[currentStepIndex + 1];
      setCurrentStep(nextStep);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      const prevStep = steps[currentStepIndex - 1];
      setCurrentStep(prevStep);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
    // Reset form data when complete
    setFormData(initialFormData);
    setCurrentStep('declaration');
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'declaration':
        return (
          <DeclarationStep 
            agreeToTerms={formData.agreeToTerms}
            updateFormData={updateFormData}
          />
        );
      case 'personal':
        return (
          <PersonalInfoStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 'region':
        return (
          <RegionStep
            selectedRegion={formData.region}
            updateFormData={updateFormData}
          />
        );
      case 'constituency':
        return (
          <ConstituencyStep
            region={formData.region as GambiaRegion}
            selectedConstituency={formData.constituency}
            updateFormData={updateFormData}
          />
        );
      case 'identification':
        return (
          <IdentificationStep
            idNumber={formData.identificationNumber}
            idType={formData.identificationType}
            updateFormData={updateFormData}
          />
        );
      case 'complete':
        return <CompleteStep formData={formData} onReset={handleComplete} />;
      default:
        return <div>Unknown step</div>;
    }
  };

  if (isRegistrationClosed && currentStep !== 'complete') {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
            <Ban className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Registration Closed</h2>
          <p className="text-gray-600 mb-4">
            Voter registration has been closed. The registration deadline has passed.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Registration was open until Wednesday at 11:59 PM.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">For any information, contact:</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p>📍 <strong>Visit:</strong> NYP Office at Westfield behind Family Planning</p>
              <p>📧 <strong>Email:</strong> nypgambia.org</p>
              <p>📞 <strong>Call:</strong> 3204119</p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <div className="p-6">
        {currentStep !== 'complete' && (
          <>
            <h2 className="text-xl font-bold mb-2">Registration Step: {stepLabels[currentStep]}</h2>
            <ProgressBar 
              currentStep={currentStepIndex} 
              totalSteps={steps.length - 1} 
            />
          </>
        )}
        
        <div className="mt-6">
          {renderCurrentStep()}
        </div>
        
        {currentStep !== 'complete' && !isRegistrationClosed && (
          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={currentStepIndex === 0}
              className="gap-2"
            >
              <ArrowLeftIcon size={16} />
              Back
            </Button>
            
            <Button
              onClick={goToNextStep}
              disabled={isNextDisabled() || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? 'Submitting...' : currentStep === 'identification' ? 'Submit' : 'Next'}
              {!isSubmitting && <ArrowRightIcon size={16} />}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MultiStepForm;
