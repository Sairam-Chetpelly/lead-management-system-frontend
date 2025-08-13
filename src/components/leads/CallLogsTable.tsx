'use client';

import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Search, FileSpreadsheet, Filter, Phone } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import Modal from '../Modal';
import ModernLoader from '../ModernLoader';
import PaginationFooter from '../PaginationFooter';
import { authAPI } from '@/lib/auth';
import { useDebounce } from '@/hooks/useDebounce';

interface CallLog {
  _id: string;
  userId: { _id: string; name: string };
  leadId: { _id: string; name: string; contactNumber: string };
  callDateTime: string;
  callDuration: number;
  callStatus: string;
  callOutcome?: string;
  nextCallDateTime?: string;
  originalLanguageId?: { _id: string; name: string };
  updatedLanguageId?: { _id: string; name: string };
  cifDateTime?: string;
  languageId?: { _id: string; name: string };
  assignedUserId?: { _id: string; name: string };
  leadValue?: string;
  centerId?: { _id: string; name: string };
  apartmentTypeId?: { _id: string; name: string };
  followUpAction?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface CallLogFormData {
  userId: string;
  leadId: string;
  callDateTime: string;
  callDuration: number;
  callStatus: string;
  callOutcome: string;
  nextCallDateTime: string;
  originalLanguageId: string;
  updatedLanguageId: string;
  cifDateTime: string;
  languageId: string;
  assignedUserId: string;
  leadValue: string;
  centerId: string;
  apartmentTypeId: string;
  followUpAction: string;
  notes: string;
}

export default function CallLogsTable() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination and filters
  const { pagination, handlePageChange, handleLimitChange, updatePagination } = usePagination({ initialLimit: 10 });
  const [filters, setFilters] = useState({
    search: '',
    user: '',
    lead: ''
  });
  const debouncedFilters = useDebounce(filters, 300);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<CallLog | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [formData, setFormData] = useState<CallLogFormData>({
    userId: '',
    leadId: '',
    callDateTime: '',
    callDuration: 0,
    callStatus: '',
    callOutcome: '',
    nextCallDateTime: '',
    originalLanguageId: '',
    updatedLanguageId: '',
    cifDateTime: '',
    languageId: '',
    assignedUserId: '',
    leadValue: '',
    centerId: '',
    apartmentTypeId: '',
    followUpAction: '',
    notes: ''
  });
  const [languages, setLanguages] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [apartmentTypes, setApartmentTypes] = useState<any[]>([]);

  useEffect(() => {
    fetchCallLogs();
    fetchDropdownData();
  }, [pagination.current, pagination.limit, debouncedFilters]);

