'use client';

import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/auth';
import { Phone, Eye, Pencil } from 'lucide-react';

interface SalesStats {
  totalQualifiedLeads: number;
  hotLeads: number;
  warmLeads: number;
  cifLeads: number;
  wonLeads: number;
}

interface Lead {
  _id: string;
  leadId: string;
  name: string;
  contactNumber: string;
  email: string;
  sourceId: { name: string };
  leadStatusId: { name: string };
  languageId: { name: string };
  centerId?: { name: string };
  leadSubstatus?: string;
  leadValue?: string;
  createdAt: string;
  nextCallDateTime?: string;
  cifDateTime?: string;
}

interface SalesDashboardProps {
  user: any;
  onCallLead: (lead: Lead) => void;
  onViewLead: (leadId: string) => void;
  onEditLead: (lead: Lead) => void;
}

export default function SalesDashboard({ user, onCallLead, onViewLead, onEditLead }: SalesDashboardProps) {
  const [stats, setStats] = useState<SalesStats>({ 
    totalQualifiedLeads: 0, 
    hotLeads: 0, 
    warmLeads: 0, 
    cifLeads: 0, 
    wonLeads: 0 
  });
  const [activeTab, setActiveTab] = useState('hot');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchLeads(activeTab);
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const response = await authAPI.get('/api/dashboard/sales-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({ totalQualifiedLeads: 0, hotLeads: 0, warmLeads: 0, cifLeads: 0, wonLeads: 0 });
    }
  };

  const fetchLeads = async (category: string) => {
    try {
      setLoading(true);
      const response = await authAPI.get(`/api/dashboard/sales-leads/${category}`);
      setLeads(response.data.data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getLeadValueBadge = (value?: string) => {
    if (value === 'high_value') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">High Value</span>;
    } else if (value === 'low_value') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Low Value</span>;
    }
    return null;
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.name}</p>
        </div>
        <button
          onClick={() => {
            fetchStats();
            fetchLeads(activeTab);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <i className="fas fa-sync-alt mr-2"></i>
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="fas fa-bullseye text-blue-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Qualified</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQualifiedLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <i className="fas fa-fire text-red-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Hot Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.hotLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <i className="fas fa-phone text-orange-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Warm Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.warmLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <i className="fas fa-clock text-yellow-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">CIF Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.cifLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="fas fa-trophy text-green-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Won Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.wonLeads}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('hot')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'hot'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔥 Hot Leads ({stats.hotLeads})
            </button>
            <button
              onClick={() => setActiveTab('warm')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'warm'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📞 Warm Leads ({stats.warmLeads})
            </button>
            <button
              onClick={() => setActiveTab('cif')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'cif'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ⏰ CIF Leads ({stats.cifLeads})
            </button>
            <button
              onClick={() => setActiveTab('won')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'won'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🏆 Won Leads ({stats.wonLeads})
            </button>
          </nav>
        </div>

        {/* Leads Table */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No leads found in this category
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto scrollbar-hide">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lead Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value & Center
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {activeTab === 'hot' ? 'Qualified Date' : 
                         activeTab === 'warm' ? 'Next Call' :
                         activeTab === 'cif' ? 'CIF Date' : 'Won Date'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leads.map((lead) => (
                      <tr key={lead._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                              activeTab === 'hot' ? 'bg-red-500' :
                              activeTab === 'warm' ? 'bg-orange-500' :
                              activeTab === 'cif' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}>
                              {lead.name.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                              <div className="text-sm text-gray-500">{lead.leadId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{lead.contactNumber}</div>
                          <div className="text-sm text-gray-500">{lead.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            {getLeadValueBadge(lead.leadValue)}
                            <span className="text-xs text-gray-500">{lead.centerId?.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {activeTab === 'warm' && lead.nextCallDateTime 
                            ? formatDateTime(lead.nextCallDateTime)
                            : activeTab === 'cif' && lead.cifDateTime
                              ? formatDateTime(lead.cifDateTime)
                              : formatDateTime(lead.createdAt)
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {activeTab !== 'won' && (
                              <button
                                onClick={() => onCallLead(lead)}
                                className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                                title="Call"
                              >
                                <Phone size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => onViewLead(lead._id)}
                              className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => onEditLead(lead)}
                              className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4 max-h-96 overflow-y-auto scrollbar-hide">
                {leads.map((lead) => (
                  <div key={lead._id} className="bg-white rounded-lg p-4 shadow border border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                          activeTab === 'hot' ? 'bg-red-500' :
                          activeTab === 'warm' ? 'bg-orange-500' :
                          activeTab === 'cif' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}>
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{lead.name}</div>
                          <div className="text-sm text-gray-600">{lead.leadId}</div>
                        </div>
                      </div>
                      {getLeadValueBadge(lead.leadValue)}
                    </div>
                    <div className="space-y-2 text-sm mb-4">
                      <div><span className="font-medium text-gray-700">Contact:</span> <span className="text-gray-600">{lead.contactNumber}</span></div>
                      <div><span className="font-medium text-gray-700">Email:</span> <span className="text-gray-600">{lead.email}</span></div>
                      <div><span className="font-medium text-gray-700">Center:</span> <span className="text-gray-600">{lead.centerId?.name}</span></div>
                      <div><span className="font-medium text-gray-700">{activeTab === 'hot' ? 'Qualified:' : activeTab === 'warm' ? 'Next Call:' : activeTab === 'cif' ? 'CIF Date:' : 'Won Date:'}:</span> 
                        <span className="text-gray-600">
                          {activeTab === 'warm' && lead.nextCallDateTime 
                            ? formatDateTime(lead.nextCallDateTime)
                            : activeTab === 'cif' && lead.cifDateTime
                              ? formatDateTime(lead.cifDateTime)
                              : formatDateTime(lead.createdAt)
                          }
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {activeTab !== 'won' && (
                        <button
                          onClick={() => onCallLead(lead)}
                          className="flex-1 flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-sm hover:bg-green-200"
                        >
                          <Phone size={16} className="mr-1" /> Call
                        </button>
                      )}
                      <button
                        onClick={() => onViewLead(lead._id)}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-200"
                      >
                        <Eye size={16} className="mr-1" /> View
                      </button>
                      <button
                        onClick={() => onEditLead(lead)}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium text-sm hover:bg-purple-200"
                      >
                        <Pencil size={16} className="mr-1" /> Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}