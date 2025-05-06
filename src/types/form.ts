
export interface VoterFormData {
  // Declaration section
  agreeToTerms: boolean;
  
  // Personal Information
  fullName: string;
  email: string;
  dateOfBirth: Date | null;
  gender: 'male' | 'female' | null;
  organization: string;
  
  // Region
  region: GambiaRegion | null;
  
  // Constituency (will be populated based on region)
  constituency: string | null;
  
  // ID verification
  identificationType: 'birth_certificate' | 'identification_document' | 'passport_number' | null;
  identificationNumber: string; // We'll validate this as numeric in the UI
}

export type GambiaRegion = 
  | 'Banjul'
  | 'Kanifing'
  | 'West Coast'
  | 'North Bank'
  | 'Lower River'
  | 'Central River'
  | 'Upper River';

export type FormStep = 
  | 'declaration'
  | 'personal'
  | 'region'
  | 'constituency'
  | 'identification'
  | 'complete';

export interface RegionConstituencies {
  [key: string]: string[];
}

export interface UserRole {
  id: string;
  email: string;
  password?: string;
  isAdmin: boolean;
}
