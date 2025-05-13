
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { useStatistics } from './StatisticsContext';
import GenderChart from './GenderChart';
import RegionChart from './RegionChart';
import RegistrationTable from './RegistrationTable';
import ConstituencyDetail from './ConstituencyDetail';
import AdminManagement from './AdminManagement';

interface StatisticsContentProps {
  onLogout: () => void;
}

const StatisticsContent: React.FC<StatisticsContentProps> = ({ onLogout }) => {
  const {
    voterData,
    filteredData,
    genderData,
    regionData,
    constituencyData,
    adminList,
    filters,
    setFilters,
    isLoading,
    selectedRegion,
    setSelectedRegion,
    handleDeleteSuccess,
    handleExcelExport
  } = useStatistics();

  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">NATIONAL YOUTH PARLIAMENT GAMBIA - Registration Statistics</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onLogout}>Logout</Button>
          <Button 
            onClick={handleExcelExport}
            className="flex items-center gap-2"
          >
            <Download size={18} />
            Export CSV
          </Button>
          <Button 
            onClick={() => {
              const printHandler = document.getElementById('printTable');
              if (printHandler) {
                printHandler.click();
              }
            }}
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
            <GenderChart 
              genderData={genderData} 
              totalCount={voterData.length} 
            />
            
            {/* Regional Distribution */}
            <RegionChart 
              regionData={regionData} 
            />
          </div>
          
          {/* Registration Data Table with Enhanced Filtering */}
          <RegistrationTable
            voterData={voterData}
            filteredData={filteredData}
            regionData={regionData}
            constituencyData={constituencyData}
            onUpdateFilters={setFilters}
            filters={filters}
            onDeleteSuccess={handleDeleteSuccess}
          />
          
          {/* Constituency Details */}
          <ConstituencyDetail
            selectedRegion={selectedRegion}
            regionData={regionData}
            constituencyData={constituencyData}
            onRegionChange={setSelectedRegion}
          />
          
          {/* Admin Management */}
          <AdminManagement 
            adminList={adminList}
          />
        </>
      )}
    </main>
  );
};

export default StatisticsContent;
