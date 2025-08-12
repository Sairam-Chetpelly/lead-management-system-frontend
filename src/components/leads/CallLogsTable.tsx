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
  leadId: { _id: string; name: string };
  dateTime: string;
  createdAt: string;
}

interface CallLogFormData {
  userId: string;
  leadId: string;
  dateTime: string;
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
    dateTime: ''
  });

  useEffect(() => {
    fetchCallLogs();
    fetchDropdownData();
  }, [pagination.current, pagination.limit, debouncedFilters]);

  const fetchDropdownData = async () => {
    try {
      const [usersRes, leadsRes] = await Promise.all([
        authAPI.admin.getUsers(),
        authAPI.leads.getLeads()
      ]);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || []);
      setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : leadsRes.data.data || []);
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
      dateTime: ''
    });
    setEditingLog(null);
  };

  const openModal = (log?: CallLog) => {
    if (log) {
      setEditingLog(log);
      setFormData({
        userId: log.userId._id,
        leadId: log.leadId._id,
        dateTime: log.dateTime ? new Date(log.dateTime).toISOString().slice(0, 16) : ''
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
              <div className="col-span-3 text-left font-semibold text-sm uppercase tracking-wider">User</div>
              <div className="col-span-3 text-left font-semibold text-sm uppercase tracking-wider">Lead</div>
              <div className="col-span-3 text-left font-semibold text-sm uppercase tracking-wider">Call Time</div>
              <div className="col-span-1 text-left font-semibold text-sm uppercase tracking-wider">Created</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Actions</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              {callLogs.map((log, index) => (
                <div key={log._id} className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 hover:bg-gradient-to-r hover:from-green-50 hover:to-teal-50 transition-all duration-200 animate-stagger ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`} style={{animationDelay: `${index * 0.05}s`}}>
                  <div className="col-span-3 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                      <Phone size={16} />
                    </div>
                    <div className="text-slate-900 font-bold truncate">{log.userId?.name || 'N/A'}</div>
                  </div>
                  <div className="col-span-3 flex items-center">
                    <span className="text-slate-700 font-medium truncate">{log.leadId?.name || 'N/A'}</span>
                  </div>
                  <div className="col-span-3 flex items-center">
                    <span className="text-slate-600 text-sm">
                      {log.dateTime ? new Date(log.dateTime).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className="text-slate-500 text-xs">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center space-x-1">
                    <button onClick={() => openModal(log)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(log._id)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all">
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
                  <div><span className="font-medium">Call Time:</span> {log.dateTime ? new Date(log.dateTime).toLocaleString() : 'N/A'}</div>
                  <div><span className="font-medium">Created:</span> {new Date(log.createdAt).toLocaleDateString()}</div>
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
          <select
            value={formData.userId}
            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Lead</option>
            {leads && leads.map ? leads.map(lead => (
              <option key={lead._id} value={lead._id}>{lead.name}</option>
            )) : null}
          </select>
          <input
            type="datetime-local"
            value={formData.dateTime}
            onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
            className="w-full p-2 border rounded"
          />
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="text-white px-6 py-3 rounded-lg font-semibold hover:opacity-80 hover:shadow-lg transition-all duration-300"
              style={{backgroundColor: '#0f172a'}}
            >
              {editingLog ? 'Update Call Log' : 'Create Call Log'}
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}