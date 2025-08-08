'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import Modal from '../Modal';
import { authAPI } from '@/lib/auth';

interface LeadActivity {
  _id: string;
  leadId: { _id: string; name: string };
  name: string;
  email: string;
  contactNumber: string;
  leadValue: 'high value' | 'medium value' | 'low value';
  paymentMethod: string;
  siteVisit: boolean;
  centerVisit: boolean;
  virtualMeeting: boolean;
  isCompleted: boolean;
  notes: string;
  createdAt: string;
}

interface LeadActivityFormData {
  leadId: string;
  name: string;
  email: string;
  contactNumber: string;
  presalesUserId: string;
  salesUserId: string;
  updatedPerson: string;
  leadStatusId: string;
  leadSubStatusId: string;
  languageId: string;
  sourceId: string;
  projectTypeId: string;
  projectValue: string;
  apartmentName: string;
  houseTypeId: string;
  expectedPossessionDate: string;
  leadValue: 'high value' | 'medium value' | 'low value' | '';
  paymentMethod: string;
  siteVisit: boolean;
  siteVisitDate: string;
  centerVisit: boolean;
  centerVisitDate: string;
  virtualMeeting: boolean;
  virtualMeetingDate: string;
  isCompleted: boolean;
  isCompletedDate: string;
  notes: string;
  centerId: string;
}

