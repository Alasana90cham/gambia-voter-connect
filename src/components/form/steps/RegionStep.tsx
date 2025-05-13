
import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GambiaRegion } from '@/types/form';

interface RegionStepProps {
  selectedRegion: GambiaRegion | null;
  updateFormData: (data: { region: GambiaRegion }) => void;
}

const RegionStep: React.FC<RegionStepProps> = ({ selectedRegion, updateFormData }) => {
  const regions: GambiaRegion[] = [
    'Banjul',
    'Kanifing',
    'West Coast',
    'North Bank',
    'Lower River',
    'Central River',
    'Upper River'
  ];

  const handleRegionClick = (region: GambiaRegion) => {
    updateFormData({ region });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Select Your Region</h2>
      
      <div className="bg-blue-50 p-4 rounded-md mb-6">
        <p className="text-gray-700">
          Please select the administrative region where you currently reside. 
          This will help determine your constituency for voting purposes.
        </p>
      </div>
      
      <div className="mt-4">
        <Label className="mb-3 block">Region <span className="text-red-500">*</span></Label>
        <RadioGroup 
          value={selectedRegion || ''} 
          className="grid gap-4"
        >
          {regions.map((region) => (
            <div 
              key={region} 
              className="flex items-center space-x-2 bg-white p-3 rounded-md border hover:border-primary transition-all cursor-pointer"
              onClick={() => handleRegionClick(region)}
            >
              <RadioGroupItem value={region} id={region} />
              <Label htmlFor={region} className="cursor-pointer w-full">{region} Region</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
};

export default RegionStep;
