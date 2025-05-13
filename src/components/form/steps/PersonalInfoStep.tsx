
import React, { useState, useCallback, useMemo } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';

interface PersonalInfoStepProps {
  formData: VoterFormData;
  updateFormData: (data: Partial<VoterFormData>) => void;
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ formData, updateFormData }) => {
  // Calculate min/max date for date restrictions (1990-2010)
  const minDate = useMemo(() => new Date(1990, 0, 1), []);
  const maxDate = useMemo(() => new Date(2010, 11, 31), []);
  
  // Default calendar date to show in the middle of the allowed range
  const defaultCalendarDate = useMemo(() => new Date(2000, 0, 1), []);
  
  // State for email validation
  const [emailError, setEmailError] = useState<string | null>(null);
  
  // Use React Query for email validation
  const { refetch: checkEmail, isFetching: isCheckingEmail } = useQuery({
    queryKey: ['emailCheck', formData.email],
    queryFn: async () => {
      if (!formData.email) return null;
      
      // Check email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error("Please enter a valid email address");
      }
      
      // Check if email already exists in database
      const { data, error } = await supabase
        .from('voters')
        .select('email')
        .eq('email', formData.email)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking email:', error);
        throw error;
      }
      
      if (data) {
        throw new Error("This email has already been registered");
      }
      
      return data;
    },
    enabled: false, // Don't run on mount, only when manually triggered
    retry: false, // Don't retry failed queries
    refetchOnWindowFocus: false,
  });
  
  const handleEmailChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    updateFormData({ email });
    
    // Clear previous error
    setEmailError(null);
    
    // If email is empty, don't check
    if (!email) return;
    
    // Debounce email check for better UX
    const timeoutId = setTimeout(async () => {
      try {
        await checkEmail();
      } catch (error) {
        setEmailError(error.message);
        
        if (error.message.includes("already been registered")) {
          toast({
            title: "Email already registered",
            description: "This email address is already registered in our system",
            variant: "destructive",
          });
        }
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [updateFormData, checkEmail]);
  
  // Memoize date selection handler
  const handleDateSelect = useCallback((date: Date | undefined) => {
    updateFormData({ dateOfBirth: date });
  }, [updateFormData]);
  
  // Memoize gender selection handler
  const handleGenderChange = useCallback((value: string) => {
    updateFormData({ gender: value as 'male' | 'female' });
  }, [updateFormData]);
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Personal Information</h2>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name <span className="text-red-500">*</span></Label>
          <Input 
            id="fullName" 
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={(e) => updateFormData({ fullName: e.target.value })}
            className="w-full"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
          <Input 
            id="email" 
            type="email"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={handleEmailChange}
            className={cn(
              "w-full",
              emailError && "border-red-500 focus-visible:ring-red-500"
            )}
            disabled={isCheckingEmail}
            required
          />
          {emailError && (
            <p className="text-sm text-red-500 mt-1">{emailError}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Your email will be used to prevent duplicate registrations.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="organization">Organization <span className="text-red-500">*</span></Label>
          <Input 
            id="organization" 
            placeholder="Enter your organization"
            value={formData.organization}
            onChange={(e) => updateFormData({ organization: e.target.value })}
            className="w-full"
            required
          />
          <p className="text-sm text-muted-foreground">
            Please provide the organization you represent.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dob">Date of Birth <span className="text-red-500">*</span></Label>
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
                  onSelect={handleDateSelect}
                  disabled={(date) => date < minDate || date > maxDate}
                  defaultMonth={formData.dateOfBirth || defaultCalendarDate}
                  initialFocus
                  captionLayout="dropdown-buttons"
                  fromYear={1990}
                  toYear={2010}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <p className="text-sm text-muted-foreground mt-1">
              You must be born between 1990 and 2010 to register as a voter.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Gender <span className="text-red-500">*</span></Label>
          <RadioGroup 
            value={formData.gender || ''} 
            onValueChange={handleGenderChange}
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
