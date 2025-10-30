'use client';

import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/auth';
import { Phone, Search, Filter, Mail, User } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import PaginationFooter from '../PaginationFooter';
import ModernLoader from '../ModernLoader';
import SearchableAgentDropdown from '../SearchableAgentDropdown';

interface CallLog {
  _id: string;
  callId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  leadId: {
    _id: string;
    name: string;
    contactNumber: string;
  };
  dateTime: string;
  createdAt: string;
}

export default function CallLogsTable() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { pagination, handlePageChange, handleLimitChange, updatePagination } = usePagination({ initialLimit: 10 });
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    userId: ''
  });
  const [users, setUsers] = useState<any[]>([]);
  const debouncedFilters = useDebounce(filters, 300);

  useEffect(() => {
    fetchCallLogs();
    fetchUsers();
  }, [pagination.current, pagination.limit, debouncedFilters]);

  const fetchCallLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.current,
        limit: pagination.limit
      };
      if (debouncedFilters.startDate) params.startDate = debouncedFilters.startDate;
      if (debouncedFilters.endDate) params.endDate = debouncedFilters.endDate;
      if (debouncedFilters.userId) params.userId = debouncedFilters.userId;
      if (debouncedFilters.search) params.search = debouncedFilters.search;

      const response = await authAPI.getCallLogs(params);
      if (response.data.callLogs) {
        setCallLogs(response.data.callLogs);
        if (response.data.pagination) {
          updatePagination(response.data.pagination);
        }
      } else {
        setCallLogs(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching call logs:', error);
      setCallLogs([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.limit, debouncedFilters, updatePagination]);

  const fetchUsers = async () => {
    try {
      const response = await authAPI.getUsers({ limit: 1000 });
      setUsers(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
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
    setFilters({ search: '', startDate: '', endDate: '', userId: '' });
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search call logs..."
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
            <div className="grid grid-cols-5 gap-3 px-4 py-4">
              <div className="col-span-1 text-left font-semibold text-xs uppercase tracking-wider">
                Call ID
              </div>
              <div className="col-span-1 text-left font-semibold text-xs uppercase tracking-wider">
                User
              </div>
              <div className="col-span-1 text-left font-semibold text-xs uppercase tracking-wider">
                Lead
              </div>
              <div className="col-span-1 text-left font-semibold text-xs uppercase tracking-wider">
                Call Date
              </div>
              <div className="col-span-1 text-left font-semibold text-xs uppercase tracking-wider">
                Created
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              {callLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Phone className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg font-medium">No call logs found</p>
                  <p className="text-gray-400 text-sm">Try adjusting your filters</p>
                </div>
              ) : (
                callLogs.map((callLog) => (
                  <div key={callLog._id} className="grid grid-cols-5 gap-3 px-4 py-3 border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">
                    <div className="col-span-1 flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        <Phone size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-slate-900 font-bold truncate">{callLog.callId}</div>
                      </div>
                    </div>

                    <div className="col-span-1 flex flex-col justify-center min-w-0">
                      <div className="text-slate-700 font-medium truncate flex items-center">
                        <User size={12} className="mr-1 text-slate-400" />
                        {callLog.userId?.name || 'N/A'}
                      </div>
                      <div className="text-slate-500 text-sm truncate flex items-center">
                        <Mail size={12} className="mr-1 text-slate-400" />
                        {callLog.userId?.email || 'N/A'}
                      </div>
                    </div>

                    <div className="col-span-1 flex flex-col justify-center min-w-0">
                      <div className="text-slate-700 font-medium truncate">
                        {callLog.leadId?.name || 'N/A'}
                      </div>
                      <div className="text-slate-500 text-sm truncate flex items-center">
                        <Phone size={12} className="mr-1 text-slate-400" />
                        {callLog.leadId?.contactNumber || 'N/A'}
                      </div>
                    </div>

                    <div className="col-span-1 flex items-center">
                      <div className="text-slate-700 font-medium">
                        {formatDateTime(callLog.dateTime)}
                      </div>
                    </div>

                    <div className="col-span-1 flex items-center">
                      <div className="text-slate-500 text-sm">
                        {formatDateTime(callLog.createdAt)}
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
            {callLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Phone className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg font-medium">No call logs found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              callLogs.map((callLog) => (
                <div key={callLog._id} className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                        <Phone size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{callLog.callId}</div>
                        <div className="text-sm text-slate-600">Call ID</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">User:</span> {callLog.userId?.name || 'N/A'}</div>
                    <div><span className="font-medium">Email:</span> {callLog.userId?.email || 'N/A'}</div>
                    <div><span className="font-medium">Lead:</span> {callLog.leadId?.name || 'N/A'}</div>
                    <div><span className="font-medium">Contact:</span> {callLog.leadId?.contactNumber || 'N/A'}</div>
                    <div><span className="font-medium">Call Date:</span> {formatDateTime(callLog.dateTime)}</div>
                    <div className="text-gray-500">Created: {formatDateTime(callLog.createdAt)}</div>
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
          itemName="call logs"
        />
      </div>
    </div>
  );
}