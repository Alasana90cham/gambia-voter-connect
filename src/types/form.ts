
export interface VoterFormData {
  // Declaration section
  agreeToTerms: boolean;
  
  // Personal Information
  fullName: string;
  email: string; // Added email field
  dateOfBirth: Date | null;
  gender: 'male' | 'female' | null;
  organization: string; // Added organization field
  
  // Region
  region: GambiaRegion | null;
  
  // Constituency (will be populated based on region)
  constituency: string | null;
  
  // ID verification
  identificationNumber: string;
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
  isAdmin: boolean;
}
