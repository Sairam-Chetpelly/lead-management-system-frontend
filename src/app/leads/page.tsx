'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LeadsTable from '@/components/LeadsTable';
import GlobalLoader from '@/components/GlobalLoader';

export default function LeadsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing login
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (!token || !savedUser) {
      router.push('/');
      return;
    }
    
    try {
      const userData = JSON.parse(savedUser);
      setUser(userData);
    } catch (error) {
      console.error('Error parsing saved user:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/');
      return;
    }
    
    setLoading(false);
  }, [router]);

  if (loading) {
    return <GlobalLoader />;
  }

  if (!user) {
    return <GlobalLoader />;
  }

  return <LeadsTable user={user} />;
}