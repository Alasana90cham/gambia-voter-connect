
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GambiaRegion } from '@/types/form';
import { regionConstituencies } from '@/data/constituencies';
import { Input } from '@/components/ui/input';

interface ConstituencyStepProps {
  region: GambiaRegion;
  selectedConstituency: string | null;
  updateFormData: (data: { constituency: string }) => void;
}

const ConstituencyStep: React.FC<ConstituencyStepProps> = ({ 
  region, 
  selectedConstituency, 
  updateFormData 
}) => {
  const constituencies = regionConstituencies[region] || [];
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter constituencies based on search term
  const filteredConstituencies = constituencies.filter(constituency => 
    constituency.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Your Constituency</h2>
      <p className="text-gray-600 mb-6">Region: <span className="font-semibold">{region}</span></p>
      
      <div className="bg-blue-50 p-4 rounded-md mb-6">
        <p className="text-gray-700">
          Based on your selected region, please choose the constituency where you will be registered to vote.
          This information will determine your polling station.
        </p>
      </div>
      
      <div className="mb-4">
        <Input 
          placeholder="Search constituencies..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>
      
      <div className="mt-4">
        <Label className="mb-3 block">Constituency</Label>
        {filteredConstituencies.length === 0 ? (
          <p className="text-gray-500 italic">No constituencies found matching your search</p>
        ) : (
          <RadioGroup 
            value={selectedConstituency || ''} 
            onValueChange={(value) => updateFormData({ constituency: value })}
            className="grid gap-4"
          >
            {filteredConstituencies.map((constituency) => (
              <div key={constituency} className="flex items-center space-x-2 bg-white p-3 rounded-md border hover:border-primary transition-all">
                <RadioGroupItem value={constituency} id={constituency} />
                <Label htmlFor={constituency} className="cursor-pointer w-full">{constituency}</Label>
              </div>
            ))}
          </RadioGroup>
        )}
      </div>
    </div>
  );
};

export default ConstituencyStep;
