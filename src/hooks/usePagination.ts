import { useState, useCallback } from 'react';

interface PaginationState {
  current: number;
  pages: number;
  total: number;
  limit: number;
}

interface UsePaginationReturn {
  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  handlePageChange: (page: number) => void;
  handleLimitChange: (limit: number) => void;
  resetPagination: () => void;
}

export const usePagination = (initialLimit: number = 10): UsePaginationReturn => {
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pages: 1,
    total: 0,
    limit: initialLimit
  });

  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, current: page }));
  }, []);

  const handleLimitChange = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, current: 1 }));
  }, []);

  const resetPagination = useCallback(() => {
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  return {
    pagination,
    setPagination,
    handlePageChange,
    handleLimitChange,
    resetPagination
  };
};