'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Plus, Phone, Eye, Search, FileSpreadsheet, Filter, UserPen, Upload, PhoneCall, ClipboardList } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import ModernLoader from '../ModernLoader';
import Modal from '../Modal';
import PaginationFooter from '../PaginationFooter';
import ErrorPage from '../ErrorPage';

import { authAPI } from '@/lib/auth';

// Lead Activity Form Component
interface LeadActivityFormProps {
  lead: Lead;
  onSuccess: () => void;
  onCancel: () => void;
}

function LeadActivityForm({ lead, onSuccess, onCancel }: LeadActivityFormProps) {
  const [formData, setFormData] = useState({
    leadId: lead._id,
    name: lead.name,
    email: lead.email,
    contactNumber: lead.contactNumber,
    presalesUserId: '',
    salesUserId: '',
    leadStatusId: '',
    leadSubStatusId: '',
    languageId: lead.languageId._id,
    sourceId: lead.sourceId._id,
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
    centerId: lead.centerId?._id || '',
    leadSubStatusId: ''
  });
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [projectTypes, setProjectTypes] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [usersRes, statusesRes, languagesRes, sourcesRes, typesRes, centersRes] = await Promise.all([
        authAPI.admin.getUsers(),
        authAPI.admin.getStatuses(),
        authAPI.admin.getLanguages(),
        authAPI.leads.getLeadSources(),
        authAPI.leads.getProjectHouseTypes(),
        authAPI.admin.getAllCentres()
      ]);
      
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || []);
      setStatuses(Array.isArray(statusesRes.data) ? statusesRes.data : statusesRes.data.data || []);
      setLanguages(Array.isArray(languagesRes.data) ? languagesRes.data : languagesRes.data.data || []);
      setSources(Array.isArray(sourcesRes.data) ? sourcesRes.data : sourcesRes.data.data || []);
      setProjectTypes(Array.isArray(typesRes.data) ? typesRes.data : typesRes.data.data || []);
      setCenters(Array.isArray(centersRes.data) ? centersRes.data : centersRes.data.data || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const payload = {
        ...formData,
        updatedPerson: currentUser._id || currentUser.id
      };
      
      await authAPI.leads.createLeadActivity(payload);
      alert('Lead activity created successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error creating lead activity:', error);
      alert('Error creating lead activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-[75vh] overflow-y-auto scrollbar-hide">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
            Basic Information
          </h3>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Contact *</label>
              <input
                type="text"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Project Value</label>
              <input
                type="text"
                value={formData.projectValue}
                onChange={(e) => setFormData({ ...formData, projectValue: e.target.value })}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
              />
            </div>
          </div>
        </div>
        {/* Assignment & Status */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
            Assignment & Status
          </h3>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Presales User</label>
              <select
                value={formData.presalesUserId}
                onChange={(e) => setFormData({ ...formData, presalesUserId: e.target.value })}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
              >
                <option value="">Select Presales User</option>
                {users.filter(u => u.roleId?.slug === 'presales_agent').map(user => (
                  <option key={user._id} value={user._id}>{user.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Sales User</label>
              <select
                value={formData.salesUserId}
                onChange={(e) => setFormData({ ...formData, salesUserId: e.target.value })}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
              >
                <option value="">Select Sales User</option>
                {users.filter(u => u.roleId?.slug === 'sales_agent').map(user => (
                  <option key={user._id} value={user._id}>{user.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Lead Status</label>
              <select
                value={formData.leadStatusId}
                onChange={(e) => setFormData({ ...formData, leadStatusId: e.target.value, leadSubStatusId: '' })}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
              >
                <option value="">Select Lead Status</option>
                {statuses.filter(s => s.type === 'leadStatus').map(status => (
                  <option key={status._id} value={status._id}>{status.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Language</label>
              <select
                value={formData.languageId}
                onChange={(e) => setFormData({ ...formData, languageId: e.target.value })}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
              >
                <option value="">Select Language</option>
                {languages.map(language => (
                  <option key={language._id} value={language._id}>{language.name}</option>
                ))}
              </select>
            </div>
            {(() => {
              const selectedStatus = statuses.find(s => s._id === formData.leadStatusId);
              return selectedStatus?.name === 'Qualified' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Substatus *</label>
                  <select
                    value={formData.leadSubStatusId}
                    onChange={(e) => setFormData({ ...formData, leadSubStatusId: e.target.value })}
                    className="w-full p-2.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
                    required
                  >
                    <option value="">Select Substatus</option>
                    {statuses.filter(s => s.type === 'leadSubStatus').map(substatus => (
                      <option key={substatus._id} value={substatus._id}>{substatus.name}</option>
                    ))}
                  </select>
                </div>
              ) : null;
            })()
            }
          </div>
        </div>

        {/* Project Details */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
            Project Details
          </h3>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Project Type</label>
              <select
                value={formData.projectTypeId}
                onChange={(e) => setFormData({ ...formData, projectTypeId: e.target.value })}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
              >
                <option value="">Select Project Type</option>
                {projectTypes.filter(t => t.type === 'project').map(type => (
                  <option key={type._id} value={type._id}>{type.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">House Type</label>
              <select
                value={formData.houseTypeId}
                onChange={(e) => setFormData({ ...formData, houseTypeId: e.target.value })}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
              >
                <option value="">Select House Type</option>
                {projectTypes.filter(t => t.type === 'house').map(type => (
                  <option key={type._id} value={type._id}>{type.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Apartment Name</label>
              <input
                type="text"
                value={formData.apartmentName}
                onChange={(e) => setFormData({ ...formData, apartmentName: e.target.value })}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Possession Date</label>
              <input
                type="date"
                value={formData.expectedPossessionDate}
                onChange={(e) => setFormData({ ...formData, expectedPossessionDate: e.target.value })}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Financial & Center */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-100">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></div>
            Financial & Center
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Lead Value</label>
              <select
                value={formData.leadValue}
                onChange={(e) => setFormData({ ...formData, leadValue: e.target.value })}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
              >
                <option value="">Select Value</option>
                <option value="high value">High</option>
                <option value="medium value">Medium</option>
                <option value="low value">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
              >
                <option value="">Select Payment</option>
                <option value="cod">COD</option>
                <option value="upi">UPI</option>
                <option value="debit card">Debit Card</option>
                <option value="credit card">Credit Card</option>
                <option value="emi">EMI</option>
                <option value="cheque">Cheque</option>
                <option value="loan">Loan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Center</label>
              <select
                value={formData.centerId}
                onChange={(e) => setFormData({ ...formData, centerId: e.target.value })}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
              >
                <option value="">Select Center</option>
                {centers.map(center => (
                  <option key={center._id} value={center._id}>{center.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {/* Activity Tracking */}
        <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-lg border border-red-100">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></div>
            Activity Tracking
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
              <label className="flex items-center mb-2 text-xs font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.siteVisit}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const currentDateTime = checked ? new Date().toISOString().slice(0, 16) : '';
                    setFormData({ ...formData, siteVisit: checked, siteVisitDate: currentDateTime });
                  }}
                  className="mr-2 w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-400"
                />
                Site Visit
              </label>
              {formData.siteVisit && (
                <input
                  type="datetime-local"
                  value={formData.siteVisitDate}
                  onChange={(e) => setFormData({ ...formData, siteVisitDate: e.target.value })}
                  className="w-full p-2 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                />
              )}
            </div>
            <div className="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
              <label className="flex items-center mb-2 text-xs font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.centerVisit}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const currentDateTime = checked ? new Date().toISOString().slice(0, 16) : '';
                    setFormData({ ...formData, centerVisit: checked, centerVisitDate: currentDateTime });
                  }}
                  className="mr-2 w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-400"
                />
                Center Visit
              </label>
              {formData.centerVisit && (
                <input
                  type="datetime-local"
                  value={formData.centerVisitDate}
                  onChange={(e) => setFormData({ ...formData, centerVisitDate: e.target.value })}
                  className="w-full p-2 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                />
              )}
            </div>
            <div className="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
              <label className="flex items-center mb-2 text-xs font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.virtualMeeting}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const currentDateTime = checked ? new Date().toISOString().slice(0, 16) : '';
                    setFormData({ ...formData, virtualMeeting: checked, virtualMeetingDate: currentDateTime });
                  }}
                  className="mr-2 w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-400"
                />
                Virtual Meeting
              </label>
              {formData.virtualMeeting && (
                <input
                  type="datetime-local"
                  value={formData.virtualMeetingDate}
                  onChange={(e) => setFormData({ ...formData, virtualMeetingDate: e.target.value })}
                  className="w-full p-2 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                />
              )}
            </div>
          </div>
        </div>
        {/* Completion & Notes */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-100">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></div>
            Completion & Notes
          </h3>
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
              <label className="flex items-center mb-2 text-xs font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.isCompleted}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const currentDateTime = checked ? new Date().toISOString().slice(0, 16) : '';
                    setFormData({ ...formData, isCompleted: checked, isCompletedDate: currentDateTime });
                  }}
                  className="mr-2 w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-400"
                />
                Mark as Completed
              </label>
              {formData.isCompleted && (
                <input
                  type="datetime-local"
                  value={formData.isCompletedDate}
                  onChange={(e) => setFormData({ ...formData, isCompletedDate: e.target.value })}
                  className="w-full p-2 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
                rows={3}
                placeholder="Add notes or comments..."
              />
            </div>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.01] disabled:transform-none text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : 'Create Activity'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.01] text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// Bulk Upload Component
interface BulkUploadComponentProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface UploadResult {
  success?: boolean;
  message: string;
  summary?: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
  hasErrors?: boolean;
  errorFile?: string;
  requiredColumns?: string[];
  foundColumns?: string[];
}

function BulkUploadComponent({ onSuccess, onCancel }: BulkUploadComponentProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const downloadErrorFile = (errorFileData: string) => {
    const binaryString = atob(errorFileData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const blob = new Blob([bytes], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'invalid_rows.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    try {
      const response = await authAPI.leads.bulkUploadLeads(file);
      const result = response.data;
      
      console.log('Full upload response:', response);
      console.log('Upload result data:', result);
      console.log('Summary data:', result.summary);
      
      setUploadResult(result);
      setShowResultModal(true);
      
    } catch (error: any) {
      console.error('Upload failed:', error);
      const errorMsg = error.response?.data?.message || error.message;
      
      setUploadResult({
        success: false,
        message: errorMsg,
        requiredColumns: error.response?.data?.requiredColumns,
        foundColumns: error.response?.data?.foundColumns,
        summary: {
          totalRows: 0,
          validRows: 0,
          invalidRows: 0
        }
      });
      setShowResultModal(true);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await authAPI.leads.downloadLeadsTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'leads_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Template download failed:', error);
      alert('Failed to download template');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Bulk Upload Leads</h3>
        <p className="text-sm text-gray-600">Upload multiple leads using an Excel file</p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">Download Template</h4>
            <p className="text-sm text-blue-700">Get the Excel template with sample data</p>
          </div>
          <button
            onClick={downloadTemplate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Download
          </button>
        </div>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload size={48} className="mx-auto text-gray-400 mb-4" />
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900">
            {file ? file.name : 'Drop your Excel file here'}
          </p>
          <p className="text-sm text-gray-600">or</p>
          <label className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
            Choose File
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-2">Supports .xlsx and .xls files</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload Leads'}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Upload Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              {uploadResult?.success === false ? (
                <>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Failed</h3>
                  <p className="text-gray-600 mb-4">{uploadResult.message}</p>
                  {uploadResult.requiredColumns && (
                    <div className="bg-red-50 p-3 rounded-lg mb-4 text-left">
                      <p className="text-sm font-medium text-red-800 mb-2">Required columns:</p>
                      <p className="text-sm text-red-700">{uploadResult.requiredColumns.join(', ')}</p>
                      <p className="text-sm font-medium text-red-800 mb-1 mt-2">Found columns:</p>
                      <p className="text-sm text-red-700">{uploadResult.foundColumns?.join(', ')}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Completed!</h3>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{uploadResult?.summary?.validRows || 0}</div>
                        <div className="text-gray-600">Rows Inserted</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{uploadResult?.summary?.invalidRows || 0}</div>
                        <div className="text-gray-600">Rows Failed</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-800">{uploadResult?.summary?.totalRows || 0}</div>
                        <div className="text-gray-600 text-sm">Total Rows Processed</div>
                      </div>
                    </div>
                  </div>

                  {uploadResult?.hasErrors && uploadResult?.errorFile && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center mb-2">
                        <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="font-medium text-yellow-800">Action Required</span>
                      </div>
                      <p className="text-sm text-yellow-700 mb-3">
                        {uploadResult.summary?.invalidRows || 0} rows failed validation. Download the error file to see details and fix the issues.
                      </p>
                      <button
                        onClick={() => {
                          console.log('Downloading error file...');
                          downloadErrorFile(uploadResult.errorFile);
                        }}
                        className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                      >
                        Download Error File
                      </button>
                      <p className="text-xs text-yellow-600 mt-2">
                        Fix the errors in the downloaded file and re-upload the corrected rows.
                      </p>
                    </div>
                  )}
                  
                  {uploadResult?.summary?.invalidRows === 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-green-800">Perfect! All rows were successfully processed.</span>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowResultModal(false);
                    setUploadResult(null);
                    if (uploadResult?.success !== false) {
                      onSuccess();
                    }
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {uploadResult?.success === false ? 'Try Again' : 'Continue'}
                </button>
                {uploadResult?.success !== false && (
                  <button
                    onClick={() => {
                      setShowResultModal(false);
                      setUploadResult(null);
                      setFile(null);
                    }}
                    className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    Upload More
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const { error, handleError, retry } = useErrorHandler();
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    contactNumber: '',
    email: '',
    sourceId: '',
    leadStatusId: '',
    languageId: ''
  });
  const [manualSourceId, setManualSourceId] = useState<string>('');
  const [activeModalTab, setActiveModalTab] = useState('manual'); // 'manual' or 'bulk'
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedLeadForActivity, setSelectedLeadForActivity] = useState<Lead | null>(null);


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
      if (typeof window !== 'undefined' && window.location.pathname === '/leads') {
        localStorage.setItem('currentPage', 'leads');
        localStorage.setItem('lastVisitedPage', '/leads');
      }
    };
    
    preventRedirect();
    window.addEventListener('beforeunload', preventRedirect);
    
    // Restore scroll position
    if (typeof window !== 'undefined') {
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
    }
  }, []);



  const handleCallClick = async (lead: Lead) => {
    try {
      const userId = currentUser?._id || currentUser?.id;
      if (!userId) {
        alert('Please login again');
        return;
      }
      
      const callLogData = {
        userId,
        leadId: lead._id,
        datetime: new Date().toISOString()
      };
      
      await authAPI.leads.createCallLog(callLogData);
      alert('Call logged successfully!');
      fetchLeads();
    } catch (error: any) {
      console.error('Error logging call:', error);
      alert('Failed to log call: ' + (error.response?.data?.message || error.message));
    }
  };





  const fetchDropdownData = async () => {
    try {
      const [sourcesRes, statusesRes, usersRes, languagesRes, centersRes, apartmentTypesRes] = await Promise.all([
        authAPI.leads.getLeadSources(),
        authAPI.admin.getStatuses(),
        authAPI.admin.getUsers(),
        authAPI.admin.getLanguages(),
        authAPI.admin.getAllCentres(),
        Promise.resolve({ data: [] })
      ]);
      
      const sourcesData = Array.isArray(sourcesRes.data) ? sourcesRes.data : sourcesRes.data.data || [];
      const statusesData = Array.isArray(statusesRes.data) ? statusesRes.data : statusesRes.data.data || [];
      let usersData = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || [];
      const languagesData = Array.isArray(languagesRes.data) ? languagesRes.data : languagesRes.data.data || [];
      const centersData = Array.isArray(centersRes.data) ? centersRes.data : centersRes.data.data || [];
      
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
      
      if (response.data.data) {
        setLeads(response.data.data);
        if (response.data.pagination) {
          updatePagination(response.data.pagination);
        }
      } else {
        setLeads(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
      handleError(err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.limit, debouncedFilters, updatePagination, handleError]);

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

  const openActivityModal = (lead: Lead) => {
    setSelectedLeadForActivity(lead);
    setIsActivityModalOpen(true);
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

  if (error.hasError) {
    return <ErrorPage statusCode={error.statusCode || 500} message={error.message} onRetry={() => { retry(); fetchLeads(); }} />;
  }

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
                    <button onClick={() => openViewPage(lead._id)} className="p-1.5 xl:p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all" title="View">
                      <Eye size={14} />
                    </button>
                    <button onClick={() => openModal(lead)} className="p-1.5 xl:p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all" title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => openActivityModal(lead)} className="p-1.5 xl:p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-all" title="Add Activity">
                      <ClipboardList size={14} />
                    </button>
                    <button onClick={() => handleCallClick(lead)} className="p-1.5 xl:p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all" title="Call">
                      <Phone size={14} />
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
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                  <button onClick={() => handleCallClick(lead)} className="flex items-center justify-center px-2 sm:px-3 py-2 bg-green-100 text-green-700 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm">
                    <Phone size={12} className="mr-1" /> Call
                  </button>
                  <button onClick={() => openViewPage(lead._id)} className="flex items-center justify-center px-2 sm:px-3 py-2 bg-blue-100 text-blue-700 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm">
                    <Eye size={12} className="mr-1" /> View
                  </button>
                  <button onClick={() => openModal(lead)} className="flex items-center justify-center px-2 sm:px-3 py-2 bg-purple-100 text-purple-700 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm">
                    <Pencil size={12} className="mr-1" /> Edit
                  </button>
                  <button onClick={() => openActivityModal(lead)} className="flex items-center justify-center px-2 sm:px-3 py-2 bg-orange-100 text-orange-700 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm">
                    <ClipboardList size={12} className="mr-1" /> Activity
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
        onClose={() => {
          setIsModalOpen(false);
          setActiveModalTab('manual');
        }}
        title={editingLead ? 'Edit Lead' : 'Add Lead'}
      >
        <div>
          {!editingLead && (
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveModalTab('manual')}
                className={`flex-1 py-3 px-4 text-center font-medium transition-all ${
                  activeModalTab === 'manual'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Manual Entry
              </button>
              <button
                onClick={() => setActiveModalTab('bulk')}
                className={`flex-1 py-3 px-4 text-center font-medium transition-all ${
                  activeModalTab === 'bulk'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Bulk Upload
              </button>
            </div>
          )}
          
          {(editingLead || activeModalTab === 'manual') && (
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
                  onClick={() => {
                    setIsModalOpen(false);
                    setActiveModalTab('manual');
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          
          {!editingLead && activeModalTab === 'bulk' && (
            <BulkUploadComponent
              onSuccess={() => {
                fetchLeads();
                setIsModalOpen(false);
                setActiveModalTab('manual');
              }}
              onCancel={() => {
                setIsModalOpen(false);
                setActiveModalTab('manual');
              }}
            />
          )}
        </div>
      </Modal>

      {/* Lead Activity Modal */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => {
          setIsActivityModalOpen(false);
          setSelectedLeadForActivity(null);
        }}
        title="Add Lead Activity"
        size="xl"
      >
        {selectedLeadForActivity && (
          <LeadActivityForm
            lead={selectedLeadForActivity}
            onSuccess={() => {
              setIsActivityModalOpen(false);
              setSelectedLeadForActivity(null);
              fetchLeads();
            }}
            onCancel={() => {
              setIsActivityModalOpen(false);
              setSelectedLeadForActivity(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}