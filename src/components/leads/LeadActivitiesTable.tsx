'use client';

import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Plus, Search, FileSpreadsheet } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import Modal from '../Modal';
import ModernLoader from '../ModernLoader';
import PaginationFooter from '../PaginationFooter';
import { authAPI } from '@/lib/auth';
import { useDebounce } from '@/hooks/useDebounce';

interface LeadActivity {
  _id: string;
  leadId: { _id: string; name: string };
  name: string;
  email: string;
  contactNumber: string;
  leadValue: 'high value' | 'medium value' | 'low value';
  paymentMethod: string;
  siteVisit: boolean;
  centerVisit: boolean;
  virtualMeeting: boolean;
  isCompleted: boolean;
  notes: string;
  createdAt: string;
}

interface LeadActivityFormData {
  leadId: string;
  name: string;
  email: string;
  contactNumber: string;
  presalesUserId: string;
  salesUserId: string;
  updatedPerson: string;
  leadStatusId: string;
  leadSubStatusId: string;
  languageId: string;
  sourceId: string;
  projectTypeId: string;
  projectValue: string;
  apartmentName: string;
  houseTypeId: string;
  expectedPossessionDate: string;
  leadValue: 'high value' | 'medium value' | 'low value' | '';
  paymentMethod: string;
  siteVisit: boolean;
  siteVisitDate: string;
  centerVisit: boolean;
  centerVisitDate: string;
  virtualMeeting: boolean;
  virtualMeetingDate: string;
  isCompleted: boolean;
  isCompletedDate: string;
  notes: string;
  centerId: string;
}