export default function LeadActivitiesTable() {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<LeadActivity | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [projectTypes, setProjectTypes] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [formData, setFormData] = useState<LeadActivityFormData>({
    leadId: '',
    name: '',
    email: '',
    contactNumber: '',
    presalesUserId: '',
    salesUserId: '',
    updatedPerson: '',
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
    fetchActivities();
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [leadsRes, usersRes, sourcesRes, statusesRes, typesRes, centersRes] = await Promise.all([
        authAPI.leads.getLeads(),
        authAPI.admin.getUsers(),
        authAPI.leads.getLeadSources(),
        authAPI.admin.getStatuses(),
        authAPI.leads.getProjectHouseTypes(),
        authAPI.admin.getCentres()
      ]);
      
      setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : leadsRes.data.data || []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || []);
      setSources(Array.isArray(sourcesRes.data) ? sourcesRes.data : sourcesRes.data.data || []);
      setStatuses(Array.isArray(statusesRes.data) ? statusesRes.data : statusesRes.data.data || []);
      setProjectTypes(Array.isArray(typesRes.data) ? typesRes.data : typesRes.data.data || []);
      setCenters(Array.isArray(centersRes.data) ? centersRes.data : centersRes.data.data || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await authAPI.leads.getLeadActivities();
      setActivities(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingActivity) {
        await authAPI.leads.updateLeadActivity(editingActivity._id, formData);
      } else {
        await authAPI.leads.createLeadActivity(formData);
      }
      fetchActivities();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving activity:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      try {
        await authAPI.leads.deleteLeadActivity(id);
        fetchActivities();
      } catch (error) {
        console.error('Error deleting activity:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      leadId: '',
      name: '',
      email: '',
      contactNumber: '',
      presalesUserId: '',
      salesUserId: '',
      updatedPerson: '',
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
    setEditingActivity(null);
  };

  const openModal = (activity?: LeadActivity) => {
    if (activity) {
      setEditingActivity(activity);
      setFormData({
        leadId: activity.leadId._id,
        name: activity.name || '',
        email: activity.email || '',
        contactNumber: activity.contactNumber || '',
        presalesUserId: '',
        salesUserId: '',
        updatedPerson: '',
        leadStatusId: '',
        leadSubStatusId: '',
        languageId: '',
        sourceId: '',
        projectTypeId: '',
        projectValue: '',
        apartmentName: '',
        houseTypeId: '',
        expectedPossessionDate: '',
        leadValue: activity.leadValue || '',
        paymentMethod: activity.paymentMethod || '',
        siteVisit: activity.siteVisit || false,
        siteVisitDate: '',
        centerVisit: activity.centerVisit || false,
        centerVisitDate: '',
        virtualMeeting: activity.virtualMeeting || false,
        virtualMeetingDate: '',
        isCompleted: activity.isCompleted || false,
        isCompletedDate: '',
        notes: activity.notes || '',
        centerId: ''
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lead Activities Management</h1>
        <button
          onClick={() => openModal()}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
        >
          <Plus size={20} />
          Add Activity
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <tr key={activity._id}>
                <td className="px-6 py-4 whitespace-nowrap">{activity.leadId?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{activity.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{activity.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs ${
                    activity.leadValue === 'high value' ? 'bg-red-100 text-red-800' :
                    activity.leadValue === 'medium value' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {activity.leadValue}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs ${
                    activity.isCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.isCompleted ? 'Completed' : 'In Progress'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => openModal(activity)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(activity._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingActivity ? 'Edit Activity' : 'Add Activity'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <select
              value={formData.leadId}
              onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Lead</option>
              {leads && leads.map ? leads.map(lead => (
                <option key={lead._id} value={lead._id}>{lead.name}</option>
              )) : null}
            </select>
            <select
              value={formData.sourceId}
              onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Source</option>
              {sources && sources.map ? sources.map(source => (
                <option key={source._id} value={source._id}>{source.name}</option>
              )) : null}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Contact Number"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <select
              value={formData.presalesUserId}
              onChange={(e) => setFormData({ ...formData, presalesUserId: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Presales User</option>
              {users && users.map ? users.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              )) : null}
            </select>
            <select
              value={formData.salesUserId}
              onChange={(e) => setFormData({ ...formData, salesUserId: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Sales User</option>
              {users && users.map ? users.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              )) : null}
            </select>
            <select
              value={formData.leadStatusId}
              onChange={(e) => setFormData({ ...formData, leadStatusId: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Lead Status</option>
              {statuses && statuses.filter ? statuses.filter(s => s.type === 'leadStatus').map(status => (
                <option key={status._id} value={status._id}>{status.name}</option>
              )) : null}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select
              value={formData.projectTypeId}
              onChange={(e) => setFormData({ ...formData, projectTypeId: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Project Type</option>
              {projectTypes && projectTypes.filter ? projectTypes.filter(t => t.type === 'project').map(type => (
                <option key={type._id} value={type._id}>{type.name}</option>
              )) : null}
            </select>
            <select
              value={formData.houseTypeId}
              onChange={(e) => setFormData({ ...formData, houseTypeId: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select House Type</option>
              {projectTypes && projectTypes.filter ? projectTypes.filter(t => t.type === 'house').map(type => (
                <option key={type._id} value={type._id}>{type.name}</option>
              )) : null}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Project Value"
              value={formData.projectValue}
              onChange={(e) => setFormData({ ...formData, projectValue: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Apartment Name"
              value={formData.apartmentName}
              onChange={(e) => setFormData({ ...formData, apartmentName: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select
              value={formData.leadValue}
              onChange={(e) => setFormData({ ...formData, leadValue: e.target.value as any })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Lead Value</option>
              <option value="high value">High Value</option>
              <option value="medium value">Medium Value</option>
              <option value="low value">Low Value</option>
            </select>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              placeholder="Expected Possession Date"
              value={formData.expectedPossessionDate || ''}
              onChange={(e) => setFormData({ ...formData, expectedPossessionDate: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isCompleted}
                  onChange={(e) => setFormData({ ...formData, isCompleted: e.target.checked })}
                  className="mr-2"
                />
                Completed
              </label>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={formData.siteVisit}
                  onChange={(e) => setFormData({ ...formData, siteVisit: e.target.checked })}
                  className="mr-2"
                />
                Site Visit
              </label>
              {formData.siteVisit && (
                <input
                  type="date"
                  value={formData.siteVisitDate}
                  onChange={(e) => setFormData({ ...formData, siteVisitDate: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              )}
            </div>
            <div>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={formData.centerVisit}
                  onChange={(e) => setFormData({ ...formData, centerVisit: e.target.checked })}
                  className="mr-2"
                />
                Center Visit
              </label>
              {formData.centerVisit && (
                <input
                  type="date"
                  value={formData.centerVisitDate}
                  onChange={(e) => setFormData({ ...formData, centerVisitDate: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              )}
            </div>
            <div>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={formData.virtualMeeting}
                  onChange={(e) => setFormData({ ...formData, virtualMeeting: e.target.checked })}
                  className="mr-2"
                />
                Virtual Meeting
              </label>
              {formData.virtualMeeting && (
                <input
                  type="date"
                  value={formData.virtualMeetingDate}
                  onChange={(e) => setFormData({ ...formData, virtualMeetingDate: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              )}
            </div>
          </div>
          <select
            value={formData.centerId}
            onChange={(e) => setFormData({ ...formData, centerId: e.target.value })}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Center</option>
            {centers && centers.map ? centers.map(center => (
              <option key={center._id} value={center._id}>{center.name}</option>
            )) : null}
          </select>
          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              {editingActivity ? 'Update Activity' : 'Create Activity'}
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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