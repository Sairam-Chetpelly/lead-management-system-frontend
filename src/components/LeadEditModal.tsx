'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Upload, FileText, User, Building, Globe, Phone, Mail, MessageSquare, MapPin, Tag, File, Clock, CheckCircle } from 'lucide-react';
import Modal from './Modal';
import { authAPI } from '@/lib/auth';
import { useToast } from '@/contexts/ToastContext';
import { validateContactNumber, formatContactNumber } from '@/utils/validation';

interface LeadEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  email: string;
  contactNumber: string;
  presalesUserId: string;
  salesUserId: string;
  leadStatusId: string;
  leadSubStatusId: string;
  languageId: string;
  sourceId: string;
  centreId: string;
  projectTypeId: string;
  projectValue: number | string;
  apartmentName: string;
  houseTypeId: string;
  expectedPossessionDate: string;
  leadValue: string;
  siteVisit: boolean;
  siteVisitDate: string;
  siteVisitCompletedDate: string;
  centerVisit: boolean;
  centerVisitDate: string;
  centerVisitCompletedDate: string;
  virtualMeeting: boolean;
  virtualMeetingDate: string;
  virtualMeetingCompletedDate: string;
  leadClosure: boolean;
  leadClosureDate: string;
  meetingArrangedDate: string;
  cifDate: string;
  comment: string;
  outOfStation: boolean;
  requirementWithinTwoMonths: boolean;
  cpUserName: string;
}

interface DropdownItem {
  _id: string;
  name: string;
  slug?: string;
}

interface DropdownData {
  users: any[];
  leadSources: any[];
  centres: any[];
  languages: any[];
  projectTypes: any[];
  houseTypes: any[];
  leadStatuses: DropdownItem[];
  leadSubStatuses: DropdownItem[];
}

