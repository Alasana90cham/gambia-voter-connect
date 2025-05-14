
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";

interface VoterData {
  id: string;
  full_name: string;
  email: string;
  organization: string;
  date_of_birth: string;
  gender: string;
  region: string;
  constituency: string;
  identification_type: string;
  identification_number: string;
}

export const NoDataRow = () => (
  <TableRow>
    <TableCell colSpan={8} className="text-center py-4">
      No matching records found
    </TableCell>
  </TableRow>
);

// Optimized export formatter for large datasets
export const formatForExport = (voter: VoterData) => {
  const dob = voter.date_of_birth ? voter.date_of_birth.split('T')[0] : '';
  const idType = voter.identification_type === 'birth_certificate' ? 'Birth Certificate' : 
                voter.identification_type === 'identification_document' ? 'ID Document' :
                voter.identification_type === 'passport_number' ? 'Passport' : '';
  
  // No masking for admin exports - show complete data
  return `"${voter.full_name || ''}","${voter.email || ''}","${voter.organization || ''}","${dob}","${voter.gender || ''}","${voter.region || ''}","${voter.constituency || ''}","${idType}","${voter.identification_number || ''}"`;
};

// New batch processing helper for large datasets
export const processBatch = <T, R>(
  items: T[], 
  processFn: (item: T) => R, 
  batchSize = 500
): R[] => {
  const results: R[] = [];
  const totalItems = items.length;
  
  for (let i = 0; i < totalItems; i += batchSize) {
    const batchEnd = Math.min(i + batchSize, totalItems);
    const batch = items.slice(i, batchEnd);
    
    batch.forEach(item => {
      results.push(processFn(item));
    });
  }
  
  return results;
};

// Virtual list helper to render only visible rows for better performance
export const getVisibleRows = <T,>(
  data: T[], 
  currentPage: number, 
  pageSize: number
): T[] => {
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, data.length);
  return data.slice(startIndex, endIndex);
};
