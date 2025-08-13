'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Plus, Phone, Eye, Search, FileSpreadsheet, Filter, UserPen } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import ModernLoader from '../ModernLoader';
import Modal from '../Modal';
import PaginationFooter from '../PaginationFooter';
import { authAPI } from '@/lib/auth';

interface Lead {
  _id: string;
  leadId?: string;
  name: string;
  contactNumber: string;
  email: string;
  sourceId: { _id: string; name: string };
  leadStatusId: { _id: string; name: string };
  languageId: { _id: string; name: string };
  centerId?: { _id: string; name: string };
  assignmentType?: string;
  presalesUserId?: string | { _id: string; name: string };
  salesUserId?: string | { _id: string; name: string };
  leadSubstatus?: string;
  cifDateTime?: string;
  createdAt: string;
}

interface LeadFormData {
  name: string;
  contactNumber: string;
  email: string;
  sourceId: string;
  leadStatusId: string;
  languageId: string;
  centerId?: string;
  assignmentType?: string;
  presalesUserId?: string;
  leadSubstatus?: string;
  cifDateTime?: string;
  salesUserId?: string;
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
  const { pagination, handlePageChange, handleLimitChange, updatePagination } = usePagination({ initialLimit: 10 });
  const [filters, setFilters] = useState({
    search: '',
    source: '',
    status: '',
    assignedTo: ''
  });
  const debouncedFilters = useDebounce(filters, 300);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [callTimer, setCallTimer] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [callStatus, setCallStatus] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [callForm, setCallForm] = useState({
    cifOption: '',
    customCifDateTime: '',
    languageId: '',
    originalLanguageId: '',
    updatedLanguageId: '',
    assignedUserId: '',
    leadValue: '',
    centerId: '',
    apartmentTypeId: '',
    followUpAction: '',
    callOutcome: ''
  });
  const [apartmentTypes, setApartmentTypes] = useState<any[]>([]);
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    contactNumber: '',
    email: '',
    sourceId: '',
    leadStatusId: '',
    languageId: ''
  });
  const [manualSourceId, setManualSourceId] = useState<string>('');

  useEffect(() => {
    // Prevent redirect on refresh
    localStorage.setItem('currentPage', 'leads');
    localStorage.setItem('lastVisitedPage', '/leads');
    
    // Get current user
    const userData = localStorage.getItem('user');
    const tokenData = localStorage.getItem('token');
    console.log('userData from localStorage:', userData);
    console.log('tokenData from localStorage:', tokenData);
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('Parsed user data:', parsedUser);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const openCallModal = (lead: Lead) => {
    setCurrentLead(lead);
    setIsCallModalOpen(true);
    setCallTimer(0);
    setCallNotes('');
    setCallStatus('');
    setCallForm({
      cifOption: '',
      customCifDateTime: '',
      languageId: lead.languageId?._id || '',
      originalLanguageId: lead.languageId?._id || '',
      updatedLanguageId: '',
      assignedUserId: '',
      leadValue: '',
      centerId: lead.centerId?._id || '',
      apartmentTypeId: '',
      followUpAction: '',
      callOutcome: ''
    });
  };

  const startCall = () => {
    setIsCallActive(true);
    setCallTimer(0);
  };

  const endCall = async () => {
    console.log('endCall function started');
    console.log('callStatus:', callStatus);
    console.log('currentLead:', currentLead);
    console.log('currentUser:', currentUser);
    
    setIsCallActive(false);
    
    // Validation
    if (!callStatus) {
      alert('Please select call status');
      return;
    }
    
    if (callStatus === 'connected' && callForm.followUpAction === 'qualified') {
      if (!callForm.leadValue || !callForm.centerId) {
        alert('Lead Value and Center are required for qualified leads');
        return;
      }
    }
    
    if (callStatus && currentLead && currentUser) {
      try {
        console.log('currentUser object:', currentUser);
        console.log('currentUser._id:', currentUser._id);
        console.log('currentUser.id:', currentUser.id);
        
        const userId = currentUser._id || currentUser.id;
        if (!userId) {
          throw new Error('User ID not found. Please login again.');
        }
        
        const nextCallDateTime = getCifDateTime();
        
        const callLogData = {
          userId: userId,
          leadId: currentLead._id,
          callDuration: callTimer,
          callStatus,
          callOutcome: callForm.callOutcome || null,
          notes: callNotes || '',
          nextCallDateTime,
          languageId: callForm.languageId || null,
          originalLanguageId: callForm.originalLanguageId || null,
          updatedLanguageId: callForm.updatedLanguageId || null,
          assignedUserId: callForm.assignedUserId || null,
          leadValue: callForm.leadValue || null,
          centerId: callForm.centerId || null,
          apartmentTypeId: callForm.apartmentTypeId || null
        };

        console.log('Sending call log data:', callLogData);
        console.log('authAPI.leads.createCallLog exists:', typeof authAPI.leads.createCallLog);
        const response = await authAPI.leads.createCallLog(callLogData);
        console.log('Call log response:', response);
        
        alert('Call log saved successfully!');
        setIsCallModalOpen(false);
        setCallTimer(0);
        setCallNotes('');
        setCallStatus('');
        fetchLeads();
      } catch (error: any) {
        console.error('Error saving call log:', error);
        console.error('Error details:', error.response?.data);
        alert(`Failed to save call log: ${error.response?.data?.message || error.message}`);
        setIsCallActive(true);
      }
    } else {
      console.log('Missing required data:', { callStatus, currentLead: !!currentLead, currentUser: !!currentUser });
      alert('Missing required information. Please try again.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCifDateTime = () => {
    const now = new Date();
    if (callForm.cifOption === '30mins') {
      return new Date(now.getTime() + 30 * 60000).toISOString();
    } else if (callForm.cifOption === '60mins') {
      return new Date(now.getTime() + 60 * 60000).toISOString();
    } else if (callForm.cifOption === '2hours') {
      return new Date(now.getTime() + 2 * 60 * 60000).toISOString();
    } else if (callForm.cifOption === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString();
    } else if (callForm.cifOption === 'custom' && callForm.customCifDateTime) {
      return new Date(callForm.customCifDateTime).toISOString();
    }
    return null;
  };

  const handleCallFormChange = (field: string, value: string) => {
    setCallForm(prev => ({ ...prev, [field]: value }));
  };

  const fetchDropdownData = async () => {
    try {
      const [sourcesRes, statusesRes, usersRes, languagesRes, centersRes, apartmentTypesRes] = await Promise.all([
        authAPI.leads.getLeadSources(),
        authAPI.admin.getStatuses(),
        authAPI.admin.getUsers(),
        authAPI.admin.getLanguages(),
        authAPI.admin.getAllCentres(),
        authAPI.leads.getProjectHouseTypes()
      ]);
      
      const sourcesData = Array.isArray(sourcesRes.data) ? sourcesRes.data : sourcesRes.data.data || [];
      const statusesData = Array.isArray(statusesRes.data) ? statusesRes.data : statusesRes.data.data || [];
      let usersData = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || [];
      const languagesData = Array.isArray(languagesRes.data) ? languagesRes.data : languagesRes.data.data || [];
      const centersData = Array.isArray(centersRes.data) ? centersRes.data : centersRes.data.data || [];
      const apartmentTypesData = Array.isArray(apartmentTypesRes.data) ? apartmentTypesRes.data : apartmentTypesRes.data.data || [];
      
      // Populate role data for users if not already populated
      if (usersData.length > 0 && !usersData[0].roleId?.slug) {
        usersData = usersData.map((user: any) => ({
          ...user,
          roleId: user.roleId // Assume backend populates this
        }));
      }
      
      setSources(sourcesData);
      setStatuses(statusesData);
      setUsers(usersData);
      setLanguages(languagesData);
      setCenters(centersData);
      setApartmentTypes(apartmentTypesData.filter((t: any) => t.type === 'house'));
      
      // Set Manual as default source
      const manualSource = sourcesData.find((s: any) => s.name === 'Manual');
      if (manualSource) {
        setManualSourceId(manualSource._id);
        setFormData(prev => ({ ...prev, sourceId: manualSource._id }));
      }
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
        updatePagination(response.data.pagination);
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
      sourceId: manualSourceId,
      leadStatusId: '',
      languageId: '',
      assignmentType: '',
      presalesUserId: '',
      salesUserId: '',
      leadSubstatus: '',
      cifDateTime: ''
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
        leadStatusId: lead.leadStatusId._id,
        languageId: lead.languageId._id,
        centerId: lead.centerId?._id || '',
        assignmentType: (lead as any).assignmentType || '',
        presalesUserId: typeof (lead as any).presalesUserId === 'object' ? (lead as any).presalesUserId?._id || '' : (lead as any).presalesUserId || '',
        salesUserId: typeof (lead as any).salesUserId === 'object' ? (lead as any).salesUserId?._id || '' : (lead as any).salesUserId || '',
        leadSubstatus: (lead as any).leadSubstatus || '',
        cifDateTime: (lead as any).cifDateTime ? new Date((lead as any).cifDateTime).toISOString().slice(0, 16) : ''
      });
    } else {
      const manualSource = sources.find(s => s.name === 'Manual');
      setFormData({
        name: '',
        contactNumber: '',
        email: '',
        sourceId: manualSource?._id || '',
        leadStatusId: '',
        languageId: ''
      });
      setEditingLead(null);
    }
    setIsModalOpen(true);
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

  const getLeadStatusName = () => {
    const status = statuses.find(s => s._id === formData.leadStatusId);
    return status?.name || '';
  };

  const renderConditionalFields = () => {
    const statusName = getLeadStatusName();
    console.log('Current status name:', statusName, 'Form data:', formData);
    
    if (statusName === 'Lead') {
      return (
        <>
          <select
            value={formData.assignmentType || ''}
            onChange={(e) => setFormData({ ...formData, assignmentType: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={editingLead ? true : false}
          >
            <option value="">Select Assignment Type *</option>
            <option value="auto">Auto from Any</option>
            <option value="manual">Select by Manual</option>
          </select>
          {formData.assignmentType === 'manual' && (
            <select
              value={formData.presalesUserId || ''}
              onChange={(e) => setFormData({ ...formData, presalesUserId: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Presales User *</option>
              {users.filter(user => user.roleId?.slug === 'presales_agent').map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>
          )}
          {formData.assignmentType === 'auto' && formData.presalesUserId && (
            <div className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50">
              <span className="text-sm text-gray-600">Assigned Presales User: </span>
              <span className="font-medium">
                {editingLead && typeof (editingLead as any).presalesUserId === 'object' 
                  ? (editingLead as any).presalesUserId?.name 
                  : users.find(u => u._id === formData.presalesUserId)?.name || 'Loading...'}
              </span>
            </div>
          )}
        </>
      );
    }
    
    if (statusName === 'Qualified') {
      return (
        <>
          <select
            value={formData.leadSubstatus || ''}
            onChange={(e) => setFormData({ ...formData, leadSubstatus: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select Lead Substatus *</option>
            <option value="hot">Hot</option>
            <option value="cif">CIF</option>
            <option value="warm">Warm</option>
          </select>
          {formData.leadSubstatus === 'cif' && (
            <input
              type="datetime-local"
              value={formData.cifDateTime || ''}
              onChange={(e) => setFormData({ ...formData, cifDateTime: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          )}
          {(formData.leadSubstatus === 'hot' || formData.leadSubstatus === 'warm') && (
            <>
              <select
                value={formData.assignmentType || ''}
                onChange={(e) => setFormData({ ...formData, assignmentType: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={editingLead ? true : false}
              >
                <option value="">Select Assignment Type *</option>
                <option value="auto">Auto from Any</option>
                <option value="manual">Select by Manual</option>
              </select>
              {formData.assignmentType === 'manual' && (
                <select
                  value={formData.salesUserId || ''}
                  onChange={(e) => setFormData({ ...formData, salesUserId: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Sales User *</option>
                  {users.filter(user => user.roleId?.slug === 'sales_agent').map(user => (
                    <option key={user._id} value={user._id}>{user.name}</option>
                  ))}
                </select>
              )}
              {formData.assignmentType === 'auto' && formData.salesUserId && (
                <div className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <span className="text-sm text-gray-600">Assigned Sales User: </span>
                  <span className="font-medium">
                    {editingLead && typeof (editingLead as any).salesUserId === 'object' 
                      ? (editingLead as any).salesUserId?.name 
                      : users.find(u => u._id === formData.salesUserId)?.name || 'Loading...'}
                  </span>
                </div>
              )}
            </>
          )}
        </>
      );
    }
    
    return null;
  };

  if (loading) return <div>Loading...</div>;

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    handlePageChange(1);
  };

  if (loading && leads.length === 0) return <div className="flex items-center justify-center h-64"><ModernLoader size="lg" variant="primary" /></div>;

  return (
    <div className="container-responsive space-y-4 sm:space-y-6 min-h-full">
      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 p-4 sm:p-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative sm:col-span-2">
              <Search size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 sm:py-3 bg-white/80 border border-slate-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium text-sm sm:text-base"
              />
            </div>
            <select
              value={filters.source}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white/80 border border-slate-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium text-sm sm:text-base"
            >
              <option value="">All Sources</option>
              {sources.map(source => (
                <option key={source._id} value={source._id}>{source.name}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white/80 border border-slate-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium text-sm sm:text-base"
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
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
            className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 bg-white/80 backdrop-blur-sm border border-emerald-200 rounded-xl sm:rounded-2xl hover:bg-emerald-50 transition-all duration-300 shadow-lg hover:shadow-xl group text-sm sm:text-base"
          >
            <FileSpreadsheet size={18} className="text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-emerald-700 font-semibold">Export</span>
          </button>
          <button 
            onClick={() => openModal()}
            className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 text-white rounded-xl sm:rounded-2xl hover:opacity-80 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
            style={{backgroundColor: '#0f172a'}}
          >
            <Plus size={18} />
            <span className="font-semibold">Add Lead</span>
          </button>
        </div>
      </div>

      {/* Modern Table Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative flex flex-col" style={{minHeight: 'calc(100vh - 350px)'}}>
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 transition-opacity duration-200">
            <ModernLoader size="lg" variant="primary" />
          </div>
        )}
        
        {/* Desktop Table */}
        <div className="hidden lg:flex flex-col flex-1 min-h-0">
          <div className="text-white" style={{backgroundColor: '#0f172a'}}>
            <div className="grid grid-cols-12 gap-4 px-4 xl:px-6 py-4">
              <div className="col-span-3 text-left font-semibold text-xs xl:text-sm uppercase tracking-wider">Lead Info</div>
              <div className="col-span-3 text-left font-semibold text-xs xl:text-sm uppercase tracking-wider">Contact</div>
              <div className="col-span-2 text-left font-semibold text-xs xl:text-sm uppercase tracking-wider">Source</div>
              <div className="col-span-2 text-left font-semibold text-xs xl:text-sm uppercase tracking-wider">Status</div>
              <div className="col-span-2 text-left font-semibold text-xs xl:text-sm uppercase tracking-wider">Actions</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              {leads.map((lead, index) => (
                <div key={lead._id} className={`grid grid-cols-12 gap-4 px-4 xl:px-6 py-3 xl:py-4 border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 animate-stagger ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`} style={{animationDelay: `${index * 0.05}s`}}>
                  <div className="col-span-3 flex items-center space-x-2 xl:space-x-3 min-w-0">
                    <div className="w-8 h-8 xl:w-10 xl:h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg xl:rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0 text-sm xl:text-base">
                      {lead.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-slate-900 font-bold truncate text-sm xl:text-base">{lead.name}</div>
                      <div className="text-slate-600 text-xs xl:text-sm truncate font-mono">{lead.leadId || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="col-span-3 flex flex-col justify-center min-w-0">
                    <div className="text-slate-700 font-medium truncate text-sm xl:text-base">{lead.contactNumber}</div>
                    <div className="text-slate-500 text-xs xl:text-sm truncate">{lead.email}</div>
                  </div>
                  <div className="col-span-2 flex items-center min-w-0">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 truncate max-w-full">
                      {lead.sourceId?.name || '--'}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center min-w-0">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-800 truncate max-w-full">
                      {lead.leadStatusId?.name || '--'}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center space-x-1">
                    <button onClick={() => openCallModal(lead)} className="p-1.5 xl:p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all" title="Call">
                      <Phone size={14} />
                    </button>
                    <button onClick={() => openViewPage(lead._id)} className="p-1.5 xl:p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all" title="View">
                      <Eye size={14} />
                    </button>
                    <button onClick={() => openModal(lead)} className="p-1.5 xl:p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all" title="Edit">
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Mobile Cards */}
        <div className="lg:hidden flex-1 overflow-y-auto scrollbar-hide p-3 sm:p-4">
          <div className={`space-y-3 sm:space-y-4 transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {leads.map((lead) => (
              <div key={lead._id} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-slate-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 text-sm sm:text-base">
                      {lead.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 text-sm sm:text-base truncate">{lead.name}</div>
                      <div className="text-xs sm:text-sm text-slate-600 font-mono truncate">{lead.leadId || 'N/A'}</div>
                    </div>
                  </div>
                  <span className="px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl text-xs font-semibold bg-green-100 text-green-800 flex-shrink-0">
                    {lead.leadStatusId?.name || '--'}
                  </span>
                </div>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="truncate"><span className="font-medium">Contact:</span> {lead.contactNumber}</div>
                  <div className="truncate"><span className="font-medium">Email:</span> {lead.email}</div>
                  <div className="truncate"><span className="font-medium">Source:</span> {lead.sourceId?.name || '--'}</div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                  <button onClick={() => openCallModal(lead)} className="flex items-center justify-center px-2 sm:px-3 py-2 bg-green-100 text-green-700 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm">
                    <Phone size={14} className="mr-1" /> Call
                  </button>
                  <button onClick={() => openViewPage(lead._id)} className="flex items-center justify-center px-2 sm:px-3 py-2 bg-blue-100 text-blue-700 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm">
                    <Eye size={14} className="mr-1" /> View
                  </button>
                  <button onClick={() => openModal(lead)} className="flex items-center justify-center px-2 sm:px-3 py-2 bg-purple-100 text-purple-700 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm">
                    <Pencil size={14} className="mr-1" /> Edit
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLead ? 'Edit Lead' : 'Add Lead'}
      >
        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <input
                type="text"
                placeholder="Full Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="email"
                placeholder="Email Address *"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="text"
                placeholder="Contact Number *"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <select
                value={formData.languageId}
                onChange={(e) => setFormData({ ...formData, languageId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Language *</option>
                {languages.map(language => (
                  <option key={language._id} value={language._id}>{language.name}</option>
                ))}
              </select>
              <select
                value={formData.centerId || ''}
                onChange={(e) => setFormData({ ...formData, centerId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={getLeadStatusName() === 'Qualified'}
              >
                <option value="">{getLeadStatusName() === 'Qualified' ? 'Select Center *' : 'Select Center (Optional)'}</option>
                {centers.map(center => (
                  <option key={center._id} value={center._id}>{center.name}</option>
                ))}
              </select>
              <select
                value={formData.sourceId}
                onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {sources.map(source => (
                  <option key={source._id} value={source._id}>{source.name}</option>
                ))}
              </select>
              <select
                value={formData.leadStatusId}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  leadStatusId: e.target.value,
                  assignmentType: '',
                  presalesUserId: '',
                  leadSubstatus: '',
                  cifDateTime: '',
                  salesUserId: ''
                })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Status *</option>
                {statuses.filter(s => s.type === 'leadStatus' && (s.name === 'Lead' || s.name === 'Qualified')).map(status => (
                  <option key={status._id} value={status._id}>{status.name}</option>
                ))}
              </select>
              
              {renderConditionalFields()}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="flex-1 text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-all"
                style={{backgroundColor: '#0f172a'}}
              >
                {editingLead ? 'Update Lead' : 'Create Lead'}
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Call Activity Modal */}
      <Modal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        title={`Call Activity - ${currentLead?.name}`}
      >
        <div className="space-y-4">
          <div className="text-center bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-2">Caller: {currentUser?.name}</div>
            <div className="text-xl font-bold text-blue-600 mb-2">{currentLead?.contactNumber}</div>
            <div className="text-3xl font-mono font-bold text-gray-800 my-3">{formatTime(callTimer)}</div>
            {!isCallActive ? (
              <button onClick={startCall} className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium">
                <Phone size={16} className="inline mr-2" />Start Call
              </button>
            ) : (
              <div className="text-green-600 font-medium animate-pulse">📞 Call in Progress...</div>
            )}
          </div>

          {isCallActive && (
            <div className="space-y-4">
              {/* Call Status */}
              <div className="bg-white p-3 rounded-lg border">
                <label className="block text-sm font-medium mb-2 text-gray-700">Call Status *</label>
                <select
                  value={callStatus}
                  onChange={(e) => setCallStatus(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Call Status</option>
                  <option value="connected">Connected</option>
                  <option value="not_connected">Not Connected</option>
                </select>
              </div>

              {/* Duration */}
              <div className="bg-white p-3 rounded-lg border">
                <label className="block text-sm font-medium mb-2 text-gray-700">Call Duration (seconds)</label>
                <input
                  type="number"
                  value={callTimer}
                  onChange={(e) => setCallTimer(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Duration in seconds"
                />
              </div>

              {/* Not Connected Options */}
              {callStatus === 'not_connected' && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-3">Not Connected Reason</h4>
                  <div>
                    <label className="block text-sm font-medium mb-2">Reason *</label>
                    <select
                      value={callForm.callOutcome}
                      onChange={(e) => handleCallFormChange('callOutcome', e.target.value)}
                      className="w-full p-2 border rounded-lg mb-2"
                      required
                    >
                      <option value="">Select Reason</option>
                      <option value="not_reachable">Not Reachable</option>
                      <option value="incorrect_number">Incorrect Mobile No.</option>
                      <option value="not_picking">Not Picking</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Schedule Next Call</label>
                    <select
                      value={callForm.cifOption}
                      onChange={(e) => handleCallFormChange('cifOption', e.target.value)}
                      className="w-full p-2 border rounded-lg mb-2"
                    >
                      <option value="">Select Next Call Time</option>
                      <option value="30mins">Call in 30 Minutes</option>
                      <option value="60mins">Call in 60 Minutes</option>
                      <option value="custom">Custom Date & Time</option>
                    </select>
                    {callForm.cifOption === 'custom' && (
                      <input
                        type="datetime-local"
                        value={callForm.customCifDateTime}
                        onChange={(e) => handleCallFormChange('customCifDateTime', e.target.value)}
                        className="w-full p-2 border rounded-lg"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Connected Options */}
              {callStatus === 'connected' && (
                <div className="bg-green-50 p-4 rounded-lg space-y-4">
                  <h4 className="font-medium text-green-800 mb-3">Connected - What Happened?</h4>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Call Outcome *</label>
                    <select
                      value={callForm.callOutcome}
                      onChange={(e) => handleCallFormChange('callOutcome', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      required
                    >
                      <option value="">Select Outcome</option>
                      {currentUser?.role === 'presales_agent' ? (
                        <>
                          <option value="not_interested">Customer Not Interested → Lead Lost</option>
                          <option value="language_mismatch">Language Do Not Match</option>
                          <option value="follow_up">Need Follow Up Call</option>
                          <option value="qualified">Qualified → Move to Sales</option>
                        </>
                      ) : (
                        <>
                          <option value="not_interested">Customer Not Interested → Lead Lost</option>
                          <option value="follow_up">Need Follow Up Call</option>
                          <option value="site_visit">Site Visit Scheduled</option>
                          <option value="meeting_scheduled">Meeting Scheduled</option>
                          <option value="won">Deal Won → Customer Purchased</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Language Mismatch */}
                  {callForm.callOutcome === 'language_mismatch' && (
                    <div className="bg-yellow-100 p-3 rounded space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">Update Customer Language *</label>
                        <select
                          value={callForm.updatedLanguageId}
                          onChange={(e) => handleCallFormChange('updatedLanguageId', e.target.value)}
                          className="w-full p-2 border rounded-lg"
                          required
                        >
                          <option value="">Select Correct Language</option>
                          {languages.map(lang => (
                            <option key={lang._id} value={lang._id}>{lang.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Reassign to Presales Agent *</label>
                        <select
                          value={callForm.assignedUserId}
                          onChange={(e) => handleCallFormChange('assignedUserId', e.target.value)}
                          className="w-full p-2 border rounded-lg"
                          required
                        >
                          <option value="">Select Presales Agent</option>
                          {users.filter(u => u.roleId?.slug === 'presales_agent').map(user => (
                            <option key={user._id} value={user._id}>{user.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Follow Up */}
                  {callForm.callOutcome === 'follow_up' && (
                    <div className="bg-blue-100 p-3 rounded">
                      <label className="block text-sm font-medium mb-2">Next Call Date & Time *</label>
                      <input
                        type="datetime-local"
                        value={callForm.customCifDateTime}
                        onChange={(e) => handleCallFormChange('customCifDateTime', e.target.value)}
                        className="w-full p-2 border rounded-lg"
                        required
                      />
                    </div>
                  )}

                  {/* Site Visit */}
                  {callForm.callOutcome === 'site_visit' && (
                    <div className="bg-purple-100 p-3 rounded">
                      <label className="block text-sm font-medium mb-2">Site Visit Date & Time *</label>
                      <input
                        type="datetime-local"
                        value={callForm.customCifDateTime}
                        onChange={(e) => handleCallFormChange('customCifDateTime', e.target.value)}
                        className="w-full p-2 border rounded-lg"
                        required
                      />
                    </div>
                  )}

                  {/* Meeting Scheduled */}
                  {callForm.callOutcome === 'meeting_scheduled' && (
                    <div className="bg-indigo-100 p-3 rounded">
                      <label className="block text-sm font-medium mb-2">Meeting Date & Time *</label>
                      <input
                        type="datetime-local"
                        value={callForm.customCifDateTime}
                        onChange={(e) => handleCallFormChange('customCifDateTime', e.target.value)}
                        className="w-full p-2 border rounded-lg"
                        required
                      />
                    </div>
                  )}

                  {/* Deal Won */}
                  {callForm.callOutcome === 'won' && (
                    <div className="bg-green-100 p-3 rounded space-y-3">
                      <h5 className="font-medium text-green-800">🎉 Congratulations! Deal Won</h5>
                      <div>
                        <label className="block text-sm font-medium mb-2">Purchase Amount</label>
                        <input
                          type="number"
                          placeholder="Enter purchase amount"
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Payment Method</label>
                        <select className="w-full p-2 border rounded-lg">
                          <option value="">Select Payment Method</option>
                          <option value="cash">Cash</option>
                          <option value="loan">Home Loan</option>
                          <option value="emi">EMI</option>
                          <option value="cheque">Cheque</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Qualification */}
                  {callForm.callOutcome === 'qualified' && (
                    <div className="space-y-3 bg-blue-50 p-3 rounded">
                      <h5 className="font-medium text-blue-800">Qualification Details (All Required)</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Lead Value *</label>
                          <select
                            value={callForm.leadValue}
                            onChange={(e) => handleCallFormChange('leadValue', e.target.value)}
                            className="w-full p-2 border rounded-lg"
                            required
                          >
                            <option value="">Select Value</option>
                            <option value="high_value">High Value</option>
                            <option value="low_value">Low Value</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Selection Center *</label>
                          <select
                            value={callForm.centerId}
                            onChange={(e) => handleCallFormChange('centerId', e.target.value)}
                            className="w-full p-2 border rounded-lg"
                            required
                          >
                            <option value="">Select Center</option>
                            {centers.map(center => (
                              <option key={center._id} value={center._id}>{center.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Language *</label>
                        <select
                          value={callForm.languageId}
                          onChange={(e) => handleCallFormChange('languageId', e.target.value)}
                          className="w-full p-2 border rounded-lg"
                          required
                        >
                          <option value="">Select Language</option>
                          {languages.map(lang => (
                            <option key={lang._id} value={lang._id}>{lang.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="bg-white p-3 rounded-lg border">
                <label className="block text-sm font-medium mb-2 text-gray-700">Call Notes</label>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  className="w-full p-2 border rounded-lg h-20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Add your call notes here..."
                />
              </div>

              {/* End Call Button */}
              <div className="pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('End call button clicked');
                    endCall();
                  }}
                  disabled={!callStatus}
                  className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
                >
                  End Call & Save
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}