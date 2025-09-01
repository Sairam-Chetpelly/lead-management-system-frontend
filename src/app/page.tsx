'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import UserManagement from '@/components/UserManagement';
import GlobalLoader from '@/components/GlobalLoader';
import InactiveUserNotification from '@/components/InactiveUserNotification';
import { authAPI } from '@/lib/auth';
import { useUserStatus } from '@/hooks/useUserStatus';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const { isActive, loading: statusLoading } = useUserStatus();
  const searchParams = useSearchParams();
  const resetToken = searchParams.get('token');

  useEffect(() => {
    // If there's a reset token, don't auto-login
    if (resetToken) {
      setLoading(false);
      return;
    }

    // Check for existing login synchronously
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const tokenExpiresAt = localStorage.getItem('tokenExpiresAt');
    
    if (token && savedUser && tokenExpiresAt) {
      const expiryTime = parseInt(tokenExpiresAt);
      const currentTime = Date.now();
      
      if (currentTime >= expiryTime) {
        // Token expired, logout
        handleLogout();
        setLoading(false);
        return;
      }
      
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        handleLogout();
      }
    }
    
    setLoading(false);
  }, [resetToken]);

  const handleLogin = (userData: any) => {
    setUser(userData);
    setJustLoggedIn(true);
    // Clear the flag after a longer delay to avoid race condition
    setTimeout(() => setJustLoggedIn(false), 5000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiresAt');
    localStorage.removeItem('activeSection');
    localStorage.removeItem('lastVisitedPage');
    localStorage.removeItem('currentPage');
    setUser(null);
    setJustLoggedIn(false);
  };

  // Check token expiry periodically when user is logged in
  useEffect(() => {
    if (!user) return;

    const checkTokenExpiry = () => {
      const tokenExpiresAt = localStorage.getItem('tokenExpiresAt');
      if (tokenExpiresAt) {
        const expiryTime = parseInt(tokenExpiresAt);
        const currentTime = Date.now();
        
        if (currentTime >= expiryTime) {
          handleLogout();
        }
      }
    };

    // Check every minute
    const interval = setInterval(checkTokenExpiry, 60000);
    
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return <GlobalLoader />;
  }

  if (!user || resetToken) {
    return <LoginForm onLogin={handleLogin} resetToken={resetToken} />;
  }

  // If user just logged in, skip status check
  if (justLoggedIn) {
    return <UserManagement user={user} onLogout={handleLogout} />;
  }

  // Quick status check without showing loader
  if (user && !statusLoading && !isActive) {
    return <InactiveUserNotification onLogout={handleLogout} />;
  }

  return <UserManagement user={user} onLogout={handleLogout} />;
}