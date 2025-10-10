'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Mail, Phone, User, Building, Globe, Eye, Search, Filter, FileSpreadsheet, Edit, Trash2, PhoneCall, FileText } from 'lucide-react';
import { authAPI } from '@/lib/auth';
import { useToast } from '@/contexts/ToastContext';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import PaginationFooter from './PaginationFooter';
import ModernLoader from './ModernLoader';
import Modal from './Modal';
import DeleteDialog from './DeleteDialog';
import LeadCreationModal from './LeadCreationModal';
import ActivityLogModal from './ActivityLogModal';
import LeadView from './LeadView';
import LeadEditModal from './LeadEditModal';
import PresalesLeadEditModal from './PresalesLeadEditModal';
import SearchableAgentDropdown from './SearchableAgentDropdown';

interface LeadsTableProps {
  user: any;
}

interface Lead {
  _id: string;
  leadID: string;
  name: string;
  email: string;
  contactNumber: string;
  comment: string;
  presalesUserId?: {
    name: string;
    email: string;
  };
  salesUserId?: {
    name: string;
    email: string;
  };
  languageId?: {
    name: string;
  };
  sourceId: {
    name: string;
  };
  projectTypeId?: {
    name: string;
    type: string;
  };
  houseTypeId?: {
    name: string;
    type: string;
  };
  centreId?: {
    name: string;
  };
  leadStatusId?: {
    name: string;
    slug: string;
  };
  leadSubStatusId?: {
    name: string;
    slug: string;
  };
  leadValue?: string;
  createdAt: string;
  updatedAt?: string;
  qualifiedDate?: string;
  hotDate?: string;
  warmDate?: string;
  cifDate?: string;
  meetingArrangedDate?: string;
  interestedDate?: string;
  leadWonDate?: string;
  leadLostDate?: string;
  siteVisit?: boolean;
  centerVisit?: boolean;
  virtualMeeting?: boolean;
  siteVisitDate?: string;
  centerVisitDate?: string;
  virtualMeetingDate?: string;
  siteVisitCompletedDate?: string;
  centerVisitCompletedDate?: string;
  virtualMeetingCompletedDate?: string;
  callLogCount?: number;
  activityLogCount?: number;
  salesActivity?: boolean;
  hasActivity?: boolean;
}

