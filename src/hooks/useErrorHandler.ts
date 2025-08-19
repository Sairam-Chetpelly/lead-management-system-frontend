'use client';

import { useState, useCallback } from 'react';

interface ErrorState {
  hasError: boolean;
  statusCode?: number;
  message?: string;
}

export function useErrorHandler() {
  const [error, setError] = useState<ErrorState>({ hasError: false });

  const handleError = useCallback((err: any) => {
    const status = err.response?.status || 500;
    const message = err.response?.data?.message || err.message || 'An unexpected error occurred';
    
    setError({
      hasError: true,
      statusCode: status,
      message
    });
  }, []);

  const clearError = useCallback(() => {
    setError({ hasError: false });
  }, []);

  const retry = useCallback(() => {
    clearError();
  }, [clearError]);

  return {
    error,
    handleError,
    clearError,
    retry
  };
}