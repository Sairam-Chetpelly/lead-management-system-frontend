'use client';

import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/auth';
import Modal from '../Modal';
import { Phone, ArrowLeft, Plus, User, ChartLine, Users, Calendar, PhoneCall, ClipboardList } from 'lucide-react';

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
    languageId: lead.languageId?._id || '',
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
  callId: string;
  userId: { _id: string; name: string };
  leadId: string;
  datetime: string;
  createdAt: string;
  updatedAt: string;
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  


  useEffect(() => {
    if (leadId) {
      fetchLeadDetails();
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





  const fetchLeadDetails = async () => {
    try {
      const response = await authAPI.leads.getLeadDetails(leadId);
      
      setLead(response.data.lead);
      setCallLogs(response.data.callLogs || []);
      setLeadActivities(response.data.activities || []);
    } catch (error) {
      console.error('Error fetching lead details:', error);
    } finally {
      setLoading(false);
    }
  };







  const handleCallClick = async () => {
    if (!lead) return;
    
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
      fetchLeadDetails(); // Refresh data
    } catch (error: any) {
      console.error('Error logging call:', error);
      alert('Failed to log call: ' + (error.response?.data?.message || error.message));
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
              onClick={handleCallClick}
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
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                        <Phone size={16} />
                      </div>
                      <div>
                        <div className="font-semibold text-green-800">{log.userId.name}</div>
                        <div className="text-sm text-green-600">Call made</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(log.datetime).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 font-mono">
                    Call ID: {log.callId}
                  </div>
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
                <div key={activity._id} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                        {activity.updatedPerson?.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <div className="font-bold text-blue-900">{activity.updatedPerson?.name || 'System'}</div>
                        <div className="text-sm text-blue-600 font-medium">Lead Activity Created</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full font-medium">
                      {new Date(activity.createdAt).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-100 mb-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">Status:</span>
                        <div className="mt-1">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            {activity.leadStatusId?.name || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Contact:</span>
                        <div className="mt-1 font-medium text-gray-900">{activity.contactNumber}</div>
                      </div>
                      {activity.projectValue && (
                        <div>
                          <span className="font-semibold text-gray-700">Project Value:</span>
                          <div className="mt-1 font-medium text-gray-900">{activity.projectValue}</div>
                        </div>
                      )}
                      {activity.leadValue && (
                        <div>
                          <span className="font-semibold text-gray-700">Lead Value:</span>
                          <div className="mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              activity.leadValue === 'high value' ? 'bg-red-100 text-red-800' :
                              activity.leadValue === 'medium value' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {activity.leadValue}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {(activity.presalesUserId || activity.salesUserId) && (
                      <div className="grid grid-cols-2 gap-4 text-sm mt-3 pt-3 border-t border-gray-200">
                        {activity.presalesUserId && (
                          <div>
                            <span className="font-semibold text-gray-700">Presales:</span>
                            <div className="mt-1 font-medium text-gray-900">{activity.presalesUserId.name}</div>
                          </div>
                        )}
                        {activity.salesUserId && (
                          <div>
                            <span className="font-semibold text-gray-700">Sales:</span>
                            <div className="mt-1 font-medium text-gray-900">{activity.salesUserId.name}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {activity.notes && (
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                      <span className="font-semibold text-gray-700 block mb-2">Notes:</span>
                      <p className="text-gray-800 leading-relaxed">{activity.notes}</p>
                    </div>
                  )}
                </div>
              ))}
              {leadActivities.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClipboardList size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Yet</h3>
                  <p className="text-gray-500 mb-4">Start tracking lead activities by creating your first activity.</p>
                  <button
                    onClick={() => setIsActivityModalOpen(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add First Activity
                  </button>
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
        size="xl"
      >
        {lead && (
          <LeadActivityForm
            lead={lead}
            onSuccess={() => {
              setIsActivityModalOpen(false);
              fetchLeadDetails();
            }}
            onCancel={() => setIsActivityModalOpen(false)}
          />
        )}
      </Modal>




    </div>
  );
}