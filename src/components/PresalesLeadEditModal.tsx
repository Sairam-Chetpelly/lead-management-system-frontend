'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Upload, FileText, User, Building, MessageSquare } from 'lucide-react';
import Modal from './Modal';
import { authAPI } from '@/lib/auth';
import { useToast } from '@/contexts/ToastContext';

interface PresalesLeadEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  email: string;
  contactNumber: string;
  sourceId: string;
  leadStatusId: string;
  centreId: string;
  languageId: string;
  projectTypeId: string;
  houseTypeId: string;
  apartmentName: string;
  leadValue: string;
  notes: string;
  comment: string;
}

interface DropdownItem {
  _id: string;
  name: string;
  slug?: string;
}

interface DropdownData {
  leadSources: any[];
  centres: any[];
  languages: any[];
  projectTypes: any[];
  houseTypes: any[];
  leadStatuses: DropdownItem[];
}

export default function PresalesLeadEditModal({ isOpen, onClose, leadId, onSuccess }: PresalesLeadEditModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    contactNumber: '',
    sourceId: '',
    leadStatusId: '',
    centreId: '',
    languageId: '',
    projectTypeId: '',
    houseTypeId: '',
    apartmentName: '',
    leadValue: '',
    notes: '',
    comment: ''
  });

  const [dropdownData, setDropdownData] = useState<DropdownData>({
    leadSources: [],
    centres: [],
    languages: [],
    projectTypes: [],
    houseTypes: [],
    leadStatuses: []
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
        sourceId: lead.sourceId?._id || '',
        leadStatusId: lead.leadStatusId?._id || '',
        centreId: lead.centreId?._id || '',
        languageId: lead.languageId?._id || '',
        projectTypeId: lead.projectTypeId?._id || '',
        houseTypeId: lead.houseTypeId?._id || '',
        apartmentName: lead.apartmentName || '',
        leadValue: lead.leadValue || '',
        notes: lead.notes || '',
        comment: ''
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
      const [sourcesRes, centresRes, languagesRes, statusesRes, formDataRes] = await Promise.all([
        authAPI.admin.getAllLeadSources(),
        authAPI.admin.getAllCentres(),
        authAPI.admin.getAllLanguages(),
        authAPI.admin.getAllStatuses(),
        authAPI.getLeadFormData()
      ]);

      const statuses = statusesRes.data.data || statusesRes.data || [];
      
      setDropdownData({
        leadSources: sourcesRes.data.data || sourcesRes.data || [],
        centres: centresRes.data.data || centresRes.data || [],
        languages: languagesRes.data.data || languagesRes.data || [],
        projectTypes: formDataRes.data.projectTypes || [],
        houseTypes: formDataRes.data.houseTypes || [],
        leadStatuses: statuses.filter((s: any) => s.type === 'leadStatus' && ['lead', 'qualified', 'lost'].includes(s.slug))
      });
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      showToast('Failed to fetch form data', 'error');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    
    // Basic validation
    if (!formData.email || !formData.contactNumber) {
      showToast('Email and contact number are required', 'error');
      return;
    }
    
    // Check if status is qualified and validate centre/language
    if (formData.leadStatusId) {
      const selectedStatus = dropdownData.leadStatuses.find((s: DropdownItem) => s._id === formData.leadStatusId);
      if (selectedStatus?.slug === 'qualified') {
        if (!formData.centreId || !formData.languageId) {
          showToast('Centre and Language are required when status is Qualified', 'error');
          return;
        }
      }
    }
    
    setSubmitting(true);

    try {
      console.log('Submitting presales activity with data:', formData);
      console.log('Files:', files);
      
      await authAPI.createPresalesActivity(leadId, formData, files);
      showToast('Lead updated successfully', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating lead:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update lead';
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      contactNumber: '',
      sourceId: '',
      leadStatusId: '',
      centreId: '',
      languageId: '',
      projectTypeId: '',
      houseTypeId: '',
      apartmentName: '',
      leadValue: '',
      notes: '',
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Lead (Presales)" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
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
                value={formData.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lead Source (Disabled)</label>
              <select
                value={formData.sourceId}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              >
                <option value="">Select Source</option>
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
                {dropdownData.leadStatuses.map((status: any) => (
                  <option key={status._id} value={status._id}>{status.name}</option>
                ))}
              </select>
            </div>
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Apartment Name</label>
              <input
                type="text"
                value={formData.apartmentName}
                onChange={(e) => handleInputChange('apartmentName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter apartment name"
              />
            </div>
          </div>
        </div>

        {/* Notes & Comments */}
        <div className="bg-orange-50 p-4 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <MessageSquare className="mr-2" size={20} />
            Notes & Comments
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter general notes..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Activity Comment</label>
              <textarea
                value={formData.comment}
                onChange={(e) => handleInputChange('comment', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter activity comment..."
              />
            </div>
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
              <p className="text-sm text-gray-600 mb-2">Click to upload files</p>
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
            className="px-8 py-3 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
            style={{backgroundColor: '#0f172a'}}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                Updating...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2 inline-block" />
                Update Lead
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}