'use client';

import { useState, useEffect } from 'react';
import NestedSidebar from './NestedSidebar';
import UsersTable from './admin/UsersTable';
import RolesTable from './admin/RolesTable';
import CentresTable from './admin/CentresTable';
import LanguagesTable from './admin/LanguagesTable';
import StatusesTable from './admin/StatusesTable';
import LeadSourcesTable from './admin/LeadSourcesTable';
import ProjectHouseTypesTable from './admin/ProjectHouseTypesTable';
import Dashboard from './Dashboard';
import LeadsManagement from './LeadsManagement';
import CallLogsTable from './admin/CallLogsTable';
import ActivityLogsTable from './admin/ActivityLogsTable';
import LeadActivitiesTable from './admin/LeadActivitiesTable';
import FoldersManagement from './FoldersManagement';
import KeywordsManagement from './KeywordsManagement';

interface UserManagementProps {
  user: any;
  onLogout: () => void;
}

export default function UserManagement({ user, onLogout }: UserManagementProps) {
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('activeSection') || 'dashboard';
    }
    return 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('activeSection', activeSection);
  }, [activeSection]);

  const getSectionTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      users: 'Users',
      roles: 'Roles', 
      centres: 'Centres',
      languages: 'Languages',
      statuses: 'Statuses',
      'lead-sources': 'Lead Sources',
      'project-house-types': 'Project & House Types',
      'leads': 'Leads Management',
      'folders': 'Document Management',
      'keywords': 'Keywords Management',
      'call-logs': 'Call Logs',
      'activity-logs': 'Activity Logs',
      'lead-activities': 'Lead Activities'
    };
    return titles[activeSection as keyof typeof titles] || 'Users';
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    localStorage.setItem('activeSection', section);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard user={user} />;
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
      case 'lead-sources':
        return <LeadSourcesTable />;
      case 'project-house-types':
        return <ProjectHouseTypesTable />;
      case 'leads':
        return <LeadsManagement user={user} />;
      case 'folders':
        return <FoldersManagement />;
      case 'keywords':
        return <KeywordsManagement />;
      case 'call-logs':
        return <CallLogsTable />;
      case 'activity-logs':
        return <ActivityLogsTable />;
      case 'lead-activities':
        return <LeadActivitiesTable />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <NestedSidebar 
        activeSection={activeSection} 
        onSectionChange={handleSectionChange} 
        user={user}
        onLogout={onLogout}
      />
      
      <div className="flex-1 flex flex-col min-h-0 lg:ml-0">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20 p-3 sm:p-4 flex-shrink-0 animate-fade-in-up ml-0 lg:ml-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pl-16 lg:pl-0">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent truncate">
                {getSectionTitle()}
              </h1>
              <p className="text-slate-600 mt-1 font-medium text-xs hidden sm:block">Manage your {getSectionTitle().toLowerCase()} efficiently</p>
            </div>
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="px-2 py-1 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-200 animate-pulse">
                <span className="text-green-700 font-semibold text-xs">System Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white/30 backdrop-blur-sm overflow-y-auto scrollbar-hide min-h-0">
          <div className="animate-fade-in-up h-full">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}