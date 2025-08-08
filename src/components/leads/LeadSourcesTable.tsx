'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import Modal from '../Modal';
import { authAPI } from '@/lib/auth';

interface LeadSource {
  _id: string;
  name: string;
  slug: string;
  description: string;
  isApiSource: boolean;
  createdAt: string;
}

interface LeadSourceFormData {
  name: string;
  slug: string;
  description: string;
  isApiSource: boolean;
}

export default function LeadSourcesTable() {
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<LeadSource | null>(null);
  const [formData, setFormData] = useState<LeadSourceFormData>({
    name: '',
    slug: '',
    description: '',
    isApiSource: false
  });

  useEffect(() => {
    fetchLeadSources();
  }, []);

  const fetchLeadSources = async () => {
    try {
      const response = await authAPI.leads.getLeadSources();
      setLeadSources(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (error) {
      console.error('Error fetching lead sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSource) {
        await authAPI.leads.updateLeadSource(editingSource._id, formData);
      } else {
        await authAPI.leads.createLeadSource(formData);
      }
      fetchLeadSources();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving lead source:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this lead source?')) {
      try {
        await authAPI.leads.deleteLeadSource(id);
        fetchLeadSources();
      } catch (error) {
        console.error('Error deleting lead source:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      isApiSource: false
    });
    setEditingSource(null);
  };

  const openModal = (source?: LeadSource) => {
    if (source) {
      setEditingSource(source);
      setFormData({
        name: source.name,
        slug: source.slug,
        description: source.description,
        isApiSource: source.isApiSource
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
        <button
          onClick={() => openModal()}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
        >
          <Plus size={20} />
          Add Lead Source
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">API Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leadSources.map((source) => (
              <tr key={source._id}>
                <td className="px-6 py-4 whitespace-nowrap">{source.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{source.slug}</td>
                <td className="px-6 py-4">{source.description}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs ${source.isApiSource ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {source.isApiSource ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => openModal(source)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(source._id)}
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
        title={editingSource ? 'Edit Lead Source' : 'Add Lead Source'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
            required
          />
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isApiSource}
              onChange={(e) => setFormData({ ...formData, isApiSource: e.target.checked })}
              className="mr-2"
            />
            Is API Source
          </label>
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              {editingSource ? 'Update Source' : 'Create Source'}
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