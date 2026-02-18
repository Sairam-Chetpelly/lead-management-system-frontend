'use client';

import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/auth';
import { FileText, Search, Filter, Mail, User } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import PaginationFooter from '../PaginationFooter';
import ModernLoader from '../ModernLoader';
import SearchableAgentDropdown from '../SearchableAgentDropdown';

interface ActivityLog {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  leadId: {
    _id: string;
    leadID: string;
    name: string;
    contactNumber: string;
  };
  type: string;
  comment: string;
  document: string;
  createdAt: string;
}

export default function ActivityLogsTable() {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { pagination, handlePageChange, handleLimitChange, updatePagination } = usePagination({ initialLimit: 10 });
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    userId: '',
    type: ''
  });
  const [users, setUsers] = useState<any[]>([]);
  const debouncedFilters = useDebounce(filters, 300);

  useEffect(() => {
    fetchActivityLogs();
    fetchUsers();
  }, [pagination.current, pagination.limit, debouncedFilters]);

  const fetchActivityLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.current,
        limit: pagination.limit
      };
      if (debouncedFilters.startDate) params.startDate = debouncedFilters.startDate;
      if (debouncedFilters.endDate) params.endDate = debouncedFilters.endDate;
      if (debouncedFilters.userId) params.userId = debouncedFilters.userId;
      if (debouncedFilters.type) params.type = debouncedFilters.type;
      if (debouncedFilters.search) params.search = debouncedFilters.search;

      const response = await authAPI.getActivityLogs(params);
      const data = response.data.data || response.data;
      setActivityLogs(Array.isArray(data) ? data : (data?.activityLogs || []));
      if (data?.pagination || response.data.pagination) {
        updatePagination(data?.pagination || response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      setActivityLogs([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.limit, debouncedFilters, updatePagination]);

  const fetchUsers = async () => {
    try {
      const response = await authAPI.getUsers({ limit: 1000 });
      const data = response.data.data || response.data;
      setUsers(Array.isArray(data) ? data : (data?.users || []));
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    handlePageChange(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', startDate: '', endDate: '', userId: '', type: '' });
    handlePageChange(1);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 min-h-full">
      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
        {/* Mobile Filter Button */}
        <div className={`md:hidden ${showFilters ? 'mb-4' : ''} flex gap-2`}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium text-sm hover:bg-blue-200 transition-all"
          >
            <Filter size={16} />
            <span>Filters</span>
          </button>
          <button
            onClick={clearFilters}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-all"
          >
            <span>Clear</span>
          </button>
        </div>

        {/* Desktop Clear Button */}
        <div className="hidden md:flex justify-end mb-4">
          <button
            onClick={clearFilters}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-all"
          >
            <span>Clear Filters</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search activity logs..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              />
            </div>
            <SearchableAgentDropdown
              agents={users}
              value={filters.userId}
              onChange={(value) => handleFilterChange('userId', value)}
              placeholder="All Users"
            />
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            >
              <option value="">All Types</option>
              <option value="call">Call</option>
              <option value="manual">Manual</option>
            </select>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              placeholder="End Date"
            />
          </div>
        </div>
      </div>

      {/* Modern Table Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative flex flex-col" style={{ minHeight: 'calc(100vh - 400px)' }}>
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 transition-opacity duration-200">
            <ModernLoader size="lg" variant="primary" />
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden xl:flex flex-col flex-1 min-h-0">
          <div className="text-white" style={{ backgroundColor: '#0f172a' }}>
            <div className="grid grid-cols-6 gap-3 px-4 py-4">
              <div className="col-span-1 text-left font-semibold text-xs uppercase tracking-wider">
                User
              </div>
              <div className="col-span-1 text-left font-semibold text-xs uppercase tracking-wider">
                Lead
              </div>
              <div className="col-span-1 text-left font-semibold text-xs uppercase tracking-wider">
                Type
              </div>
              <div className="col-span-2 text-left font-semibold text-xs uppercase tracking-wider">
                Comment
              </div>
              <div className="col-span-1 text-left font-semibold text-xs uppercase tracking-wider">
                Created
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              {activityLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg font-medium">No activity logs found</p>
                  <p className="text-gray-400 text-sm">Try adjusting your filters</p>
                </div>
              ) : (
                activityLogs.map((log) => (
                  <div key={log._id} className="grid grid-cols-6 gap-3 px-4 py-3 border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">
                    <div className="col-span-1 flex flex-col justify-center min-w-0">
                      <div className="text-slate-700 font-medium truncate flex items-center">
                        <User size={12} className="mr-1 text-slate-400" />
                        {log.userId?.name || 'N/A'}
                      </div>
                      <div className="text-slate-500 text-sm truncate flex items-center">
                        <Mail size={12} className="mr-1 text-slate-400" />
                        {log.userId?.email || 'N/A'}
                      </div>
                    </div>

                    <div className="col-span-1 flex flex-col justify-center min-w-0">
                      <div className="text-slate-700 font-medium truncate">
                        {log.leadId?.leadID || 'N/A'}
                      </div>
                      <div className="text-slate-500 text-sm truncate">
                        {log.leadId?.name || 'N/A'}
                      </div>
                    </div>

                    <div className="col-span-1 flex items-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${
                        log.type === 'call' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {log.type.toUpperCase()}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center">
                      <div className="text-slate-700 text-sm line-clamp-2">
                        {log.comment}
                      </div>
                    </div>

                    <div className="col-span-1 flex items-center">
                      <div className="text-slate-500 text-sm">
                        {formatDateTime(log.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="xl:hidden flex-1 overflow-y-auto p-4">
          <div className={`space-y-4 transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {activityLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg font-medium">No activity logs found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              activityLogs.map((log) => (
                <div key={log._id} className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                        <FileText size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{log.userId?.name || 'N/A'}</div>
                        <div className="text-sm text-slate-600">{log.type.toUpperCase()}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      log.type === 'call' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {log.type.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">User Email:</span> {log.userId?.email || 'N/A'}</div>
                    <div><span className="font-medium">Lead ID:</span> {log.leadId?.leadID || 'N/A'}</div>
                    <div><span className="font-medium">Lead Name:</span> {log.leadId?.name || 'N/A'}</div>
                    <div><span className="font-medium">Comment:</span> {log.comment}</div>
                    <div className="text-gray-500">Created: {formatDateTime(log.createdAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <PaginationFooter
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          itemName="activity logs"
        />
      </div>
    </div>
  );
}