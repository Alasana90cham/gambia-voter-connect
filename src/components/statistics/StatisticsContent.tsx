
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import GenderChart from './GenderChart';
import RegionChart from './RegionChart';
import ConstituencyDetail from './ConstituencyDetail';
import AdminManagement from './AdminManagement';
import RegistrationTable from './RegistrationTable';
import { useStatistics } from './StatisticsContext';
import { LogOut } from 'lucide-react'; 
import { DataIntegrityMonitor } from './DataIntegrityMonitor';

interface StatisticsContentProps {
  onLogout: () => void;
}

const StatisticsContent: React.FC<StatisticsContentProps> = ({ onLogout }) => {
  const { 
    handleDeleteSuccess, 
    selectedRegion, 
    setSelectedRegion,
    genderData,
    regionData,
    constituencyData,
    filteredData,
    voterData,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    totalPages,
    totalRecords,
    filters,
    setFilters,
    isLoading,
    handleExcelExport,
    adminList
  } = useStatistics();
  
  const [activeTab, setActiveTab] = useState<string>('registrations');
  
  // Handle tab change
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
  };

  // Handle data recovery completion - improved for more reliable data refresh
  const handleDataRecovery = () => {
    console.log("Data recovery triggered in StatisticsContent");
    // Refresh the data with a slight delay to ensure database consistency
    setTimeout(() => {
      handleDeleteSuccess();
      toast({
        title: "Data Refreshed",
        description: "Data has been refreshed with recovered records.",
      });
    }, 300);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">View and manage voter registration statistics</p>
        </div>
        <Button variant="ghost" onClick={onLogout} className="mt-4 md:mt-0">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="regions">Regional Data</TabsTrigger>
          <TabsTrigger value="admin">Admin Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="registrations">
          <RegistrationTable 
            voterData={voterData}
            filteredData={filteredData}
            regionData={regionData}
            constituencyData={constituencyData}
            currentPage={currentPage}
            pageSize={pageSize}
            setCurrentPage={setCurrentPage}
            setPageSize={setPageSize}
            totalPages={totalPages}
            totalRecords={totalRecords}
            filters={filters}
            setFilters={setFilters}
            isLoading={isLoading}
            handleExcelExport={handleExcelExport}
          />
        </TabsContent>
        
        <TabsContent value="demographics">
          <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Gender Distribution</h2>
            <GenderChart 
              genderData={genderData} 
              totalCount={filteredData.length}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="regions">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-6 lg:col-span-1">
              <h2 className="text-xl font-semibold mb-4">Regional Distribution</h2>
              <RegionChart regionData={regionData} />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4">
                <span>Constituency Distribution: </span>
                <select 
                  value={selectedRegion} 
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="border rounded px-2 py-1 text-sm font-normal"
                >
                  <option value="Banjul">Banjul</option>
                  <option value="Kanifing">Kanifing</option>
                  <option value="West Coast">West Coast</option>
                  <option value="North Bank">North Bank</option>
                  <option value="Lower River">Lower River</option>
                  <option value="Central River">Central River</option>
                  <option value="Upper River">Upper River</option>
                </select>
              </h2>
              <ConstituencyDetail 
                selectedRegion={selectedRegion}
                regionData={regionData}
                constituencyData={constituencyData}
                onRegionChange={setSelectedRegion}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="admin">
          <AdminManagement 
            adminList={adminList || []} 
            onUpdateSuccess={handleDeleteSuccess} 
          />
        </TabsContent>
      </Tabs>
      
      {/* Invisible component that monitors and recovers unsaved data */}
      <DataIntegrityMonitor onRecover={handleDataRecovery} />
    </div>
  );
};

export default StatisticsContent;
