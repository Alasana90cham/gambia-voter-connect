
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
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';

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
  const currentStepIndex = steps.indexOf(currentStep);

  const updateFormData = useCallback((data: Partial<VoterFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  const isNextDisabled = useCallback(() => {
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
        return true; // Always disable the next button on identification step since we removed submission
      default:
        return false;
    }
  }, [currentStep, formData]);

  const goToNextStep = async () => {
    // Remove submission logic - just navigate to next step normally
    if (currentStep !== 'identification') {
      const nextStep = steps[currentStepIndex + 1];
      setCurrentStep(nextStep);
    }
    // If on identification step, do nothing since we removed the submit functionality
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
        
        {currentStep !== 'complete' && currentStep !== 'identification' && (
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
              disabled={isNextDisabled()}
              className="gap-2"
            >
              Next
              <ArrowRightIcon size={16} />
            </Button>
          </div>
        )}
        
        {currentStep === 'identification' && (
          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              className="gap-2"
            >
              <ArrowLeftIcon size={16} />
              Back
            </Button>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex-1 ml-4">
              <p className="text-red-700 font-medium text-center">
                Registration has been closed. No submissions are currently being accepted.
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MultiStepForm;
