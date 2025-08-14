'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import NestedSidebar from '@/components/NestedSidebar';
import GlobalLoader from '@/components/GlobalLoader';
import InactiveUserNotification from '@/components/InactiveUserNotification';
import { useUserStatus } from '@/hooks/useUserStatus';

const LeadsTable = dynamic(() => import('@/components/leads/LeadsTable'), {
  ssr: false,
  loading: () => <GlobalLoader />
});

export default function LeadsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('leads');
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const { isActive, loading } = useUserStatus();
  
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentPage', 'leads');
      localStorage.setItem('lastVisitedPage', '/leads');
      
      // Get user from localStorage
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
  }, []);
  
  if (!mounted) {
    return <GlobalLoader />;
  }
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  if (loading) {
    return <GlobalLoader />;
  }

  if (!user) {
    router.push('/');
    return <GlobalLoader />;
  }

  if (!isActive) {
    return <InactiveUserNotification onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      <NestedSidebar 
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        user={user}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 lg:ml-72">
        <div className="py-8 px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Lead Management</h1>
            <p className="text-gray-600">Manage your leads, track activities, and monitor call logs</p>
          </div>
          <LeadsTable />
        </div>
      </div>
    </div>
  );
}