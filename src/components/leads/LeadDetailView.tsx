'use client';

import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/auth';
import Modal from '../Modal';
import { Phone, ArrowLeft, Plus, User, ChartLine, Users, Calendar, PhoneCall, ClipboardList } from 'lucide-react';

interface Lead {
  _id: string;
  leadId?: string;
  name: string;
  contactNumber: string;
  email: string;
  sourceId: { _id: string; name: string };
  salesUserId?: { _id: string; name: string };
  presalesUserId?: { _id: string; name: string };
  leadStatusId: { _id: string; name: string };
  languageId?: { _id: string; name: string };
  centerId?: { _id: string; name: string };
  createdAt: string;
}

interface CallLog {
  _id: string;
  userId: { _id: string; name: string };
  leadId: string;
  callDateTime: string;
  callDuration: number;
  callStatus: string;
  callOutcome?: string;
  followUpAction?: string;
  nextCallDateTime?: string;
  cifDateTime?: string;
  originalLanguageId?: { _id: string; name: string };
  updatedLanguageId?: { _id: string; name: string };
  languageId?: { _id: string; name: string };
  assignedUserId?: { _id: string; name: string };
  leadValue?: string;
  centerId?: { _id: string; name: string };
  apartmentTypeId?: { _id: string; name: string };
  notes?: string;
  createdAt: string;
}

interface LeadActivity {
  _id: string;
  leadId: string;
  name?: string;
  email?: string;
  contactNumber?: string;
  presalesUserId?: { _id: string; name: string };
  salesUserId?: { _id: string; name: string };
  updatedPerson?: { _id: string; name: string };
  leadStatusId?: { _id: string; name: string };
  languageId?: { _id: string; name: string };
  sourceId: { _id: string; name: string };
  projectValue?: string;
  leadValue?: string;
  notes?: string;
  centerId?: { _id: string; name: string };
  createdAt: string;
}

interface LeadDetailViewProps {
  leadId: string;
  onBack: () => void;
}

