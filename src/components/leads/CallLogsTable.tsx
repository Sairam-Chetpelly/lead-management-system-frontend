'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import Modal from '../Modal';
import { authAPI } from '@/lib/auth';

interface CallLog {
  _id: string;
  userId: { _id: string; name: string };
  leadId: { _id: string; name: string };
  dateTime: string;
  createdAt: string;
}

interface CallLogFormData {
  userId: string;
  leadId: string;
  dateTime: string;
}

export default function CallLogsTable() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<CallLog | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [formData, setFormData] = useState<CallLogFormData>({
    userId: '',
    leadId: '',
    dateTime: ''
  });

  useEffect(() => {
    fetchCallLogs();
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [usersRes, leadsRes] = await Promise.all([
        authAPI.admin.getUsers(),
        authAPI.leads.getLeads()
      ]);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || []);
      setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : leadsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const fetchCallLogs = async () => {
    try {
      const response = await authAPI.leads.getCallLogs();
      setCallLogs(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (error) {
      console.error('Error fetching call logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLog) {
        await authAPI.leads.updateCallLog(editingLog._id, formData);
      } else {
        await authAPI.leads.createCallLog(formData);
      }
      fetchCallLogs();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving call log:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this call log?')) {
      try {
        await authAPI.leads.deleteCallLog(id);
        fetchCallLogs();
      } catch (error) {
        console.error('Error deleting call log:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      leadId: '',
      dateTime: ''
    });
    setEditingLog(null);
  };

  const openModal = (log?: CallLog) => {
    if (log) {
      setEditingLog(log);
      setFormData({
        userId: log.userId._id,
        leadId: log.leadId._id,
        dateTime: log.dateTime ? new Date(log.dateTime).toISOString().slice(0, 16) : ''
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
        <h1 className="text-2xl font-bold">Call Logs Management</h1>
        <button
          onClick={() => openModal()}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
        >
          <Plus size={20} />
          Add Call Log
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {callLogs.map((log) => (
              <tr key={log._id}>
                <td className="px-6 py-4 whitespace-nowrap">{log.userId?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{log.leadId?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {log.dateTime ? new Date(log.dateTime).toLocaleString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => openModal(log)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(log._id)}
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
        title={editingLog ? 'Edit Call Log' : 'Add Call Log'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={formData.userId}
            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select User</option>
            {users && users.map ? users.map(user => (
              <option key={user._id} value={user._id}>{user.name}</option>
            )) : null}
          </select>
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
          <input
            type="datetime-local"
            value={formData.dateTime}
            onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
            className="w-full p-2 border rounded"
          />
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              {editingLog ? 'Update Call Log' : 'Create Call Log'}
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