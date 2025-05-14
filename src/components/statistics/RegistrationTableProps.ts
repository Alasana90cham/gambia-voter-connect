
import { ChartData } from 'recharts';

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
  regionData: ChartData[];
  constituencyData: { [key: string]: ChartData[] };
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
