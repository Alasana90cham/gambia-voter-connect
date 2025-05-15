
import { FilterState } from '../RegistrationTableProps';
import { debounce } from "@/lib/utils";

/**
 * Apply filters to dataset
 */
export const applyFilters = (voterData: any[], filters: FilterState) => {
  if (!voterData.length) return [];
  
  console.log("Applying filters to", voterData.length, "records");
  
  let result = voterData;
  
  // Apply each filter sequentially with early termination for performance
  if (filters.fullName) {
    const searchTerm = filters.fullName.toLowerCase();
    result = result.filter(voter => 
      voter.full_name && voter.full_name.toLowerCase().includes(searchTerm)
    );
    
    // Early termination if no results
    if (result.length === 0) {
      return result;
    }
  }
  
  if (filters.organization) {
    const searchTerm = filters.organization.toLowerCase();
    result = result.filter(voter => 
      voter.organization && voter.organization.toLowerCase().includes(searchTerm)
    );
    
    if (result.length === 0) {
      return result;
    }
  }
  
  if (filters.dateOfBirth) {
    result = result.filter(voter => 
      voter.date_of_birth && voter.date_of_birth.includes(filters.dateOfBirth)
    );
    
    if (result.length === 0) {
      return result;
    }
  }
  
  if (filters.gender) {
    result = result.filter(voter => 
      voter.gender === filters.gender
    );
    
    if (result.length === 0) {
      return result;
    }
  }
  
  if (filters.region) {
    const searchTerm = filters.region.toLowerCase();
    result = result.filter(voter => 
      voter.region && voter.region.toLowerCase().includes(searchTerm)
    );
    
    if (result.length === 0) {
      return result;
    }
  }
  
  if (filters.constituency) {
    const searchTerm = filters.constituency.toLowerCase();
    result = result.filter(voter => 
      voter.constituency && voter.constituency.toLowerCase().includes(searchTerm)
    );
    
    if (result.length === 0) {
      return result;
    }
  }
  
  if (filters.identificationType) {
    result = result.filter(voter => 
      voter.identification_type && voter.identification_type.includes(filters.identificationType)
    );
    
    if (result.length === 0) {
      return result;
    }
  }
  
  if (filters.identificationNumber) {
    result = result.filter(voter => 
      voter.identification_number && voter.identification_number.includes(filters.identificationNumber)
    );
  }
  
  return result;
};

/**
 * Create a debounced filter function
 */
export const createDebouncedFilterFn = (
  voterData: any[],
  filters: FilterState,
  callback: (result: any[]) => void,
  delay = 300
) => {
  return debounce(() => {
    if (!voterData.length) return;
    
    console.log("Applying filters with debounce to", voterData.length, "records");
    
    // Process filtering in background
    setTimeout(() => {
      try {
        const result = applyFilters(voterData, filters);
        callback(result);
      } catch (error) {
        console.error("Error applying filters:", error);
      }
    }, 0);
  }, delay);
};
