import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, Download, Printer } from 'lucide-react';
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
}

const RegistrationTable: React.FC<RegistrationTableProps> = ({
  voterData,
  filteredData,
  regionData,
  constituencyData,
  onUpdateFilters,
  filters,
  onDeleteSuccess
}) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [localData, setLocalData] = useState<VoterData[]>(filteredData);
  
  // Update local data when filteredData changes
  useEffect(() => {
    setLocalData(filteredData);
  }, [filteredData]);
  
  // Improved pagination state with more feedback
  const [currentPage, setCurrentPage] = useState(1);
  const [isPageChanging, setIsPageChanging] = useState(false);
  const recordsPerPage = 100;
  
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
  
  const handleExcelExport = () => {
    // Create a CSV string with the filtered data
    const headers = "Full Name,Email,Organization,Date Of Birth,Gender,Region,Constituency,ID Type,ID Number\n";
    let csvContent = headers;
    
    // Add the filtered data rows with full information (no redaction for admins)
    filteredData.forEach(voter => {
      csvContent += formatForExport(voter) + "\n";
    });
    
    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NYPG_Voter_Statistics_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: `${filteredData.length} records have been exported to CSV format`,
    });
  };

  const handlePrint = () => {
    if (tableRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Voter Registration Data</title>');
        printWindow.document.write('<style>');
        printWindow.document.write('table { border-collapse: collapse; width: 100%; }');
        printWindow.document.write('th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }');
        printWindow.document.write('th { background-color: #f2f2f2; }');
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<h1>NYPG Voter Registration Data</h1>');
        printWindow.document.write('<h3>Exported on ' + new Date().toLocaleDateString() + '</h3>');
        printWindow.document.write('<table>');
        
        // Table headers
        printWindow.document.write('<tr>');
        printWindow.document.write('<th>Full Name</th>');
        printWindow.document.write('<th>Email</th>'); // Now including email for admin print
        printWindow.document.write('<th>Organization</th>');
        printWindow.document.write('<th>Date of Birth</th>');
        printWindow.document.write('<th>Gender</th>');
        printWindow.document.write('<th>Region</th>');
        printWindow.document.write('<th>Constituency</th>');
        printWindow.document.write('<th>ID Type</th>');
        printWindow.document.write('<th>ID Number</th>');
        printWindow.document.write('</tr>');
        
        // Table data with full information (no masking for admins)
        filteredData.forEach(voter => {
          const dob = voter.date_of_birth ? voter.date_of_birth.split('T')[0] : '';
          const idType = voter.identification_type === 'birth_certificate' ? 'Birth Certificate' : 
                        voter.identification_type === 'identification_document' ? 'ID Document' :
                        voter.identification_type === 'passport_number' ? 'Passport' : '';
          
          printWindow.document.write('<tr>');
          printWindow.document.write(`<td>${voter.full_name}</td>`);
          printWindow.document.write(`<td>${voter.email}</td>`); // Show full email
          printWindow.document.write(`<td>${voter.organization}</td>`);
          printWindow.document.write(`<td>${dob}</td>`);
          printWindow.document.write(`<td>${voter.gender || ''}</td>`);
          printWindow.document.write(`<td>${voter.region || ''}</td>`);
          printWindow.document.write(`<td>${voter.constituency || ''}</td>`);
          printWindow.document.write(`<td>${idType}</td>`);
          printWindow.document.write(`<td>${voter.identification_number}</td>`); // Show full ID number
          printWindow.document.write('</tr>');
        });
        
        printWindow.document.write('</table>');
        printWindow.document.write('<p>Total records: ' + filteredData.length + '</p>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
      }
    }
  };
  
  // Enhanced pagination logic with animation feedback
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const paginatedData = localData.slice(indexOfFirstRecord, indexOfLastRecord);
  
  const totalPages = Math.ceil(localData.length / recordsPerPage);
  
  // Improved page change handler with animation
  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    
    setIsPageChanging(true);
    setCurrentPage(newPage);
    
    // Add slight delay for visual feedback
    setTimeout(() => {
      setIsPageChanging(false);
    }, 300);
  };
  
  // Generate page numbers for pagination with enhanced visibility
  const getPageNumbers = () => {
    const pages = [];
    const maxDisplayedPages = 5;
    
    if (totalPages <= maxDisplayedPages) {
      // If we have 5 or fewer pages, show all page numbers
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Handle case with more than 5 pages
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Somewhere in the middle
        pages.push(1);
        pages.push('ellipsis');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };
  
  const pageNumbers = getPageNumbers();

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);
  
  // Reset selected rows when page changes or data changes
  useEffect(() => {
    setSelectedRows([]);
  }, [currentPage, localData]);
  
  // Set up real-time subscription for deleted rows with privacy protection
  useEffect(() => {
    // Avoiding direct logging of sensitive data
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

  // Updated VoterRow component - with no selection checkbox
  const VoterRow = ({ voter }) => {
    const dob = voter.date_of_birth ? voter.date_of_birth.split('T')[0] : '';
    const idType = voter.identification_type === 'birth_certificate' ? 'Birth Certificate' : 
                  voter.identification_type === 'identification_document' ? 'ID Document' :
                  voter.identification_type === 'passport_number' ? 'Passport' : '';
    
    return (
      <TableRow key={voter.id}>
        <TableCell>{voter.full_name}</TableCell>
        <TableCell>{voter.organization}</TableCell>
        <TableCell>{dob}</TableCell>
        <TableCell>{voter.gender}</TableCell>
        <TableCell>{voter.region}</TableCell>
        <TableCell>{voter.constituency}</TableCell>
        <TableCell>{idType}</TableCell>
        <TableCell>{voter.identification_number}</TableCell>
      </TableRow>
    );
  };

  return (
    <Card className="p-6 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl font-semibold">Registration Data</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
            <Filter size={16} />
            Clear Filters
          </Button>
          <Button variant="outline" onClick={handleExcelExport} className="flex items-center gap-2">
            <Download size={16} />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2" id="printTable">
            <Printer size={16} />
            Print
          </Button>
        </div>
      </div>
      
      <div className={`overflow-x-auto transition-opacity duration-300 ${isPageChanging ? 'opacity-70' : 'opacity-100'}`} ref={tableRef}>
        <Table>
          <TableHeader>
            <TableRow>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <NoDataRow />
            ) : (
              paginatedData.map((voter) => (
                <VoterRow 
                  key={voter.id} 
                  voter={voter}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Enhanced pagination controls with better state feedback */}
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => changePage(currentPage - 1)}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
                    isActive={currentPage === pageNumber}
                    onClick={() => changePage(pageNumber as number)}
                    className={`cursor-pointer transition-all ${
                      isPageChanging ? 'bg-opacity-70' : ''
                    }`}
                    aria-current={currentPage === pageNumber ? 'page' : undefined}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              )
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => changePage(currentPage + 1)}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p>
          Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, localData.length)} of {localData.length} registrations
          {localData.length !== voterData.length && ` (filtered from ${voterData.length} total)`}
        </p>
      </div>
    </Card>
  );
};

export default RegistrationTable;
