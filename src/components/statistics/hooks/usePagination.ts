
import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for managing pagination state
 */
export const usePagination = (totalItems: number) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  
  // Calculate total pages based on filtered data
  const totalPages = useMemo(() => 
    Math.ceil(totalItems / pageSize),
  [totalItems, pageSize]);
  
  // Safe setter for current page that validates the input
  const setCurrentPageSafe = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages || 1));
    setCurrentPage(validPage);
  }, [totalPages]);
  
  return {
    currentPage,
    setCurrentPage: setCurrentPageSafe,
    pageSize,
    setPageSize,
    totalPages,
  };
};
