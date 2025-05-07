
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { fetchAdmins, addAdminUser, removeAdminUser, verifyAdminLogin, fetchVoterData } from '@/data/constituencies';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download, UserPlus, Filter, Search, Trash2, Printer } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { UserRole, VoterFormData } from "@/types/form";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
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

const Statistics = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Banjul');
  
  // Add tableRef for printing
  const tableRef = useRef<HTMLDivElement>(null);
  
  // New admin form state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminId, setNewAdminId] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  
  // Table filtering state
  const [filters, setFilters] = useState({
    fullName: '',
    organization: '',
    dateOfBirth: '',
    gender: '',
    region: '',
    constituency: '',
    identificationType: '',
    identificationNumber: ''
  });
  
  // Add state for constituency search dropdown
  const [constituencySearchOpen, setConstituencySearchOpen] = useState(false);
  
  // Voter data state
  const [voterData, setVoterData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  
  // Admin users state
  const [adminList, setAdminList] = useState<UserRole[]>([]);
  
  // Chart data state
  const [genderData, setGenderData] = useState<{ name: string; value: number }[]>([]);
  const [regionData, setRegionData] = useState<{ name: string; value: number }[]>([]);
  const [constituencyData, setConstituencyData] = useState<{[key: string]: { name: string; value: number }[]}>({}); 
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch voter data and prepare chart data
  const loadVoterData = async () => {
    setIsLoading(true);
    
    try {
      const voters = await fetchVoterData();
      setVoterData(voters);
      setFilteredData(voters);
      
      if (voters && voters.length > 0) {
        // Process gender data
        const genderCounts: Record<string, number> = {};
        voters.forEach((voter: any) => {
          const gender = voter.gender || 'Unknown';
          genderCounts[gender] = (genderCounts[gender] || 0) + 1;
        });
        
        const genderChartData = Object.keys(genderCounts).map(gender => ({
          name: gender.charAt(0).toUpperCase() + gender.slice(1), // Capitalize
          value: genderCounts[gender]
        }));
        setGenderData(genderChartData);
        
        // Process region data
        const regionCounts: Record<string, number> = {};
        voters.forEach((voter: any) => {
          const region = voter.region || 'Unknown';
          regionCounts[region] = (regionCounts[region] || 0) + 1;
        });
        
        const regionChartData = Object.keys(regionCounts).map(region => ({
          name: region,
          value: regionCounts[region]
        }));
        setRegionData(regionChartData);
        
        // Process constituency data
        const constituenciesByRegion: Record<string, Record<string, number>> = {};
        voters.forEach((voter: any) => {
          const region = voter.region || 'Unknown';
          const constituency = voter.constituency || 'Unknown';
          
          if (!constituenciesByRegion[region]) {
            constituenciesByRegion[region] = {};
          }
          
          constituenciesByRegion[region][constituency] = (constituenciesByRegion[region][constituency] || 0) + 1;
        });
        
        const constituencyChartData: {[key: string]: { name: string; value: number }[]} = {};
        Object.keys(constituenciesByRegion).forEach(region => {
          constituencyChartData[region] = Object.keys(constituenciesByRegion[region]).map(constituency => ({
            name: constituency,
            value: constituenciesByRegion[region][constituency]
          }));
        });
        setConstituencyData(constituencyChartData);
      }
    } catch (error) {
      console.error("Error loading voter data:", error);
      toast({
        title: "Data Loading Error",
        description: "Failed to load voter registration data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load admins
  const loadAdmins = async () => {
    try {
      const admins = await fetchAdmins();
      setAdminList(admins);
    } catch (error) {
      console.error("Error loading admins:", error);
    }
  };
  
  // Subscribe to realtime updates for admins
  const subscribeToAdmins = () => {
    const adminChannel = supabase
      .channel('admin-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'admins' 
      }, () => {
        // Reload admins when any change happens
        loadAdmins();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(adminChannel);
    };
  };
  
  // Initial data loading
  useEffect(() => {
    if (isAdmin) {
      loadVoterData();
      loadAdmins();
      
      // Subscribe to realtime updates
      const unsubscribe = subscribeToAdmins();
      
      return () => {
        unsubscribe();
      };
    }
  }, [isAdmin]);
  
  // Apply filters to the data
  useEffect(() => {
    if (!voterData.length) return;
    
    let result = voterData;
    
    if (filters.fullName) {
      result = result.filter(voter => 
        voter.full_name.toLowerCase().includes(filters.fullName.toLowerCase())
      );
    }
    
    if (filters.organization) {
      result = result.filter(voter => 
        voter.organization.toLowerCase().includes(filters.organization.toLowerCase())
      );
    }
    
    if (filters.dateOfBirth) {
      result = result.filter(voter => 
        voter.date_of_birth && voter.date_of_birth.includes(filters.dateOfBirth)
      );
    }
    
    if (filters.gender) {
      result = result.filter(voter => 
        voter.gender === filters.gender
      );
    }
    
    if (filters.region) {
      result = result.filter(voter => 
        voter.region && voter.region.toLowerCase().includes(filters.region.toLowerCase())
      );
    }
    
    if (filters.constituency) {
      result = result.filter(voter => 
        voter.constituency && voter.constituency.toLowerCase().includes(filters.constituency.toLowerCase())
      );
    }
    
    if (filters.identificationType) {
      result = result.filter(voter => 
        voter.identification_type && voter.identification_type.includes(filters.identificationType)
      );
    }
    
    if (filters.identificationNumber) {
      result = result.filter(voter => 
        voter.identification_number.includes(filters.identificationNumber)
      );
    }
    
    setFilteredData(result);
  }, [filters, voterData]);
  
  // Handle filter changes
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
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
  
  // Check for admin login
  const handleLogin = async () => {
    if (!email || !password) {
      setLoginError('Please enter both email and password');
      return;
    }
    
    try {
      const isValid = await verifyAdminLogin(email, password);
      
      if (isValid) {
        setIsAdmin(true);
        setLoginError('');
      } else {
        setLoginError('Invalid email or password');
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError('An error occurred during login');
    }
  };
  
  // Handle adding a new admin
  const handleAddAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword || !newAdminId) {
      toast({
        title: "Missing Information",
        description: "Please fill all fields to add a new admin",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const newAdmin = await addAdminUser(newAdminId, newAdminEmail, newAdminPassword);
      
      if (newAdmin) {
        toast({
          title: "Admin Added",
          description: `New admin ${newAdminEmail} added successfully`,
        });
        
        // Reset form
        setNewAdminEmail('');
        setNewAdminPassword('');
        setNewAdminId('');
        setOpenDialog(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to add new admin",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding admin:", error);
      toast({
        title: "Error",
        description: "Failed to add new admin",
        variant: "destructive",
      });
    }
  };
  
  // Handle deleting an admin
  const handleDeleteAdmin = async (id: string) => {
    // Don't allow deleting if there's only one admin left
    if (adminList.length <= 1) {
      toast({
        title: "Cannot Delete Admin",
        description: "At least one admin must remain in the system",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const success = await removeAdminUser(id);
      
      if (success) {
        toast({
          title: "Admin Deleted",
          description: "Admin has been deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete admin",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting admin:", error);
      toast({
        title: "Error",
        description: "Failed to delete admin",
        variant: "destructive",
      });
    }
  };
  
  const handleExcelExport = () => {
    // In a real application, this would generate a proper Excel file
    // using a library like xlsx or exceljs with real data from the database
    
    // For demonstration, we'll create a CSV string with the filtered data
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
            <p className="text-gray-600 mb-6">
              Only administrators can access the statistics dashboard.
            </p>
            
            {loginError && (
              <div className="bg-red-50 p-4 rounded-md mb-4 text-red-800">
                {loginError}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter admin email"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
              
              <Button className="w-full" onClick={handleLogin}>
                Login
              </Button>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">NATIONAL YOUTH PARLIAMENT GAMBIA - Registration Statistics</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsAdmin(false)}>Logout</Button>
            <Button 
              onClick={handleExcelExport}
              className="flex items-center gap-2"
            >
              <Download size={18} />
              Export CSV
            </Button>
            <Button 
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer size={18} />
              Print
            </Button>
          </div>
        </div>
        
        <div className="mb-8">
          <p className="text-lg text-gray-600">
            Welcome to the admin dashboard. Here you can view real-time statistics of voter registrations.
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading data...</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Gender Distribution */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Gender Distribution</h2>
                {genderData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genderData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {genderData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-[300px]">
                    <p>No data available</p>
                  </div>
                )}
                <div className="mt-4 text-sm text-gray-600">
                  <p>Total Registrations: {voterData.length}</p>
                </div>
              </Card>
              
              {/* Regional Distribution */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Regional Distribution</h2>
                {regionData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={regionData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Registrations" fill="#0067A5" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-[300px]">
                    <p>No data available</p>
                  </div>
                )}
                <div className="mt-4 text-sm text-gray-600">
                  <p>Total Regions: {regionData.length}</p>
                </div>
              </Card>
            </div>
            
            {/* Registration Data Table with Enhanced Filtering */}
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
                          <Popover open={constituencySearchOpen} onOpenChange={setConstituencySearchOpen}>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="outline" 
                                role="combobox" 
                                aria-expanded={constituencySearchOpen}
                                className="h-8 w-full justify-between"
                              >
                                {filters.constituency || "All constituencies"}
                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0">
                              <Command>
                                <CommandInput placeholder="Search constituency..." className="h-9" />
                                <CommandEmpty>No constituency found.</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    onSelect={() => {
                                      handleFilterChange('constituency', '');
                                      setConstituencySearchOpen(false);
                                    }}
                                  >
                                    All Constituencies
                                  </CommandItem>
                                  {filters.region && 
                                    constituencyData[filters.region]?.map(item => (
                                      <CommandItem
                                        key={item.name}
                                        onSelect={() => {
                                          handleFilterChange('constituency', item.name);
                                          setConstituencySearchOpen(false);
                                        }}
                                      >
                                        {item.name}
                                      </CommandItem>
                                    ))
                                  }
                                  {!filters.region &&
                                    Object.values(constituencyData).flat().map(item => (
                                      <CommandItem
                                        key={`${item.name}-${Math.random()}`}
                                        onSelect={() => {
                                          handleFilterChange('constituency', item.name);
                                          setConstituencySearchOpen(false);
                                        }}
                                      >
                                        {item.name}
                                      </CommandItem>
                                    ))
                                  }
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
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
            
            {/* Constituency Details */}
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-semibold mb-6">Constituency Details</h2>
              
              <div className="mb-4">
                <Label htmlFor="region-select" className="block mb-2">Select Region</Label>
                <select 
                  id="region-select"
                  className="w-full md:w-64 p-2 border rounded-md"
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                >
                  {regionData.map((region) => (
                    <option key={region.name} value={region.name}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {constituencyData[selectedRegion] && constituencyData[selectedRegion].length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={constituencyData[selectedRegion]}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                      layout="vertical"
                    >
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={150} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Registrations" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex justify-center items-center h-[300px]">
                  <p>No constituency data available for this region</p>
                </div>
              )}
            </Card>
            
            {/* Admin Management Section with Delete Function */}
            <Card className="p-6 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h2 className="text-xl font-semibold">Admin Management</h2>
                
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <UserPlus size={16} />
                      Add Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Admin User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="admin-id">ID</Label>
                        <Input 
                          id="admin-id" 
                          value={newAdminId}
                          onChange={(e) => setNewAdminId(e.target.value)}
                          placeholder="Enter unique ID"
                        />
                      </div>
                      <div>
                        <Label htmlFor="admin-email">Email</Label>
                        <Input 
                          id="admin-email" 
                          type="email" 
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          placeholder="Enter admin email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="admin-password">Password</Label>
                        <Input 
                          id="admin-password" 
                          type="password" 
                          value={newAdminPassword}
                          onChange={(e) => setNewAdminPassword(e.target.value)}
                          placeholder="Enter password"
                        />
                      </div>
                      <Button className="w-full" onClick={handleAddAdmin}>
                        Add Admin
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4">
                          No admin users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      adminList.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell>{admin.id}</TableCell>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteAdmin(admin.id)}
                            >
                              <Trash2 size={16} />
                              <span className="ml-2">Delete</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Statistics;
