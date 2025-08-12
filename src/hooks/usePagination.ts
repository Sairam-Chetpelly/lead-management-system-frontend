'use client';

import { useState, useCallback } from 'react';

interface PaginationState {
  current: number;
  pages: number;
  total: number;
  limit: number;
}

interface UsePaginationProps {
  initialLimit?: number;
  onDataFetch?: (pagination: PaginationState, filters?: any) => void;
}

export function usePagination({ 
  initialLimit = 10, 
  onDataFetch 
}: UsePaginationProps = {}) {
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

  const updatePagination = useCallback((newPagination: Partial<PaginationState>) => {
    setPagination(prev => ({ ...prev, ...newPagination }));
  }, []);

  const resetPagination = useCallback(() => {
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  return {
    pagination,
    handlePageChange,
    handleLimitChange,
    updatePagination,
    resetPagination,
    setPagination
  };
}