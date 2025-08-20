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
import ModernLoader from './ModernLoader';
import LeadTimeline from './LeadTimeline';
import LeadActivityForm from './LeadActivityForm';
import CallLogModal from './CallLogModal';
import LanguageChangeModal from './LanguageChangeModal';

interface LeadViewProps {
  leadId: string;
  onBack: () => void;
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
  notes: string;
  presalesUserId?: {
    name: string;
    email: string;
  };
  salesUserId?: {
    name: string;
    email: string;
  };
  languageId?: {
    _id: string;
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
  projectValue?: string;
  apartmentName?: string;
  expectedPossessionDate?: string;
  paymentMethod?: string;
  siteVisit?: boolean;
  siteVisitDate?: string;
  centerVisit?: boolean;
  centerVisitDate?: string;
  virtualMeeting?: boolean;
  virtualMeetingDate?: string;

  createdAt: string;
  updatedAt: string;
}

interface CallLog {
  _id: string;
  callId: string;
  userId: {
    name: string;
    email: string;
  };
  dateTime: string;
  createdAt: string;
}

interface ActivityLog {
  _id: string;
  userId: {
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
  const [showCallModal, setShowCallModal] = useState(false);
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

  const handleCall = async () => {
    if (!lead) return;
    
    try {
      await authAPI.createCallLog(lead?.leadId?._id);
      showToast('Call logged successfully', 'success');
      fetchLeadData(); // Refresh data
    } catch (error) {
      console.error('Error logging call:', error);
      showToast('Failed to log call', 'error');
    }
  };

  const handleActivitySubmit = async (type: 'call' | 'manual', comment: string, document?: File) => {
    if (!lead) return;
    
    try {
      await authAPI.createActivityLog(lead?.leadId?._id, type, comment, document);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{lead.leadId.leadID}</h1>
                <p className="text-sm text-gray-600">{lead.name || 'Lead Details'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {!editing ? (
                <>
                  <button
                    onClick={() => setShowCallModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <PhoneCall size={16} />
                    <span>Call</span>
                  </button>
                  {currentUser?.role === 'presales_agent' && (
                    <button
                      onClick={() => setShowLanguageModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <Globe size={16} />
                      <span>Language Change</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowActivityForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <MessageSquare size={16} />
                    <span>Add Activity</span>
                  </button>
                  {/* <button
                    onClick={handleEdit}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit size={16} />
                    <span>Edit</span>
                  </button> */}
                </>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <X size={16} />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save size={16} />
                    <span>Save</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <User size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Lead Status</p>
                <p className="font-semibold text-gray-900">
                  {lead.leadStatusId?.name || 'Not Set'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Lead Value</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {lead.leadValue || 'Not Set'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Users size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Assigned To</p>
                <p className="font-semibold text-gray-900">
                  {lead.presalesUserId?.name || lead.salesUserId?.name || 'Unassigned'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Target size={24} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Activities</p>
                <p className="font-semibold text-gray-900">
                  {callLogs.length + activityLogs.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: User },
                { id: 'timeline', label: 'Timeline', icon: Clock },
                { id: 'activities', label: 'Activities', icon: Activity }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <LeadOverview 
                lead={lead} 
                editing={editing} 
                editData={editData} 
                setEditData={setEditData} 
              />
            )}
            {activeTab === 'timeline' && (
              <LeadTimeline 
                leadId={lead._id} 
                callLogs={callLogs} 
                activityLogs={activityLogs} 
              />
            )}
            {activeTab === 'activities' && (
              <LeadActivities 
                callLogs={callLogs} 
                activityLogs={activityLogs}
                leadActivities={leadActivities}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showActivityForm && (
        <LeadActivityForm
          isOpen={showActivityForm}
          onClose={() => setShowActivityForm(false)}
          onSubmit={handleActivitySubmit}
        />
      )}

      {showCallModal && (
        <CallLogModal
          isOpen={showCallModal}
          onClose={() => setShowCallModal(false)}
          onCall={handleCall}
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
  const handleInputChange = (field: string, value: any) => {
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
            value={type === 'date' && editData[field] ? new Date(editData[field]).toISOString().split('T')[0] : editData[field] || ''}
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
             type === 'date' && value ? new Date(value).toLocaleDateString() :
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
          <FieldDisplay label="Name" value={lead.name} icon={User} editing={editing} field="name" />
          <FieldDisplay label="Email" value={lead.email} icon={Mail} editing={editing} field="email" type="email" />
          <FieldDisplay label="Contact Number" value={lead.contactNumber} icon={Phone} editing={editing} field="contactNumber" type="tel" />
          <FieldDisplay label="Source" value={lead.sourceId?.name} icon={Globe} editing={false} field="sourceId" />
          <FieldDisplay label="Language" value={lead.languageId?.name} icon={Globe} editing={false} field="languageId" />
          <FieldDisplay label="Lead Value" value={lead.leadValue} icon={TrendingUp} editing={editing} field="leadValue" type="select" options={[
            { value: 'high value', label: 'High Value' },
            { value: 'medium value', label: 'Medium Value' },
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
          <FieldDisplay label="Presales User" value={lead.presalesUserId?.name} icon={User} editing={false} field="presalesUserId" />
          <FieldDisplay label="Sales User" value={lead.salesUserId?.name} icon={User} editing={false} field="salesUserId" />
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
          <FieldDisplay label="Project Value" value={lead.projectValue} icon={DollarSign} editing={editing} field="projectValue" />
          <FieldDisplay label="Apartment Name" value={lead.apartmentName} icon={Building} editing={editing} field="apartmentName" />
          <FieldDisplay label="Expected Possession Date" value={lead.expectedPossessionDate} icon={Calendar} editing={editing} field="expectedPossessionDate" type="date" />
          <FieldDisplay label="Payment Method" value={lead.paymentMethod} icon={DollarSign} editing={editing} field="paymentMethod" type="select" options={[
            { value: 'cod', label: 'Cash on Delivery' },
            { value: 'upi', label: 'UPI' },
            { value: 'debit card', label: 'Debit Card' },
            { value: 'credit card', label: 'Credit Card' },
            { value: 'emi', label: 'EMI' },
            { value: 'cheque', label: 'Cheque' },
            { value: 'loan', label: 'Loan' }
          ]} />
        </div>
      </div>

      {/* Visit Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin size={20} className="mr-2" />
          Visit Information
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



      {/* Comments & Notes */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText size={20} className="mr-2" />
          Comments & Notes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FieldDisplay label="Comment" value={lead.comment} icon={MessageSquare} editing={editing} field="comment" type="textarea" />
          <FieldDisplay label="Notes" value={lead.notes} icon={FileText} editing={editing} field="notes" type="textarea" />
        </div>
      </div>

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
    <div className="space-y-6">
      {/* Lead Activities */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Activity size={20} className="mr-2" />
          Lead Activities ({leadActivities.length})
        </h3>
        {leadActivities.length > 0 ? (
          <div className="space-y-3">
            {leadActivities.map((activity, index) => (
              <div key={activity._id} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Activity size={16} className="text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Activity #{leadActivities.length - index}</p>
                      <p className="text-sm text-gray-600 mb-2">
                        Updated by {activity.updatedPerson?.name || 'System'}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        {activity.leadStatusId && (
                          <div>
                            <span className="font-medium text-gray-700">Status:</span>
                            <span className="ml-1 text-gray-900">{activity.leadStatusId.name}</span>
                          </div>
                        )}
                        {activity.leadSubStatusId && (
                          <div>
                            <span className="font-medium text-gray-700">Sub-Status:</span>
                            <span className="ml-1 text-gray-900">{activity.leadSubStatusId.name}</span>
                          </div>
                        )}
                        {activity.leadValue && (
                          <div>
                            <span className="font-medium text-gray-700">Value:</span>
                            <span className="ml-1 text-gray-900 capitalize">{activity.leadValue}</span>
                          </div>
                        )}
                        {activity.projectValue && (
                          <div>
                            <span className="font-medium text-gray-700">Project Value:</span>
                            <span className="ml-1 text-gray-900">{activity.projectValue}</span>
                          </div>
                        )}
                        {activity.apartmentName && (
                          <div>
                            <span className="font-medium text-gray-700">Apartment:</span>
                            <span className="ml-1 text-gray-900">{activity.apartmentName}</span>
                          </div>
                        )}
                        {activity.paymentMethod && (
                          <div>
                            <span className="font-medium text-gray-700">Payment:</span>
                            <span className="ml-1 text-gray-900 capitalize">{activity.paymentMethod}</span>
                          </div>
                        )}
                      </div>
                      
                      {activity.comment && (
                        <div className="mt-2">
                          <span className="font-medium text-gray-700">Comment:</span>
                          <p className="text-gray-900 mt-1">{activity.comment}</p>
                        </div>
                      )}
                      
                      {activity.files && activity.files.length > 0 && (
                        <div className="mt-2">
                          <span className="font-medium text-gray-700">Files:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {activity.files.map((file: any, fileIndex: number) => (
                              <a 
                                key={fileIndex}
                                href={`/api/leads/document/${file.filename}`}
                                download
                                className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center space-x-1 bg-white px-2 py-1 rounded"
                              >
                                <FileText size={12} />
                                <span>{file.originalname}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">{new Date(activity.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500">{new Date(activity.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No lead activities yet</p>
        )}
      </div>

      {/* Call Logs */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <PhoneCall size={20} className="mr-2" />
          Call Logs ({callLogs.length})
        </h3>
        {callLogs.length > 0 ? (
          <div className="space-y-3">
            {callLogs.map((log) => (
              <div key={log._id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <PhoneCall size={16} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Call - {log.callId}</p>
                      <p className="text-sm text-gray-600 mb-2">by {log.userId.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">{new Date(log.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No call logs yet</p>
        )}
      </div>

      {/* Activity Logs */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MessageSquare size={20} className="mr-2" />
          Activity Logs ({activityLogs.length})
        </h3>
        {activityLogs.length > 0 ? (
          <div className="space-y-3">
            {activityLogs.map((log) => (
              <div key={log._id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MessageSquare size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 capitalize">{log.type} Activity</p>
                      <p className="text-sm text-gray-600 mb-2">by {log.userId.name}</p>
                      <p className="text-gray-900 mb-2">{log.comment}</p>
                      {log.document && (
                        <div className="flex items-center space-x-2">
                          <FileText size={14} className="text-blue-600" />
                          <a 
                            href={`/api/leads/document/${log.document}`}
                            download
                            className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
                          >
                            <Download size={12} />
                            <span>Download</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">{new Date(log.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No activity logs yet</p>
        )}
      </div>
    </div>
  );
}