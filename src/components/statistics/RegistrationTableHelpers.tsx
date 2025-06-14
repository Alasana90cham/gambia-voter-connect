
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
    <TableCell colSpan={9} className="text-center py-4">
      No matching records found
    </TableCell>
  </TableRow>
);

// Complete export formatter - shows all data without any censoring or masking
export const formatForExport = (voter: VoterData) => {
  const dob = voter.date_of_birth ? voter.date_of_birth.split('T')[0] : '';
  const idType = voter.identification_type === 'birth_certificate' ? 'Birth Certificate' : 
                voter.identification_type === 'identification_document' ? 'ID Document' :
                voter.identification_type === 'passport_number' ? 'Passport' : '';
  
  // Return complete data without any masking, censoring, or redaction
  // Format ID number as text to prevent scientific notation
  const idNumber = voter.identification_number ? `"${voter.identification_number}"` : '""';
  
  return `"${voter.full_name || ''}","${voter.email || ''}","${voter.organization || ''}","${dob}","${voter.gender || ''}","${voter.region || ''}","${voter.constituency || ''}","${idType}",${idNumber}`;
};

// Enhanced batch processing helper for large datasets with memory optimization
export const processBatch = <T, R>(
  items: T[], 
  processFn: (item: T) => R, 
  batchSize = 1000
): R[] => {
  const results: R[] = [];
  const totalItems = items.length;
  
  // Process in chunks to avoid memory issues with large datasets
  for (let i = 0; i < totalItems; i += batchSize) {
    const batchEnd = Math.min(i + batchSize, totalItems);
    const batch = items.slice(i, batchEnd);
    
    console.log(`Processing batch ${i/batchSize + 1}/${Math.ceil(totalItems/batchSize)}: items ${i+1}-${batchEnd}`);
    
    batch.forEach(item => {
      results.push(processFn(item));
    });
    
    // Give a breather to the JavaScript event loop
    if (i + batchSize < totalItems) {
      setTimeout(() => {}, 0);
    }
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
  
  // Protect against bad indices
  if (startIndex >= data.length) {
    console.warn(`Pagination issue: startIndex (${startIndex}) >= data.length (${data.length})`);
    return [];
  }
  
  console.log(`Getting visible rows: ${startIndex + 1}-${endIndex} of ${data.length}`);
  return data.slice(startIndex, endIndex);
};

// Memory-efficient filter function for large datasets
export const filterLargeDataset = (data: any[], filterFn: (item: any) => boolean, chunkSize = 2000): any[] => {
  const result: any[] = [];
  const totalItems = data.length;
  
  for (let i = 0; i < totalItems; i += chunkSize) {
    const endIdx = Math.min(i + chunkSize, totalItems);
    const chunk = data.slice(i, endIdx);
    
    // Filter this chunk and add matching items to result
    chunk.forEach(item => {
      if (filterFn(item)) {
        result.push(item);
      }
    });
  }
  
  return result;
};

// Generate complete CSV content with all information visible and proper ID number formatting
export const generateCsvContent = (data: any[], includeHeaders = true): string => {
  const headers = "No.,Full Name,Email Address,Organization,Date Of Birth,Gender,Region,Constituency,ID Type,ID Number (Complete)\n";
  const chunkSize = 1000;
  let csvContent = includeHeaders ? headers : '';
  const totalItems = data.length;
  
  console.log(`Generating complete CSV for ${totalItems} records with all data visible`);
  
  for (let i = 0; i < totalItems; i += chunkSize) {
    const endIdx = Math.min(i + chunkSize, totalItems);
    console.log(`Processing complete CSV chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(totalItems/chunkSize)}`);
    
    // Process this chunk with complete data
    for (let j = i; j < endIdx; j++) {
      const voter = data[j];
      const rowNum = j + 1; // 1-based row numbering
      
      // Format with complete information - no censoring, preserve exact ID numbers
      const dob = voter.date_of_birth ? voter.date_of_birth.split('T')[0] : '';
      const idType = voter.identification_type === 'birth_certificate' ? 'Birth Certificate' : 
                    voter.identification_type === 'identification_document' ? 'ID Document' :
                    voter.identification_type === 'passport_number' ? 'Passport' : '';
      
      // Format ID number as text to prevent Excel from converting to scientific notation
      const idNumber = voter.identification_number || '';
      
      csvContent += `${rowNum},"${voter.full_name || ''}","${voter.email || ''}","${voter.organization || ''}","${dob}","${voter.gender || ''}","${voter.region || ''}","${voter.constituency || ''}","${idType}","${idNumber}"\n`;
    }
  }
  
  return csvContent;
};

// Function to download generated content
export const downloadCsv = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Important: revoke object URL to free memory
  setTimeout(() => URL.revokeObjectURL(url), 100);
};