export default function LeadDetailView({ leadId, onBack }: LeadDetailViewProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [leadActivities, setLeadActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('calls');
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
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
  
  // Dropdown data
  const [users, setUsers] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);

  // Activity form data
  const [activityFormData, setActivityFormData] = useState({
    name: '',
    email: '',
    contactNumber: '',
    presalesUserId: '',
    salesUserId: '',
    leadStatusId: '',
    languageId: '',
    sourceId: '',
    projectValue: '',
    leadValue: '',
    notes: '',
    centerId: ''
  });

  useEffect(() => {
    if (leadId) {
      fetchLeadDetails();
      fetchDropdownData();
    }
    
    // Get current user
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [leadId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const fetchDropdownData = async () => {
    try {
      const [usersRes, sourcesRes, statusesRes, centersRes, languagesRes, apartmentTypesRes] = await Promise.all([
        authAPI.admin.getUsers(),
        authAPI.leads.getLeadSources(),
        authAPI.admin.getStatuses(),
        authAPI.admin.getAllCentres(),
        authAPI.admin.getLanguages(),
        authAPI.leads.getProjectHouseTypes()
      ]);
      
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || []);
      setSources(Array.isArray(sourcesRes.data) ? sourcesRes.data : sourcesRes.data.data || []);
      setStatuses(Array.isArray(statusesRes.data) ? statusesRes.data : statusesRes.data.data || []);
      setCenters(Array.isArray(centersRes.data) ? centersRes.data : centersRes.data.data || []);
      setLanguages(Array.isArray(languagesRes.data) ? languagesRes.data : languagesRes.data.data || []);
      const apartmentTypesData = Array.isArray(apartmentTypesRes.data) ? apartmentTypesRes.data : apartmentTypesRes.data.data || [];
      setApartmentTypes(apartmentTypesData.filter((t: any) => t.type === 'house'));
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const fetchLeadDetails = async () => {
    try {
      const response = await authAPI.leads.getLeadDetails(leadId);
      
      setLead(response.data.lead);
      setCallLogs(response.data.callLogs || []);
      setLeadActivities(response.data.activities || []);
      
      // Pre-fill form with lead data
      const leadData = response.data.lead;
      setActivityFormData({
        name: leadData.name || '',
        email: leadData.email || '',
        contactNumber: leadData.contactNumber || '',
        presalesUserId: leadData.presalesUserId?._id || '',
        salesUserId: leadData.salesUserId?._id || '',
        leadStatusId: leadData.leadStatusId._id || '',
        languageId: leadData.languageId?._id || '',
        sourceId: leadData.sourceId._id || '',
        projectValue: '',
        leadValue: '',
        notes: '',
        centerId: leadData.centerId?._id || ''
      });
    } catch (error) {
      console.error('Error fetching lead details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const payload = {
        leadId,
        name: activityFormData.name,
        email: activityFormData.email,
        contactNumber: activityFormData.contactNumber,
        presalesUserId: activityFormData.presalesUserId || null,
        salesUserId: activityFormData.salesUserId || null,
        leadStatusId: activityFormData.leadStatusId || null,
        languageId: activityFormData.languageId || null,
        sourceId: activityFormData.sourceId,
        projectValue: activityFormData.projectValue || null,
        leadValue: activityFormData.leadValue || null,
        notes: activityFormData.notes || null,
        centerId: activityFormData.centerId || null,
        updatedPerson: currentUser._id || currentUser.id
      };
      
      // Remove empty strings
      Object.keys(payload).forEach(key => {
        if ((payload as any)[key] === '') {
          (payload as any)[key] = null;
        }
      });
      
      await authAPI.leads.createLeadActivity(payload);
      fetchLeadDetails();
      setIsActivityModalOpen(false);
      alert('Activity created successfully!');
    } catch (error) {
      console.error('Error creating lead activity:', error);
      alert('Error creating lead activity');
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

  const openCallModal = () => {
    if (!lead) return;
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
    
    if (callStatus && lead && currentUser) {
      try {
        const userId = currentUser._id || currentUser.id;
        if (!userId) {
          throw new Error('User ID not found. Please login again.');
        }
        
        const nextCallDateTime = getCifDateTime();
        
        const callLogData = {
          userId: userId,
          leadId: lead._id,
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
        const response = await authAPI.leads.createCallLog(callLogData);
        console.log('Call log response:', response);
        
        setIsCallModalOpen(false);
        setCallTimer(0);
        setCallNotes('');
        setCallStatus('');
        fetchLeadDetails(); // Refresh data
        alert('Call log saved successfully!');
      } catch (error: any) {
        console.error('Error saving call log:', error);
        console.error('Error details:', error.response?.data);
        alert(`Failed to save call log: ${error.response?.data?.message || error.message}`);
        setIsCallActive(true);
      }
    } else {
      console.log('Missing required data:', { callStatus, lead: !!lead, currentUser: !!currentUser });
      alert('Missing required information. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-red-600">Lead not found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lead Details</h1>
              <p className="text-gray-600 mt-1">Manage lead information and activities</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={openCallModal}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all duration-300 font-semibold"
            >
              <Phone size={20} />
              Make Call
            </button>
            <button
              onClick={() => setIsActivityModalOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all duration-300 font-semibold"
            >
              <Plus size={20} />
              Add Activity
            </button>
          </div>
        </div>
      </div>

      {/* Lead Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold">{lead.name}</h2>
                <span className="px-3 py-1 bg-white/30 backdrop-blur-sm rounded-full text-sm font-mono font-bold">{lead.leadId || 'N/A'}</span>
              </div>
              <div className="flex gap-2 mb-3">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">{lead.leadStatusId.name}</span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">Active</span>
              </div>
              <div className="flex items-center gap-2 text-blue-100">
                <Calendar size={16} />
                <span className="text-sm">
                  Created on {new Date(lead.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <User size={32} />
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Contact Info</h3>
                  <p className="text-sm text-gray-500">Personal details</p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-500 text-sm">Name:</span>
                  <span className="ml-2 font-medium">{lead.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Phone:</span>
                  <span className="ml-2 font-medium">{lead.contactNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Email:</span>
                  <span className="ml-2 font-medium">{lead.email}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <ChartLine size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Lead Status</h3>
                  <p className="text-sm text-gray-500">Current progress</p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-500 text-sm">Status:</span>
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">{lead.leadStatusId.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Source:</span>
                  <span className="ml-2 font-medium">{lead.sourceId.name}</span>
                </div>
                {lead.languageId && (
                  <div>
                    <span className="text-gray-500 text-sm">Language:</span>
                    <span className="ml-2 font-medium">{lead.languageId.name}</span>
                  </div>
                )}
                {lead.centerId && (
                  <div>
                    <span className="text-gray-500 text-sm">Center:</span>
                    <span className="ml-2 font-medium">{lead.centerId.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Assigned Team</h3>
                  <p className="text-sm text-gray-500">Responsible agents</p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-500 text-sm">Sales:</span>
                  <span className="ml-2 font-medium">{lead?.salesUserId?.name || 'Not assigned'}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Presales:</span>
                  <span className="ml-2 font-medium">{lead?.presalesUserId?.name || 'Not assigned'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Section */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button 
            className={`flex-1 p-4 text-center text-sm font-semibold transition-all duration-200 ${
              activeTab === 'calls' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-600 border-b-2 border-transparent hover:text-gray-800 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('calls')}
          >
            <PhoneCall size={16} className="inline mr-2" />
            Call Logs ({callLogs.length})
          </button>
          <button 
            className={`flex-1 p-4 text-center text-sm font-semibold transition-all duration-200 ${
              activeTab === 'activities' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-600 border-b-2 border-transparent hover:text-gray-800 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('activities')}
          >
            <ClipboardList size={16} className="inline mr-2" />
            Activity Logs ({leadActivities.length})
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'calls' && (
            <div className="space-y-4">
              {callLogs.map((log) => (
                <div key={log._id} className="bg-green-50 p-4 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                        log.callStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        <Phone size={16} />
                      </div>
                      <div>
                        <div className="font-semibold text-green-800">{log.userId.name}</div>
                        <div className={`text-sm font-medium ${
                          log.callStatus === 'connected' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          Call {log.callStatus}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(log.callDateTime).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                    <div><span className="font-medium text-gray-700">Duration:</span> {formatTime(log.callDuration)}</div>
                    {log.callOutcome && (
                      <div><span className="font-medium text-gray-700">Outcome:</span> 
                        <span className="ml-1 capitalize">{log.callOutcome.replace('_', ' ')}</span>
                      </div>
                    )}
                    {log.followUpAction && (
                      <div><span className="font-medium text-gray-700">Follow Up:</span> 
                        <span className="ml-1 capitalize">{log.followUpAction.replace('_', ' ')}</span>
                      </div>
                    )}
                    {log.leadValue && (
                      <div><span className="font-medium text-gray-700">Lead Value:</span> 
                        <span className={`ml-1 px-2 py-1 rounded text-xs font-semibold ${
                          log.leadValue === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {log.leadValue.toUpperCase()}
                        </span>
                      </div>
                    )}
                    {log.languageId && (
                      <div><span className="font-medium text-gray-700">Language:</span> {log.languageId.name}</div>
                    )}
                    {log.assignedUserId && (
                      <div><span className="font-medium text-gray-700">Assigned To:</span> {log.assignedUserId.name}</div>
                    )}
                    {log.centerId && (
                      <div><span className="font-medium text-gray-700">Center:</span> {log.centerId.name}</div>
                    )}
                    {log.apartmentTypeId && (
                      <div><span className="font-medium text-gray-700">Apartment Type:</span> {log.apartmentTypeId.name}</div>
                    )}
                  </div>
                  
                  {(log.nextCallDateTime || log.cifDateTime) && (
                    <div className="bg-yellow-50 p-3 rounded border mb-3">
                      <div className="text-sm font-medium text-yellow-800 mb-1">Scheduling:</div>
                      {log.nextCallDateTime && (
                        <div className="text-sm text-yellow-700">
                          <span className="font-medium">Next Call:</span> {new Date(log.nextCallDateTime).toLocaleString()}
                        </div>
                      )}
                      {log.cifDateTime && (
                        <div className="text-sm text-yellow-700">
                          <span className="font-medium">CIF:</span> {new Date(log.cifDateTime).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {(log.originalLanguageId || log.updatedLanguageId) && (
                    <div className="bg-blue-50 p-3 rounded border mb-3">
                      <div className="text-sm font-medium text-blue-800 mb-1">Language Changes:</div>
                      {log.originalLanguageId && (
                        <div className="text-sm text-blue-700">
                          <span className="font-medium">Original:</span> {log.originalLanguageId.name}
                        </div>
                      )}
                      {log.updatedLanguageId && (
                        <div className="text-sm text-blue-700">
                          <span className="font-medium">Updated:</span> {log.updatedLanguageId.name}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {log.notes && (
                    <div className="bg-white p-3 rounded border text-sm">
                      <span className="font-medium text-gray-700">Notes:</span>
                      <div className="mt-1 text-gray-600 whitespace-pre-wrap">{log.notes}</div>
                    </div>
                  )}
                </div>
              ))}
              {callLogs.length === 0 && (
                <div className="text-center py-12">
                  <Phone size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No call logs found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="space-y-4">
              {leadActivities.map((activity) => (
                <div key={activity._id} className="bg-blue-50 p-4 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {activity.updatedPerson?.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <div className="font-semibold text-blue-800">{activity.updatedPerson?.name || 'System'}</div>
                        <div className="text-sm text-blue-600">Activity updated</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(activity.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="font-medium text-gray-700">Status:</span> 
                      <span className="ml-1">{activity.leadStatusId?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Contact:</span> 
                      <span className="ml-1">{activity.contactNumber}</span>
                    </div>
                    {activity.projectValue && (
                      <div>
                        <span className="font-medium text-gray-700">Project Value:</span> 
                        <span className="ml-1">{activity.projectValue}</span>
                      </div>
                    )}
                    {activity.leadValue && (
                      <div>
                        <span className="font-medium text-gray-700">Lead Value:</span> 
                        <span className="ml-1">{activity.leadValue}</span>
                      </div>
                    )}
                  </div>
                  {activity.notes && (
                    <div className="bg-white p-3 rounded border text-sm">
                      <span className="font-medium text-gray-700">Notes:</span> {activity.notes}
                    </div>
                  )}
                </div>
              ))}
              {leadActivities.length === 0 && (
                <div className="text-center py-12">
                  <ClipboardList size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No activities found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Activity Modal */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="Add Lead Activity"
      >
        <form onSubmit={handleCreateActivity} className="space-y-4 max-h-[80vh] overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              value={activityFormData.name}
              onChange={(e) => setActivityFormData({ ...activityFormData, name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="text"
              placeholder="Contact Number"
              value={activityFormData.contactNumber}
              onChange={(e) => setActivityFormData({ ...activityFormData, contactNumber: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <input
            type="email"
            placeholder="Email"
            value={activityFormData.email}
            onChange={(e) => setActivityFormData({ ...activityFormData, email: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <select
              value={activityFormData.salesUserId}
              onChange={(e) => setActivityFormData({ ...activityFormData, salesUserId: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Sales User</option>
              {users.filter(u => u.roleId?.slug === 'sales_agent').map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>
            <select
              value={activityFormData.presalesUserId}
              onChange={(e) => setActivityFormData({ ...activityFormData, presalesUserId: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Presales User</option>
              {users.filter(u => u.roleId?.slug === 'presales_agent').map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select
              value={activityFormData.leadStatusId}
              onChange={(e) => setActivityFormData({ ...activityFormData, leadStatusId: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Lead Status</option>
              {statuses.filter(s => s.type === 'leadStatus').map(status => (
                <option key={status._id} value={status._id}>{status.name}</option>
              ))}
            </select>
            <select
              value={activityFormData.languageId}
              onChange={(e) => setActivityFormData({ ...activityFormData, languageId: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Language</option>
              {languages.map(language => (
                <option key={language._id} value={language._id}>{language.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select
              value={activityFormData.sourceId}
              onChange={(e) => setActivityFormData({ ...activityFormData, sourceId: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Source</option>
              {sources.map(source => (
                <option key={source._id} value={source._id}>{source.name}</option>
              ))}
            </select>
            <select
              value={activityFormData.centerId}
              onChange={(e) => setActivityFormData({ ...activityFormData, centerId: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Center</option>
              {centers.map(center => (
                <option key={center._id} value={center._id}>{center.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Project Value"
              value={activityFormData.projectValue}
              onChange={(e) => setActivityFormData({ ...activityFormData, projectValue: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={activityFormData.leadValue}
              onChange={(e) => setActivityFormData({ ...activityFormData, leadValue: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Lead Value</option>
              <option value="high">High</option>
              <option value="low">Low</option>
            </select>
          </div>

          <textarea
            placeholder="Notes"
            value={activityFormData.notes}
            onChange={(e) => setActivityFormData({ ...activityFormData, notes: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              Create Activity
            </button>
            <button
              type="button"
              onClick={() => setIsActivityModalOpen(false)}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Call Activity Modal */}
      <Modal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        title={`Call Activity - ${lead?.name}`}
      >
        <div className="space-y-4">
          <div className="text-center border-b pb-4">
            <div className="text-sm text-gray-600">Caller: {currentUser?.name}</div>
            <div className="text-xl font-bold text-blue-600">{lead?.contactNumber}</div>
            <div className="text-3xl font-mono font-bold text-gray-800 my-2">{formatTime(callTimer)}</div>
            {!isCallActive ? (
              <button onClick={startCall} className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600">
                <Phone size={16} className="inline mr-2" />Start Call
              </button>
            ) : (
              <div className="text-green-600 font-semibold">Call in Progress...</div>
            )}
          </div>

          {isCallActive && (
            <div className="space-y-4">
              {/* Call Status */}
              <div>
                <label className="block text-sm font-medium mb-2">Call Status *</label>
                <select
                  value={callStatus}
                  onChange={(e) => setCallStatus(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  required
                >
                  <option value="">Select Call Status</option>
                  <option value="connected">Connected</option>
                  <option value="not_connected">Not Connected</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium mb-1">Call Duration (seconds)</label>
                <input
                  type="number"
                  value={callTimer}
                  onChange={(e) => setCallTimer(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border rounded-lg"
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
                      <option value="not_interested">Customer Not Interested → Lead Lost</option>
                      <option value="language_mismatch">Language Do Not Match</option>
                      <option value="follow_up">Need Follow Up Call</option>
                      <option value="qualified">Qualified → Move to Sales</option>
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
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  className="w-full p-2 border rounded-lg h-20"
                  placeholder="Call notes..."
                />
              </div>

              {/* End Call Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('End call button clicked');
                  endCall();
                }}
                disabled={!callStatus}
                className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                End Call & Save
              </button>
            </div>
          )}
        </div>
      </Modal>


    </div>
  );
}