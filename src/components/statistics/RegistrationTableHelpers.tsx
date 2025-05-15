
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

// Enhanced export formatter for large datasets - no censoring
export const formatForExport = (voter: VoterData) => {
  const dob = voter.date_of_birth ? voter.date_of_birth.split('T')[0] : '';
  const idType = voter.identification_type === 'birth_certificate' ? 'Birth Certificate' : 
                voter.identification_type === 'identification_document' ? 'ID Document' :
                voter.identification_type === 'passport_number' ? 'Passport' : '';
  
  // No masking for exports - show complete data
  return `"${voter.full_name || ''}","${voter.email || ''}","${voter.organization || ''}","${dob}","${voter.gender || ''}","${voter.region || ''}","${voter.constituency || ''}","${idType}","${voter.identification_number || ''}"`;
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

// Generate CSV content in memory-efficient chunks
export const generateCsvContent = (data: any[], includeHeaders = true): string => {
  const headers = "No.,Full Name,Email,Organization,Date Of Birth,Gender,Region,Constituency,ID Type,ID Number\n";
  const chunkSize = 1000;
  let csvContent = includeHeaders ? headers : '';
  const totalItems = data.length;
  
  console.log(`Generating CSV for ${totalItems} records in chunks of ${chunkSize}`);
  
  for (let i = 0; i < totalItems; i += chunkSize) {
    const endIdx = Math.min(i + chunkSize, totalItems);
    console.log(`Processing CSV chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(totalItems/chunkSize)}`);
    
    // Process this chunk
    for (let j = i; j < endIdx; j++) {
      const voter = data[j];
      const rowNum = j + 1; // 1-based row numbering
      csvContent += `${rowNum},${formatForExport(voter)}\n`;
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
