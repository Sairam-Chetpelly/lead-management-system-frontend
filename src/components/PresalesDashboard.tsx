'use client';

import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/auth';
import { Phone, Eye, Pencil } from 'lucide-react';

interface PresalesStats {
  totalLeads: number;
  freshLeads: number;
  followUpLeads: number;
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
  createdAt: string;
  nextCallDateTime?: string;
}

interface PresalesDashboardProps {
  user: any;
  onCallLead: (lead: Lead) => void;
  onViewLead: (leadId: string) => void;
  onEditLead: (lead: Lead) => void;
}

export default function PresalesDashboard({ user, onCallLead, onViewLead, onEditLead }: PresalesDashboardProps) {
  const [stats, setStats] = useState<PresalesStats>({ totalLeads: 0, freshLeads: 0, followUpLeads: 0 });
  const [activeTab, setActiveTab] = useState('fresh');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchLeads(activeTab);
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const response = await authAPI.get('/api/dashboard/presales-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({ totalLeads: 0, freshLeads: 0, followUpLeads: 0 });
    }
  };

  const fetchLeads = async (category: string) => {
    try {
      setLoading(true);
      const response = await authAPI.get(`/api/dashboard/presales-leads/${category}`);
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

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Presales Dashboard</h1>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="fas fa-users text-blue-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="fas fa-star text-green-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Fresh Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.freshLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <i className="fas fa-phone text-yellow-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Follow Ups</p>
              <p className="text-2xl font-bold text-gray-900">{stats.followUpLeads}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('fresh')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'fresh'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Fresh Leads ({stats.freshLeads})
            </button>
            <button
              onClick={() => setActiveTab('not-connected')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'not-connected'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Not Connected
            </button>
            <button
              onClick={() => setActiveTab('follow-up')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'follow-up'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Follow Up Leads ({stats.followUpLeads})
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
                        Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {activeTab === 'fresh' ? 'Created At' : 'Next Call'}
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
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
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
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {lead.sourceId?.name || '--'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {activeTab === 'fresh' 
                            ? formatDateTime(lead.createdAt)
                            : lead.nextCallDateTime 
                              ? formatDateTime(lead.nextCallDateTime)
                              : 'Not scheduled'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => onCallLead(lead)}
                              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                              title="Call"
                            >
                              <Phone size={16} />
                            </button>
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
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{lead.name}</div>
                          <div className="text-sm text-gray-600">{lead.leadId}</div>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {lead.sourceId?.name || '--'}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm mb-4">
                      <div><span className="font-medium text-gray-700">Contact:</span> <span className="text-gray-600">{lead.contactNumber}</span></div>
                      <div><span className="font-medium text-gray-700">Email:</span> <span className="text-gray-600">{lead.email}</span></div>
                      <div><span className="font-medium text-gray-700">{activeTab === 'fresh' ? 'Created:' : 'Next Call:'}:</span> 
                        <span className="text-gray-600">
                          {activeTab === 'fresh' 
                            ? formatDateTime(lead.createdAt)
                            : lead.nextCallDateTime 
                              ? formatDateTime(lead.nextCallDateTime)
                              : 'Not scheduled'
                          }
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onCallLead(lead)}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-sm hover:bg-green-200"
                      >
                        <Phone size={16} className="mr-1" /> Call
                      </button>
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