'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { usePagination } from './usePagination';

interface UseTableDataProps {
  fetchFn: (params: any) => Promise<any>;
  initialFilters?: Record<string, string>;
  initialLimit?: number;
}

export function useTableData({ 
  fetchFn, 
  initialFilters = {}, 
  initialLimit = 10 
}: UseTableDataProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const debouncedFilters = useDebounce(filters, 300);
  const { pagination, handlePageChange, handleLimitChange, updatePagination } = usePagination({ initialLimit });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchFn({
        page: pagination.current,
        limit: pagination.limit,
        ...debouncedFilters
      });
      setData(Array.isArray(response.data) ? response.data : response.data.data || []);
      if (response.data.pagination) {
        updatePagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, pagination.current, pagination.limit, debouncedFilters, updatePagination]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    handlePageChange(1);
  };

  const refetch = () => {
    fetchData();
  };

  return {
    data,
    loading,
    filters,
    pagination,
    handleFilterChange,
    handlePageChange,
    handleLimitChange,
    refetch
  };
}