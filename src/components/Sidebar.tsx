'use client';

import { BarChart3, Users, Building, Globe, Activity, LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  user: any;
  onLogout: () => void;
}

export default function Sidebar({ activeSection, onSectionChange, user, onLogout }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const menuItems = [
    { id: 'users', name: 'Users', icon: Users },
    { id: 'roles', name: 'Roles', icon: BarChart3 },
    { id: 'centres', name: 'Centres', icon: Building },
    { id: 'languages', name: 'Languages', icon: Globe },
    { id: 'statuses', name: 'Statuses', icon: Activity }
  ];
  
  const handleMenuClick = (sectionId: string) => {
    onSectionChange(sectionId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-slate-900 text-white rounded-2xl shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:relative inset-y-0 left-0 z-50 w-72 h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col shadow-2xl transform transition-transform duration-300 lg:transform-none overflow-hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-white/70 hover:text-white"
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <div className="p-6 lg:p-8 border-b border-white/10">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 lg:w-14 h-12 lg:h-14 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <div className="w-6 lg:w-8 h-6 lg:h-8 bg-white rounded-lg flex items-center justify-center">
                  <div className="w-3 lg:w-4 h-3 lg:h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-sm"></div>
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-3 lg:w-4 h-3 lg:h-4 bg-green-400 rounded-full border-2 border-slate-900"></div>
            </div>
            <div>
              <h2 className="font-bold text-lg lg:text-xl bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">LMS ADMIN</h2>
              <p className="text-purple-200 text-xs lg:text-sm font-medium">Management Hub</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 pt-6 lg:pt-8 px-4 overflow-y-auto custom-scrollbar">
          <div className="space-y-2 lg:space-y-3">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`group w-full flex items-center space-x-3 lg:space-x-4 px-4 lg:px-5 py-3 lg:py-4 rounded-xl lg:rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                      : 'text-purple-200 hover:bg-white/10 hover:text-white backdrop-blur-sm'
                  }`}
                >
                  <div className={`p-1.5 lg:p-2 rounded-lg lg:rounded-xl transition-colors ${
                    isActive ? 'bg-white/20' : 'group-hover:bg-white/10'
                  }`}>
                    <IconComponent size={18} className="lg:w-5 lg:h-5" />
                  </div>
                  <span className="font-semibold text-sm lg:text-base">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 lg:p-6 border-t border-white/10 bg-black/20 flex-shrink-0">
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 lg:px-5 py-3 lg:py-4 rounded-xl lg:rounded-2xl bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/25 mb-3 lg:mb-4"
          >
            <LogOut size={18} className="lg:w-5 lg:h-5" />
            <span className="font-semibold text-sm lg:text-base">Logout</span>
          </button>
          <div className="flex items-center space-x-3 lg:space-x-4 px-2 lg:px-3 py-2 lg:py-3 rounded-xl lg:rounded-2xl bg-white/5 backdrop-blur-sm">
            <div className="relative">
              <div className="w-10 lg:w-12 h-10 lg:h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg">
                <User size={18} className="lg:w-5 lg:h-5 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 lg:w-4 h-3 lg:h-4 bg-green-400 rounded-full border-2 border-slate-900"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-sm lg:text-base truncate">{user.name}</div>
              <div className="text-purple-200 text-xs lg:text-sm truncate">{user.role || 'Administrator'}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}