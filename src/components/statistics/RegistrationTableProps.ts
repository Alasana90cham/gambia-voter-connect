
export interface FilterState {
  fullName: string;
  organization: string;
  dateOfBirth: string;
  gender: string;
  region: string;
  constituency: string;
  identificationType: string;
  identificationNumber: string;
}

export interface RegistrationTableProps {
  voterData: any[];
  filteredData: any[];
  regionData: any[]; // Changed from ChartData[] to any[]
  constituencyData: { [key: string]: any[] }; // Changed from ChartData[] to any[]
  currentPage: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  totalPages: number;
  totalRecords: number;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  isLoading: boolean;
  handleExcelExport: () => void;
}
