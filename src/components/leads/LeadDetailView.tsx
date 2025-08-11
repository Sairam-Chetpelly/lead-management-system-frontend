'use client';

import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/auth';
import Modal from '../Modal';

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

interface CallLog {
  _id: string;
  userId: { _id: string; name: string };
  leadId: string;
  dateTime: string;
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
  leadSubStatusId?: { _id: string; name: string };
  languageId?: { _id: string; name: string };
  sourceId: { _id: string; name: string };
  projectTypeId?: { _id: string; name: string };
  houseTypeId?: { _id: string; name: string };
  projectValue?: string;
  apartmentName?: string;
  expectedPossessionDate?: string;
  leadValue?: string;
  paymentMethod?: string;
  siteVisit?: boolean;
  siteVisitDate?: string;
  centerVisit?: boolean;
  centerVisitDate?: string;
  virtualMeeting?: boolean;
  virtualMeetingDate?: string;
  isCompleted?: boolean;
  isCompletedDate?: string;
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
  
  // Dropdown data
  const [users, setUsers] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [projectTypes, setProjectTypes] = useState<any[]>([]);

  // Activity form data
  const [activityFormData, setActivityFormData] = useState({
    name: '',
    email: '',
    contactNumber: '',
    presalesUserId: '',
    salesUserId: '',
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

  useEffect(() => {
    console.log('LeadDetailView mounted with leadId:', leadId);
    if (leadId) {
      fetchLeadDetails();
      fetchDropdownData();
    }
  }, [leadId]);

  const fetchDropdownData = async () => {
    try {
      const [usersRes, sourcesRes, statusesRes, centersRes, languagesRes, projectTypesRes] = await Promise.all([
        authAPI.admin.getUsers(),
        authAPI.leads.getLeadSources(),
        authAPI.admin.getStatuses(),
        authAPI.admin.getCentres(),
        authAPI.admin.getLanguages(),
        authAPI.leads.getProjectHouseTypes()
      ]);
      
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || []);
      setSources(Array.isArray(sourcesRes.data) ? sourcesRes.data : sourcesRes.data.data || []);
      setStatuses(Array.isArray(statusesRes.data) ? statusesRes.data : statusesRes.data.data || []);
      setCenters(Array.isArray(centersRes.data) ? centersRes.data : centersRes.data.data || []);
      setLanguages(Array.isArray(languagesRes.data) ? languagesRes.data : languagesRes.data.data || []);
      setProjectTypes(Array.isArray(projectTypesRes.data) ? projectTypesRes.data : projectTypesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const fetchLeadDetails = async () => {
    try {
      console.log('Fetching lead details for:', leadId);
      const response = await authAPI.leads.getLeadDetails(leadId);
      console.log('Lead details response:', response.data);
      setLead(response.data.lead);
      setCallLogs(response.data.callLogs || []);
      setLeadActivities(response.data.activities || []);
      
      // Pre-fill form with latest activity or lead data
      const latest = response.data.activities?.[0];
      const leadData = response.data.lead;
      
      setActivityFormData({
        name: latest?.name || leadData.name || '',
        email: latest?.email || leadData.email || '',
        contactNumber: latest?.contactNumber || leadData.contactNumber || '',
        presalesUserId: latest?.presalesUserId?._id || leadData.presalesUserId._id || '',
        salesUserId: latest?.salesUserId?._id || leadData.salesUserId._id || '',
        leadStatusId: latest?.leadStatusId?._id || leadData.leadStatusId._id || '',
        leadSubStatusId: latest?.leadSubStatusId?._id || '',
        languageId: latest?.languageId?._id || '',
        sourceId: latest?.sourceId._id || leadData.sourceId._id || '',
        projectTypeId: latest?.projectTypeId?._id || '',
        projectValue: latest?.projectValue || '',
        apartmentName: latest?.apartmentName || '',
        houseTypeId: latest?.houseTypeId?._id || '',
        expectedPossessionDate: latest?.expectedPossessionDate ? latest.expectedPossessionDate.split('T')[0] : '',
        leadValue: latest?.leadValue || '',
        paymentMethod: latest?.paymentMethod || '',
        siteVisit: latest?.siteVisit || false,
        siteVisitDate: latest?.siteVisitDate ? latest.siteVisitDate.split('T')[0] : '',
        centerVisit: latest?.centerVisit || false,
        centerVisitDate: latest?.centerVisitDate ? latest.centerVisitDate.split('T')[0] : '',
        virtualMeeting: latest?.virtualMeeting || false,
        virtualMeetingDate: latest?.virtualMeetingDate ? latest.virtualMeetingDate.split('T')[0] : '',
        isCompleted: latest?.isCompleted || false,
        isCompletedDate: latest?.isCompletedDate ? latest.isCompletedDate.split('T')[0] : '',
        notes: '',
        centerId: latest?.centerId?._id || leadData.centerId?._id || ''
      });
    } catch (error) {
      console.error('Error fetching lead details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = async () => {
    try {
      await authAPI.leads.createCallLog({ leadId: leadId });
      fetchLeadDetails();
      alert('Call log created successfully!');
    } catch (error) {
      console.error('Error creating call log:', error);
      alert('Error creating call log');
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        leadId,
        name: activityFormData.name,
        email: activityFormData.email,
        contactNumber: activityFormData.contactNumber,
        presalesUserId: activityFormData.presalesUserId || null,
        salesUserId: activityFormData.salesUserId || null,
        leadStatusId: activityFormData.leadStatusId || null,
        leadSubStatusId: activityFormData.leadSubStatusId || null,
        languageId: activityFormData.languageId || null,
        sourceId: activityFormData.sourceId,
        projectTypeId: activityFormData.projectTypeId || null,
        projectValue: activityFormData.projectValue || null,
        apartmentName: activityFormData.apartmentName || null,
        houseTypeId: activityFormData.houseTypeId || null,
        expectedPossessionDate: activityFormData.expectedPossessionDate || null,
        leadValue: activityFormData.leadValue || null,
        paymentMethod: activityFormData.paymentMethod || null,
        siteVisit: activityFormData.siteVisit,
        siteVisitDate: activityFormData.siteVisitDate || null,
        centerVisit: activityFormData.centerVisit,
        centerVisitDate: activityFormData.centerVisitDate || null,
        virtualMeeting: activityFormData.virtualMeeting,
        virtualMeetingDate: activityFormData.virtualMeetingDate || null,
        isCompleted: activityFormData.isCompleted,
        isCompletedDate: activityFormData.isCompletedDate || null,
        notes: activityFormData.notes || null,
        centerId: activityFormData.centerId || null
      };
      
      // Remove empty string ObjectIds
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') {
          payload[key] = null;
        }
      });
      
      await authAPI.leads.createLeadActivity(payload);
      fetchLeadDetails();
      setIsActivityModalOpen(false);
    } catch (error) {
      console.error('Error creating lead activity:', error);
      alert('Error creating lead activity');
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
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <i className="fas fa-arrow-left text-gray-600"></i>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lead Details</h1>
              <p className="text-gray-600 mt-1">Manage lead information and activities</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCall}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all duration-300 font-semibold"
            >
              <i className="fas fa-phone"></i>
              Make Call
            </button>
            <button
              onClick={() => setIsActivityModalOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all duration-300 font-semibold"
            >
              <i className="fas fa-plus"></i>
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
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">Qualified</span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">Active</span>
              </div>
              <div className="flex items-center gap-2 text-blue-100">
                <i className="far fa-calendar"></i>
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
                <i className="fas fa-user text-3xl"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-user text-blue-600"></i>
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
                  <i className="fas fa-chart-line text-green-600"></i>
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
                  <i className="fas fa-users text-purple-600"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Assigned Team</h3>
                  <p className="text-sm text-gray-500">Responsible agents</p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-500 text-sm">Sales:</span>
                  <span className="ml-2 font-medium">{lead?.salesUserId?.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Presales:</span>
                  <span className="ml-2 font-medium">{lead?.presalesUserId?.name}</span>
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
            <i className="fas fa-phone mr-2"></i>
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
            <i className="fas fa-clipboard-list mr-2"></i>
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
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                        <i className="fas fa-phone text-sm"></i>
                      </div>
                      <div>
                        <div className="font-semibold text-green-800">{log.userId.name}</div>
                        <div className="text-sm text-green-600">Call made</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(log.dateTime).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">
                    Call completed successfully - Follow up scheduled
                  </div>
                </div>
              ))}
              {callLogs.length === 0 && (
                <div className="text-center py-12">
                  <i className="fas fa-phone text-4xl text-gray-300 mb-4"></i>
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
                  <i className="fas fa-clipboard-list text-4xl text-gray-300 mb-4"></i>
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
        <form onSubmit={handleCreateActivity} className="space-y-4 max-h-[80vh] overflow-y-auto">
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
              required
            >
              <option value="">Select Sales User</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>
            <select
              value={activityFormData.presalesUserId}
              onChange={(e) => setActivityFormData({ ...activityFormData, presalesUserId: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Presales User</option>
              {users.map(user => (
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
    </div>
  );
}