export default function LeadActivitiesTable() {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<LeadActivity | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [projectTypes, setProjectTypes] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [formData, setFormData] = useState<LeadActivityFormData>({
    leadId: '',
    name: '',
    email: '',
    contactNumber: '',
    presalesUserId: '',
    salesUserId: '',
    updatedPerson: '',
    leadStatusId: '',
    leadSubStatusId: '',
    languageId: '',
    sourceId: '',
    projectTypeId: '',
    projectValue: '',
    apartmentName: '',
    houseTypeId: '',
    expectedPossessionDate: '',
    leadValue: '',
    paymentMethod: '',
    siteVisit: false,
    siteVisitDate: '',
    centerVisit: false,
    centerVisitDate: '',
    virtualMeeting: false,
    virtualMeetingDate: '',
    isCompleted: false,
    isCompletedDate: '',
    notes: '',
    centerId: ''
  });

  const { pagination, handlePageChange, handleLimitChange, updatePagination } = usePagination({ initialLimit: 10 });
  const [filters, setFilters] = useState({
    search: '',
    leadValue: '',
    isCompleted: ''
  });
  const debouncedFilters = useDebounce(filters, 300);

  useEffect(() => {
    fetchActivities();
    fetchDropdownData();
  }, [pagination.current, pagination.limit, debouncedFilters]);

  const fetchDropdownData = async () => {
    try {
      const [leadsRes, usersRes, sourcesRes, statusesRes, typesRes, centersRes] = await Promise.all([
        authAPI.leads.getLeads(),
        authAPI.admin.getUsers(),
        authAPI.leads.getLeadSources(),
        authAPI.admin.getStatuses(),
        authAPI.leads.getProjectHouseTypes(),
        authAPI.admin.getCentres()
      ]);
      
      setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : leadsRes.data.data || []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || []);
      setSources(Array.isArray(sourcesRes.data) ? sourcesRes.data : sourcesRes.data.data || []);
      setStatuses(Array.isArray(statusesRes.data) ? statusesRes.data : statusesRes.data.data || []);
      setProjectTypes(Array.isArray(typesRes.data) ? typesRes.data : typesRes.data.data || []);
      setCenters(Array.isArray(centersRes.data) ? centersRes.data : centersRes.data.data || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };
  
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authAPI.leads.getLeadActivities({
        page: pagination.current,
        limit: pagination.limit,
        ...debouncedFilters
      });
      
      if (response.data.data) {
        setActivities(response.data.data);
        if (response.data.pagination) {
          updatePagination(response.data.pagination);
        }
      } else {
        setActivities(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.limit, debouncedFilters, updatePagination]);
  
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    handlePageChange(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingActivity) {
        await authAPI.leads.updateLeadActivity(editingActivity._id, formData);
      } else {
        await authAPI.leads.createLeadActivity(formData);
      }
      fetchActivities();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving activity:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      try {
        await authAPI.leads.deleteLeadActivity(id);
        fetchActivities();
      } catch (error) {
        console.error('Error deleting activity:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      leadId: '',
      name: '',
      email: '',
      contactNumber: '',
      presalesUserId: '',
      salesUserId: '',
      updatedPerson: '',
      leadStatusId: '',
      leadSubStatusId: '',
      languageId: '',
      sourceId: '',
      projectTypeId: '',
      projectValue: '',
      apartmentName: '',
      houseTypeId: '',
      expectedPossessionDate: '',
      leadValue: '',
      paymentMethod: '',
      siteVisit: false,
      siteVisitDate: '',
      centerVisit: false,
      centerVisitDate: '',
      virtualMeeting: false,
      virtualMeetingDate: '',
      isCompleted: false,
      isCompletedDate: '',
      notes: '',
      centerId: ''
    });
    setEditingActivity(null);
  };

  const openModal = (activity?: LeadActivity) => {
    if (activity) {
      setEditingActivity(activity);
      setFormData({
        leadId: activity.leadId._id,
        name: activity.name || '',
        email: activity.email || '',
        contactNumber: activity.contactNumber || '',
        presalesUserId: '',
        salesUserId: '',
        updatedPerson: '',
        leadStatusId: '',
        leadSubStatusId: '',
        languageId: '',
        sourceId: '',
        projectTypeId: '',
        projectValue: '',
        apartmentName: '',
        houseTypeId: '',
        expectedPossessionDate: '',
        leadValue: activity.leadValue || '',
        paymentMethod: activity.paymentMethod || '',
        siteVisit: activity.siteVisit || false,
        siteVisitDate: '',
        centerVisit: activity.centerVisit || false,
        centerVisitDate: '',
        virtualMeeting: activity.virtualMeeting || false,
        virtualMeetingDate: '',
        isCompleted: activity.isCompleted || false,
        isCompletedDate: '',
        notes: activity.notes || '',
        centerId: ''
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><ModernLoader size="lg" variant="primary" /></div>;

  return (
    <div className="p-4 lg:p-8 space-y-6 min-h-full">
      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative lg:col-span-2">
            <Search size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search activities..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            />
          </div>
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
            value={filters.isCompleted}
            onChange={(e) => handleFilterChange('isCompleted', e.target.value)}
            className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
          >
            <option value="">All Status</option>
            <option value="true">Completed</option>
            <option value="false">In Progress</option>
          </select>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={async () => {
              try {
                const response = await authAPI.leads.exportLeadActivities();
                const { downloadCSV } = await import('@/lib/exportUtils');
                downloadCSV(response.data, 'lead-activities.csv');
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
            <Plus size={20} />
            <span className="font-semibold">Add Activity</span>
          </button>
        </div>
      </div>

      {/* Modern Table Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative flex flex-col" style={{minHeight: 'calc(100vh - 400px)'}}>
        {/* Desktop Table */}
        <div className="hidden lg:flex flex-col flex-1 min-h-0">
          <div className="text-white" style={{backgroundColor: '#0f172a'}}>
            <div className="grid grid-cols-12 gap-4 px-6 py-4">
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Lead</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Contact</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Email</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Value</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Status</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Actions</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div>
              {activities.map((activity, index) => (
                <div key={activity._id} className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <div className="col-span-2 flex items-center">
                    <span className="text-slate-900 font-bold truncate">{activity.leadId?.name || 'N/A'}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-slate-700 font-medium truncate">{activity.contactNumber}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-slate-600 text-sm truncate">{activity.email}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${
                      activity.leadValue === 'high value' ? 'bg-red-100 text-red-800' :
                      activity.leadValue === 'medium value' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {activity.leadValue}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${
                      activity.isCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.isCompleted ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center space-x-1">
                    <button onClick={() => openModal(activity)} className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all">
                      <Pencil size={14} />
                    </button>
                    {/* <button onClick={() => handleDelete(activity._id)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all">
                      <Trash2 size={14} />
                    </button> */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Mobile Cards */}
        <div className="lg:hidden flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity._id} className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-slate-900">{activity.leadId?.name || 'N/A'}</div>
                    <div className="text-sm text-slate-600">{activity.name}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                    activity.isCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.isCompleted ? 'Completed' : 'In Progress'}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Email:</span> {activity.email}</div>
                  <div><span className="font-medium">Contact:</span> {activity.contactNumber}</div>
                  <div><span className="font-medium">Value:</span> {activity.leadValue}</div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button onClick={() => openModal(activity)} className="flex-1 flex items-center justify-center px-3 py-2 bg-purple-100 text-purple-700 rounded-xl font-medium text-sm">
                    <Pencil size={16} className="mr-1" /> Edit
                  </button>
                  <button onClick={() => handleDelete(activity._id)} className="flex-1 flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-xl font-medium text-sm">
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
          itemName="activities"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingActivity ? 'Edit Activity' : 'Add Activity'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-2 gap-4">
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
            <select
              value={formData.sourceId}
              onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Source</option>
              {sources && sources.map ? sources.map(source => (
                <option key={source._id} value={source._id}>{source.name}</option>
              )) : null}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Contact Number"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <select
              value={formData.presalesUserId}
              onChange={(e) => setFormData({ ...formData, presalesUserId: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Presales User</option>
              {users && users.map ? users.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              )) : null}
            </select>
            <select
              value={formData.salesUserId}
              onChange={(e) => setFormData({ ...formData, salesUserId: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Sales User</option>
              {users && users.map ? users.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              )) : null}
            </select>
            <select
              value={formData.leadStatusId}
              onChange={(e) => setFormData({ ...formData, leadStatusId: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Lead Status</option>
              {statuses && statuses.filter ? statuses.filter(s => s.type === 'leadStatus').map(status => (
                <option key={status._id} value={status._id}>{status.name}</option>
              )) : null}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select
              value={formData.projectTypeId}
              onChange={(e) => setFormData({ ...formData, projectTypeId: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Project Type</option>
              {projectTypes && projectTypes.filter ? projectTypes.filter(t => t.type === 'project').map(type => (
                <option key={type._id} value={type._id}>{type.name}</option>
              )) : null}
            </select>
            <select
              value={formData.houseTypeId}
              onChange={(e) => setFormData({ ...formData, houseTypeId: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select House Type</option>
              {projectTypes && projectTypes.filter ? projectTypes.filter(t => t.type === 'house').map(type => (
                <option key={type._id} value={type._id}>{type.name}</option>
              )) : null}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Project Value"
              value={formData.projectValue}
              onChange={(e) => setFormData({ ...formData, projectValue: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Apartment Name"
              value={formData.apartmentName}
              onChange={(e) => setFormData({ ...formData, apartmentName: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select
              value={formData.leadValue}
              onChange={(e) => setFormData({ ...formData, leadValue: e.target.value as any })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Lead Value</option>
              <option value="high value">High Value</option>
              <option value="medium value">Medium Value</option>
              <option value="low value">Low Value</option>
            </select>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Payment Method</option>
              <option value="cod">COD</option>
              <option value="upi">UPI</option>
              <option value="debit card">Debit Card</option>
              <option value="credit card">Credit Card</option>
              <option value="emi">EMI</option>
              <option value="cheque">Cheque</option>
              <option value="loan">Loan</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              placeholder="Expected Possession Date"
              value={formData.expectedPossessionDate || ''}
              onChange={(e) => setFormData({ ...formData, expectedPossessionDate: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isCompleted}
                  onChange={(e) => setFormData({ ...formData, isCompleted: e.target.checked })}
                  className="mr-2"
                />
                Completed
              </label>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={formData.siteVisit}
                  onChange={(e) => setFormData({ ...formData, siteVisit: e.target.checked })}
                  className="mr-2"
                />
                Site Visit
              </label>
              {formData.siteVisit && (
                <input
                  type="date"
                  value={formData.siteVisitDate}
                  onChange={(e) => setFormData({ ...formData, siteVisitDate: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              )}
            </div>
            <div>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={formData.centerVisit}
                  onChange={(e) => setFormData({ ...formData, centerVisit: e.target.checked })}
                  className="mr-2"
                />
                Center Visit
              </label>
              {formData.centerVisit && (
                <input
                  type="date"
                  value={formData.centerVisitDate}
                  onChange={(e) => setFormData({ ...formData, centerVisitDate: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              )}
            </div>
            <div>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={formData.virtualMeeting}
                  onChange={(e) => setFormData({ ...formData, virtualMeeting: e.target.checked })}
                  className="mr-2"
                />
                Virtual Meeting
              </label>
              {formData.virtualMeeting && (
                <input
                  type="date"
                  value={formData.virtualMeetingDate}
                  onChange={(e) => setFormData({ ...formData, virtualMeetingDate: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              )}
            </div>
          </div>
          <select
            value={formData.centerId}
            onChange={(e) => setFormData({ ...formData, centerId: e.target.value })}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Center</option>
            {centers && centers.map ? centers.map(center => (
              <option key={center._id} value={center._id}>{center.name}</option>
            )) : null}
          </select>
          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="text-white px-6 py-3 rounded-lg font-semibold hover:opacity-80 hover:shadow-lg transition-all duration-300"
              style={{backgroundColor: '#0f172a'}}
            >
              {editingActivity ? 'Update Activity' : 'Create Activity'}
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