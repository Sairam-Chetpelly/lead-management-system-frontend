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

interface LeadsTableProps {
  user: any;
}

interface Lead {
  _id: string;
  leadId: {
    leadID: string;
    _id: string;
  };
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
}

export default function LeadsTable({ user }: LeadsTableProps) {
  const { showToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [showLeadView, setShowLeadView] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<{isOpen: boolean, leadId: string}>({isOpen: false, leadId: ''});
  const [deleteDialog, setDeleteDialog] = useState<{isOpen: boolean, id: string, name: string}>({isOpen: false, id: '', name: ''});
  const [activityLogModal, setActivityLogModal] = useState<{isOpen: boolean, leadId: string}>({isOpen: false, leadId: ''});
  
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
    dateFrom: '',
    dateTo: ''
  });
  const debouncedFilters = useDebounce(filters, 300);

  useEffect(() => {
    fetchLeads();
    fetchDropdownData();
  }, [pagination.current, pagination.limit, debouncedFilters]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authAPI.getLeads({
        page: pagination.current,
        limit: pagination.limit,
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
  }, [pagination.current, pagination.limit, debouncedFilters, updatePagination]);
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
    setFilters(prev => ({ ...prev, [key]: value }));
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
      await authAPI.deleteLead(deleteDialog.id);
      showToast('Lead deleted successfully', 'success');
      fetchLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
      showToast('Failed to delete lead', 'error');
    } finally {
      setDeleteDialog({isOpen: false, id: '', name: ''});
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
      const response = await authAPI.exportLeads();
      const { downloadCSV } = await import('@/lib/exportUtils');
      downloadCSV(response.data, 'leads.csv');
      showToast('Leads exported successfully', 'success');
    } catch (error: any) {
      console.error('Export failed:', error);
      showToast(`Export failed: ${error.response?.data?.error || error.message}`, 'error');
    }
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-10 gap-4">
            <div className="relative lg:col-span-2">
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
            <select
              value={filters.assignedTo}
              onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
              hidden={isSalesAgent || isPreSalesAgent}
              className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            >
              <option value="">All Agents</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>
            <select
              value={filters.leadValue}
              onChange={(e) => handleFilterChange('leadValue', e.target.value)}
              className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            >
              <option value="">All Values</option>
              <option value="high value">High Value</option>
              <option value="medium value">Medium Value</option>
              <option value="low value">Low Value</option>
            </select>
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
            <select
              value={filters.leadSubStatus}
              onChange={(e) => handleFilterChange('leadSubStatus', e.target.value)}
              className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            >
              <option value="">All Sub-Status</option>
              {leadSubStatuses.map(subStatus => (
                <option key={subStatus._id} value={subStatus._id}>{subStatus.name}</option>
              ))}
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
            className="flex items-center space-x-3 px-4 lg:px-6 py-3 bg-white/80 backdrop-blur-sm border border-emerald-200 rounded-2xl hover:bg-emerald-50 transition-all duration-300 shadow-lg hover:shadow-xl group"
          >
            <FileSpreadsheet size={20} className="text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-emerald-700 font-semibold hidden sm:inline">Export</span>
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-3 px-4 lg:px-6 py-3 text-white rounded-2xl hover:opacity-80 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            style={{backgroundColor: '#0f172a'}}
          >
            <div className="w-5 h-5">➕</div>
            <span className="font-semibold">Add Lead</span>
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
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Lead ID</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Contact Info</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Source & Centre</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Assigned To</div>
              <div className="col-span-1 text-left font-semibold text-sm uppercase tracking-wider">Lead Value</div>
              <div className="col-span-1 text-left font-semibold text-sm uppercase tracking-wider">Status</div>
              <div className="col-span-1 text-left font-semibold text-sm uppercase tracking-wider">Created</div>
              <div className="col-span-1 text-left font-semibold text-sm uppercase tracking-wider">Actions</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              {leads.map((lead, index) => (
                <div key={lead._id} className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 animate-stagger ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`} style={{animationDelay: `${index * 0.05}s`}}>
                  <div className="col-span-2 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {lead.leadId.leadID.slice(-3)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-slate-900 font-bold truncate">{lead.leadId.leadID}</div>
                      <div className="text-slate-600 text-sm truncate">{lead.name || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div className="col-span-2 flex flex-col justify-center min-w-0">
                    <div className="text-slate-700 font-medium truncate flex items-center">
                      <Mail size={12} className="mr-1 text-slate-400" />
                      {lead.email}
                    </div>
                    <div className="text-slate-500 text-sm truncate flex items-center">
                      <Phone size={12} className="mr-1 text-slate-400" />
                      {lead.contactNumber}
                    </div>
                  </div>
                  
                  <div className="col-span-2 flex flex-col justify-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-800 mb-1 w-fit">
                      {lead.sourceId.name}
                    </span>
                    {lead.centreId && (
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 w-fit">
                        {lead.centreId.name}
                      </span>
                    )}
                  </div>
                  
                  <div className="col-span-2 flex items-center">
                    {lead.presalesUserId && (
                      <div className="text-sm">
                        <div className="font-medium text-blue-600">Presales</div>
                        <div className="text-gray-600 truncate">{lead.presalesUserId.name}</div>
                      </div>
                    )}
                    {lead.salesUserId && (
                      <div className="text-sm">
                        <div className="font-medium text-purple-600">Sales</div>
                        <div className="text-gray-600 truncate">{lead.salesUserId.name}</div>
                      </div>
                    )}
                    {!lead.presalesUserId && !lead.salesUserId && (
                      <span className="text-gray-400 text-sm">Unassigned</span>
                    )}
                  </div>
                  
                  <div className="col-span-1 flex items-center">
                    {lead.leadValue ? (
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold capitalize ${
                        lead.leadValue === 'high value' ? 'bg-red-100 text-red-800' :
                        lead.leadValue === 'medium value' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {lead.leadValue}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">Not set</span>
                    )}
                  </div>
                  
                  <div className="col-span-1 flex flex-col justify-center">
                    {lead.leadStatusId && (
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-purple-100 text-purple-800 mb-1 w-fit">
                        {lead.leadStatusId.name}
                      </span>
                    )}
                    {lead.leadSubStatusId && (
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-orange-100 text-orange-800 w-fit">
                        {lead.leadSubStatusId.name}
                      </span>
                    )}
                  </div>
                  
                  <div className="col-span-1 flex items-center">
                    <span className="text-gray-500 text-xs">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="col-span-1 flex items-center space-x-1">
                    <button onClick={() => handleViewDetails(lead._id)} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all" title="View Details">
                      <Eye size={14} />
                    </button>
                    <button onClick={() => setShowEditModal({isOpen: true, leadId: lead._id})} className="p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-all" title="Edit Lead">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => setActivityLogModal({isOpen: true, leadId: lead._id})} className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all" title="Activity Log">
                      <FileText size={14} />
                    </button>
                     <button onClick={() => handleCall(lead._id, lead.contactNumber)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all" title="Make Call">
                      <PhoneCall size={14} />
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
            {leads.map((lead) => (
              <div key={lead._id} className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {lead.leadId.leadID.slice(-3)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{lead.leadId.leadID}</div>
                      <div className="text-sm text-slate-600">{lead.name || 'N/A'}</div>
                    </div>
                  </div>
                  {lead.leadValue && (
                    <span className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize ${
                      lead.leadValue === 'high value' ? 'bg-red-100 text-red-800' :
                      lead.leadValue === 'medium value' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {lead.leadValue}
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Email:</span> {lead.email}</div>
                  <div><span className="font-medium">Phone:</span> {lead.contactNumber}</div>
                  <div><span className="font-medium">Source:</span> {lead.sourceId.name}</div>
                  {lead.centreId && <div><span className="font-medium">Centre:</span> {lead.centreId.name}</div>}
                  <div><span className="font-medium">Assigned:</span> {lead.presalesUserId ? `Presales: ${lead.presalesUserId.name}` : lead.salesUserId ? `Sales: ${lead.salesUserId.name}` : 'Unassigned'}</div>
                  <div className="text-gray-500">Created: {new Date(lead.createdAt).toLocaleDateString()}</div>
                </div>
                
                <div className="flex space-x-2 mt-4">
                  <button onClick={() => handleViewDetails(lead._id)} className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium text-sm">
                    <Eye size={16} className="mr-1" /> View
                  </button>
                  <button onClick={() => setShowEditModal({isOpen: true, leadId: lead._id})} className="flex-1 flex items-center justify-center px-3 py-2 bg-orange-100 text-orange-700 rounded-xl font-medium text-sm">
                    <Edit size={16} className="mr-1" /> Edit
                  </button>
                  <button onClick={() => setActivityLogModal({isOpen: true, leadId: lead._id})} className="flex-1 flex items-center justify-center px-3 py-2 bg-purple-100 text-purple-700 rounded-xl font-medium text-sm">
                    <FileText size={16} className="mr-1" /> Log
                  </button>
                  <button onClick={() => handleCall(lead._id, lead.contactNumber)} className="flex-1 flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded-xl font-medium text-sm">
                    <PhoneCall size={16} className="mr-1" /> Call
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
                <p className="text-sm text-gray-900">{viewLead.leadId.leadID}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-sm text-gray-900">{viewLead.name || 'N/A'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{viewLead.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="text-sm text-gray-900">{viewLead.contactNumber}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Source</label>
                <p className="text-sm text-gray-900">{viewLead.sourceId.name}</p>
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
        onCancel={() => setDeleteDialog({isOpen: false, id: '', name: ''})}
      />

      <ActivityLogModal
        isOpen={activityLogModal.isOpen}
        onClose={() => setActivityLogModal({isOpen: false, leadId: ''})}
        leadId={activityLogModal.leadId}
      />

      {/* Conditional Modal Rendering Based on User Role */}
      {user?.role === 'presales_agent' ? (
        <PresalesLeadEditModal
          isOpen={showEditModal.isOpen}
          onClose={() => setShowEditModal({isOpen: false, leadId: ''})}
          leadId={showEditModal.leadId}
          onSuccess={() => { setShowEditModal({isOpen: false, leadId: ''}); fetchLeads(); }}
        />
      ) : (
        <LeadEditModal
          isOpen={showEditModal.isOpen}
          onClose={() => setShowEditModal({isOpen: false, leadId: ''})}
          leadId={showEditModal.leadId}
          onSuccess={() => { setShowEditModal({isOpen: false, leadId: ''}); fetchLeads(); }}
        />
      )}

      {/* Lead View */}
      {showLeadView && (
        <div className="fixed inset-0 z-50 bg-white">
          <LeadView
            leadId={showLeadView}
            onBack={() => setShowLeadView(null)}
          />
        </div>
      )}
    </div>
  );
}