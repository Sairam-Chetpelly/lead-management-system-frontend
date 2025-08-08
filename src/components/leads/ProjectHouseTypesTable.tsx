'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import Modal from '../Modal';
import { authAPI } from '@/lib/auth';

interface ProjectHouseType {
  _id: string;
  name: string;
  type: 'project' | 'house';
  description: string;
  createdAt: string;
}

interface ProjectHouseTypeFormData {
  name: string;
  type: 'project' | 'house';
  description: string;
}

export default function ProjectHouseTypesTable() {
  const [types, setTypes] = useState<ProjectHouseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ProjectHouseType | null>(null);
  const [formData, setFormData] = useState<ProjectHouseTypeFormData>({
    name: '',
    type: 'project',
    description: ''
  });

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const response = await authAPI.leads.getProjectHouseTypes();
      setTypes(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (error) {
      console.error('Error fetching types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingType) {
        await authAPI.leads.updateProjectHouseType(editingType._id, formData);
      } else {
        await authAPI.leads.createProjectHouseType(formData);
      }
      fetchTypes();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving type:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this type?')) {
      try {
        await authAPI.leads.deleteProjectHouseType(id);
        fetchTypes();
      } catch (error) {
        console.error('Error deleting type:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'project',
      description: ''
    });
    setEditingType(null);
  };

  const openModal = (type?: ProjectHouseType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        type: type.type,
        description: type.description
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
        <h1 className="text-2xl font-bold">Project & House Types Management</h1>
        <button
          onClick={() => openModal()}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
        >
          <Plus size={20} />
          Add Type
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {types.map((type) => (
              <tr key={type._id}>
                <td className="px-6 py-4 whitespace-nowrap">{type.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs capitalize ${
                    type.type === 'project' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {type.type}
                  </span>
                </td>
                <td className="px-6 py-4">{type.description}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(type.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => openModal(type)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(type._id)}
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
        title={editingType ? 'Edit Type' : 'Add Type'}
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
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'project' | 'house' })}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="project">Project</option>
            <option value="house">House</option>
          </select>
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
            required
          />
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              {editingType ? 'Update Type' : 'Create Type'}
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