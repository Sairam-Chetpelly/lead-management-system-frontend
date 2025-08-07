'use client';

import { useState } from 'react';
import NestedSidebar from './NestedSidebar';
import UsersTable from './admin/UsersTable';
import RolesTable from './admin/RolesTable';
import CentresTable from './admin/CentresTable';
import LanguagesTable from './admin/LanguagesTable';
import StatusesTable from './admin/StatusesTable';

interface UserManagementProps {
  user: any;
  onLogout: () => void;
}

export default function UserManagement({ user, onLogout }: UserManagementProps) {
  const [activeSection, setActiveSection] = useState('users');

  const getSectionTitle = () => {
    const titles = {
      users: 'Users',
      roles: 'Roles', 
      centres: 'Centres',
      languages: 'Languages',
      statuses: 'Statuses'
    };
    return titles[activeSection as keyof typeof titles] || 'Users';
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'users':
        return <UsersTable />;
      case 'roles':
        return <RolesTable />;
      case 'centres':
        return <CentresTable />;
      case 'languages':
        return <LanguagesTable />;
      case 'statuses':
        return <StatusesTable />;
      default:
        return <UsersTable />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden">
      <NestedSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
        user={user}
        onLogout={onLogout}
      />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20 p-4 flex-shrink-0 animate-fade-in-up">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
                {getSectionTitle()}
              </h1>
              <p className="text-slate-600 mt-1 font-medium text-xs">Manage your {getSectionTitle().toLowerCase()} efficiently</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-2 py-1 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-200 animate-pulse">
                <span className="text-green-700 font-semibold text-xs">System Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white/30 backdrop-blur-sm overflow-y-auto custom-scrollbar scroll-smooth">
          <div className="animate-fade-in-up">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}