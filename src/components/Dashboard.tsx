import React, { useState } from 'react';
import { Search, Download, Plus, ChevronDown, User, BarChart3, Users, LogOut } from 'lucide-react';

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedValues, setSelectedValues] = useState('Select values');
  const [selectedLanguages, setSelectedLanguages] = useState('Select languages');
  const [selectedStatus, setSelectedStatus] = useState('Select status');

  // Sample data - all entries are the same person as shown in the screenshot
  const leads = Array(12).fill().map((_, index) => ({
    id: index + 1,
    name: 'Aryan Mehta',
    contact: '9854563254',
    source: ['google', 'youtube', 'tiktok', 'excel', 'facebook', 'linkedin'][index % 6],
    city: 'Mumbai',
    value: '--',
    language: '--',
    preSales: '--',
    leadStatus: 'Lead',
    leadSubStatus: '--'
  }));

  const getSourceIcon = (source) => {
    const icons = {
      google: '🔍',
      youtube: '📺',
      tiktok: '🎵',
      excel: '📊',
      facebook: '📘',
      linkedin: '💼'
    };
    return icons[source] || '📋';
  };

  const getSourceColor = (source) => {
    const colors = {
      google: 'bg-red-100',
      youtube: 'bg-red-100',
      tiktok: 'bg-purple-100',
      excel: 'bg-green-100',
      facebook: 'bg-blue-100',
      linkedin: 'bg-blue-100'
    };
    return colors[source] || 'bg-gray-100';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
            </div>
            <div>
              <h2 className="font-bold text-lg">REMINISCENT</h2>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 pt-6">
          <div className="px-4 space-y-2">
            <a href="#" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
              <BarChart3 size={20} />
              <span>Dashboard</span>
            </a>
            <a href="#" className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-gray-800 text-white">
              <Users size={20} />
              <span>Leads Manage</span>
            </a>
          </div>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-gray-700">
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition-colors mb-3">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
          <div className="flex items-center space-x-3 px-2">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <div>
              <div className="font-medium text-sm">Sainath Mahto</div>
              <div className="text-gray-400 text-xs">Pre-sales manager</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm border-b p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <div className="flex space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download size={16} className="text-green-600" />
                <span className="text-gray-700">Download Excel</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                <Plus size={16} />
                <span>Add Lead</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-b p-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Select values</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <div className="relative">
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Select languages</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <div className="relative">
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Select status</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto bg-white">
          <table className="w-full">
            <thead className="bg-gray-900 text-white sticky top-0">
              <tr>
                <th className="px-6 py-4 text-left font-medium">Name</th>
                <th className="px-6 py-4 text-left font-medium">Contact</th>
                <th className="px-6 py-4 text-left font-medium">Source</th>
                <th className="px-6 py-4 text-left font-medium">City</th>
                <th className="px-6 py-4 text-left font-medium">Value</th>
                <th className="px-6 py-4 text-left font-medium">Language</th>
                <th className="px-6 py-4 text-left font-medium">Pre-sales</th>
                <th className="px-6 py-4 text-left font-medium">Lead Status</th>
                <th className="px-6 py-4 text-left font-medium">Lead Sub Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, index) => (
                <tr key={lead.id} className={`border-b border-gray-200 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-6 py-4 text-gray-900">{lead.name}</td>
                  <td className="px-6 py-4 text-gray-700">{lead.contact}</td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded ${getSourceColor(lead.source)}`}>
                      <span className="text-lg">{getSourceIcon(lead.source)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{lead.city}</td>
                  <td className="px-6 py-4 text-gray-500">{lead.value}</td>
                  <td className="px-6 py-4 text-gray-500">{lead.language}</td>
                  <td className="px-6 py-4 text-gray-500">{lead.preSales}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                      {lead.leadStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{lead.leadSubStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-white border-t px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
              <span className="text-sm text-gray-600">Records per page</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">1-6 out of 8</span>
              <div className="flex space-x-1">
                <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">
                  ‹
                </button>
                <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
              <span className="text-sm text-gray-600">Records per page</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">1-6 out of 8</span>
              <div className="flex space-x-1">
                <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">
                  ‹
                </button>
                <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;