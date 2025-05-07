
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
        return !formData.identificationType || !formData.identificationNumber;
      default:
        return false;
    }
  }, [currentStep, formData]);

  const goToNextStep = async () => {
    // If we're on the identification step (last step before complete)
    if (currentStep === 'identification') {
      try {
        setIsSubmitting(true);
        
        // Submit the form data to the API
        await submitVoterRegistration(formData);
        
        // Move to complete step after successful submission
        setCurrentStep('complete');
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
        
        {currentStep !== 'complete' && (
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
