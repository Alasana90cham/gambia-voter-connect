import React, { useState, useEffect } from 'react';
import { RegistrationTableProps } from './RegistrationTableProps';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Search, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

const RegistrationTable: React.FC<RegistrationTableProps> = ({
  voterData,
  filteredData,
  regionData,
  constituencyData,
  currentPage,
  pageSize,
  setCurrentPage,
  setPageSize,
  totalPages,
  totalRecords,
  filters,
  setFilters,
  isLoading,
  handleExcelExport
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [visibleData, setVisibleData] = useState<any[]>([]);
  
  // Calculate visible rows based on current page and page size
  useEffect(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredData.length);
    setVisibleData(filteredData.slice(startIndex, endIndex));
  }, [filteredData, currentPage, pageSize]);
  
  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters({
      ...filters,
      [key]: value
    });
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
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
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of visible page range
      let startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 3);
      
      // Adjust if we're near the beginning
      if (currentPage <= Math.floor(maxVisiblePages / 2) + 1) {
        endPage = maxVisiblePages - 1;
      }
      
      // Adjust if we're near the end
      if (currentPage >= totalPages - Math.floor(maxVisiblePages / 2)) {
        startPage = totalPages - maxVisiblePages + 2;
      }
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push('...');
      }
      
      // Add visible page range
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <CardTitle>Voter Registrations</CardTitle>
            <CardDescription>
              {isLoading ? (
                <Skeleton className="h-4 w-[250px]" />
              ) : (
                `Showing ${Math.min(filteredData.length, 1 + (currentPage - 1) * pageSize)}-${Math.min(currentPage * pageSize, filteredData.length)} of ${totalRecords} total registrations`
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? <X className="h-4 w-4 mr-2" /> : <Filter className="h-4 w-4 mr-2" />}
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExcelExport}
              disabled={isLoading || filteredData.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {showFilters && (
        <CardContent className="border-b pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Full Name</label>
              <Input
                placeholder="Search by name"
                value={filters.fullName}
                onChange={(e) => handleFilterChange('fullName', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Organization</label>
              <Input
                placeholder="Search by organization"
                value={filters.organization}
                onChange={(e) => handleFilterChange('organization', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Date of Birth</label>
              <Input
                type="date"
                value={filters.dateOfBirth}
                onChange={(e) => handleFilterChange('dateOfBirth', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Gender</label>
              <Select 
                value={filters.gender} 
                onValueChange={(value) => handleFilterChange('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Region</label>
              <Select 
                value={filters.region} 
                onValueChange={(value) => handleFilterChange('region', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All regions</SelectItem>
                  {regionData.map((region) => (
                    <SelectItem key={region.name} value={region.name}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Constituency</label>
              <Input
                placeholder="Search by constituency"
                value={filters.constituency}
                onChange={(e) => handleFilterChange('constituency', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">ID Type</label>
              <Select 
                value={filters.identificationType} 
                onValueChange={(value) => handleFilterChange('identificationType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All ID types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All ID types</SelectItem>
                  <SelectItem value="National ID">National ID</SelectItem>
                  <SelectItem value="Passport">Passport</SelectItem>
                  <SelectItem value="Voter's Card">Voter's Card</SelectItem>
                  <SelectItem value="Driver's License">Driver's License</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">ID Number</label>
              <Input
                placeholder="Search by ID number"
                value={filters.identificationNumber}
                onChange={(e) => handleFilterChange('identificationNumber', e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      )}
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Constituency</TableHead>
                <TableHead>ID Type</TableHead>
                <TableHead>ID Number</TableHead>
                <TableHead>Registration Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeletons
                Array(pageSize).fill(0).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    {Array(9).fill(0).map((_, cellIndex) => (
                      <TableCell key={`cell-${index}-${cellIndex}`}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : visibleData.length > 0 ? (
                // Actual data rows
                visibleData.map((voter) => (
                  <TableRow key={voter.id}>
                    <TableCell className="font-medium">{voter.full_name}</TableCell>
                    <TableCell>{voter.organization}</TableCell>
                    <TableCell>{voter.date_of_birth}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {voter.gender}
                      </Badge>
                    </TableCell>
                    <TableCell>{voter.region}</TableCell>
                    <TableCell>{voter.constituency}</TableCell>
                    <TableCell>{voter.identification_type}</TableCell>
                    <TableCell>{voter.identification_number}</TableCell>
                    <TableCell>{formatDate(voter.created_at)}</TableCell>
                  </TableRow>
                ))
              ) : (
                // No data message
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No registrations found matching your criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select 
            value={pageSize.toString()} 
            onValueChange={(value) => setPageSize(Number(value))}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {getPageNumbers().map((page, index) => (
            typeof page === 'number' ? (
              <Button
                key={`page-${index}`}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => handlePageChange(page)}
                disabled={isLoading}
              >
                {page}
              </Button>
            ) : (
              <span key={`ellipsis-${index}`} className="px-2">
                {page}
              </span>
            )
          ))}
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default RegistrationTable;
