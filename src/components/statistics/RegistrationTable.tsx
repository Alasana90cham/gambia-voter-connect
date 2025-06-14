import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, Download, Printer, ListOrdered } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  generatePaginationItems
} from "@/components/ui/pagination";
import { NoDataRow, formatForExport } from './RegistrationTableHelpers';

interface ChartData {
  name: string;
  value: number;
}

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
  created_at: string;
}

interface FilterState {
  fullName: string;
  organization: string;
  dateOfBirth: string;
  gender: string;
  region: string;
  constituency: string;
  identificationType: string;
  identificationNumber: string;
}

interface RegistrationTableProps {
  voterData: VoterData[];
  filteredData: VoterData[];
  regionData: ChartData[];
  constituencyData: {[key: string]: ChartData[]};
  onUpdateFilters: (filters: FilterState) => void;
  filters: FilterState;
  onDeleteSuccess?: () => void; // Prop to trigger parent refresh
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  setPageSize?: (size: number) => void;
  setCurrentPage?: (page: number) => void;
  isLoading?: boolean;
}

const RegistrationTable: React.FC<RegistrationTableProps> = ({
  voterData,
  filteredData,
  regionData,
  constituencyData,
  onUpdateFilters,
  filters,
  onDeleteSuccess,
  currentPage: propCurrentPage,
  totalPages: propTotalPages,
  pageSize: propPageSize,
  setPageSize: propSetPageSize,
  setCurrentPage: propSetCurrentPage,
  isLoading: propIsLoading
}) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [localData, setLocalData] = useState<VoterData[]>(filteredData);
  
  // Use props or local state for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [isPageChanging, setIsPageChanging] = useState(false);
  const [recordsPerPage, setRecordsPerPage] = useState(100);
  
  // Determine whether to use local or prop-based pagination
  const useLocalPagination = !propCurrentPage && !propSetCurrentPage;
  const effectiveCurrentPage = useLocalPagination ? currentPage : propCurrentPage || 1;
  const effectiveSetCurrentPage = useLocalPagination ? setCurrentPage : propSetCurrentPage || setCurrentPage;
  const effectivePageSize = useLocalPagination ? recordsPerPage : propPageSize || 100;
  const effectiveSetPageSize = useLocalPagination ? setRecordsPerPage : propSetPageSize || setRecordsPerPage;
  const isLoading = propIsLoading || false;
  
  // Update local data when filteredData changes and sort by creation date (first come first serve)
  useEffect(() => {
    const sortedData = [...filteredData].sort((a, b) => {
      // Sort by created_at in ascending order (oldest first = first come first serve)
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateA - dateB;
    });
    setLocalData(sortedData);
  }, [filteredData]);
  
  // Filter handling functions
  const handleFilterChange = (field: keyof FilterState, value: string) => {
    onUpdateFilters({
      ...filters,
      [field]: value
    });
  };
  
  const clearFilters = () => {
    onUpdateFilters({
      fullName: '',
      organization: '',
      dateOfBirth: '',
      gender: '',
      region: '',
      constituency: '',
      identificationType: '',
      identificationNumber: ''
    });
  };
  
  const toggleRowSelection = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };
  
  const selectAllRows = () => {
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedData.map(voter => voter.id));
    }
  };
  
  const getFilteredConstituencies = () => {
    if (filters.region && constituencyData[filters.region]) {
      return constituencyData[filters.region] || [];
    }
    
    // If no region filter, combine all constituencies from all regions
    const allConstituencies: ChartData[] = [];
    Object.values(constituencyData).forEach(constituencies => {
      if (Array.isArray(constituencies)) {
        constituencies.forEach(constituency => {
          // Avoid duplicates
          if (!allConstituencies.some(item => item.name === constituency.name)) {
            allConstituencies.push(constituency);
          }
        });
      }
    });
    
    return allConstituencies;
  };
  
  // Updated export function to show all data without any censoring and proper ID number formatting
  const handleExcelExport = () => {
    // Create a CSV string with the filtered data showing complete information
    const headers = "No.,Full Name,Email,Organization,Date Of Birth,Gender,Region,Constituency,ID Type,ID Number,Registration Date\n";
    let csvContent = headers;
    
    // Add the filtered data rows with complete information (no redaction or censoring)
    // Sort by registration date for first-come-first-serve order
    const sortedForExport = [...filteredData].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateA - dateB;
    });
    
    sortedForExport.forEach((voter, index) => {
      const dob = voter.date_of_birth ? voter.date_of_birth.split('T')[0] : '';
      const registrationDate = voter.created_at ? new Date(voter.created_at).toLocaleDateString() : '';
      const idType = voter.identification_type === 'birth_certificate' ? 'Birth Certificate' : 
                    voter.identification_type === 'identification_document' ? 'ID Document' :
                    voter.identification_type === 'passport_number' ? 'Passport' : '';
      
      // Show complete ID number without any masking or censoring, format as text to prevent scientific notation
      const idNumber = voter.identification_number || '';
      csvContent += `${index + 1},"${voter.full_name || ''}","${voter.email || ''}","${voter.organization || ''}","${dob}","${voter.gender || ''}","${voter.region || ''}","${voter.constituency || ''}","${idType}","${idNumber}","${registrationDate}"\n`;
    });
    
    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NYPG_Voter_Statistics_FirstComeFirstServe_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: `${filteredData.length} complete records exported in first-come-first-serve order`,
    });
  };

  // Enhanced print function to show all data without any censoring in first-come-first-serve order
  const handlePrint = () => {
    if (tableRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        // Sort data for printing in first-come-first-serve order
        const sortedForPrint = [...filteredData].sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateA - dateB;
        });
        
        printWindow.document.write('<html><head><title>NYPG Complete Voter Registration Data - First Come First Serve</title>');
        printWindow.document.write('<style>');
        printWindow.document.write('@media print {');
        printWindow.document.write('  @page { size: landscape; margin: 0.5cm; }');
        printWindow.document.write('  table { border-collapse: collapse; width: 100%; font-size: 9px; }');
        printWindow.document.write('  th, td { border: 1px solid #ddd; padding: 3px; text-align: left; font-size: 9px; }');
        printWindow.document.write('  th { background-color: #f2f2f2; font-weight: bold; }');
        printWindow.document.write('  h1 { font-size: 16px; margin-bottom: 10px; }');
        printWindow.document.write('  h3 { font-size: 14px; margin-bottom: 10px; }');
        printWindow.document.write('  .print-info { font-size: 12px; margin-bottom: 15px; }');
        printWindow.document.write('}');
        printWindow.document.write('table { border-collapse: collapse; width: 100%; font-size: 10px; }');
        printWindow.document.write('th, td { border: 1px solid #ddd; padding: 4px; text-align: left; }');
        printWindow.document.write('th { background-color: #f2f2f2; font-weight: bold; }');
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<h1>National Youth Parliament Gambia - Complete Registration Data (First Come First Serve)</h1>');
        printWindow.document.write('<div class="print-info">');
        printWindow.document.write('<h3>Complete Export - All Information in Registration Order</h3>');
        printWindow.document.write('<p>Exported on: ' + new Date().toLocaleDateString() + ' at ' + new Date().toLocaleTimeString() + '</p>');
        printWindow.document.write('<p>Total Records: ' + filteredData.length + '</p>');
        printWindow.document.write('<p>Note: Records are sorted by registration date (first registered appears first)</p>');
        printWindow.document.write('</div>');
        printWindow.document.write('<table>');
        
        // Table headers with all columns including complete information
        printWindow.document.write('<tr>');
        printWindow.document.write('<th style="width: 3%;">No.</th>');
        printWindow.document.write('<th style="width: 13%;">Full Name</th>');
        printWindow.document.write('<th style="width: 15%;">Email Address</th>');
        printWindow.document.write('<th style="width: 12%;">Organization</th>');
        printWindow.document.write('<th style="width: 8%;">Date of Birth</th>');
        printWindow.document.write('<th style="width: 6%;">Gender</th>');
        printWindow.document.write('<th style="width: 8%;">Region</th>');
        printWindow.document.write('<th style="width: 10%;">Constituency</th>');
        printWindow.document.write('<th style="width: 8%;">ID Type</th>');
        printWindow.document.write('<th style="width: 12%;">ID Number</th>');
        printWindow.document.write('<th style="width: 10%;">Registration Date</th>');
        printWindow.document.write('</tr>');
        
        // Table data with complete information in first-come-first-serve order
        sortedForPrint.forEach((voter, index) => {
          const dob = voter.date_of_birth ? voter.date_of_birth.split('T')[0] : '';
          const registrationDate = voter.created_at ? new Date(voter.created_at).toLocaleDateString() : '';
          const idType = voter.identification_type === 'birth_certificate' ? 'Birth Certificate' : 
                        voter.identification_type === 'identification_document' ? 'ID Document' :
                        voter.identification_type === 'passport_number' ? 'Passport' : '';
          
          // Show complete ID number without any masking or censoring
          const idNumber = voter.identification_number || '';
          
          printWindow.document.write('<tr>');
          printWindow.document.write(`<td>${index + 1}</td>`);
          printWindow.document.write(`<td>${voter.full_name || ''}</td>`);
          printWindow.document.write(`<td>${voter.email || ''}</td>`);
          printWindow.document.write(`<td>${voter.organization || ''}</td>`);
          printWindow.document.write(`<td>${dob}</td>`);
          printWindow.document.write(`<td>${voter.gender || ''}</td>`);
          printWindow.document.write(`<td>${voter.region || ''}</td>`);
          printWindow.document.write(`<td>${voter.constituency || ''}</td>`);
          printWindow.document.write(`<td>${idType}</td>`);
          printWindow.document.write(`<td>${idNumber}</td>`);
          printWindow.document.write(`<td>${registrationDate}</td>`);
          printWindow.document.write('</tr>');
        });
        
        printWindow.document.write('</table>');
        printWindow.document.write('<div style="margin-top: 20px; font-size: 12px;">');
        printWindow.document.write('<p><strong>Total records printed: ' + filteredData.length + ' (in registration order)</strong></p>');
        printWindow.document.write('<p>This document contains complete voter registration information sorted by registration date.</p>');
        printWindow.document.write('</div>');
        printWindow.document.write('<div style="text-align: center; margin-top: 30px; page-break-inside: avoid;">');
        printWindow.document.write('<button onclick="window.print()" style="margin-right: 10px; padding: 10px 20px;">Print This Page</button>');
        printWindow.document.write('<button onclick="window.close()" style="padding: 10px 20px;">Close Window</button>');
        printWindow.document.write('</div>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        
        // Auto-focus the print window
        printWindow.focus();
      }
    }
  };
  
  // Optimized pagination for large datasets
  const indexOfLastRecord = effectiveCurrentPage * effectivePageSize;
  const indexOfFirstRecord = indexOfLastRecord - effectivePageSize;
  const paginatedData = localData.slice(indexOfFirstRecord, indexOfLastRecord);
  
  const totalPages = Math.ceil(localData.length / effectivePageSize);
  
  // Improved page change handler with animation
  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === effectiveCurrentPage) return;
    
    setIsPageChanging(true);
    effectiveSetCurrentPage(newPage);
    
    // Add slight delay for visual feedback
    setTimeout(() => {
      setIsPageChanging(false);
    }, 300);
  };
  
  // Use the generatePaginationItems function for better pagination with large datasets
  const pageNumbers = generatePaginationItems(effectiveCurrentPage, totalPages);
  
  // Reset to first page when filters change
  useEffect(() => {
    effectiveSetCurrentPage(1);
  }, [filters, effectiveSetCurrentPage]);
  
  // Reset selected rows when page changes or data changes
  useEffect(() => {
    setSelectedRows([]);
  }, [effectiveCurrentPage, localData]);
  
  // Set up real-time subscription for deleted rows with privacy protection
  useEffect(() => {
    console.log("Setting up real-time subscription for voter updates");
    
    const channel = supabase
      .channel('voter-delete-events')
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'voters'
      }, (payload) => {
        console.log("Received real-time DELETE event");
        
        // Update local data immediately when a delete happens elsewhere
        if (payload.old && payload.old.id) {
          setLocalData(prev => prev.filter(voter => voter.id !== payload.old.id));
        }
      })
      .subscribe((status) => {
        console.log("Voter delete subscription status:", status);
        if (status === 'CHANNEL_ERROR') {
          console.error("Error with delete event subscription");
          toast({
            title: "Sync Error",
            description: "Realtime updates for deletions may not work. Please refresh if you see inconsistencies.",
            variant: "destructive",
          });
        }
      });
      
    return () => {
      console.log("Cleaning up delete events subscription");
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.error("Error removing delete events channel");
      }
    };
  }, []);
  
  // Additional data loading indicator for large datasets
  const renderLoadingState = () => {
    if (!isLoading) return null;
    
    return (
      <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
        <div className="flex flex-col items-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <div className="mt-4 text-lg">Processing data...</div>
        </div>
      </div>
    );
  };

  // Updated VoterRow component to show complete information with registration order number
  const VoterRow = ({ voter, index }) => {
    const dob = voter.date_of_birth ? voter.date_of_birth.split('T')[0] : '';
    const registrationDate = voter.created_at ? new Date(voter.created_at).toLocaleDateString() : '';
    const idType = voter.identification_type === 'birth_certificate' ? 'Birth Certificate' : 
                  voter.identification_type === 'identification_document' ? 'ID Document' :
                  voter.identification_type === 'passport_number' ? 'Passport' : '';
    
    return (
      <TableRow key={voter.id}>
        <TableCell className="font-medium text-center">{indexOfFirstRecord + index + 1}</TableCell>
        <TableCell>{voter.full_name}</TableCell>
        <TableCell>{voter.organization}</TableCell>
        <TableCell>{dob}</TableCell>
        <TableCell>{voter.gender}</TableCell>
        <TableCell>{voter.region}</TableCell>
        <TableCell>{voter.constituency}</TableCell>
        <TableCell>{idType}</TableCell>
        <TableCell>{voter.identification_number}</TableCell>
        <TableCell className="text-xs">{registrationDate}</TableCell>
      </TableRow>
    );
  };
  
  // Page size options for large datasets
  const pageSizeOptions = [50, 100, 250, 500, 1000];

  return (
    <Card className="p-6 mb-8 relative">
      {renderLoadingState()}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl font-semibold">Registration Data - First Come First Serve Order</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
            <Filter size={16} />
            Clear Filters
          </Button>
          <Button variant="outline" onClick={handleExcelExport} className="flex items-center gap-2">
            <Download size={16} />
            Export Complete CSV
          </Button>
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2" id="printTable">
            <Printer size={16} />
            Print Complete Data
          </Button>
        </div>
      </div>
      
      <div className={`overflow-x-auto transition-opacity duration-300 ${isPageChanging ? 'opacity-70' : 'opacity-100'}`} ref={tableRef}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">
                <div className="space-y-1">
                  <div className="flex items-center justify-center">
                    <ListOrdered size={16} className="mr-1" />
                    No.
                  </div>
                </div>
              </TableHead>
              <TableHead>
                <div className="space-y-1">
                  <div>Full Name</div>
                  <Input 
                    placeholder="Filter name..." 
                    className="h-8 w-full" 
                    value={filters.fullName}
                    onChange={(e) => handleFilterChange('fullName', e.target.value)}
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="space-y-1">
                  <div>Organization</div>
                  <Input 
                    placeholder="Filter organization..." 
                    className="h-8 w-full" 
                    value={filters.organization}
                    onChange={(e) => handleFilterChange('organization', e.target.value)}
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="space-y-1">
                  <div>Date of Birth</div>
                  <Input 
                    placeholder="YYYY-MM-DD" 
                    className="h-8 w-full"
                    pattern="\d{4}-\d{2}-\d{2}"
                    value={filters.dateOfBirth}
                    onChange={(e) => handleFilterChange('dateOfBirth', e.target.value)}
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="space-y-1">
                  <div>Gender</div>
                  <select 
                    className="h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
                    value={filters.gender}
                    onChange={(e) => handleFilterChange('gender', e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </TableHead>
              <TableHead>
                <div className="space-y-1">
                  <div>Region</div>
                  <select 
                    className="h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
                    value={filters.region}
                    onChange={(e) => handleFilterChange('region', e.target.value)}
                  >
                    <option value="">All Regions</option>
                    {regionData.map((region) => (
                      <option key={region.name} value={region.name}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>
              </TableHead>
              <TableHead>
                <div className="space-y-1">
                  <div>Constituency</div>
                  <Input 
                    placeholder="Filter constituency..." 
                    className="h-8 w-full" 
                    value={filters.constituency}
                    onChange={(e) => handleFilterChange('constituency', e.target.value)}
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="space-y-1">
                  <div>ID Type</div>
                  <select 
                    className="h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
                    value={filters.identificationType}
                    onChange={(e) => handleFilterChange('identificationType', e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="birth_certificate">Birth Certificate</option>
                    <option value="identification_document">ID Document</option>
                    <option value="passport_number">Passport</option>
                  </select>
                </div>
              </TableHead>
              <TableHead>
                <div className="space-y-1">
                  <div>ID Number</div>
                  <Input 
                    placeholder="Filter ID..." 
                    className="h-8 w-full"
                    value={filters.identificationNumber}
                    onChange={(e) => handleFilterChange('identificationNumber', e.target.value)}
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="space-y-1">
                  <div>Reg. Date</div>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <NoDataRow />
            ) : (
              paginatedData.map((voter, index) => (
                <VoterRow 
                  key={voter.id} 
                  voter={voter}
                  index={index}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Page size selector */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm">Rows per page:</span>
          <select 
            className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background"
            value={effectivePageSize}
            onChange={(e) => effectiveSetPageSize(Number(e.target.value))}
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        
        <div className="text-sm text-gray-600">
          Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, localData.length)} of {localData.length} registrations
          {localData.length !== voterData.length && ` (filtered from ${voterData.length} total)`}
        </div>
      </div>
      
      {/* Enhanced pagination controls */}
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => changePage(effectiveCurrentPage - 1)}
                className={effectiveCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {pageNumbers.map((pageNumber, i) => (
              pageNumber === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    isActive={effectiveCurrentPage === pageNumber}
                    onClick={() => changePage(pageNumber as number)}
                    className={`cursor-pointer transition-all ${
                      isPageChanging ? 'bg-opacity-70' : ''
                    }`}
                    aria-current={effectiveCurrentPage === pageNumber ? 'page' : undefined}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              )
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => changePage(effectiveCurrentPage + 1)}
                className={effectiveCurrentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </Card>
  );
};

export default RegistrationTable;
