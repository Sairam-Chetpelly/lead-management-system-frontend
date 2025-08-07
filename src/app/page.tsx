'use client';

import { useState, useEffect } from 'react';
import LoginForm from '@/components/LoginForm';
import UserManagement from '@/components/UserManagement';
import { authAPI } from '@/lib/auth';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initialize system on first load
    const initSystem = async () => {
      try {
        await authAPI.initSystem();
        setInitialized(true);
      } catch (error) {
        console.error('System initialization error:', error);
        setInitialized(true); // Continue even if init fails
      }
    };

    // Check for existing login
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    if (!initialized) {
      initSystem();
    }
    
    setLoading(false);
  }, [initialized]);

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Initializing system...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <UserManagement user={user} onLogout={handleLogout} />;
}