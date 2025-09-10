'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, User, Mail, Phone, Building, Globe, Calendar, 
  DollarSign, MapPin, Clock, Edit, Save, X, PhoneCall, 
  MessageSquare, Activity, FileText, CheckCircle, AlertCircle,
  TrendingUp, Users, Target, Download
} from 'lucide-react';
import { authAPI } from '@/lib/auth';
import { useToast } from '@/contexts/ToastContext';
import { validateContactNumber, formatContactNumber } from '@/utils/validation';
import ModernLoader from './ModernLoader';
import LeadTimeline from './LeadTimeline';
import ActivityLogModal from './ActivityLogModal';

import LanguageChangeModal from './LanguageChangeModal';

interface LeadViewProps {
  leadId: string;
  onBack: () => void;
}

interface Lead {
  _id: string;
  leadID: string;
  name?: string;
  email?: string;
  contactNumber?: string;
  comment?: string;
  presalesUserId?: {
    name: string;
    email: string;
  };
  salesUserId?: {
    name: string;
    email: string;
  };
  updatedPerson?: {
    name: string;
    email: string;
  };
  languageId?: {
    _id: string;
    name: string;
  };
  sourceId?: {
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
  projectValue?: string;
  apartmentName?: string;
  expectedPossessionDate?: string;
  siteVisit?: boolean;
  siteVisitDate?: string;
  centerVisit?: boolean;
  centerVisitDate?: string;
  virtualMeeting?: boolean;
  virtualMeetingDate?: string;
  meetingArrangedDate?: string;
  cifDate?: string;
  leadWonDate?: string;
  leadLostDate?: string;
  qualifiedDate?: string;
  hotDate?: string;
  warmDate?: string;
  interestedDate?: string;
  files?: any[];
  createdAt: string;
  updatedAt: string;
}

interface CallLog {
  _id: string;
  callId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  dateTime: string;
  createdAt: string;
}

interface ActivityLog {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  type: 'call' | 'manual';
  comment: string;
  document?: string;
  createdAt: string;
}

export default function LeadView({ leadId, onBack }: LeadViewProps) {
  const { showToast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [leadActivities, setLeadActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [showActivityForm, setShowActivityForm] = useState(false);

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'activities'>('overview');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchLeadData();
    // Get current user from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [leadId]);

  const fetchLeadData = async () => {
    setLoading(true);
    try {
      const [leadResponse, activitiesResponse] = await Promise.all([
        authAPI.getLead(leadId),
        authAPI.getLeadActivities(leadId)
      ]);
      
      setLead(leadResponse.data.lead);
      setCallLogs(leadResponse.data.callLogs || []);
      setActivityLogs(leadResponse.data.activityLogs || []);
      setLeadActivities(activitiesResponse.data.leadActivities || []);
      setEditData(leadResponse.data.lead);
    } catch (error) {
      console.error('Error fetching lead:', error);
      showToast('Failed to fetch lead details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setEditData(lead || {});
  };

  const handleSave = async () => {
    if (!lead) return;
    
    // Validate contact number format
    const contactValidation = validateContactNumber(editData.contactNumber);
    if (!contactValidation.isValid) {
      showToast(contactValidation.error!, 'error');
      return;
    }
    
    try {
      const response = await authAPI.updateLead(lead._id, editData);
      setLead(response.data.lead);
      setEditing(false);
      showToast('Lead updated successfully', 'success');
    } catch (error) {
      console.error('Error updating lead:', error);
      showToast('Failed to update lead', 'error');
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditData(lead || {});
  };

  const handleCall = async (contactNumber?: string) => {
    if (!lead) return;
    
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
      await authAPI.createCallLog(lead?._id);
      if (!isMobileOrTablet) {
        showToast('Call logged successfully', 'success');
      }
      fetchLeadData(); // Refresh data
    } catch (error) {
      console.error('Error logging call:', error);
      showToast('Failed to log call', 'error');
    }
  };

  const handleActivitySubmit = async (type: 'call' | 'manual', comment: string, document?: File) => {
    if (!lead) return;
    
    try {
      await authAPI.createActivityLog(lead?._id, type, comment, document);
      showToast('Activity logged successfully', 'success');
      setShowActivityForm(false);
      fetchLeadData(); // Refresh data
    } catch (error) {
      console.error('Error logging activity:', error);
      showToast('Failed to log activity', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ModernLoader size="lg" variant="primary" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Lead Not Found</h2>
          <p className="text-gray-600 mb-4">The lead you're looking for doesn't exist.</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40">
        <div className="px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <button
                onClick={onBack}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-lg font-bold text-gray-900 truncate">{lead.leadID}</h1>
                <p className="text-xs text-gray-600 truncate">{lead.name || 'Lead Details'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 flex-shrink-0">
              {!editing ? (
                <>
                  <button
                    onClick={() => handleCall(lead.contactNumber)}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <PhoneCall size={14} />
                  </button>
                  
                  <button
                    onClick={() => setShowActivityForm(true)}
                    className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <MessageSquare size={14} />
                  </button>
                  {currentUser?.role === 'presales_agent' && (
                    <button
                      onClick={() => setShowLanguageModal(true)}
                      className="p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <Globe size={14} />
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <X size={14} />
                  </button>
                  <button
                    onClick={handleSave}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Status Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl flex-shrink-0">
                <User size={16} className="sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600">Lead Status</p>
                <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                  {lead.leadStatusId?.name || 'Not Set'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg sm:rounded-xl flex-shrink-0">
                <TrendingUp size={16} className="sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600">Lead Value</p>
                <p className="font-semibold text-gray-900 text-sm sm:text-base capitalize truncate">
                  {lead.leadValue || 'Not Set'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg sm:rounded-xl flex-shrink-0">
                <Users size={16} className="sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600">Assigned To</p>
                <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                  {lead.presalesUserId?.name || lead.salesUserId?.name || 'Unassigned'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-2 sm:p-3 bg-orange-100 rounded-lg sm:rounded-xl flex-shrink-0">
                <Target size={16} className="sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600">Activities</p>
                <p className="font-semibold text-gray-900 text-sm sm:text-base">
                  {callLogs.length + activityLogs.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-white/20 shadow-lg mb-4 sm:mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex px-2 sm:px-4">
              {[
                { id: 'overview', label: 'Overview', icon: User },
                { id: 'timeline', label: 'Timeline', icon: Clock },
                { id: 'activities', label: 'Activities', icon: Activity }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex-1 flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-3 px-1 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={14} className="sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">{label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-2 sm:p-4 lg:p-6">
            {activeTab === 'overview' && (
              <LeadOverview 
                lead={lead} 
                editing={editing} 
                editData={editData} 
                setEditData={setEditData} 
              />
            )}
            {activeTab === 'timeline' && (
              <div className="-mx-2 sm:mx-0">
                <LeadTimeline 
                  leadId={lead._id} 
                  callLogs={callLogs} 
                  activityLogs={activityLogs} 
                />
              </div>
            )}
            {activeTab === 'activities' && (
              <div className="-mx-2 sm:mx-0">
                <LeadActivities 
                  callLogs={callLogs} 
                  activityLogs={activityLogs}
                  leadActivities={leadActivities}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showActivityForm && (
        <ActivityLogModal
          isOpen={showActivityForm}
          onClose={() => setShowActivityForm(false)}
          onSubmit={handleActivitySubmit}
        />
      )}



      {showLanguageModal && (
        <LanguageChangeModal
          isOpen={showLanguageModal}
          onClose={() => setShowLanguageModal(false)}
          leadId={leadId}
          currentLanguageId={lead?.languageId?._id}
          onSuccess={() => {
            fetchLeadData();
            onBack(); // Go back to leads list since lead is reassigned
          }}
        />
      )}


    </div>
  );
}

// Overview Component
function LeadOverview({ lead, editing, editData, setEditData }: {
  lead: Lead;
  editing: boolean;
  editData: any;
  setEditData: (data: any) => void;
}) {
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
  const isPresalesAgent = userRole === 'presales_agent';
  const isPresalesManager = userRole === 'manager_presales';
  const isPresalesHod = userRole === 'hod_presales';
  const isSalesAgent = userRole === 'sales_agent';
  const isSalesManager = userRole === 'sales_manager';
  const isHodSales = userRole === 'hod_sales';
  const isAdmin = userRole === 'admin';
  
  const isPresalesRole = isPresalesAgent || isPresalesManager || isPresalesHod;
  const isSalesRole = isSalesAgent || isSalesManager || isHodSales;

  const handleInputChange = (field: string, value: any) => {
    if (field === 'contactNumber' && typeof value === 'string') {
      value = formatContactNumber(value);
    }
    setEditData((prev: any) => ({ ...prev, [field]: value }));
  };

  const FieldDisplay = ({ label, value, icon: Icon, editing, field, type = 'text', options }: any) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      {editing ? (
        type === 'select' ? (
          <select
            value={editData[field] || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select {label}</option>
            {options?.map((opt: any) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            value={editData[field] || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        ) : type === 'checkbox' ? (
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={editData[field] || false}
              onChange={(e) => handleInputChange(field, e.target.checked)}
              className="w-5 h-5 text-blue-600 bg-gray-50 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Yes</span>
          </div>
        ) : (
          <input
            type={type}
            value={type === 'date' && editData[field] ? new Date(editData[field]).toISOString().split('T')[0] : 
                   type === 'datetime-local' && editData[field] ? new Date(editData[field]).toISOString().slice(0, 16) : 
                   editData[field] || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        )
      ) : (
        <div className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg flex items-center min-h-[48px]">
          {Icon && <Icon size={16} className="mr-2 text-gray-400 flex-shrink-0" />}
          <span>
            {type === 'checkbox' ? (value ? 'Yes' : 'No') :
             (type === 'date' || type === 'datetime-local') && value ? new Date(value).toLocaleString() :
             value || 'Not specified'}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User size={20} className="mr-2" />
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FieldDisplay label="Name" value={lead.name || ''} icon={User} editing={editing} field="name" />
          <FieldDisplay label="Email" value={lead.email || ''} icon={Mail} editing={editing} field="email" type="email" />
          <FieldDisplay label="Contact Number" value={lead.contactNumber || ''} icon={Phone} editing={editing} field="contactNumber" type="tel" />
          <FieldDisplay label="Source" value={lead.sourceId?.name} icon={Globe} editing={false} field="sourceId" />
          <FieldDisplay label="Language" value={lead.languageId?.name} icon={Globe} editing={false} field="languageId" />
          <FieldDisplay label="Lead Value" value={lead.leadValue} icon={TrendingUp} editing={editing} field="leadValue" type="select" options={[
            { value: 'high value', label: 'High Value' },
            { value: 'low value', label: 'Low Value' }
          ]} />
        </div>
      </div>

      {/* Assignment Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users size={20} className="mr-2" />
          Assignment Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(isPresalesRole || isAdmin) && (
            <FieldDisplay label="Presales User" value={lead.presalesUserId?.name} icon={User} editing={false} field="presalesUserId" />
          )}
          {(isSalesRole || isAdmin) && (
            <FieldDisplay label="Sales User" value={lead.salesUserId?.name} icon={User} editing={false} field="salesUserId" />
          )}
          <FieldDisplay label="Lead Status" value={lead.leadStatusId?.name} icon={CheckCircle} editing={false} field="leadStatusId" />
          <FieldDisplay label="Lead Sub Status" value={lead.leadSubStatusId?.name} icon={AlertCircle} editing={false} field="leadSubStatusId" />
          <FieldDisplay label="Centre" value={lead.centreId?.name} icon={MapPin} editing={false} field="centreId" />
        </div>
      </div>

      {/* Project Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Building size={20} className="mr-2" />
          Project Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FieldDisplay label="Project Type" value={lead.projectTypeId?.name} icon={Building} editing={false} field="projectTypeId" />
          <FieldDisplay label="House Type" value={lead.houseTypeId?.name} icon={Building} editing={false} field="houseTypeId" />
          {(isPresalesRole || isAdmin) && (
            <FieldDisplay label="Apartment Name" value={lead.apartmentName} icon={Building} editing={isPresalesAgent ? editing : false} field="apartmentName" />
          )}
          {(isSalesRole || isAdmin) && (
            <>
              <FieldDisplay label="Project Value" value={lead.projectValue} icon={DollarSign} editing={editing} field="projectValue" />
              <FieldDisplay label="Expected Possession Date" value={lead.expectedPossessionDate} icon={Calendar} editing={editing} field="expectedPossessionDate" type="date" />
            </>
          )}
        </div>
      </div>

      {/* Status Dates */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar size={20} className="mr-2" />
          Status Dates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(isPresalesRole || isAdmin) && (
            <>
              <FieldDisplay label="CIF Date" value={lead.cifDate} icon={Calendar} editing={false} field="cifDate" type="datetime-local" />
              <FieldDisplay label="Meeting Arranged Date" value={lead.meetingArrangedDate} icon={Calendar} editing={false} field="meetingArrangedDate" type="datetime-local" />
              <FieldDisplay label="Interested Date" value={lead.interestedDate} icon={Calendar} editing={false} field="interestedDate" type="datetime-local" />
            </>
          )}
          {(isSalesRole || isAdmin) && (
            <>
              <FieldDisplay label="Qualified Date" value={lead.qualifiedDate} icon={Calendar} editing={false} field="qualifiedDate" type="datetime-local" />
              <FieldDisplay label="Hot Date" value={lead.hotDate} icon={Calendar} editing={false} field="hotDate" type="datetime-local" />
              <FieldDisplay label="Warm Date" value={lead.warmDate} icon={Calendar} editing={false} field="warmDate" type="datetime-local" />
              <FieldDisplay label="Won Date" value={lead.leadWonDate} icon={Calendar} editing={false} field="leadWonDate" type="datetime-local" />
              <FieldDisplay label="Lost Date" value={lead.leadLostDate} icon={Calendar} editing={false} field="leadLostDate" type="datetime-local" />
            </>
          )}
        </div>
      </div>

      {/* Activities & Visits */}
      {(isSalesRole || isAdmin) && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity size={20} className="mr-2" />
            Activities & Visits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FieldDisplay label="Site Visit" value={lead.siteVisit} icon={MapPin} editing={editing} field="siteVisit" type="checkbox" />
            <FieldDisplay label="Site Visit Date" value={lead.siteVisitDate} icon={Calendar} editing={editing} field="siteVisitDate" type="date" />
            <FieldDisplay label="Center Visit" value={lead.centerVisit} icon={Building} editing={editing} field="centerVisit" type="checkbox" />
            <FieldDisplay label="Center Visit Date" value={lead.centerVisitDate} icon={Calendar} editing={editing} field="centerVisitDate" type="date" />
            <FieldDisplay label="Virtual Meeting" value={lead.virtualMeeting} icon={Users} editing={editing} field="virtualMeeting" type="checkbox" />
            <FieldDisplay label="Virtual Meeting Date" value={lead.virtualMeetingDate} icon={Calendar} editing={editing} field="virtualMeetingDate" type="date" />
          </div>
        </div>
      )}


      {/* Comments */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText size={20} className="mr-2" />
          Comments
        </h3>
        <div className="grid grid-cols-1 gap-6">
          <FieldDisplay label="Comment" value={lead.comment} icon={MessageSquare} editing={editing} field="comment" type="textarea" />
        </div>
      </div>

      {/* Files */}
      {lead.files && lead.files.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Download size={20} className="mr-2" />
            Attached Files
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lead.files.map((file: any, index: number) => (
              <a
                key={index}
                href={`/api/leads/document/${file.filename}`}
                download
                className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <FileText size={20} className="text-blue-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-blue-900 truncate">
                    {file.originalname || file.filename}
                  </p>
                  <p className="text-xs text-blue-600">
                    {file.size ? `${Math.round(file.size / 1024)} KB` : 'Unknown size'}
                  </p>
                </div>
                <Download size={16} className="text-blue-600" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock size={20} className="mr-2" />
          Timestamps
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FieldDisplay label="Created At" value={lead.createdAt} icon={Calendar} editing={false} field="createdAt" type="date" />
          <FieldDisplay label="Updated At" value={lead.updatedAt} icon={Calendar} editing={false} field="updatedAt" type="date" />
        </div>
      </div>
    </div>
  );
}

// Activities Component
function LeadActivities({ callLogs, activityLogs, leadActivities }: {
  callLogs: CallLog[];
  activityLogs: ActivityLog[];
  leadActivities: any[];
}) {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="bg-slate-900 text-white px-3 sm:px-6 py-3 sm:py-4 rounded-t-lg">
        <h3 className="text-sm sm:text-lg font-semibold flex items-center">
          <Activity size={16} className="sm:w-5 sm:h-5 mr-2" />
          Activities ({leadActivities.length})
        </h3>
      </div>
      
      {leadActivities.length > 0 ? (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden p-3 space-y-4">
            {leadActivities.map((activity, index) => (
              <div key={activity._id} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {leadActivities.length - index}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">{activity.name || 'Unknown'}</h4>
                      <p className="text-xs text-slate-600">{activity.email || '-'}</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 bg-white px-2 py-1 rounded-lg">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-3 mb-3">
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Contact:</span> 
                      <span className="text-slate-900">{activity.contactNumber || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Centre:</span> 
                      <span className="text-slate-900">{activity.centreId?.name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Language:</span> 
                      <span className="text-slate-900">{activity.languageId?.name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Updated By:</span> 
                      <span className="text-slate-900">{activity.updatedPerson?.name || 'System'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {activity.leadStatusId && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                      {activity.leadStatusId.name}
                    </span>
                  )}
                  {activity.leadSubStatusId && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                      {activity.leadSubStatusId.name}
                    </span>
                  )}
                  {activity.leadValue && (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize border ${
                      activity.leadValue === 'high value' ? 'bg-red-100 text-red-800 border-red-200' :
                      activity.leadValue === 'low value' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      'bg-blue-100 text-blue-800 border-blue-200'
                    }`}>
                      {activity.leadValue}
                    </span>
                  )}
                </div>
                
                {activity.comment && (
                  <div className="bg-white rounded-lg p-3 mb-3 border-l-4 border-blue-400">
                    <p className="text-sm text-slate-700">{activity.comment}</p>
                  </div>
                )}
                
                {activity.files && activity.files.length > 0 && (
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs font-medium text-slate-600 mb-2">Attachments:</p>
                    <div className="flex flex-wrap gap-2">
                      {activity.files.map((file: any, fileIndex: number) => (
                        <a 
                          key={fileIndex}
                          href={`/api/leads/document/${file.filename}`}
                          download
                          className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs hover:bg-blue-100 transition-colors border border-blue-200"
                          title={file.originalname}
                        >
                          <FileText size={14} />
                          <span className="truncate max-w-32">{file.originalname || file.filename}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Sub-Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Centre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Language</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Updated By</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Files</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leadActivities.map((activity, index) => (
                  <tr key={activity._id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                        {leadActivities.length - index}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 font-medium">{activity.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{activity.email || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{activity.contactNumber || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {activity.leadStatusId ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                          {activity.leadStatusId.name}
                        </span>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {activity.leadSubStatusId ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-800">
                          {activity.leadSubStatusId.name}
                        </span>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {activity.leadValue ? (
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold capitalize ${
                          activity.leadValue === 'high value' ? 'bg-red-100 text-red-800' :
                          activity.leadValue === 'low value' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {activity.leadValue}
                        </span>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {activity.sourceId ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                          {activity.sourceId.name}
                        </span>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{activity.centreId?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{activity.languageId?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-medium">{activity.updatedPerson?.name || 'System'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <div className="font-medium">{new Date(activity.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-500">{new Date(activity.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {activity.files && activity.files.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {activity.files.map((file: any, fileIndex: number) => (
                            <a 
                              key={fileIndex}
                              href={`/api/leads/document/${file.filename}`}
                              download
                              className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                              title={file.originalname}
                            >
                              <FileText size={12} />
                              <span className="truncate max-w-20">{file.originalname || file.filename}</span>
                            </a>
                          ))}
                        </div>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-center py-8 sm:py-12">
          <Activity size={32} className="sm:w-12 sm:h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 text-sm sm:text-base">No lead activities yet</p>
        </div>
      )}
    </div>
  );
}