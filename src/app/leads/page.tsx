'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LeadsTable from '@/components/leads/LeadsTable';
import NestedSidebar from '@/components/NestedSidebar';

export default function LeadsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('leads');
  
  useEffect(() => {
    localStorage.setItem('currentPage', 'leads');
    localStorage.setItem('lastVisitedPage', '/leads');
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      <NestedSidebar 
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        user={{ name: 'Admin User', role: 'Administrator' }}
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