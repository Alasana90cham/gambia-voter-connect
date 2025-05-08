import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, Download, Printer, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
}

const RegistrationTable: React.FC<RegistrationTableProps> = ({
  voterData,
  filteredData,
  regionData,
  constituencyData,
  onUpdateFilters,
  filters
}) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const [constituencySearchOpen, setConstituencySearchOpen] = useState(false);
  
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
  
  // Get all available constituencies based on selected region, or all constituencies if no region selected
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
  
  const availableConstituencies = getFilteredConstituencies();
  
  const handleExcelExport = () => {
    // Create a CSV string with the filtered data
    const headers = "Full Name,Email,Organization,Date Of Birth,Gender,Region,Constituency,ID Type,ID Number\n";
    let csvContent = headers;
    
    // Add the filtered data rows
    filteredData.forEach(voter => {
      const dob = voter.date_of_birth ? voter.date_of_birth.split('T')[0] : '';
      const idType = voter.identification_type === 'birth_certificate' ? 'Birth Certificate' : 
                    voter.identification_type === 'identification_document' ? 'ID Document' :
                    voter.identification_type === 'passport_number' ? 'Passport' : '';
      
      csvContent += `"${voter.full_name}","${voter.email}","${voter.organization}","${dob}","${voter.gender || ''}","${voter.region || ''}","${voter.constituency || ''}","${idType}","${voter.identification_number}"\n`;
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
        printWindow.document.write('<th>Email</th>');
        printWindow.document.write('<th>Organization</th>');
        printWindow.document.write('<th>Date of Birth</th>');
        printWindow.document.write('<th>Gender</th>');
        printWindow.document.write('<th>Region</th>');
        printWindow.document.write('<th>Constituency</th>');
        printWindow.document.write('<th>ID Type</th>');
        printWindow.document.write('<th>ID Number</th>');
        printWindow.document.write('</tr>');
        
        // Table data
        filteredData.forEach(voter => {
          const dob = voter.date_of_birth ? voter.date_of_birth.split('T')[0] : '';
          const idType = voter.identification_type === 'birth_certificate' ? 'Birth Certificate' : 
                        voter.identification_type === 'identification_document' ? 'ID Document' :
                        voter.identification_type === 'passport_number' ? 'Passport' : '';
          
          printWindow.document.write('<tr>');
          printWindow.document.write(`<td>${voter.full_name}</td>`);
          printWindow.document.write(`<td>${voter.email}</td>`);
          printWindow.document.write(`<td>${voter.organization}</td>`);
          printWindow.document.write(`<td>${dob}</td>`);
          printWindow.document.write(`<td>${voter.gender || ''}</td>`);
          printWindow.document.write(`<td>${voter.region || ''}</td>`);
          printWindow.document.write(`<td>${voter.constituency || ''}</td>`);
          printWindow.document.write(`<td>${idType}</td>`);
          printWindow.document.write(`<td>${voter.identification_number}</td>`);
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

  return (
    <Card className="p-6 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl font-semibold">Registration Data</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
            <Filter size={16} />
            Clear Filters
          </Button>
          <Button variant="outline" onClick={handleExcelExport} className="flex items-center gap-2">
            <Download size={16} />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
            <Printer size={16} />
            Print
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto" ref={tableRef}>
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
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No matching records found
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((voter, index) => (
                <TableRow key={voter.id || index}>
                  <TableCell>{voter.full_name}</TableCell>
                  <TableCell>{voter.organization}</TableCell>
                  <TableCell>{voter.date_of_birth ? voter.date_of_birth.split('T')[0] : ''}</TableCell>
                  <TableCell className="capitalize">{voter.gender || ''}</TableCell>
                  <TableCell>{voter.region || ''}</TableCell>
                  <TableCell>{voter.constituency || ''}</TableCell>
                  <TableCell>
                    {voter.identification_type === 'birth_certificate' ? 'Birth Certificate' : 
                     voter.identification_type === 'identification_document' ? 'ID Document' :
                     voter.identification_type === 'passport_number' ? 'Passport' : ''}
                  </TableCell>
                  <TableCell>{voter.identification_number}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>Showing {filteredData.length} of {voterData.length} registrations</p>
      </div>
    </Card>
  );
};

export default RegistrationTable;
