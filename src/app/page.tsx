'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    // Check for existing login
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        // Preserve current page on refresh
        const currentPath = window.location.pathname;
        if (currentPath !== '/' && currentPath !== '/login') {
          localStorage.setItem('lastVisitedPage', currentPath);
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    setJustLoggedIn(true);
    // Clear the flag after a longer delay to avoid race condition
    setTimeout(() => setJustLoggedIn(false), 5000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeSection');
    localStorage.removeItem('lastVisitedPage');
    localStorage.removeItem('currentPage');
    setUser(null);
    setJustLoggedIn(false);
  };

  if (loading) {
    return <GlobalLoader />;
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // If user just logged in, skip status check for a moment to avoid race condition
  if (justLoggedIn) {
    return <UserManagement user={user} onLogout={handleLogout} />;
  }

  // Only check status if we have a user and status loading is complete
  if (statusLoading) {
    return <GlobalLoader />;
  }

  if (!isActive) {
    return <InactiveUserNotification onLogout={handleLogout} />;
  }

  return <UserManagement user={user} onLogout={handleLogout} />;
}