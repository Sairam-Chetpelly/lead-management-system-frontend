import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/auth';

export const useUserStatus = () => {
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);

  const checkUserStatus = async () => {
    try {
      const response = await authAPI.checkStatus();
      const userIsActive = response.data.isActive !== false;
      setIsActive(userIsActive);
      
      if (!userIsActive) {
        // User is inactive, clear storage and force logout
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => window.location.reload(), 100);
      }
    } catch (error: any) {
      console.error('Status check failed:', error);
      // Only logout on authentication errors, not network errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => window.location.reload(), 100);
      } else {
        // Network error - assume user is still active
        setIsActive(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkUserStatus();
      
      // Check status every 10 minutes instead of 5
      const interval = setInterval(checkUserStatus, 10 * 60 * 1000);
      return () => clearInterval(interval);
    } else {
      setIsActive(false);
      setLoading(false);
    }
  }, []);

  return { isActive, loading, checkUserStatus };
};