export default function LeadsTable({ user }: LeadsTableProps) {
  const { showToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [showLeadView, setShowLeadView] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<{ isOpen: boolean, leadId: string }>({ isOpen: false, leadId: '' });
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean, id: string, name: string }>({ isOpen: false, id: '', name: '' });
  const [activityLogModal, setActivityLogModal] = useState<{ isOpen: boolean, leadId: string }>({ isOpen: false, leadId: '' });

  // Dropdown data for filters
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [centres, setCentres] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<any[]>([]);
  const [leadSubStatuses, setLeadSubStatuses] = useState<any[]>([]);

  // Pagination and filters
  const { pagination, handlePageChange, handleLimitChange, updatePagination } = usePagination({ initialLimit: 10 });
  const [filters, setFilters] = useState({
    search: '',
    source: '',
    assignedTo: '',
    leadValue: '',
    centre: '',
    leadStatus: '',
    leadSubStatus: '',
    siteVisit: '',
    centerVisit: '',
    virtualMeeting: '',
    dateFrom: '',
    dateTo: ''
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Set default sort based on user role
  useEffect(() => {
    const userRole = getCurrentUserRole();
    if (['sales_agent', 'sales_manager', 'hod_sales'].includes(userRole)) {
      setSortBy('qualifiedDate');
    } else {
      setSortBy('createdAt');
    }
  }, []);
  const debouncedFilters = useDebounce(filters, 300);

  // Helper function to get row color and reason
  const getRowColorAndReason = (lead: Lead) => {
    // Check if lead has any activity (touched vs untouched)
    const hasFieldActivity = lead.qualifiedDate || lead.hotDate || lead.warmDate || lead.cifDate || 
                            lead.meetingArrangedDate || lead.interestedDate || lead.siteVisit || 
                            lead.centerVisit || lead.virtualMeeting || lead.siteVisitCompletedDate ||
                            lead.centerVisitCompletedDate || lead.virtualMeetingCompletedDate;
    
    // Check for call logs and activity logs from backend
    const hasCallLogs = (lead.callLogCount || 0) > 0;
    const hasActivityLogs = (lead.activityLogCount || 0) > 0;
    
    // Check for meaningful comment activity (not just auto-generated comments)
    const hasCommentActivity = lead.comment && lead.comment.trim().length > 0 && 
                              !lead.comment.includes('Google Ads Lead') && 
                              !lead.comment.includes('Facebook Ads Lead') && 
                              !lead.comment.includes('Instagram Ads Lead');
    
    // Combined activity check - includes field activity, call logs, activity logs, or meaningful comments
    const hasActivity = hasFieldActivity || hasCallLogs || hasActivityLogs || hasCommentActivity || lead.hasActivity;
    
    // For sales team - check if lead is assigned to sales and has no sales activity
    const isAssignedToSales = lead.salesUserId;
    
    // If assigned to sales team but no sales activity from the assigned sales agent
    if (isAssignedToSales && !lead.salesActivity) {
      return { color: 'bg-green-500 border-l-4 border-green-700', reason: '🟢 UNTOUCHED - No action taken by assigned sales agent' };
    }
    
    // If not assigned to anyone or only assigned to presales with no activity
    if (!hasActivity) {
      return { color: 'bg-green-500 border-l-4 border-green-700', reason: '🟢 UNTOUCHED - No activity recorded' };
    }
    
    // Lead has activity - light green
    return { color: 'bg-white border-l-4 border-gray-300', reason: '⚪ ACTIVE - Has activity/action taken' };
  };

  const getRowColor = (lead: Lead) => getRowColorAndReason(lead).color;

  // Helper function to get short status display
  const getShortStatus = (lead: Lead) => {
    if (lead.leadStatusId?.slug === 'won') return { text: 'WON', color: 'bg-green-500 text-white' };
    if (lead.leadStatusId?.slug === 'lost') return { text: 'LOST', color: 'bg-gray-500 text-white' };
    if (lead.leadStatusId?.slug === 'qualified') {
      if (lead.leadSubStatusId?.slug === 'hot') return { text: 'HOT', color: 'bg-red-500 text-white' };
      if (lead.leadSubStatusId?.slug === 'warm') return { text: 'WARM', color: 'bg-yellow-500 text-white' };
      if (lead.leadSubStatusId?.slug === 'cif') return { text: 'CIF', color: 'bg-purple-500 text-white' };
      return { text: 'QUAL', color: 'bg-blue-500 text-white' };
    }
    if (lead.leadStatusId?.slug === 'lead') {
      if (lead.leadSubStatusId?.slug === 'interested') return { text: 'INT', color: 'bg-teal-500 text-white' };
      if (lead.leadSubStatusId?.slug === 'meeting-arranged') return { text: 'MEET', color: 'bg-indigo-500 text-white' };
      return { text: 'LEAD', color: 'bg-indigo-400 text-white' };
    }
    return { text: 'NEW', color: 'bg-gray-400 text-white' };
  };

  // Helper function to get assignment status
  const getAssignmentStatus = (lead: Lead) => {
    if (!lead.presalesUserId && !lead.salesUserId) {
      return { text: 'UNASSIGNED', color: 'bg-red-100 text-red-800' };
    }
    if (lead.presalesUserId) {
      return { text: 'PRE', color: 'bg-blue-100 text-blue-800', name: lead.presalesUserId.name };
    }
    if (lead.salesUserId) {
      return { text: 'SALES', color: 'bg-purple-100 text-purple-800', name: lead.salesUserId.name };
    }
    return { text: 'N/A', color: 'bg-gray-100 text-gray-800' };
  };

  useEffect(() => {
    fetchLeads();
    fetchDropdownData();
  }, [pagination.current, pagination.limit, sortBy, sortOrder, debouncedFilters]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authAPI.getLeads({
        page: pagination.current,
        limit: pagination.limit,
        sortBy,
        sortOrder,
        ...debouncedFilters
      });

      if (response.data.leads) {
        setLeads(response.data.leads);
        if (response.data.pagination) {
          updatePagination(response.data.pagination);
        }
      } else {
        setLeads(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      showToast('Failed to fetch leads', 'error');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.limit, sortBy, sortOrder, debouncedFilters, updatePagination]);
  const getCurrentUserRole = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        return user.role;
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    return null;
  };

  const userRole = getCurrentUserRole();
  const isSalesAgent = userRole === 'sales_agent';
  const isPreSalesAgent = userRole === 'presales_agent';
  const isSalesManager = userRole === 'sales_manager';
  const isHodSales = userRole === 'hod_sales';
  const isPreSalesManager = userRole === 'manager_presales';
  const isPreSalesHod = userRole === 'hod_presales';
  const isMarketing = userRole === 'marketing';
  const isAdmin = userRole === 'admin';

  const fetchDropdownData = async () => {
    try {
      const [sourcesRes, centresRes, usersRes, statusesRes] = await Promise.all([
        authAPI.admin.getAllLeadSources(),
        authAPI.admin.getAllCentres(),
        authAPI.getUsers({ limit: 1000 }),
        authAPI.admin.getAllStatuses()
      ]);

      setLeadSources(sourcesRes.data.data || sourcesRes.data || []);
      setCentres(centresRes.data.data || centresRes.data || []);
      setUsers(usersRes.data.data || usersRes.data || []);

      const statuses = statusesRes.data.data || statusesRes.data || [];
      setLeadStatuses(statuses.filter((s: any) => s.type === 'leadStatus'));
      setLeadSubStatuses(statuses.filter((s: any) => s.type === 'leadSubStatus'));
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      showToast('Failed to fetch dropdown data', 'error');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };

      // Clear substatus when status changes and current substatus is not valid for new status
      if (key === 'leadStatus') {
        const selectedStatus = leadStatuses.find(s => s._id === value);
        const currentSubStatus = leadSubStatuses.find(s => s._id === prev.leadSubStatus);

        if (selectedStatus && currentSubStatus) {
          let isValidSubStatus = false;

          if (selectedStatus.slug === 'lead') {
            isValidSubStatus = ['cif', 'interested', 'meeting-arranged'].includes(currentSubStatus.slug);
          } else if (selectedStatus.slug === 'qualified') {
            isValidSubStatus = ['hot', 'cif', 'warm'].includes(currentSubStatus.slug);
          } else if (selectedStatus.slug === 'won' || selectedStatus.slug === 'lost') {
            isValidSubStatus = false; // These statuses have no substatuses
          }

          if (!isValidSubStatus) {
            newFilters.leadSubStatus = '';
          }
        }
      }

      return newFilters;
    });
    handlePageChange(1);
  };

  const handleView = (lead: Lead) => {
    setViewLead(lead);
  };

  const handleViewDetails = (leadId: string) => {
    setShowLeadView(leadId);
  };

  const handleDelete = async () => {
    try {
      await authAPI.admin.deleteLead(deleteDialog.id);
      showToast('Lead deleted successfully', 'success');
      fetchLeads();
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete lead';
      showToast(errorMessage, 'error');
    } finally {
      setDeleteDialog({ isOpen: false, id: '', name: '' });
    }
  };

  const handleCall = async (leadId: string, contactNumber?: string) => {
    // Check if device is mobile or tablet
    const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobileOrTablet && contactNumber) {
      try {
        // Copy contact number to clipboard
        await navigator.clipboard.writeText(contactNumber);
        showToast('Contact number copied to clipboard', 'success');

        // Open native dialer
        window.location.href = `tel:${contactNumber}`;
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        // Fallback: just open dialer
        window.location.href = `tel:${contactNumber}`;
      }
    }

    try {
      await authAPI.createCallLog(leadId);
      if (!isMobileOrTablet) {
        showToast('Call logged successfully', 'success');
      }
    } catch (error) {
      console.error('Error logging call:', error);
      showToast('Failed to log call', 'error');
    }
  };

  const exportLeads = async () => {
    try {
      console.log('Exporting leads with filters:', debouncedFilters);
      const response = await authAPI.exportLeads({ sortBy, sortOrder, ...debouncedFilters });
      console.log('Export response:', response);
      console.log('Export response data:', response.data);

      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        showToast('No data to export', 'info');
        return;
      }

      const { downloadCSV } = await import('@/lib/exportUtils');
      downloadCSV(response.data, 'leads.csv');
      showToast('Leads exported successfully', 'success');
    } catch (error: any) {
      console.error('Export failed:', error);
      showToast(`Export failed: ${error.response?.data?.error || error.message}`, 'error');
    }
  };

  if (showLeadView) {
    return (
      <LeadView
        leadId={showLeadView}
        onBack={() => setShowLeadView(null)}
      />
    );
  }

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <div className="relative xl:col-span-2">
              <Search size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              />
            </div>
            <select
              value={filters.source}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            >
              <option value="">All Sources</option>
              {leadSources.map(source => (
                <option key={source._id} value={source._id}>{source.name}</option>
              ))}
            </select>
            <div className={isSalesAgent || isPreSalesAgent ? 'hidden' : ''}>
              <SearchableAgentDropdown
                agents={users}
                value={filters.assignedTo}
                onChange={(value) => handleFilterChange('assignedTo', value)}
                placeholder="All Agents"
              />
            </div>
            <select
              value={filters.leadValue}
              onChange={(e) => handleFilterChange('leadValue', e.target.value)}
              className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            >
              <option value="">All Values</option>
              <option value="high value">High Value</option>
              <option value="low value">Low Value</option>
            </select>
            {(isAdmin || isHodSales || isMarketing) && (
              <select
                value={filters.centre}
                onChange={(e) => handleFilterChange('centre', e.target.value)}
                hidden={isSalesAgent || isPreSalesAgent}
                className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              >
                <option value="">All Centres</option>
                {centres.map(centre => (
                  <option key={centre._id} value={centre._id}>{centre.name}</option>
                ))}
              </select>
            )}
            {(isAdmin || isHodSales || isMarketing) && (
              <select
                value={filters.leadStatus}
                hidden={isSalesAgent || isPreSalesAgent}
                onChange={(e) => handleFilterChange('leadStatus', e.target.value)}
                className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              >
                <option value="">All Status</option>
                {leadStatuses.map(status => (
                  <option key={status._id} value={status._id}>{status.name}</option>
                ))}
              </select>
            )}
            <select
              value={filters.leadSubStatus}
              onChange={(e) => handleFilterChange('leadSubStatus', e.target.value)}
              disabled={(() => {
                const selectedStatus = leadStatuses.find(s => s._id === filters.leadStatus);
                return selectedStatus && (selectedStatus.slug === 'won' || selectedStatus.slug === 'lost');
              })()}
              className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">All Sub-Status</option>
              {leadSubStatuses
                .filter(subStatus => {
                  const selectedStatus = leadStatuses.find(s => s._id === filters.leadStatus);
                  if (!selectedStatus) return true; // Show all if no status selected

                  // Won/Lost have no substatuses
                  if (selectedStatus.slug === 'won' || selectedStatus.slug === 'lost') return false;

                  // Lead status can have: cif, interested, meeting-arranged
                  if (selectedStatus.slug === 'lead') {
                    return ['cif', 'interested', 'meeting-arranged'].includes(subStatus.slug);
                  }

                  // Qualified status can have: hot, cif, warm
                  if (selectedStatus.slug === 'qualified') {
                    return ['hot', 'cif', 'warm'].includes(subStatus.slug);
                  }

                  return true;
                })
                .map(subStatus => (
                  <option key={subStatus._id} value={subStatus._id}>{subStatus.name}</option>
                ))
              }
            </select>
            <select
              value={filters.siteVisit}
              onChange={(e) => handleFilterChange('siteVisit', e.target.value)}
              className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            >
              <option value="">Site Visit</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
            <select
              value={filters.centerVisit}
              onChange={(e) => handleFilterChange('centerVisit', e.target.value)}
              className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            >
              <option value="">Center Visit</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
            <select
              value={filters.virtualMeeting}
              onChange={(e) => handleFilterChange('virtualMeeting', e.target.value)}
              className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            >
              <option value="">Virtual Meeting</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              placeholder="From Date"
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              placeholder="To Date"
            />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportLeads}
            style={{ display: isSalesAgent || isPreSalesAgent ? 'none' : 'flex' }}
            className="items-center space-x-3 px-4 lg:px-6 py-3 bg-white/80 backdrop-blur-sm border border-emerald-200 rounded-2xl hover:bg-emerald-50 transition-all duration-300 shadow-lg hover:shadow-xl group"
          >
            <FileSpreadsheet size={20} className="text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-emerald-700 font-semibold hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-3 px-4 lg:px-6 py-3 text-white rounded-2xl hover:opacity-80 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            style={{ backgroundColor: '#0f172a' }}
          >
            <div className="w-5 h-5">➕</div>
            <span className="font-semibold">Add Lead</span>
          </button>
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-white/80 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
          >
            {(isPreSalesAgent || isPreSalesManager || isPreSalesHod) && (
              <option value="createdAt">Lead Generated Date</option>
            )}
            {(isSalesAgent || isSalesManager || isHodSales) && (
              <>
                <option value="qualifiedDate">Lead Qualified Date</option>
                <option value="updatedAt">Update Time</option>
                <option value="expectedPossessionDate">Possession Date</option>
                <option value="projectValue">Project Value</option>
              </>
            )}
            {isAdmin && (
              <>
                <option value="createdAt">Lead Generated Date</option>
                <option value="qualifiedDate">Lead Qualified Date</option>
                <option value="updatedAt">Update Time</option>
                <option value="expectedPossessionDate">Possession Date</option>
                <option value="projectValue">Project Value</option>
                <option value="name">Name</option>
                <option value="leadID">Lead ID</option>
                <option value="leadValue">Lead Value</option>
              </>
            )}
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 bg-white/80 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
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
            <div className="grid grid-cols-10 gap-3 px-4 py-4">
              <div className="col-span-2 text-left font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-white/10 rounded px-2 py-1" onClick={() => {
                if (sortBy === 'leadID') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('leadID');
                  setSortOrder('asc');
                }
              }}>
                Lead ID {sortBy === 'leadID' && (sortOrder === 'asc' ? '↑' : '↓')}
              </div>
              <div className="col-span-2 text-left font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-white/10 rounded px-2 py-1" onClick={() => {
                if (sortBy === 'name') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('name');
                  setSortOrder('asc');
                }
              }}>
                Contact {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </div>
              <div className="col-span-1 text-left font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-white/10 rounded px-2 py-1" onClick={() => {
                if (sortBy === 'sourceId') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('sourceId');
                  setSortOrder('asc');
                }
              }}>
                Source {sortBy === 'sourceId' && (sortOrder === 'asc' ? '↑' : '↓')}
              </div>
              <div className="col-span-1 text-left font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-white/10 rounded px-2 py-1" onClick={() => {
                if (sortBy === 'presalesUserId') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('presalesUserId');
                  setSortOrder('asc');
                }
              }}>
                Assigned {sortBy === 'presalesUserId' && (sortOrder === 'asc' ? '↑' : '↓')}
              </div>
              <div className="col-span-1 text-left font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-white/10 rounded px-2 py-1" onClick={() => {
                if (sortBy === 'leadValue') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('leadValue');
                  setSortOrder('asc');
                }
              }}>
                Value {sortBy === 'leadValue' && (sortOrder === 'asc' ? '↑' : '↓')}
              </div>
              <div className="col-span-1 text-left font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-white/10 rounded px-2 py-1" onClick={() => {
                if (sortBy === 'leadStatusId') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('leadStatusId');
                  setSortOrder('asc');
                }
              }}>
                Status {sortBy === 'leadStatusId' && (sortOrder === 'asc' ? '↑' : '↓')}
              </div>
              <div className="col-span-2 text-left font-semibold text-xs uppercase tracking-wider">Actions</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              {leads.map((lead, index) => {
                const colorInfo = getRowColorAndReason(lead);
                const shortStatus = getShortStatus(lead);
                const assignmentStatus = getAssignmentStatus(lead);
                return (
                <div key={lead._id} className={`grid grid-cols-10 gap-3 px-4 py-3 border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${colorInfo.color}`} title={colorInfo.reason}>
                  <div className="col-span-2 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {lead.leadID.slice(-3)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-slate-900 font-bold truncate">{lead.leadID}</div>
                      <div className="text-slate-600 text-sm truncate">{lead.name || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="col-span-2 flex flex-col justify-center min-w-0">
                    <div className="text-slate-700 font-medium truncate flex items-center">
                      <Mail size={12} className="mr-1 text-slate-400" />
                      {lead.email || 'N/A'}
                    </div>
                    <div className="text-slate-500 text-sm truncate flex items-center">
                      <Phone size={12} className="mr-1 text-slate-400" />
                      {lead.contactNumber || 'N/A'}
                    </div>
                  </div>

                  <div className="col-span-1 flex items-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-800 truncate">
                      {lead.sourceId?.name?.slice(0, 8) || 'N/A'}
                    </span>
                  </div>

                  <div className="col-span-1 flex items-center">
                    <div className="text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${assignmentStatus.color}`}>
                        {assignmentStatus.text}
                      </span>
                      {assignmentStatus.name && (
                        <div className="text-xs text-gray-600 mt-1 truncate" title={assignmentStatus.name}>
                          {assignmentStatus.name.split(' ')[0]}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-span-1 flex items-center">
                    {lead.leadValue ? (
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${lead.leadValue === 'high value' ? 'bg-red-500 text-white' :
                          lead.leadValue === 'low value' ? 'bg-yellow-500 text-white' :
                            'bg-blue-500 text-white'
                        }`}>
                        {lead.leadValue === 'high value' ? 'HIGH' : lead.leadValue === 'low value' ? 'LOW' : lead.leadValue.toUpperCase()}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-gray-400 text-white">N/A</span>
                    )}
                  </div>

                  <div className="col-span-1 flex items-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${shortStatus.color}`}>
                      {shortStatus.text}
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center space-x-1">
                    <button onClick={() => handleViewDetails(lead._id)} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all" title="View Details">
                      <Eye size={14} />
                    </button>
                     {!isMarketing && (
                    <button onClick={() => setShowEditModal({ isOpen: true, leadId: lead._id })} className="p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-all" title="Edit Lead">
                      <Edit size={14} />
                    </button>)}
                    {!isMarketing && (
                    <button onClick={() => setActivityLogModal({ isOpen: true, leadId: lead._id })} className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all" title="Activity Log">
                      <FileText size={14} />
                    </button>)}
                    {!isMarketing && (
                    <button onClick={() => handleCall(lead._id, lead.contactNumber)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all" title="Make Call">
                      <PhoneCall size={14} />
                    </button>)}
                    
                    {isAdmin && (
                      <button onClick={() => setDeleteDialog({ isOpen: true, id: lead._id, name: lead.leadID })} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all" title="Delete Lead">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="xl:hidden flex-1 overflow-y-auto p-4">
          <div className={`space-y-4 transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {leads.map((lead) => {
              const colorInfo = getRowColorAndReason(lead);
              const shortStatus = getShortStatus(lead);
              const assignmentStatus = getAssignmentStatus(lead);
              return (
              <div key={lead._id} className={`rounded-2xl p-4 shadow-lg border border-slate-100 ${colorInfo.color}`} title={colorInfo.reason}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {lead.leadID.slice(-3)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{lead.leadID}</div>
                      <div className="text-sm text-slate-600">{lead.name || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${shortStatus.color}`}>
                      {shortStatus.text}
                    </span>
                    {lead.leadValue && (
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${lead.leadValue === 'high value' ? 'bg-red-500 text-white' :
                          lead.leadValue === 'low value' ? 'bg-yellow-500 text-white' :
                            'bg-blue-500 text-white'
                        }`}>
                        {lead.leadValue === 'high value' ? 'HIGH' : 'LOW'}
                      </span>
                    )}
                    <div className="text-xs bg-gray-800 text-white px-2 py-1 rounded-lg" title={colorInfo.reason}>
                      ℹ️
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Email:</span> {lead.email || 'N/A'}</div>
                  <div><span className="font-medium">Phone:</span> {lead.contactNumber || 'N/A'}</div>
                  <div><span className="font-medium">Source:</span> {lead.sourceId?.name || 'N/A'}</div>
                  {lead.centreId && <div><span className="font-medium">Centre:</span> {lead.centreId.name}</div>}
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Assigned:</span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${assignmentStatus.color}`}>
                      {assignmentStatus.text}
                    </span>
                    {assignmentStatus.name && (
                      <span className="text-sm text-gray-600">{assignmentStatus.name}</span>
                    )}
                  </div>
                  <div className="text-gray-500">Created: {new Date(lead.createdAt).toLocaleDateString()}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button onClick={() => handleViewDetails(lead._id)} className="flex items-center justify-center px-2 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium text-xs">
                    <Eye size={14} className="mr-1" /> View
                  </button>
                  {!isMarketing && (
                  <button onClick={() => setShowEditModal({ isOpen: true, leadId: lead._id })} className="flex items-center justify-center px-2 py-2 bg-orange-100 text-orange-700 rounded-lg font-medium text-xs">
                    <Edit size={14} className="mr-1" /> Edit
                  </button>)}
                  {!isMarketing && (
                  <button onClick={() => handleCall(lead._id, lead.contactNumber)} className="flex items-center justify-center px-2 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-xs">
                    <PhoneCall size={14} className="mr-1" /> Call
                  </button>)}
                  {!isMarketing && (
                  <button onClick={() => setActivityLogModal({ isOpen: true, leadId: lead._id })} className="flex items-center justify-center px-2 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium text-xs">
                    <FileText size={14} className="mr-1" /> Log
                  </button>)}
                  {isAdmin && (
                    <button onClick={() => setDeleteDialog({ isOpen: true, id: lead._id, name: lead.leadID })} className="col-span-2 flex items-center justify-center px-2 py-2 bg-red-100 text-red-700 rounded-lg font-medium text-xs">
                      <Trash2 size={14} className="mr-1" /> Delete
                    </button>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>

        <PaginationFooter
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          itemName="leads"
        />
      </div>

      {/* View Lead Modal */}
      <Modal
        isOpen={!!viewLead}
        onClose={() => setViewLead(null)}
        title="Lead Details"
      >
        {viewLead && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Lead ID</label>
                <p className="text-sm text-gray-900">{viewLead.leadID}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-sm text-gray-900">{viewLead.name || 'N/A'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{viewLead.email || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="text-sm text-gray-900">{viewLead.contactNumber || 'N/A'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Source</label>
                <p className="text-sm text-gray-900">{viewLead.sourceId?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Lead Value</label>
                <p className="text-sm text-gray-900">{viewLead.leadValue || 'Not set'}</p>
              </div>
            </div>
            {viewLead.centreId && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Centre</label>
                <p className="text-sm text-gray-900">{viewLead.centreId.name}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Assigned To</label>
              <p className="text-sm text-gray-900">
                {viewLead.presalesUserId ? `Presales: ${viewLead.presalesUserId.name}` :
                  viewLead.salesUserId ? `Sales: ${viewLead.salesUserId.name}` : 'Unassigned'}
              </p>
            </div>
            {viewLead.comment && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Comment</label>
                <p className="text-sm text-gray-900">{viewLead.comment}</p>
              </div>
            )}
            {(viewLead.leadStatusId || viewLead.leadSubStatusId) && (
              <div className="grid grid-cols-2 gap-4">
                {viewLead.leadStatusId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Lead Status</label>
                    <p className="text-sm text-gray-900">{viewLead.leadStatusId.name}</p>
                  </div>
                )}
                {viewLead.leadSubStatusId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sub Status</label>
                    <p className="text-sm text-gray-900">{viewLead.leadSubStatusId.name}</p>
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Created At</label>
              <p className="text-sm text-gray-900">{new Date(viewLead.createdAt).toLocaleString()}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Lead Modal */}
      <LeadCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => { setShowCreateModal(false); fetchLeads(); }}
      />

      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Lead"
        message={`Are you sure you want to delete lead "${deleteDialog.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: '', name: '' })}
      />

      <ActivityLogModal
        isOpen={activityLogModal.isOpen}
        onClose={() => setActivityLogModal({ isOpen: false, leadId: '' })}
        leadId={activityLogModal.leadId}
      />

      {/* Conditional Modal Rendering Based on User Role */}
      {user?.role === 'presales_agent' ? (
        <PresalesLeadEditModal
          isOpen={showEditModal.isOpen}
          onClose={() => setShowEditModal({ isOpen: false, leadId: '' })}
          leadId={showEditModal.leadId}
          onSuccess={() => { setShowEditModal({ isOpen: false, leadId: '' }); fetchLeads(); }}
        />
      ) : (
        <LeadEditModal
          isOpen={showEditModal.isOpen}
          onClose={() => setShowEditModal({ isOpen: false, leadId: '' })}
          leadId={showEditModal.leadId}
          onSuccess={() => { setShowEditModal({ isOpen: false, leadId: '' }); fetchLeads(); }}
        />
      )}


    </div>
  );
}