'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Phone, Calendar, User } from 'lucide-react';
import { authAPI } from '@/lib/auth';
import Modal from '../Modal';

interface Lead {
  _id: string;
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
  sourceId: { _id: string; name: string };
  notes?: string;
  createdAt: string;
}

interface LeadViewProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

export default function LeadView({ lead, isOpen, onClose }: LeadViewProps) {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [leadActivities, setLeadActivities] = useState<LeadActivity[]>([]);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [latestActivity, setLatestActivity] = useState<LeadActivity | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [activityFormData, setActivityFormData] = useState({
    name: '',
    email: '',
    contactNumber: '',
    presalesUserId: '',
    salesUserId: '',
    leadStatusId: '',
    sourceId: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen && lead) {
      fetchLeadDetails();
      fetchDropdownData();
    }
  }, [isOpen, lead]);

  const fetchLeadDetails = async () => {
    try {
      const response = await authAPI.leads.getLeadDetails(lead._id);
      setCallLogs(response.data.callLogs || []);
      setLeadActivities(response.data.activities || []);
      
      // Set latest activity for form pre-fill
      const latest = response.data.activities?.[0];
      if (latest) {
        setLatestActivity(latest);
        setActivityFormData({
          name: latest.name || lead.name,
          email: latest.email || lead.email,
          contactNumber: latest.contactNumber || lead.contactNumber,
          presalesUserId: latest.presalesUserId?._id || lead.presalesUserId._id,
          salesUserId: latest.salesUserId?._id || lead.salesUserId._id,
          leadStatusId: latest.leadStatusId?._id || lead.leadStatusId._id,
          sourceId: latest.sourceId._id,
          notes: ''
        });
      } else {
        // Set default values from lead
        setActivityFormData({
          name: lead.name,
          email: lead.email,
          contactNumber: lead.contactNumber,
          presalesUserId: lead.presalesUserId._id,
          salesUserId: lead.salesUserId._id,
          leadStatusId: lead.leadStatusId._id,
          sourceId: lead.sourceId._id,
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error fetching lead details:', error);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [usersRes, sourcesRes, statusesRes, centersRes] = await Promise.all([
        authAPI.admin.getUsers(),
        authAPI.leads.getLeadSources(),
        authAPI.admin.getStatuses(),
        authAPI.admin.getCentres()
      ]);
      
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || []);
      setSources(Array.isArray(sourcesRes.data) ? sourcesRes.data : sourcesRes.data.data || []);
      setStatuses(Array.isArray(statusesRes.data) ? statusesRes.data : statusesRes.data.data || []);
      setCenters(Array.isArray(centersRes.data) ? centersRes.data : centersRes.data.data || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };



  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authAPI.leads.createLeadActivity({
        leadId: lead._id,
        ...activityFormData
      });
      fetchLeadDetails(); // Refresh all data
      setIsActivityModalOpen(false);
    } catch (error) {
      console.error('Error creating lead activity:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <h2 className="text-2xl font-bold text-gray-800">Lead Details - {lead.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Lead Information */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
              <h3 className="text-lg font-semibold mb-3 text-blue-800">Contact Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {lead.name}</p>
                <p><span className="font-medium">Phone:</span> {lead.contactNumber}</p>
                <p><span className="font-medium">Email:</span> {lead.email}</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
              <h3 className="text-lg font-semibold mb-3 text-green-800">Lead Details</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Source:</span> {lead.sourceId.name}</p>
                <p><span className="font-medium">Status:</span> {lead.leadStatusId.name}</p>
                <p><span className="font-medium">Sales User:</span> {lead.salesUserId.name}</p>
                <p><span className="font-medium">Presales User:</span> {lead.presalesUserId.name}</p>
              </div>
            </div>
          </div>

          {/* Call Logs and Activities */}
          <div className="grid grid-cols-2 gap-6">
            {/* Call Logs */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Phone size={20} className="text-green-600" />
                Call Logs ({callLogs.length})
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {callLogs.map((log) => (
                  <div key={log._id} className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <User size={16} className="text-green-600" />
                      <span className="font-medium text-green-800">{log.userId.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={14} />
                      <span>{new Date(log.dateTime).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {callLogs.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No call logs found</p>
                )}
              </div>
            </div>

            {/* Lead Activities */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Lead Activities ({leadActivities.length})
                </h3>
                <button
                  onClick={() => setIsActivityModalOpen(true)}
                  className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 hover:bg-blue-600 transition-colors"
                >
                  <Plus size={16} />
                  Add Activity
                </button>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {leadActivities.map((activity) => (
                  <div key={activity._id} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <User size={16} className="text-blue-600" />
                      <span className="font-medium text-blue-800">{activity.updatedPerson?.name}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <div>Status: {activity.leadStatusId?.name}</div>
                      <div>Contact: {activity.contactNumber}</div>
                    </div>
                    {activity.notes && (
                      <div className="text-sm text-gray-700 bg-white p-2 rounded border">
                        {activity.notes}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                      <Calendar size={12} />
                      <span>{new Date(activity.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {leadActivities.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No activities found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Activity Modal */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="Add Lead Activity"
      >
        <form onSubmit={handleCreateActivity} className="space-y-4 max-h-96 overflow-y-auto">
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
            rows={3}
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