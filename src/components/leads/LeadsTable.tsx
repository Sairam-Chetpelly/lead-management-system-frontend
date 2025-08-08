'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Plus, Phone, Eye, Search, FileSpreadsheet, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import ModernLoader from '../ModernLoader';
import Modal from '../Modal';
import { authAPI } from '@/lib/auth';

interface Lead {
  _id: string;
  leadId?: string;
  name: string;
  contactNumber: string;
  email: string;
  sourceId: { _id: string; name: string };
  salesUserId: { _id: string; name: string };
  presalesUserId: { _id: string; name: string };
  leadStatusId: { _id: string; name: string };
  centerId?: { _id: string; name: string };
  createdAt: string;
}

interface LeadFormData {
  name: string;
  contactNumber: string;
  email: string;
  sourceId: string;
  salesUserId: string;
  presalesUserId: string;
  leadStatusId: string;
  centerId: string;
  alternateContactNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  occupation?: string;
  company?: string;
  designation?: string;
  annualIncome?: string;
  leadSource?: string;
  referredBy?: string;
  notes?: string;
}

interface LeadsTableProps {
  onViewLead?: (leadId: string) => void;
}

export default function LeadsTable({ onViewLead }: LeadsTableProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination and filters
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10
  });
  const [filters, setFilters] = useState({
    search: '',
    source: '',
    status: '',
    assignedTo: ''
  });
  const debouncedFilters = useDebounce(filters, 300);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    contactNumber: '',
    email: '',
    sourceId: '',
    salesUserId: '',
    presalesUserId: '',
    leadStatusId: '',
    centerId: '',
    alternateContactNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    occupation: '',
    company: '',
    designation: '',
    annualIncome: '',
    leadSource: '',
    referredBy: '',
    notes: ''
  });

  useEffect(() => {
    // Prevent redirect on refresh
    localStorage.setItem('currentPage', 'leads');
    localStorage.setItem('lastVisitedPage', '/leads');
    
    fetchLeads();
    fetchDropdownData();
  }, [pagination.current, pagination.limit, debouncedFilters]);

  useEffect(() => {
    // Prevent any redirect attempts
    const preventRedirect = () => {
      if (window.location.pathname === '/leads') {
        localStorage.setItem('currentPage', 'leads');
        localStorage.setItem('lastVisitedPage', '/leads');
      }
    };
    
    preventRedirect();
    window.addEventListener('beforeunload', preventRedirect);
    
    // Restore scroll position
    const savedScrollPosition = localStorage.getItem('leadsScrollPosition');
    if (savedScrollPosition) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPosition));
      }, 100);
    }

    const handleScroll = () => {
      localStorage.setItem('leadsScrollPosition', window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', preventRedirect);
    };
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [usersRes, sourcesRes, statusesRes, centersRes] = await Promise.all([
        authAPI.admin.getUsers(),
        authAPI.leads.getLeadSources(),
        authAPI.admin.getStatuses(),
        authAPI.admin.getCentres()
      ]);
      
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || []);
      setSources(Array.isArray(sourcesRes.data) ? sourcesRes.data : sourcesRes.data.data || []);
      setStatuses(Array.isArray(statusesRes.data) ? statusesRes.data : statusesRes.data.data || []);
      setCenters(Array.isArray(centersRes.data) ? centersRes.data : centersRes.data.data || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authAPI.leads.getLeads({
        page: pagination.current,
        limit: pagination.limit,
        ...debouncedFilters
      });
      setLeads(Array.isArray(response.data) ? response.data : response.data.data || []);
      if (response.data.pagination) {
        setPagination(prev => ({ ...prev, ...response.data.pagination }));
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.limit, debouncedFilters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLead) {
        await authAPI.leads.updateLead(editingLead._id, formData);
      } else {
        await authAPI.leads.createLead(formData);
      }
      fetchLeads();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving lead:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      try {
        await authAPI.leads.deleteLead(id);
        fetchLeads();
      } catch (error) {
        console.error('Error deleting lead:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactNumber: '',
      email: '',
      sourceId: '',
      salesUserId: '',
      presalesUserId: '',
      leadStatusId: '',
      centerId: '',
      alternateContactNumber: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      occupation: '',
      company: '',
      designation: '',
      annualIncome: '',
      leadSource: '',
      referredBy: '',
      notes: ''
    });
    setEditingLead(null);
  };

  const openModal = (lead?: Lead) => {
    if (lead) {
      setEditingLead(lead);
      setFormData({
        name: lead.name,
        contactNumber: lead.contactNumber,
        email: lead.email,
        sourceId: lead.sourceId._id,
        salesUserId: lead.salesUserId._id,
        presalesUserId: lead.presalesUserId._id,
        leadStatusId: lead.leadStatusId._id,
        centerId: lead.centerId?._id || '',
        alternateContactNumber: (lead as any).alternateContactNumber || '',
        address: (lead as any).address || '',
        city: (lead as any).city || '',
        state: (lead as any).state || '',
        pincode: (lead as any).pincode || '',
        occupation: (lead as any).occupation || '',
        company: (lead as any).company || '',
        designation: (lead as any).designation || '',
        annualIncome: (lead as any).annualIncome || '',
        leadSource: (lead as any).leadSource || '',
        referredBy: (lead as any).referredBy || '',
        notes: (lead as any).notes || ''
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCall = async (leadId: string) => {
    try {
      await authAPI.leads.createCallLog({ leadId: leadId });
      alert('Call log created successfully!');
    } catch (error) {
      console.error('Error creating call log:', error);
      alert('Error creating call log');
    }
  };

  const openViewPage = (leadId: string) => {
    // Save current scroll position before navigating
    localStorage.setItem('leadsScrollPosition', window.scrollY.toString());
    localStorage.setItem('returnToLeads', 'true');
    
    console.log('Opening view for lead:', leadId, 'onViewLead callback:', !!onViewLead);
    if (onViewLead) {
      onViewLead(leadId);
    } else {
      router.push(`/leads/${leadId}`);
    }
  };

  if (loading) return <div>Loading...</div>;

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };
  
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, current: page }));
  };
  
  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, current: 1 }));
  };

  if (loading && leads.length === 0) return <div className="flex items-center justify-center h-64"><ModernLoader size="lg" variant="primary" /></div>;

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
              {sources.map(source => (
                <option key={source._id} value={source._id}>{source.name}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            >
              <option value="">All Statuses</option>
              {statuses.filter(s => s.type === 'leadStatus').map(status => (
                <option key={status._id} value={status._id}>{status.name}</option>
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
                const response = await authAPI.leads.exportLeads();
                const { downloadCSV } = await import('@/lib/exportUtils');
                downloadCSV(response.data, 'leads.csv');
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
            className="flex items-center space-x-3 px-4 lg:px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus size={20} />
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
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
            <div className="grid grid-cols-12 gap-4 px-6 py-4">
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Lead Info</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Contact</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Source</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Status</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Assigned</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Actions</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              {leads.map((lead, index) => (
                <div key={lead._id} className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 animate-stagger ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`} style={{animationDelay: `${index * 0.05}s`}}>
                  <div className="col-span-2 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                      {lead.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-slate-900 font-bold truncate">{lead.name}</div>
                      <div className="text-slate-600 text-sm truncate font-mono">{lead.leadId || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="col-span-2 flex flex-col justify-center min-w-0">
                    <div className="text-slate-700 font-medium truncate">{lead.contactNumber}</div>
                    <div className="text-slate-500 text-sm truncate">{lead.email}</div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 truncate">
                      {lead.sourceId?.name || '--'}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-800 truncate">
                      {lead.leadStatusId?.name || '--'}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <div className="text-xs text-slate-600">
                      <div>Sales: {lead.salesUserId?.name || '--'}</div>
                      <div>Pre: {lead.presalesUserId?.name || '--'}</div>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center space-x-1">
                    <button onClick={() => handleCall(lead._id)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all" title="Call">
                      <Phone size={14} />
                    </button>
                    <button onClick={() => openViewPage(lead._id)} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all" title="View">
                      <Eye size={14} />
                    </button>
                    <button onClick={() => openModal(lead)} className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all" title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(lead._id)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all" title="Delete">
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
            {leads.map((lead) => (
              <div key={lead._id} className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{lead.name}</div>
                      <div className="text-sm text-slate-600 font-mono">{lead.leadId || 'N/A'}</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-green-100 text-green-800">
                    {lead.leadStatusId?.name || '--'}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Contact:</span> {lead.contactNumber}</div>
                  <div><span className="font-medium">Email:</span> {lead.email}</div>
                  <div><span className="font-medium">Source:</span> {lead.sourceId?.name || '--'}</div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button onClick={() => handleCall(lead._id)} className="flex-1 flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded-xl font-medium text-sm">
                    <Phone size={16} className="mr-1" /> Call
                  </button>
                  <button onClick={() => openViewPage(lead._id)} className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium text-sm">
                    <Eye size={16} className="mr-1" /> View
                  </button>
                  <button onClick={() => openModal(lead)} className="flex-1 flex items-center justify-center px-3 py-2 bg-purple-100 text-purple-700 rounded-xl font-medium text-sm">
                    <Pencil size={16} className="mr-1" /> Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 px-4 lg:px-8 py-6 flex-shrink-0">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center space-x-4">
              <select 
                value={pagination.limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-slate-600 font-medium text-sm lg:text-base">Records per page</span>
            </div>
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              <span className="text-slate-600 font-medium text-sm lg:text-base">
                Showing {((pagination.current - 1) * pagination.limit) + 1}-{Math.min(pagination.current * pagination.limit, pagination.total)} of {pagination.total} leads
              </span>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handlePageChange(pagination.current - 1)}
                  disabled={pagination.current === 1}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let startPage = Math.max(1, pagination.current - 2);
                  if (startPage + 4 > pagination.pages) {
                    startPage = Math.max(1, pagination.pages - 4);
                  }
                  const page = startPage + i;
                  if (page > pagination.pages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 shadow-sm text-sm font-medium ${
                        pagination.current === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                }).filter(Boolean)}
                <button 
                  onClick={() => handlePageChange(pagination.current + 1)}
                  disabled={pagination.current === pagination.pages}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLead ? 'Edit Lead' : 'Add Lead'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="text"
              placeholder="Contact Number"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="text"
              placeholder="Alternate Contact Number"
              value={formData.alternateContactNumber}
              onChange={(e) => setFormData({ ...formData, alternateContactNumber: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Address Information */}
          <textarea
            placeholder="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
          />
          
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Pincode"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Professional Information */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Occupation"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Designation"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Annual Income"
              value={formData.annualIncome}
              onChange={(e) => setFormData({ ...formData, annualIncome: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Lead Information */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Lead Source Details"
              value={formData.leadSource}
              onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Referred By"
              value={formData.referredBy}
              onChange={(e) => setFormData({ ...formData, referredBy: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Assignments */}
          <div className="grid grid-cols-3 gap-4">
            <select
              value={formData.sourceId}
              onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Source</option>
              {sources && sources.map ? sources.map(source => (
                <option key={source._id} value={source._id}>{source.name}</option>
              )) : null}
            </select>
            <select
              value={formData.salesUserId}
              onChange={(e) => setFormData({ ...formData, salesUserId: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Sales User</option>
              {users && users.map ? users.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              )) : null}
            </select>
            <select
              value={formData.presalesUserId}
              onChange={(e) => setFormData({ ...formData, presalesUserId: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Presales User</option>
              {users && users.map ? users.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              )) : null}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <select
              value={formData.leadStatusId}
              onChange={(e) => setFormData({ ...formData, leadStatusId: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Lead Status</option>
              {statuses && statuses.filter ? statuses.filter(s => s.type === 'leadStatus').map(status => (
                <option key={status._id} value={status._id}>{status.name}</option>
              )) : null}
            </select>
            <select
              value={formData.centerId}
              onChange={(e) => setFormData({ ...formData, centerId: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Center</option>
              {centers && centers.map ? centers.map(center => (
                <option key={center._id} value={center._id}>{center.name}</option>
              )) : null}
            </select>
          </div>

          {/* Notes */}
          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              {editingLead ? 'Update Lead' : 'Create Lead'}
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