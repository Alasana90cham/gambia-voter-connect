
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { VoterFormData } from '@/types/form';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PersonalInfoStepProps {
  formData: VoterFormData;
  updateFormData: (data: Partial<VoterFormData>) => void;
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ formData, updateFormData }) => {
  // Calculate max date (18 years ago from today)
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const minDate = new Date(1900, 0, 1); // Minimum date (January 1, 1900)
  
  // Calculate a reasonable default year to show in the calendar
  // This will show around 30 years ago, which is a common adult age
  const defaultCalendarDate = new Date(today.getFullYear() - 30, 0, 1);
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Personal Information</h2>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input 
            id="fullName" 
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={(e) => updateFormData({ fullName: e.target.value })}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input 
            id="email" 
            type="email"
            placeholder="Enter your email address"
            value={formData.email || ''}
            onChange={(e) => updateFormData({ email: e.target.value })}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            Your email will be used to prevent duplicate registrations.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="organization">Organization</Label>
          <Input 
            id="organization" 
            placeholder="Enter your organization"
            value={formData.organization || ''}
            onChange={(e) => updateFormData({ organization: e.target.value })}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            Please provide the organization you represent.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dob">Date of Birth</Label>
          <div className="flex flex-col">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="dob"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.dateOfBirth && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {formData.dateOfBirth ? (
                    format(formData.dateOfBirth, "MMMM d, yyyy")
                  ) : (
                    <span>Select your date of birth</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.dateOfBirth || undefined}
                  onSelect={(date) => updateFormData({ dateOfBirth: date })}
                  disabled={(date) => date > maxDate || date < minDate}
                  defaultMonth={formData.dateOfBirth || defaultCalendarDate}
                  initialFocus
                  captionLayout="dropdown-buttons"
                  fromYear={1900}
                  toYear={maxDate.getFullYear()}
                />
              </PopoverContent>
            </Popover>
            <p className="text-sm text-muted-foreground mt-1">
              You must be at least 18 years old to register as a voter.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Gender</Label>
          <RadioGroup 
            value={formData.gender || ''} 
            onValueChange={(value) => updateFormData({ gender: value as 'male' | 'female' })}
            className="flex space-x-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id="male" />
              <Label htmlFor="male">Male</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id="female" />
              <Label htmlFor="female">Female</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoStep;
