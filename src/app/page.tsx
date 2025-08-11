'use client';

import { useState, useEffect } from 'react';
import LoginForm from '@/components/LoginForm';
import UserManagement from '@/components/UserManagement';
import GlobalLoader from '@/components/GlobalLoader';
import { authAPI } from '@/lib/auth';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing login
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Preserve current page on refresh
      const currentPath = window.location.pathname;
      if (currentPath !== '/' && currentPath !== '/login') {
        localStorage.setItem('lastVisitedPage', currentPath);
      }
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeSection');
    localStorage.removeItem('lastVisitedPage');
    localStorage.removeItem('currentPage');
    setUser(null);
  };

  if (loading) {
    return <GlobalLoader />;
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <UserManagement user={user} onLogout={handleLogout} />;
}