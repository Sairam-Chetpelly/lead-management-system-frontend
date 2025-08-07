'use client';

import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/auth';

interface TableItem {
  _id: string;
  name: string;
  slug: string;
  code?: string;
}

interface AdminTablesProps {
  user: any;
}

export default function AdminTables({ user }: AdminTablesProps) {
  const [activeTab, setActiveTab] = useState('roles');
  const [data, setData] = useState<TableItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<TableItem | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', code: '' });

  const tabs = [
    { id: 'roles', name: 'Roles' },
    { id: 'centres', name: 'Centres' },
    { id: 'languages', name: 'Languages' },
    { id: 'statuses', name: 'Statuses' }
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      let response;
      switch (activeTab) {
        case 'roles':
          response = await authAPI.admin.getRoles();
          break;
        case 'centres':
          response = await authAPI.admin.getCentres();
          break;
        case 'languages':
          response = await authAPI.admin.getLanguages();
          break;
        case 'statuses':
          response = await authAPI.admin.getStatuses();
          break;
      }
      setData(response?.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editItem) {
        switch (activeTab) {
          case 'roles':
            await authAPI.admin.updateRole(editItem._id, formData);
            break;
          case 'centres':
            await authAPI.admin.updateCentre(editItem._id, formData);
            break;
          case 'languages':
            await authAPI.admin.updateLanguage(editItem._id, formData);
            break;
          case 'statuses':
            await authAPI.admin.updateStatus(editItem._id, formData);
            break;
        }
      } else {
        switch (activeTab) {
          case 'roles':
            await authAPI.admin.createRole(formData);
            break;
          case 'centres':
            await authAPI.admin.createCentre(formData);
            break;
          case 'languages':
            await authAPI.admin.createLanguage(formData);
            break;
          case 'statuses':
            await authAPI.admin.createStatus(formData);
            break;
        }
      }
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      switch (activeTab) {
        case 'roles':
          await authAPI.admin.deleteRole(id);
          break;
        case 'centres':
          await authAPI.admin.deleteCentre(id);
          break;
        case 'languages':
          await authAPI.admin.deleteLanguage(id);
          break;
        case 'statuses':
          await authAPI.admin.deleteStatus(id);
          break;
      }
      fetchData();
    } catch (error) {
      console.error('Error deleting data:', error);
    }
  };

  const handleEdit = (item: TableItem) => {
    setEditItem(item);
    setFormData({ name: item.name, slug: item.slug, code: item.code || '' });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ name: '', slug: '', code: '' });
    setEditItem(null);
    setShowForm(false);
  };

  if (user.role !== 'admin') {
    return <div className="p-8 text-center">Access denied. Admin only.</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Admin Tables Management</h2>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Add/Edit Form */}
      <div className="mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : `Add ${tabs.find(t => t.id === activeTab)?.name.slice(0, -1)}`}
        </button>

        {showForm && (
          <div className="mt-4 bg-white p-4 border rounded-lg">
            <h3 className="text-lg font-medium mb-4">
              {editItem ? 'Edit' : 'Add'} {tabs.find(t => t.id === activeTab)?.name.slice(0, -1)}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              {activeTab === 'languages' && (
                <div>
                  <input
                    type="text"
                    placeholder="Code (e.g., en, hi)"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
              )}
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  {editItem ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              {activeTab === 'languages' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.slug}
                </td>
                {activeTab === 'languages' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.code}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}