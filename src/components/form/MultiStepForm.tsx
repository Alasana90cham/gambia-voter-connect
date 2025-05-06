
import React, { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { FormStep, VoterFormData } from '@/types/form';

import DeclarationStep from './steps/DeclarationStep';
import PersonalInfoStep from './steps/PersonalInfoStep';
import RegionStep from './steps/RegionStep';
import ConstituencyStep from './steps/ConstituencyStep';
import IdentificationStep from './steps/IdentificationStep';
import CompleteStep from './steps/CompleteStep';
import ProgressBar from './ProgressBar';

const initialFormData: VoterFormData = {
  agreeToTerms: false,
  fullName: '',
  dateOfBirth: null,
  gender: null,
  region: null,
  constituency: null,
  identificationNumber: '',
};

const MultiStepForm = () => {
  const [currentStep, setCurrentStep] = useState<FormStep>('declaration');
  const [formData, setFormData] = useState<VoterFormData>(initialFormData);
  const { toast } = useToast();

  const updateFormData = (data: Partial<VoterFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'declaration':
        if (!formData.agreeToTerms) {
          toast({
            title: "Agreement Required",
            description: "You must agree to the terms to continue",
            variant: "destructive",
          });
          return;
        }
        setCurrentStep('personal');
        break;
      case 'personal':
        if (!formData.fullName || !formData.dateOfBirth || !formData.gender) {
          toast({
            title: "Missing Information",
            description: "Please complete all fields before continuing",
            variant: "destructive",
          });
          return;
        }
        setCurrentStep('region');
        break;
      case 'region':
        if (!formData.region) {
          toast({
            title: "Missing Selection",
            description: "Please select your region before continuing",
            variant: "destructive",
          });
          return;
        }
        setCurrentStep('constituency');
        break;
      case 'constituency':
        if (!formData.constituency) {
          toast({
            title: "Missing Selection",
            description: "Please select your constituency before continuing",
            variant: "destructive",
          });
          return;
        }
        setCurrentStep('identification');
        break;
      case 'identification':
        if (!formData.identificationNumber || formData.identificationNumber.length < 5) {
          toast({
            title: "Invalid ID Number",
            description: "Please enter a valid identification number",
            variant: "destructive",
          });
          return;
        }
        handleSubmit();
        break;
      default:
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'personal':
        setCurrentStep('declaration');
        break;
      case 'region':
        setCurrentStep('personal');
        break;
      case 'constituency':
        setCurrentStep('region');
        break;
      case 'identification':
        setCurrentStep('constituency');
        break;
      default:
        break;
    }
  };

  const handleSubmit = () => {
    // Here we would normally send the data to the server
    console.log("Form submitted:", formData);
    
    // Show success message
    toast({
      title: "Registration Complete",
      description: "Your voter registration has been submitted successfully!",
    });
    
    // Move to completion step
    setCurrentStep('complete');
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setCurrentStep('declaration');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'declaration':
        return <DeclarationStep 
          agreeToTerms={formData.agreeToTerms} 
          updateFormData={updateFormData} 
        />;
      case 'personal':
        return <PersonalInfoStep 
          formData={formData} 
          updateFormData={updateFormData} 
        />;
      case 'region':
        return <RegionStep 
          selectedRegion={formData.region} 
          updateFormData={updateFormData} 
        />;
      case 'constituency':
        return <ConstituencyStep 
          region={formData.region!} 
          selectedConstituency={formData.constituency} 
          updateFormData={updateFormData} 
        />;
      case 'identification':
        return <IdentificationStep 
          idNumber={formData.identificationNumber} 
          updateFormData={updateFormData} 
        />;
      case 'complete':
        return <CompleteStep 
          formData={formData} 
          onReset={handleReset} 
        />;
      default:
        return null;
    }
  };

  // Calculate step number for progress bar
  const getStepNumber = () => {
    switch(currentStep) {
      case 'declaration': return 1;
      case 'personal': return 2;
      case 'region': return 3;
      case 'constituency': return 4;
      case 'identification': return 5;
      case 'complete': return 6;
      default: return 1;
    }
  };

  return (
    <div className="multi-step-form animate-fade-in p-6 bg-white rounded-lg shadow-md">
      {currentStep !== 'complete' && (
        <ProgressBar currentStep={getStepNumber()} totalSteps={5} />
      )}

      <div className="form-section my-6">
        {renderStepContent()}
      </div>

      {currentStep !== 'complete' && (
        <div className="flex justify-between mt-8">
          {currentStep !== 'declaration' ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
            >
              Back
            </button>
          ) : (
            <div></div>
          )}
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2 bg-primary text-white rounded hover:bg-primary/90 transition"
          >
            {currentStep === 'identification' ? 'Submit' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MultiStepForm;
