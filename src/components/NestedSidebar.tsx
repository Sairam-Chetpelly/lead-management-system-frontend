'use client';

import { 
  Users, 
  Settings, 
  Globe, 
  ChevronDown, 
  ChevronRight, 
  LogOut, 
  User, 
  Menu, 
  X,
  Activity,
  Shield,
  UserCheck,
  Building
} from 'lucide-react';
import { useState } from 'react';

interface MenuItem {
  id: string;
  name: string;
  icon: any;
  children?: MenuItem[];
}

interface NestedSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  user: any;
  onLogout: () => void;
}

export default function NestedSidebar({ activeSection, onSectionChange, user, onLogout }: NestedSidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['user-management', 'lead-management']);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems: MenuItem[] = [
    {
      id: 'user-management',
      name: 'User Management',
      icon: Users,
      children: [
        { id: 'users', name: 'Users', icon: User },
        { id: 'roles', name: 'Roles', icon: Shield }
      ]
    },
    {
      id: 'lead-management',
      name: 'Lead Management',
      icon: UserCheck,
      children: [
        { id: 'leads', name: 'Leads', icon: Users },
        { id: 'lead-sources', name: 'Lead Sources', icon: Globe },
        { id: 'lead-activities', name: 'Lead Activities', icon: Activity },
        { id: 'call-logs', name: 'Call Logs', icon: User },
        { id: 'project-house-types', name: 'Project & House Types', icon: Building }
      ]
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: Settings,
      children: [
        { id: 'centres', name: 'Centres', icon: Building },
        { id: 'languages', name: 'Languages', icon: Globe },
        { id: 'statuses', name: 'Statuses', icon: Activity }
      ]
    }
  ];

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleMenuClick = (sectionId: string) => {
    onSectionChange(sectionId);
    setIsMobileMenuOpen(false);
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const IconComponent = item.icon;
    const isExpanded = expandedItems.includes(item.id);
    const isActive = activeSection === item.id;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id}>
        <div className="relative group">
          <button
            onClick={() => {
              if (hasChildren && !isCollapsed) {
                toggleExpanded(item.id);
              } else if (!hasChildren) {
                handleMenuClick(item.id);
              } else if (hasChildren && isCollapsed) {
                setIsCollapsed(false);
                toggleExpanded(item.id);
              }
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${
              isActive
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'text-purple-200 hover:bg-white/10 hover:text-white'
            } ${level > 0 ? 'ml-3' : ''}`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-1.5 rounded-lg transition-colors ${
                isActive ? 'bg-white/20' : 'group-hover:bg-white/10'
              }`}>
                <IconComponent size={18} />
              </div>
              {!isCollapsed && (
                <span className="font-semibold text-sm">{item.name}</span>
              )}
            </div>
            {hasChildren && !isCollapsed && (
              <div className="transition-transform duration-200">
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            )}
          </button>
          
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              {item.name}
            </div>
          )}
        </div>
        
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-2 space-y-1">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
        
        {hasChildren && isCollapsed && (
          <div className="absolute left-full top-0 ml-2 bg-gray-900 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto z-50">
            <div className="p-2 space-y-1 min-w-48">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {item.name}
              </div>
              {item.children!.map(child => {
                const ChildIcon = child.icon;
                return (
                  <button
                    key={child.id}
                    onClick={() => handleMenuClick(child.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === child.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <ChildIcon size={16} />
                    <span>{child.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
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
      <div className={`fixed lg:relative inset-y-0 left-0 z-50 h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col shadow-2xl transform transition-all duration-300 lg:transform-none overflow-hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${isCollapsed ? 'w-20' : 'w-72'}`}>
        
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-white/70 hover:text-white"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className={`flex items-center space-x-4 ${isCollapsed ? 'justify-center' : ''}`}>
            <img 
              src="/ReminiscentWhiteLogo.png" 
              alt="Reminiscent Logo" 
              className={`${isCollapsed ? 'w-50 h-30' : 'w-50 h-30'} object-contain`}
            />
          </div>
          
          {/* Collapse Toggle - Desktop Only */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-2 text-white/70 hover:text-white transition-colors"
          >
            <Menu size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 pt-6 px-4">
          <div className="space-y-3">
            {menuItems.map(item => renderMenuItem(item))}
          </div>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <button 
            onClick={onLogout}
            className={`w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 transition-all duration-300 shadow-lg mb-3 ${
              isCollapsed ? 'px-2' : ''
            }`}
          >
            <LogOut size={18} />
            {!isCollapsed && <span className="font-semibold text-sm">Logout</span>}
          </button>
          
          <div className={`flex items-center space-x-3 px-3 py-3 rounded-xl bg-white/5 backdrop-blur-sm ${
            isCollapsed ? 'justify-center px-2' : ''
          }`}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <User size={18} className="text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm truncate">{user.name}</div>
                <div className="text-purple-200 text-xs truncate">{user.role || 'Administrator'}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}