  const fetchDropdownData = async () => {
    try {
      const [usersRes, leadsRes, languagesRes, centersRes, apartmentTypesRes] = await Promise.all([
        authAPI.admin.getUsers(),
        authAPI.leads.getLeads(),
        authAPI.admin.getLanguages(),
        authAPI.admin.getAllCentres(),
        authAPI.leads.getProjectHouseTypes()
      ]);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || []);
      setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : leadsRes.data.data || []);
      setLanguages(Array.isArray(languagesRes.data) ? languagesRes.data : languagesRes.data.data || []);
      setCenters(Array.isArray(centersRes.data) ? centersRes.data : centersRes.data.data || []);
      const apartmentTypesData = Array.isArray(apartmentTypesRes.data) ? apartmentTypesRes.data : apartmentTypesRes.data.data || [];
      setApartmentTypes(apartmentTypesData.filter((t: any) => t.type === 'house'));
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const fetchCallLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authAPI.leads.getCallLogs({
        page: pagination.current,
        limit: pagination.limit,
        ...debouncedFilters
      });
      setCallLogs(Array.isArray(response.data) ? response.data : response.data.data || []);
      if (response.data.pagination) {
        updatePagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching call logs:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.limit, debouncedFilters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLog) {
        await authAPI.leads.updateCallLog(editingLog._id, formData);
      } else {
        await authAPI.leads.createCallLog(formData);
      }
      fetchCallLogs();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving call log:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this call log?')) {
      try {
        await authAPI.leads.deleteCallLog(id);
        fetchCallLogs();
      } catch (error) {
        console.error('Error deleting call log:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      leadId: '',
      callDateTime: '',
      callDuration: 0,
      callStatus: '',
      callOutcome: '',
      nextCallDateTime: '',
      originalLanguageId: '',
      updatedLanguageId: '',
      cifDateTime: '',
      languageId: '',
      assignedUserId: '',
      leadValue: '',
      centerId: '',
      apartmentTypeId: '',
      followUpAction: '',
      notes: ''
    });
    setEditingLog(null);
  };

  const openModal = (log?: CallLog) => {
    if (log) {
      setEditingLog(log);
      setFormData({
        userId: log.userId._id,
        leadId: log.leadId._id,
        callDateTime: log.callDateTime ? new Date(log.callDateTime).toISOString().slice(0, 16) : '',
        callDuration: log.callDuration || 0,
        callStatus: log.callStatus || '',
        callOutcome: log.callOutcome || '',
        nextCallDateTime: log.nextCallDateTime ? new Date(log.nextCallDateTime).toISOString().slice(0, 16) : '',
        originalLanguageId: log.originalLanguageId?._id || '',
        updatedLanguageId: log.updatedLanguageId?._id || '',
        cifDateTime: log.cifDateTime ? new Date(log.cifDateTime).toISOString().slice(0, 16) : '',
        languageId: log.languageId?._id || '',
        assignedUserId: log.assignedUserId?._id || '',
        leadValue: log.leadValue || '',
        centerId: log.centerId?._id || '',
        apartmentTypeId: log.apartmentTypeId?._id || '',
        followUpAction: log.followUpAction || '',
        notes: log.notes || ''
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    handlePageChange(1);
  };

  if (loading && callLogs.length === 0) return <div className="flex items-center justify-center h-64"><ModernLoader size="lg" variant="primary" /></div>;

  return (
    <div className="p-4 lg:p-8 space-y-6 min-h-full">
      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
        {/* Mobile Filter Button */}
        <div className={`md:hidden ${showFilters ? 'mb-4' : ''}`}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium text-sm hover:bg-blue-200 transition-all"
          >
            <Filter size={16} />
            <span>Filters</span>
          </button>
        </div>
        
        {/* Filter Controls */}
        <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative lg:col-span-2">
              <Search size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search call logs..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              />
            </div>
            <select
              value={filters.user}
              onChange={(e) => handleFilterChange('user', e.target.value)}
              className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>
            <select
              value={filters.lead}
              onChange={(e) => handleFilterChange('lead', e.target.value)}
              className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            >
              <option value="">All Leads</option>
              {leads.map(lead => (
                <option key={lead._id} value={lead._id}>{lead.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={async () => {
              try {
                const response = await authAPI.leads.exportCallLogs();
                const { downloadCSV } = await import('@/lib/exportUtils');
                downloadCSV(response.data, 'call-logs.csv');
              } catch (error) {
                console.error('Export failed:', error);
                alert('Export failed. Please try again.');
              }
            }}
            className="flex items-center space-x-3 px-4 lg:px-6 py-3 bg-white/80 backdrop-blur-sm border border-emerald-200 rounded-2xl hover:bg-emerald-50 transition-all duration-300 shadow-lg hover:shadow-xl group"
          >
            <FileSpreadsheet size={20} className="text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-emerald-700 font-semibold hidden sm:inline">Export</span>
          </button>
          <button 
            onClick={() => openModal()}
            className="flex items-center space-x-3 px-4 lg:px-6 py-3 text-white rounded-2xl hover:opacity-80 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            style={{backgroundColor: '#0f172a'}}
          >
            <Phone size={20} />
            <span className="font-semibold">Add Call Log</span>
          </button>
        </div>
      </div>

      {/* Modern Table Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative flex flex-col" style={{minHeight: 'calc(100vh - 400px)'}}>
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 transition-opacity duration-200">
            <ModernLoader size="lg" variant="primary" />
          </div>
        )}
        
        {/* Desktop Table */}
        <div className="hidden lg:flex flex-col flex-1 min-h-0">
          <div className="text-white" style={{backgroundColor: '#0f172a'}}>
            <div className="grid grid-cols-12 gap-4 px-6 py-4">
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">User</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Lead</div>
              <div className="col-span-1 text-left font-semibold text-sm uppercase tracking-wider">Status</div>
              <div className="col-span-1 text-left font-semibold text-sm uppercase tracking-wider">Duration</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Outcome</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Call Time</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Actions</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              {callLogs.map((log, index) => (
                <div key={log._id} className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 hover:bg-gradient-to-r hover:from-green-50 hover:to-teal-50 transition-all duration-200 animate-stagger ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`} style={{animationDelay: `${index * 0.05}s`}}>
                  <div className="col-span-2 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                      <Phone size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-slate-900 font-bold truncate">{log.userId?.name || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center min-w-0">
                    <div>
                      <div className="text-slate-700 font-medium truncate">{log.leadId?.name || 'N/A'}</div>
                      <div className="text-slate-500 text-xs truncate">{log.leadId?.contactNumber || ''}</div>
                    </div>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      log.callStatus === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {log.callStatus || 'N/A'}
                    </span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className="text-slate-600 text-sm">
                      {log.callDuration ? `${Math.floor(log.callDuration / 60)}m ${log.callDuration % 60}s` : '0s'}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-slate-600 text-sm truncate">
                      {log.callOutcome || log.followUpAction || 'N/A'}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <div className="min-w-0">
                      <div className="text-slate-600 text-sm truncate">
                        {log.callDateTime ? new Date(log.callDateTime).toLocaleString() : 'N/A'}
                      </div>
                      {log.nextCallDateTime && (
                        <div className="text-orange-600 text-xs truncate">
                          Next: {new Date(log.nextCallDateTime).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center space-x-1">
                    <button onClick={() => openModal(log)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all" title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(log._id)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Mobile Cards */}
        <div className="lg:hidden flex-1 overflow-y-auto p-4">
          <div className={`space-y-4 transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {callLogs.map((log) => (
              <div key={log._id} className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold">
                      <Phone size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{log.userId?.name || 'N/A'}</div>
                      <div className="text-sm text-slate-600">{log.leadId?.name || 'N/A'}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                      log.callStatus === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {log.callStatus || 'N/A'}
                    </span>
                  </div>
                  <div><span className="font-medium">Duration:</span> {log.callDuration ? `${Math.floor(log.callDuration / 60)}m ${log.callDuration % 60}s` : '0s'}</div>
                  <div><span className="font-medium">Outcome:</span> {log.callOutcome || log.followUpAction || 'N/A'}</div>
                  <div><span className="font-medium">Call Time:</span> {log.callDateTime ? new Date(log.callDateTime).toLocaleString() : 'N/A'}</div>
                  {log.nextCallDateTime && (
                    <div><span className="font-medium text-orange-600">Next Call:</span> {new Date(log.nextCallDateTime).toLocaleString()}</div>
                  )}
                  {log.notes && (
                    <div><span className="font-medium">Notes:</span> {log.notes}</div>
                  )}
                </div>
                <div className="flex space-x-2 mt-4">
                  <button onClick={() => openModal(log)} className="flex-1 flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded-xl font-medium text-sm">
                    <Pencil size={16} className="mr-1" /> Edit
                  </button>
                  <button onClick={() => handleDelete(log._id)} className="flex-1 flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-xl font-medium text-sm">
                    <Trash2 size={16} className="mr-1" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <PaginationFooter
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          itemName="call logs"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLog ? 'Edit Call Log' : 'Add Call Log'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select User</option>
                {users && users.map ? users.map(user => (
                  <option key={user._id} value={user._id}>{user.name}</option>
                )) : null}
              </select>
              <select
                value={formData.leadId}
                onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Lead</option>
                {leads && leads.map ? leads.map(lead => (
                  <option key={lead._id} value={lead._id}>{lead.name}</option>
                )) : null}
              </select>
            </div>
          </div>

          {/* Call Details */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-3">Call Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Call Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.callDateTime}
                  onChange={(e) => setFormData({ ...formData, callDateTime: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration (seconds)</label>
                <input
                  type="number"
                  value={formData.callDuration}
                  onChange={(e) => setFormData({ ...formData, callDuration: parseInt(e.target.value) || 0 })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Call Status</label>
                <select
                  value={formData.callStatus}
                  onChange={(e) => setFormData({ ...formData, callStatus: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="connected">Connected</option>
                  <option value="not_connected">Not Connected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Call Outcome</label>
                <select
                  value={formData.callOutcome}
                  onChange={(e) => setFormData({ ...formData, callOutcome: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Outcome</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="language_mismatch">Language Mismatch</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="qualified">Qualified</option>
                  <option value="not_reachable">Not Reachable</option>
                  <option value="incorrect_number">Incorrect Number</option>
                  <option value="not_picking">Not Picking</option>
                </select>
              </div>
            </div>
          </div>

          {/* Language & Assignment */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Language & Assignment</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Original Language</label>
                <select
                  value={formData.originalLanguageId}
                  onChange={(e) => setFormData({ ...formData, originalLanguageId: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Language</option>
                  {languages.map(lang => (
                    <option key={lang._id} value={lang._id}>{lang.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Updated Language</label>
                <select
                  value={formData.updatedLanguageId}
                  onChange={(e) => setFormData({ ...formData, updatedLanguageId: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Language</option>
                  {languages.map(lang => (
                    <option key={lang._id} value={lang._id}>{lang.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Language Preference</label>
                <select
                  value={formData.languageId}
                  onChange={(e) => setFormData({ ...formData, languageId: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Language</option>
                  {languages.map(lang => (
                    <option key={lang._id} value={lang._id}>{lang.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Assigned User</label>
                <select
                  value={formData.assignedUserId}
                  onChange={(e) => setFormData({ ...formData, assignedUserId: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select User</option>
                  {users.filter(u => u.roleId?.slug === 'sales_agent').map(user => (
                    <option key={user._id} value={user._id}>{user.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Follow Up & Scheduling */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Follow Up & Scheduling</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Next Call Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.nextCallDateTime}
                  onChange={(e) => setFormData({ ...formData, nextCallDateTime: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CIF Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.cifDateTime}
                  onChange={(e) => setFormData({ ...formData, cifDateTime: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Follow Up Action</label>
                <select
                  value={formData.followUpAction}
                  onChange={(e) => setFormData({ ...formData, followUpAction: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Action</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="qualified">Qualified</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Lead Value</label>
                <select
                  value={formData.leadValue}
                  onChange={(e) => setFormData({ ...formData, leadValue: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Value</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location & Property */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Location & Property</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Center</label>
                <select
                  value={formData.centerId}
                  onChange={(e) => setFormData({ ...formData, centerId: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Center</option>
                  {centers.map(center => (
                    <option key={center._id} value={center._id}>{center.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Apartment Type</label>
                <select
                  value={formData.apartmentTypeId}
                  onChange={(e) => setFormData({ ...formData, apartmentTypeId: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Type</option>
                  {apartmentTypes.map(type => (
                    <option key={type._id} value={type._id}>{type.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Call notes and observations..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-all"
              style={{backgroundColor: '#0f172a'}}
            >
              {editingLog ? 'Update Call Log' : 'Create Call Log'}
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}