'use client';

import { useEffect, useState } from 'react';
import { authAPI } from '@/lib/auth';

interface AccessControlProps {
  children: React.ReactNode;
  requiredRole?: string[];
  fallback?: React.ReactNode;
}

export default function AccessControl({ 
  children, 
  requiredRole = [], 
  fallback = <div className="text-center text-gray-500 p-8">Access Denied</div> 
}: AccessControlProps) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await authAPI.checkStatus();
        const { isActive, user } = response.data;
        
        if (!isActive) {
          setHasAccess(false);
          return;
        }
        
        if (requiredRole.length === 0) {
          setHasAccess(true);
        } else {
          setHasAccess(requiredRole.includes(user.role));
        }
      } catch (error) {
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [requiredRole]);

  if (loading) {
    return <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}