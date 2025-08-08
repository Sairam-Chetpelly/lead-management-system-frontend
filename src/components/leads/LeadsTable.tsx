'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Plus, Phone, Eye } from 'lucide-react';
import Modal from '../Modal';
import { authAPI } from '@/lib/auth';

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

interface LeadFormData {
  name: string;
  contactNumber: string;
  email: string;
  sourceId: string;
  salesUserId: string;
  presalesUserId: string;
  leadStatusId: string;
  centerId: string;
  alternateContactNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  occupation?: string;
  company?: string;
  designation?: string;
  annualIncome?: string;
  leadSource?: string;
  referredBy?: string;
  notes?: string;
}

interface LeadsTableProps {
  onViewLead?: (leadId: string) => void;
}

export default function LeadsTable({ onViewLead }: LeadsTableProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    contactNumber: '',
    email: '',
    sourceId: '',
    salesUserId: '',
    presalesUserId: '',
    leadStatusId: '',
    centerId: '',
    alternateContactNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    occupation: '',
    company: '',
    designation: '',
    annualIncome: '',
    leadSource: '',
    referredBy: '',
    notes: ''
  });

  useEffect(() => {
    fetchLeads();
    fetchDropdownData();
  }, []);

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

  const fetchLeads = async () => {
    try {
      const response = await authAPI.leads.getLeads();
      setLeads(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

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
      sourceId: '',
      salesUserId: '',
      presalesUserId: '',
      leadStatusId: '',
      centerId: '',
      alternateContactNumber: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      occupation: '',
      company: '',
      designation: '',
      annualIncome: '',
      leadSource: '',
      referredBy: '',
      notes: ''
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
        salesUserId: lead.salesUserId._id,
        presalesUserId: lead.presalesUserId._id,
        leadStatusId: lead.leadStatusId._id,
        centerId: lead.centerId?._id || '',
        alternateContactNumber: (lead as any).alternateContactNumber || '',
        address: (lead as any).address || '',
        city: (lead as any).city || '',
        state: (lead as any).state || '',
        pincode: (lead as any).pincode || '',
        occupation: (lead as any).occupation || '',
        company: (lead as any).company || '',
        designation: (lead as any).designation || '',
        annualIncome: (lead as any).annualIncome || '',
        leadSource: (lead as any).leadSource || '',
        referredBy: (lead as any).referredBy || '',
        notes: (lead as any).notes || ''
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCall = async (leadId: string) => {
    try {
      await authAPI.leads.createCallLog({ leadId: leadId });
      alert('Call log created successfully!');
    } catch (error) {
      console.error('Error creating call log:', error);
      alert('Error creating call log');
    }
  };

  const openViewPage = (leadId: string) => {
    console.log('Opening view for lead:', leadId, 'onViewLead callback:', !!onViewLead);
    if (onViewLead) {
      onViewLead(leadId);
    } else {
      router.push(`/leads/${leadId}`);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => openModal()}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
        >
          <Plus size={20} />
          Add Lead
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-blue-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Lead ID</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Source</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <tr key={lead._id} className="hover:bg-blue-50/50 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-bold text-blue-600">{lead.leadId || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{lead.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600">{lead.contactNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {lead.sourceId?.name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    {lead.leadStatusId?.name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleCall(lead._id)}
                    className="text-green-600 hover:text-green-800 mr-2 p-2 hover:bg-green-100 rounded-lg transition-colors"
                    title="Make Call"
                  >
                    <Phone size={16} />
                  </button>
                  <button
                    onClick={() => openViewPage(lead._id)}
                    className="text-purple-600 hover:text-purple-800 mr-2 p-2 hover:bg-purple-100 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => openModal(lead)}
                    className="text-blue-600 hover:text-blue-800 mr-2 p-2 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(lead._id)}
                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete"
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
        title={editingLead ? 'Edit Lead' : 'Add Lead'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="text"
              placeholder="Contact Number"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="text"
              placeholder="Alternate Contact Number"
              value={formData.alternateContactNumber}
              onChange={(e) => setFormData({ ...formData, alternateContactNumber: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Address Information */}
          <textarea
            placeholder="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
          />
          
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Pincode"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Professional Information */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Occupation"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Designation"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Annual Income"
              value={formData.annualIncome}
              onChange={(e) => setFormData({ ...formData, annualIncome: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Lead Information */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Lead Source Details"
              value={formData.leadSource}
              onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Referred By"
              value={formData.referredBy}
              onChange={(e) => setFormData({ ...formData, referredBy: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Assignments */}
          <div className="grid grid-cols-3 gap-4">
            <select
              value={formData.sourceId}
              onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Source</option>
              {sources && sources.map ? sources.map(source => (
                <option key={source._id} value={source._id}>{source.name}</option>
              )) : null}
            </select>
            <select
              value={formData.salesUserId}
              onChange={(e) => setFormData({ ...formData, salesUserId: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Sales User</option>
              {users && users.map ? users.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              )) : null}
            </select>
            <select
              value={formData.presalesUserId}
              onChange={(e) => setFormData({ ...formData, presalesUserId: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Presales User</option>
              {users && users.map ? users.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              )) : null}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <select
              value={formData.leadStatusId}
              onChange={(e) => setFormData({ ...formData, leadStatusId: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Lead Status</option>
              {statuses && statuses.filter ? statuses.filter(s => s.type === 'leadStatus').map(status => (
                <option key={status._id} value={status._id}>{status.name}</option>
              )) : null}
            </select>
            <select
              value={formData.centerId}
              onChange={(e) => setFormData({ ...formData, centerId: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Center</option>
              {centers && centers.map ? centers.map(center => (
                <option key={center._id} value={center._id}>{center.name}</option>
              )) : null}
            </select>
          </div>

          {/* Notes */}
          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              {editingLead ? 'Update Lead' : 'Create Lead'}
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