export default function LeadEditModal({ isOpen, onClose, leadId, onSuccess }: LeadEditModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Get current user role
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
  const isHodPresales = userRole === 'hod_presales';
  const isManagerPresales = userRole === 'manager_presales';
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    contactNumber: '',
    presalesUserId: '',
    salesUserId: '',
    leadStatusId: '',
    leadSubStatusId: '',
    languageId: '',
    sourceId: '',
    centreId: '',
    projectTypeId: '',
    projectValue: '',
    apartmentName: '',
    houseTypeId: '',
    expectedPossessionDate: '',
    leadValue: '',
    siteVisit: false,
    siteVisitDate: '',
    siteVisitCompletedDate: '',
    centerVisit: false,
    centerVisitDate: '',
    centerVisitCompletedDate: '',
    virtualMeeting: false,
    virtualMeetingDate: '',
    virtualMeetingCompletedDate: '',
    leadClosure: false,
    leadClosureDate: '',
    meetingArrangedDate: '',
    cifDate: '',
    comment: '',
    outOfStation: false,
    requirementWithinTwoMonths: false,
    cpUserName: ''
  });

  // Dropdown data
  const [dropdownData, setDropdownData] = useState<DropdownData>({
    users: [],
    leadSources: [],
    centres: [],
    languages: [],
    projectTypes: [],
    houseTypes: [],
    leadStatuses: [],
    leadSubStatuses: []
  });

  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (isOpen && leadId) {
      fetchLeadData();
      fetchDropdownData();
    }
  }, [isOpen, leadId]);

  const fetchLeadData = async () => {
    setLoading(true);
    try {
      const response = await authAPI.getLead(leadId);
      const lead = response.data.lead;

      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        contactNumber: lead.contactNumber || '',
        presalesUserId: lead.presalesUserId?._id || '',
        salesUserId: lead.salesUserId?._id || '',
        leadStatusId: lead.leadStatusId?._id || '',
        leadSubStatusId: lead.leadSubStatusId?._id || '',
        languageId: lead.languageId?._id || '',
        sourceId: lead.sourceId?._id || '',
        centreId: lead.centreId?._id || '',
        projectTypeId: lead.projectTypeId?._id || '',
        projectValue: lead.projectValue || '',
        apartmentName: lead.apartmentName || '',
        houseTypeId: lead.houseTypeId?._id || '',
        expectedPossessionDate: lead.expectedPossessionDate ? new Date(lead.expectedPossessionDate).toISOString().split('T')[0] : '',
        leadValue: lead.leadValue || '',
        siteVisit: lead.siteVisit || false,
        siteVisitDate: lead.siteVisitDate ? new Date(lead.siteVisitDate).toISOString().split('T')[0] : '',
        siteVisitCompletedDate: lead.siteVisitCompletedDate ? new Date(lead.siteVisitCompletedDate).toISOString().split('T')[0] : '',
        centerVisit: lead.centerVisit || false,
        centerVisitDate: lead.centerVisitDate ? new Date(lead.centerVisitDate).toISOString().split('T')[0] : '',
        centerVisitCompletedDate: lead.centerVisitCompletedDate ? new Date(lead.centerVisitCompletedDate).toISOString().split('T')[0] : '',
        virtualMeeting: lead.virtualMeeting || false,
        virtualMeetingDate: lead.virtualMeetingDate ? new Date(lead.virtualMeetingDate).toISOString().split('T')[0] : '',
        virtualMeetingCompletedDate: lead.virtualMeetingCompletedDate ? new Date(lead.virtualMeetingCompletedDate).toISOString().split('T')[0] : '',
        leadClosure: lead.leadClosure || false,
        leadClosureDate: lead.leadClosureDate ? new Date(lead.leadClosureDate).toISOString().split('T')[0] : '',
        meetingArrangedDate: lead.meetingArrangedDate ? lead.meetingArrangedDate : '',
        cifDate: lead.cifDate ? lead.cifDate : '',
        comment: lead.comment || '',
        outOfStation: lead.outOfStation || false,
        requirementWithinTwoMonths: lead.requirementWithinTwoMonths || false,
        cpUserName: lead.cpUserName || ''
      });
    } catch (error) {
      console.error('Error fetching lead:', error);
      showToast('Failed to fetch lead data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [usersRes, sourcesRes, centresRes, languagesRes, statusesRes, formDataRes] = await Promise.all([
        authAPI.getUsersAll({ limit: 1000 }),
        authAPI.admin.getAllLeadSources(),
        authAPI.admin.getAllCentres(),
        authAPI.admin.getAllLanguages(),
        authAPI.admin.getAllStatuses(),
        authAPI.getLeadFormData()
      ]);

      const statuses = statusesRes.data.data || statusesRes.data || [];

      setDropdownData({
        users: usersRes.data.data?.users || usersRes.data.data || usersRes.data || [],
        leadSources: sourcesRes.data.data || sourcesRes.data || [],
        centres: centresRes.data.data || centresRes.data || [],
        languages: languagesRes.data.data || languagesRes.data || [],
        projectTypes: formDataRes.data.projectTypes || [],
        houseTypes: formDataRes.data.houseTypes || [],
        leadStatuses: statuses.filter((s: any) => s.type === 'leadStatus'),
        leadSubStatuses: statuses.filter((s: any) => s.type === 'leadSubStatus')
      });
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      showToast('Failed to fetch form data', 'error');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field === 'contactNumber' && typeof value === 'string') {
      value = formatContactNumber(value);
    }
    
    // Check if trying to change to qualified status
    if (field === 'leadStatusId') {
      const selectedStatus = dropdownData.leadStatuses.find((s: DropdownItem) => s._id === value);
      console.log('Lead status changing to:', selectedStatus?.slug, 'Centre:', formData.centreId, 'Language:', formData.languageId);
      if (selectedStatus?.slug === 'qualified') {
        if (!formData.centreId || !formData.languageId) {
          showToast('Please select Centre and Language before changing lead status to Qualified', 'error');
          return;
        }
      }
    }

    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      if (field === 'leadStatusId') {
        const selectedStatus = dropdownData.leadStatuses.find((s: DropdownItem) => s._id === value);
        console.log('Processing lead status change:', selectedStatus?.slug);
        newData.leadSubStatusId = '';
        newData.cifDate = '';
        newData.meetingArrangedDate = '';

        if (selectedStatus?.slug === 'lead') {
          newData.salesUserId = '';
          console.log('Cleared salesUserId for lead status');
        } else if (selectedStatus?.slug === 'qualified') {
          newData.presalesUserId = '';
          console.log('Cleared presalesUserId for qualified status');
        }
      }

      if (field === 'leadSubStatusId') {
        const selectedSubStatus = dropdownData.leadSubStatuses.find((s: DropdownItem) => s._id === value);
        if (selectedSubStatus?.slug !== 'cif') {
          newData.cifDate = '';
        }
        if (selectedSubStatus?.slug !== 'meeting-arranged') {
          newData.meetingArrangedDate = '';
        }
      }

      // Clear salesUserId when centre or language changes for qualified leads (but not for sales agents)
      if ((field === 'centreId' || field === 'languageId') && formData.leadStatusId && !isSalesAgent) {
        console.log('Centre or Language changed, checking salesUserId for qualified lead');
        const selectedStatus = dropdownData.leadStatuses.find((s: DropdownItem) => s._id === formData.leadStatusId);
        if (selectedStatus?.slug === 'qualified') {
          newData.salesUserId = '';
        }
      }

      return newData;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length + files.length > 5) {
      showToast('Maximum 5 files allowed', 'error');
      return;
    }

    const validFiles = selectedFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        showToast(`File ${file.name} is too large (max 10MB)`, 'error');
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate contact number format
    const contactValidation = validateContactNumber(formData.contactNumber);
    if (!contactValidation.isValid) {
      showToast(contactValidation.error!, 'error');
      return;
    }
    
    // Validation based on lead status
    const selectedStatus = dropdownData.leadStatuses.find((s: DropdownItem) => s._id === formData.leadStatusId);
    
    if (selectedStatus?.slug === 'qualified') {
      if (!formData.centreId) {
        showToast('Centre is required for qualified leads', 'error');
        return;
      }
      if (!formData.languageId) {
        showToast('Language is required for qualified leads', 'error');
        return;
      }
      if (!formData.leadSubStatusId) {
        showToast('Lead Sub-Status is required for qualified leads', 'error');
        return;
      }
      if (!formData.leadValue) {
        showToast('Lead Value is required for qualified leads', 'error');
        return;
      }
    }
    
    if (selectedStatus?.slug === 'won') {
      if (!formData.projectValue) {
        showToast('Project Value is required for won leads', 'error');
        return;
      }
      const projectValueNum = Number(formData.projectValue);
      console.log('Project Value:', formData.projectValue, 'Converted:', projectValueNum);
      if (isNaN(projectValueNum) || projectValueNum < 100000) {
        showToast('Project Value must be at least 100000', 'error');
        return;
      }
    }
    
    setSubmitting(true);

    try {
      // Prepare lead activity data
      const leadActivityData = { ...formData };

      // Convert date strings to Date objects where needed
      if (leadActivityData.expectedPossessionDate) {
        leadActivityData.expectedPossessionDate = leadActivityData.expectedPossessionDate;
      }
      if (leadActivityData.siteVisitDate) {
        leadActivityData.siteVisitDate = leadActivityData.siteVisitDate;
      }
      if (leadActivityData.siteVisitCompletedDate) {
        leadActivityData.siteVisitCompletedDate = leadActivityData.siteVisitCompletedDate;
      }
      if (leadActivityData.centerVisitDate) {
        leadActivityData.centerVisitDate = leadActivityData.centerVisitDate;
      }
      if (leadActivityData.centerVisitCompletedDate) {
        leadActivityData.centerVisitCompletedDate = leadActivityData.centerVisitCompletedDate;
      }
      if (leadActivityData.virtualMeetingDate) {
        leadActivityData.virtualMeetingDate = leadActivityData.virtualMeetingDate;
      }
      if (leadActivityData.virtualMeetingCompletedDate) {
        leadActivityData.virtualMeetingCompletedDate = leadActivityData.virtualMeetingCompletedDate;
      }
      if (leadActivityData.leadClosureDate) {
        leadActivityData.leadClosureDate = leadActivityData.leadClosureDate;
      }
      if (leadActivityData.cifDate) {
        leadActivityData.cifDate =leadActivityData.cifDate ;
      }
      if (leadActivityData.meetingArrangedDate) {
        leadActivityData.meetingArrangedDate = leadActivityData.meetingArrangedDate;
      }


      // Create new lead activity entry with all data and files
      await authAPI.createLeadActivity(leadId, leadActivityData, files);

      showToast('Lead updated successfully', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating lead activity:', error);
      showToast('Failed to create lead activity', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      contactNumber: '',
      presalesUserId: '',
      salesUserId: '',
      leadStatusId: '',
      leadSubStatusId: '',
      languageId: '',
      sourceId: '',
      centreId: '',
      projectTypeId: '',
      projectValue: '',
      apartmentName: '',
      houseTypeId: '',
      expectedPossessionDate: '',
      leadValue: '',
      siteVisit: false,
      siteVisitDate: '',
      siteVisitCompletedDate: '',
      centerVisit: false,
      centerVisitDate: '',
      centerVisitCompletedDate: '',
      virtualMeeting: false,
      virtualMeetingDate: '',
      virtualMeetingCompletedDate: '',
      leadClosure: false,
      leadClosureDate: '',
      meetingArrangedDate: '',
      cifDate: '',
      comment: '',
      outOfStation: false,
      requirementWithinTwoMonths: false,
      cpUserName: ''
    });
    setFiles([]);
    onClose();
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Edit Lead">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Lead & Add Activity" size="xl">
      <form onSubmit={handleSubmit} className="space-y-8 max-h-[85vh] overflow-y-auto pb-4">
        {/* Basic Information */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-sm border border-blue-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <User className="mr-3 h-6 w-6 text-blue-600" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">Contact Number <span className="text-red-500">*</span></label>
              <input
                type="tel"
                disabled
                value={formData.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 cursor-not-allowed shadow-sm"
                placeholder="Contact number"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">Lead Source <span className="text-red-500">*</span></label>
              <select
                value={formData.sourceId || ''}
                onChange={(e) => handleInputChange('sourceId', e.target.value)}
                required
                disabled={isSalesAgent}
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm ${isSalesAgent ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              >
                <option value="">Select Source ({dropdownData.leadSources.length} available)</option>
                {dropdownData.leadSources.map((source: any) => (
                  <option key={source._id} value={source._id}>{source.name}</option>
                ))}
              </select>
            </div>
            
            {/* CP User Name - Show only when CP source is selected */}
            {(() => {
              const selectedSource = dropdownData.leadSources.find(source => source._id === formData.sourceId);
              const isCpSource = selectedSource && (selectedSource.slug === 'cp' || selectedSource.name.toLowerCase().includes('cp'));
              
              return isCpSource ? (
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700">CP User Name</label>
                  <input
                    type="text"
                    value={formData.cpUserName}
                    onChange={(e) => handleInputChange('cpUserName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                    placeholder="Enter CP user name"
                  />
                </div>
              ) : null;
            })()}
          </div>
        </section>

        {/* Assignment & Status */}
        <section className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl shadow-sm border border-green-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Tag className="mr-3 h-6 w-6 text-green-600" />
            Assignment & Status
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">Lead Status</label>
              <select
                value={formData.leadStatusId}
                onChange={(e) => handleInputChange('leadStatusId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
              >
                <option value="">Select Status</option>
                {dropdownData.leadStatuses
                  .filter((status: any) => {
                    if (isSalesAgent) {
                      // Sales agents can see qualified, won, and lost
                      return ['qualified', 'won',].includes(status.slug);
                    }
                    // Filter out 'lost' status only for presales agents
                    if (userRole === 'presales_agent' && status.slug === 'lost') {
                      return false;
                    }
                    return true;
                  })
                  .map((status: any) => (
                    <option key={status._id} value={status._id}>{status.name}</option>
                  ))}
              </select>
            </div>
            {(() => {
              const selectedStatus = dropdownData.leadStatuses.find((s: DropdownItem) => s._id === formData.leadStatusId);
              const presalesUsers = dropdownData.users.filter((u: any) => u.roleId?.slug === 'presales_agent');
              const salesUsers = dropdownData.users.filter((u: any) => u.roleId?.slug === 'sales_agent' || u.role === 'sales_agent');
              
              console.log('All users:', dropdownData.users);
              console.log('Presales users:', presalesUsers);
              console.log('Sales users:', salesUsers);
              console.log('Selected status:', selectedStatus);

              if (selectedStatus?.slug === 'lead') {
                return (
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700">Assign to Presales Agent <span className="text-red-500">*</span></label>
                    <select
                      value={formData.presalesUserId}
                      onChange={(e) => handleInputChange('presalesUserId', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                    >
                      <option value="">Select Presales Agent</option>
                      {presalesUsers.map((user: any) => (
                        <option key={user._id} value={user._id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                );
              } else if (selectedStatus?.slug === 'qualified') {
                return (
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700">Assign to Sales Agent <span className="text-red-500">*</span></label>
                    <select
                      value={formData.salesUserId}
                      onChange={(e) => handleInputChange('salesUserId', e.target.value)}
                      required={(() => {
                        const selectedStatus = dropdownData.leadStatuses.find((s: DropdownItem) => s._id === formData.leadStatusId);
                        return selectedStatus?.slug === 'qualified';
                      })()}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                    >
                      <option value="">Select Sales Agent</option>
                      {salesUsers
                        .filter((user: any) => {
                          console.log('User details:', {
                            name: user.name,
                            centreId: user.centreId,
                            languageIds: user.languageIds,
                            formCentreId: formData.centreId,
                            formLanguageId: formData.languageId
                          });
                          const matchesLanguage = !formData.languageId || user.languageIds?.some((lang: any) => lang._id === formData.languageId);
                          const matchesCentre = !formData.centreId || user.centreId?._id === formData.centreId;
                          console.log('User:', user.name, 'Language match:', matchesLanguage, 'Centre match:', matchesCentre);
                          return matchesLanguage && matchesCentre;
                        })
                        .map((user: any) => (
                          <option key={user._id} value={user._id}>{user.name}</option>
                        ))}
                    </select>
                  </div>
                );
              }
              return null;
            })()}

            {(() => {
              const selectedStatus = dropdownData.leadStatuses.find((s: DropdownItem) => s._id === formData.leadStatusId);
              let allowedSubStatuses: any[] = [];

              if (selectedStatus?.slug === 'lead') {
                allowedSubStatuses = dropdownData.leadSubStatuses.filter((s: any) =>
                  ['interested', 'cif', 'meeting-arranged'].includes(s.slug)
                );
              } else if (selectedStatus?.slug === 'qualified') {
                allowedSubStatuses = dropdownData.leadSubStatuses.filter((s: any) =>
                  ['cif', 'hot', 'warm'].includes(s.slug)
                );
              }

              return allowedSubStatuses.length > 0 ? (
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700">
                    Lead Sub-Status
                    {selectedStatus?.slug === 'qualified' ? <span className="text-red-500"> *</span> : null}
                  </label>
                  <select
                    value={formData.leadSubStatusId}
                    onChange={(e) => handleInputChange('leadSubStatusId', e.target.value)}
                    required={selectedStatus?.slug === 'qualified'}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                  >
                    <option value="">Select Sub-Status</option>
                    {allowedSubStatuses.map((subStatus: any) => (
                      <option key={subStatus._id} value={subStatus._id}>{subStatus.name}</option>
                    ))}
                  </select>
                </div>
              ) : null;
            })()}

            {(() => {
              const selectedSubStatus = dropdownData.leadSubStatuses.find((s: DropdownItem) => s._id === formData.leadSubStatusId);
              if (selectedSubStatus?.slug === 'cif') {
                return (
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700">CIF Date & Time</label>
                    <input
                      type="datetime-local"
                      value={formData.cifDate}
                      onChange={(e) => handleInputChange('cifDate', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                    />
                  </div>
                );
              } else if (selectedSubStatus?.slug === 'meeting-arranged') {
                return (
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700">Meeting Arranged Date & Time</label>
                    <input
                      type="datetime-local"
                      value={formData.meetingArrangedDate}
                      onChange={(e) => handleInputChange('meetingArrangedDate', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                    />
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </section>

        {/* Location */}
        <section className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl shadow-sm border border-indigo-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <MapPin className="mr-3 h-6 w-6 text-indigo-600" />
            Location Details
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">
                Centre
                {(() => {
                  const selectedStatus = dropdownData.leadStatuses.find((s: DropdownItem) => s._id === formData.leadStatusId);
                  return selectedStatus?.slug === 'qualified' ? <span className="text-red-500"> *</span> : null;
                })()}
              </label>
              <select
                value={formData.centreId}
                onChange={(e) => handleInputChange('centreId', e.target.value)}
                disabled={isSalesAgent}
                required={(() => {
                  const selectedStatus = dropdownData.leadStatuses.find((s: DropdownItem) => s._id === formData.leadStatusId);
                  return selectedStatus?.slug === 'qualified';
                })()}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white shadow-sm"
              >
                <option value="">Select Centre</option>
                {dropdownData.centres.filter(centre => !centre.name.toLowerCase().includes('main')).map(centre => (
                  <option key={centre._id} value={centre._id}>{centre.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">
                Preferred Language
                {(() => {
                  const selectedStatus = dropdownData.leadStatuses.find((s: DropdownItem) => s._id === formData.leadStatusId);
                  return selectedStatus?.slug === 'qualified' ? <span className="text-red-500"> *</span> : null;
                })()}
              </label>
              <select
                value={formData.languageId}
                onChange={(e) => handleInputChange('languageId', e.target.value)}
                required={(() => {
                  const selectedStatus = dropdownData.leadStatuses.find((s: DropdownItem) => s._id === formData.leadStatusId);
                  return selectedStatus?.slug === 'qualified';
                })()}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white shadow-sm"
              >
                <option value="">Select Language</option>
                {dropdownData.languages.map((language: any) => (
                  <option key={language._id} value={language._id}>{language.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Project Information */}
        <section className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl shadow-sm border border-purple-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Building className="mr-3 h-6 w-6 text-purple-600" />
            Project Information
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">Project Type</label>
              <select
                value={formData.projectTypeId}
                onChange={(e) => handleInputChange('projectTypeId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white shadow-sm"
              >
                <option value="">Select Project Type</option>
                {dropdownData.projectTypes.map((type: any) => (
                  <option key={type._id} value={type._id}>{type.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">House Type</label>
              <select
                value={formData.houseTypeId}
                onChange={(e) => handleInputChange('houseTypeId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white shadow-sm"
              >
                <option value="">Select House Type</option>
                {dropdownData.houseTypes.map((type: any) => (
                  <option key={type._id} value={type._id}>{type.name}</option>
                ))}
              </select>
            </div>
            <div className={`space-y-1 ${isHodPresales || isManagerPresales ? 'hidden' : ''}`}>
              <label className="block text-sm font-semibold text-gray-700">
                Project Value
                {(() => {
                  const selectedStatus = dropdownData.leadStatuses.find((s: DropdownItem) => s._id === formData.leadStatusId);
                  return selectedStatus?.slug === 'won' ? <span className="text-red-500"> *</span> : null;
                })()}
              </label>
              <input
                type="number"
                value={formData.projectValue}
                onChange={(e) => handleInputChange('projectValue', e.target.value)}
                onInvalid={(e) => {
                  e.preventDefault();
                  showToast('Project Value must be at least 100000', 'error');
                }}
                min="100000"
                required={(() => {
                  const selectedStatus = dropdownData.leadStatuses.find((s: DropdownItem) => s._id === formData.leadStatusId);
                  return selectedStatus?.slug === 'won';
                })()}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white shadow-sm"
                placeholder="Enter project value (min 100000)"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">Apartment/Unit Name</label>
              <input
                type="text"
                value={formData.apartmentName}
                onChange={(e) => handleInputChange('apartmentName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white shadow-sm"
                placeholder="Enter apartment/unit name"
              />
            </div>
            <div className={`space-y-1 ${isHodPresales || isManagerPresales ? 'hidden' : ''}`}>
              <label className="block text-sm font-semibold text-gray-700">Expected Possession Date</label>
              <input
                type="date"
                value={formData.expectedPossessionDate}
                onChange={(e) => handleInputChange('expectedPossessionDate', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white shadow-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">
                Lead Value
                {(() => {
                  const selectedStatus = dropdownData.leadStatuses.find((s: DropdownItem) => s._id === formData.leadStatusId);
                  return selectedStatus?.slug === 'qualified' ? <span className="text-red-500"> *</span> : null;
                })()}
              </label>
              <select
                value={formData.leadValue}
                onChange={(e) => handleInputChange('leadValue', e.target.value)}
                required={(() => {
                  const selectedStatus = dropdownData.leadStatuses.find((s: DropdownItem) => s._id === formData.leadStatusId);
                  return selectedStatus?.slug === 'qualified';
                })()}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white shadow-sm"
              >
                <option value="">Select Lead Value</option>
                <option value="high value">High Value</option>
                <option value="low value">Low Value</option>
              </select>
            </div>
          </div>
          
          {/* Additional Flags */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <input
                type="checkbox"
                id="outOfStation"
                checked={formData.outOfStation}
                onChange={(e) => handleInputChange('outOfStation', e.target.checked)}
                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="outOfStation" className="text-sm font-semibold text-gray-700 flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                Out of Station
              </label>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <input
                type="checkbox"
                id="requirementWithinTwoMonths"
                checked={formData.requirementWithinTwoMonths}
                onChange={(e) => handleInputChange('requirementWithinTwoMonths', e.target.checked)}
                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="requirementWithinTwoMonths" className="text-sm font-semibold text-gray-700 flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Requirement Within Two Months
              </label>
            </div>
          </div>
        </section>

        {/* Activities & Meetings */}
        <section className={`bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-2xl shadow-sm border border-yellow-100 ${isHodPresales || isManagerPresales ? 'hidden' : ''}`}>
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Calendar className="mr-3 h-6 w-6 text-yellow-600" />
            Activities & Meetings
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
                <input
                  type="checkbox"
                  id="siteVisit"
                  checked={formData.siteVisit}
                  onChange={(e) => handleInputChange('siteVisit', e.target.checked)}
                  className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                />
                <label htmlFor="siteVisit" className="text-sm font-semibold text-gray-700 flex items-center">
                  <MapPin className="mr-2 h-4 w-4" />
                  Site Visit
                </label>
              </div>
              {formData.siteVisit && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700">Scheduled Date</label>
                    <input
                      type="date"
                      value={formData.siteVisitDate}
                      onChange={(e) => handleInputChange('siteVisitDate', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 bg-white shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700">Completed Date</label>
                    <input
                      type="date"
                      value={formData.siteVisitCompletedDate}
                      onChange={(e) => handleInputChange('siteVisitCompletedDate', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 bg-white shadow-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
                <input
                  type="checkbox"
                  id="centerVisit"
                  checked={formData.centerVisit}
                  onChange={(e) => handleInputChange('centerVisit', e.target.checked)}
                  className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                />
                <label htmlFor="centerVisit" className="text-sm font-semibold text-gray-700 flex items-center">
                  <Building className="mr-2 h-4 w-4" />
                  Center Visit
                </label>
              </div>
              {formData.centerVisit && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700">Scheduled Date</label>
                    <input
                      type="date"
                      value={formData.centerVisitDate}
                      onChange={(e) => handleInputChange('centerVisitDate', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 bg-white shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700">Completed Date</label>
                    <input
                      type="date"
                      value={formData.centerVisitCompletedDate}
                      onChange={(e) => handleInputChange('centerVisitCompletedDate', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 bg-white shadow-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
                <input
                  type="checkbox"
                  id="virtualMeeting"
                  checked={formData.virtualMeeting}
                  onChange={(e) => handleInputChange('virtualMeeting', e.target.checked)}
                  className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                />
                <label htmlFor="virtualMeeting" className="text-sm font-semibold text-gray-700 flex items-center">
                  <Globe className="mr-2 h-4 w-4" />
                  Virtual Meeting
                </label>
              </div>
              {formData.virtualMeeting && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700">Scheduled Date</label>
                    <input
                      type="date"
                      value={formData.virtualMeetingDate}
                      onChange={(e) => handleInputChange('virtualMeetingDate', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 bg-white shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700">Completed Date</label>
                    <input
                      type="date"
                      value={formData.virtualMeetingCompletedDate}
                      onChange={(e) => handleInputChange('virtualMeetingCompletedDate', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 bg-white shadow-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
                <input
                  type="checkbox"
                  id="leadClosure"
                  checked={formData.leadClosure}
                  onChange={(e) => handleInputChange('leadClosure', e.target.checked)}
                  className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                />
                <label htmlFor="leadClosure" className="text-sm font-semibold text-gray-700 flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Lead Closure
                </label>
              </div>
              {formData.leadClosure && (
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700">Lead Closure Date</label>
                  <input
                    type="date"
                    value={formData.leadClosureDate}
                    onChange={(e) => handleInputChange('leadClosureDate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 bg-white shadow-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Activity Comments */}
        <section className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-2xl shadow-sm border border-orange-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <MessageSquare className="mr-3 h-6 w-6 text-orange-600" />
            Activity Comments
          </h3>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Add Comment</label>
            <textarea
              value={formData.comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white shadow-sm resize-none"
              placeholder="Describe the activity, notes, or updates..."
            />
            <p className="text-sm text-gray-600 flex items-center">
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              This will create a new activity entry upon submission.
            </p>
          </div>
        </section>

        {/* File Upload */}
        <section className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Upload className="mr-3 h-6 w-6 text-gray-600" />
            Attach Files (Optional)
          </h3>
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-gray-400 transition-all duration-200 relative bg-white shadow-sm hover:shadow-md">
              <Upload size={32} className="mx-auto text-gray-400 mb-3" />
              <p className="text-lg font-medium text-gray-700 mb-1">Drop files here or click to browse</p>
              <p className="text-sm text-gray-500 mb-4">Supports PDF, DOC, DOCX, JPG, PNG (Max 10MB each, up to 5 files)</p>
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                multiple
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {files.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                  <File className="mr-2 h-4 w-4" />
                  Selected Files ({files.length}/5)
                </h4>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-4">
                      <FileText size={20} className="text-indigo-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 bg-white rounded-b-2xl px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex items-center space-x-2 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            disabled={submitting}
          >
            <X size={18} />
            <span>Cancel</span>
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center space-x-2 px-6 py-3 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 from-indigo-600 to-blue-600"
            style={{ backgroundColor: '#0f172a' }}
>
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Update Lead</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}