
import React, { useMemo } from 'react';
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
    currentPage,
    totalPages,
    totalRecords,
    pageSize,
    setPageSize,
    setCurrentPage,
    handleExcelExport
  } = useStatistics();

  // Ensure we use the actual length from voterData for accurate total count
  // This prevents the 1000-record limitation issue
  const totalVoters = useMemo(() => voterData.length, [voterData]);
  
  // Calculate actual filtered count for accurate display
  const filteredCount = useMemo(() => filteredData.length, [filteredData]);

  // Calculate displayed records range
  const startRecord = useMemo(() => 
    totalRecords > 0 ? (currentPage - 1) * pageSize + 1 : 0, 
    [currentPage, pageSize, totalRecords]
  );
  
  const endRecord = useMemo(() => 
    Math.min(startRecord + pageSize - 1, totalRecords),
    [startRecord, pageSize, totalRecords]
  );

  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">NATIONAL YOUTH PARLIAMENT GAMBIA - Registration Statistics</h1>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={onLogout} className="whitespace-nowrap">Logout</Button>
          <Button 
            onClick={handleExcelExport}
            className="flex items-center gap-2"
            disabled={isLoading || filteredData.length === 0}
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
            disabled={isLoading}
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
        
        {totalRecords > 0 && (
          <div className="mt-2 text-sm text-gray-500">
            {isLoading ? (
              <span>Loading data...</span>
            ) : (
              <span>
                Showing {startRecord} to {endRecord} of {totalRecords} records
                {totalRecords !== totalVoters && ` (filtered from ${totalVoters} total records)`}
              </span>
            )}
          </div>
        )}
      </div>
      
      {isLoading && filteredCount === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <div className="mt-4 text-lg">Loading data...</div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Gender Distribution */}
            <GenderChart 
              genderData={genderData} 
              totalCount={totalVoters} 
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
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            setPageSize={setPageSize}
            setCurrentPage={setCurrentPage}
            isLoading={isLoading}
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
