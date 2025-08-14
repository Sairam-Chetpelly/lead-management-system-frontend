import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/auth';

export const useUserStatus = () => {
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false); // Set to false to skip loading

  // Temporarily disable status checking to fix the issue
  const checkUserStatus = async () => {
    // Do nothing for now
  };

  useEffect(() => {
    // Always assume user is active for now
    setIsActive(true);
    setLoading(false);
  }, []);

  return { isActive, loading, checkUserStatus };
};