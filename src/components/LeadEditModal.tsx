'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Upload, FileText, User, Building, Globe, Phone, Mail, MessageSquare } from 'lucide-react';
import Modal from './Modal';
import { authAPI } from '@/lib/auth';
import { useToast } from '@/contexts/ToastContext';

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
  leadStatusId: string;
  leadSubStatusId: string;
  languageId: string;
  sourceId: string;
  centreId: string;
  projectTypeId: string;
  projectValue: string;
  apartmentName: string;
  houseTypeId: string;
  expectedPossessionDate: string;
  leadValue: string;
  paymentMethod: string;
  siteVisit: boolean;
  siteVisitDate: string;
  centerVisit: boolean;
  centerVisitDate: string;
  virtualMeeting: boolean;
  virtualMeetingDate: string;
  cifDate: string;
  comment: string;
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
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    contactNumber: '',
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
    paymentMethod: '',
    siteVisit: false,
    siteVisitDate: '',
    centerVisit: false,
    centerVisitDate: '',
    virtualMeeting: false,
    virtualMeetingDate: '',
    cifDate: '',
    comment: ''
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
        paymentMethod: lead.paymentMethod || '',
        siteVisit: lead.siteVisit || false,
        siteVisitDate: lead.siteVisitDate ? new Date(lead.siteVisitDate).toISOString().split('T')[0] : '',
        centerVisit: lead.centerVisit || false,
        centerVisitDate: lead.centerVisitDate ? new Date(lead.centerVisitDate).toISOString().split('T')[0] : '',
        virtualMeeting: lead.virtualMeeting || false,
        virtualMeetingDate: lead.virtualMeetingDate ? new Date(lead.virtualMeetingDate).toISOString().split('T')[0] : '',
        cifDate: lead.cifDate ? new Date(lead.cifDate).toISOString().slice(0, 16) : '',
        comment: lead.comment || ''
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
        authAPI.getUsers({ limit: 1000 }),
        authAPI.admin.getAllLeadSources(),
        authAPI.admin.getAllCentres(),
        authAPI.admin.getAllLanguages(),
        authAPI.admin.getAllStatuses(),
        authAPI.getLeadFormData()
      ]);

      console.log('Lead Sources Response:', sourcesRes.data);
      
      const statuses = statusesRes.data.data || statusesRes.data || [];
      const leadSources = sourcesRes.data || [];
      
      setDropdownData({
        users: usersRes.data.data || usersRes.data || [],
        leadSources: leadSources,
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
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // Clear sub-status if lead status is not qualified
      if (field === 'leadStatusId') {
        const selectedStatus = dropdownData.leadStatuses.find((s: DropdownItem) => s._id === value);
        if (selectedStatus?.slug !== 'qualified') {
          newData.leadSubStatusId = '';
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
    setSubmitting(true);

    try {
      // Prepare lead activity data
      const leadActivityData = { ...formData };
      
      // Convert date strings to Date objects where needed
      if (leadActivityData.expectedPossessionDate) {
        leadActivityData.expectedPossessionDate = new Date(leadActivityData.expectedPossessionDate).toISOString();
      }
      if (leadActivityData.siteVisitDate) {
        leadActivityData.siteVisitDate = new Date(leadActivityData.siteVisitDate).toISOString();
      }
      if (leadActivityData.centerVisitDate) {
        leadActivityData.centerVisitDate = new Date(leadActivityData.centerVisitDate).toISOString();
      }
      if (leadActivityData.virtualMeetingDate) {
        leadActivityData.virtualMeetingDate = new Date(leadActivityData.virtualMeetingDate).toISOString();
      }
      if (leadActivityData.cifDate) {
        leadActivityData.cifDate = new Date(leadActivityData.cifDate).toISOString();
      }


      // Create new lead activity entry with all data and files
      await authAPI.createLeadActivity(leadId, leadActivityData, files);

      showToast('Lead activity created successfully', 'success');
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
      paymentMethod: '',
      siteVisit: false,
      siteVisitDate: '',
      centerVisit: false,
      centerVisitDate: '',
      virtualMeeting: false,
      virtualMeetingDate: '',
      cifDate: '',
      comment: ''
    });
    setFiles([]);
    onClose();
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Edit Lead">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Lead & Add Activity (Admin)" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Basic Information */}
        <div className="bg-blue-50 p-4 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <User className="mr-2" size={20} />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number *</label>
              <input
                type="tel"
                disabled
                value={formData.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lead Source *</label>
              <select
                value={formData.sourceId || ''}
                onChange={(e) => handleInputChange('sourceId', e.target.value)}
                required
                disabled={isSalesAgent}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isSalesAgent ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">Select Source ({dropdownData.leadSources.length} available)</option>
                {dropdownData.leadSources.map((source: any) => (
                  <option key={source._id} value={source._id}>{source.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Status & Location */}
        <div className="bg-green-50 p-4 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Building className="mr-2" size={20} />
            Status & Location
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lead Status</label>
              <select
                value={formData.leadStatusId}
                onChange={(e) => handleInputChange('leadStatusId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Status</option>
                {dropdownData.leadStatuses
                  .filter((status: any) => isSalesAgent ? ['qualified', 'won', 'lost'].includes(status.slug) : true)
                  .map((status: any) => (
                    <option key={status._id} value={status._id}>{status.name}</option>
                  ))}
              </select>
            </div>
            {(() => {
              const selectedStatus = dropdownData.leadStatuses.find((s: DropdownItem) => s._id === formData.leadStatusId);
              return selectedStatus?.slug === 'qualified' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lead Sub-Status</label>
                  <select
                    value={formData.leadSubStatusId}
                    onChange={(e) => handleInputChange('leadSubStatusId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Sub-Status</option>
                    {dropdownData.leadSubStatuses
                      .filter((subStatus: any) => {
                        if (isSalesAgent) {
                          // For sales agents, show all sub-statuses except restrict CIF based on selection
                          return true;
                        }
                        return true;
                      })
                      .map((subStatus: any) => (
                        <option key={subStatus._id} value={subStatus._id}>{subStatus.name}</option>
                      ))}
                  </select>
                </div>
              ) : null;
            })()}
            
            {(() => {
              const selectedSubStatus = dropdownData.leadSubStatuses.find((s: DropdownItem) => s._id === formData.leadSubStatusId);
              return selectedSubStatus?.slug === 'cif' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CIF Date</label>
                  <input
                    type="datetime-local"
                    value={formData.cifDate}
                    onChange={(e) => handleInputChange('cifDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ) : null;
            })()}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Centre</label>
              <select
                value={formData.centreId}
                onChange={(e) => handleInputChange('centreId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Centre</option>
                {dropdownData.centres.map((centre: any) => (
                  <option key={centre._id} value={centre._id}>{centre.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={formData.languageId}
                onChange={(e) => handleInputChange('languageId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Language</option>
                {dropdownData.languages.map((language: any) => (
                  <option key={language._id} value={language._id}>{language.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Project Information */}
        <div className="bg-purple-50 p-4 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Building className="mr-2" size={20} />
            Project Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Type</label>
              <select
                value={formData.projectTypeId}
                onChange={(e) => handleInputChange('projectTypeId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Project Type</option>
                {dropdownData.projectTypes.map((type: any) => (
                  <option key={type._id} value={type._id}>{type.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">House Type</label>
              <select
                value={formData.houseTypeId}
                onChange={(e) => handleInputChange('houseTypeId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select House Type</option>
                {dropdownData.houseTypes.map((type: any) => (
                  <option key={type._id} value={type._id}>{type.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Value</label>
              <input
                type="text"
                value={formData.projectValue}
                onChange={(e) => handleInputChange('projectValue', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter project value"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Apartment Name</label>
              <input
                type="text"
                value={formData.apartmentName}
                onChange={(e) => handleInputChange('apartmentName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter apartment name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expected Possession Date</label>
              <input
                type="date"
                value={formData.expectedPossessionDate}
                onChange={(e) => handleInputChange('expectedPossessionDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lead Value</label>
              <select
                value={formData.leadValue}
                onChange={(e) => handleInputChange('leadValue', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Lead Value</option>
                <option value="high value">High Value</option>
                <option value="medium value">Medium Value</option>
                <option value="low value">Low Value</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          </div>
        </div>

        {/* Activities & Meetings */}
        <div className="bg-yellow-50 p-4 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Calendar className="mr-2" size={20} />
            Activities & Meetings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="siteVisit"
                checked={formData.siteVisit}
                onChange={(e) => handleInputChange('siteVisit', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="siteVisit" className="text-sm font-medium text-gray-700">Site Visit</label>
            </div>
            {formData.siteVisit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Visit Date</label>
                <input
                  type="date"
                  value={formData.siteVisitDate}
                  onChange={(e) => handleInputChange('siteVisitDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="centerVisit"
                checked={formData.centerVisit}
                onChange={(e) => handleInputChange('centerVisit', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="centerVisit" className="text-sm font-medium text-gray-700">Center Visit</label>
            </div>
            {formData.centerVisit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Center Visit Date</label>
                <input
                  type="date"
                  value={formData.centerVisitDate}
                  onChange={(e) => handleInputChange('centerVisitDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="virtualMeeting"
                checked={formData.virtualMeeting}
                onChange={(e) => handleInputChange('virtualMeeting', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="virtualMeeting" className="text-sm font-medium text-gray-700">Virtual Meeting</label>
            </div>
            {formData.virtualMeeting && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Virtual Meeting Date</label>
                <input
                  type="date"
                  value={formData.virtualMeetingDate}
                  onChange={(e) => handleInputChange('virtualMeetingDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
            

          </div>
        </div>

        {/* Activity Comments */}
        <div className="bg-orange-50 p-4 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <MessageSquare className="mr-2" size={20} />
            Activity Comments
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Activity Comment</label>
            <textarea
              value={formData.comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter activity comment (this will create a new lead activity entry)..."
            />
            <p className="text-sm text-gray-500 mt-1">
              This comment will be saved as a new lead activity entry when you update the lead.
            </p>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-gray-50 p-4 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Upload className="mr-2" size={20} />
            Attach Files (Optional)
          </h3>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors relative">
              <Upload size={24} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG (Max 10MB each, 5 files max)</p>
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                multiple
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            
            {files.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <FileText size={20} className="text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">{file.name}</span>
                      <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            disabled={submitting}
          >
            <X size={16} />
            <span>Cancel</span>
          </button>
          
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
            style={{backgroundColor: '#0f172a'}}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <span>Update Lead</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}