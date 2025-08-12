'use client';

import { useState } from 'react';
import { authAPI } from '@/lib/auth';
import SimpleTable from '../common/SimpleTable';
import Modal from '../Modal';

interface Centre {
  _id: string;
  name: string;
  slug: string;
}

export default function CentresTableNew() {
  const [showModal, setShowModal] = useState(false);
  const [editCentre, setEditCentre] = useState<Centre | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });

  const columns = [
    {
      key: 'name',
      label: 'Centre Name',
      span: 5,
      render: (centre: Centre) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
            🏢
          </div>
          <div className="text-slate-900 font-bold truncate">{centre.name}</div>
        </div>
      )
    },
    {
      key: 'slug',
      label: 'Identifier',
      span: 5,
      render: (centre: Centre) => (
        <span className="inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 truncate">
          {centre.slug}
        </span>
      )
    }
  ];

  const filters = [
    {
      key: 'search',
      type: 'search' as const,
      placeholder: 'Search centres...',
      span: 2
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editCentre) {
        await authAPI.admin.updateCentre(editCentre._id, formData);
      } else {
        await authAPI.admin.createCentre(formData);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving centre:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', slug: '' });
    setEditCentre(null);
    setShowModal(false);
  };

  const handleEdit = (centre: Centre) => {
    setEditCentre(centre);
    setFormData({ name: centre.name, slug: centre.slug });
    setShowModal(true);
  };

  const handleExport = async () => {
    try {
      const response = await authAPI.admin.exportCentres();
      const { downloadCSV } = await import('@/lib/exportUtils');
      downloadCSV(response.data, 'centres.csv');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const mobileCardRender = (centre: Centre) => (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold">
          🏢
        </div>
        <div>
          <div className="font-bold text-slate-900">{centre.name}</div>
          <div className="text-sm text-slate-600">{centre.slug}</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <SimpleTable
        fetchFn={authAPI.admin.getCentres}
        columns={columns}
        filters={filters}
        itemName="centres"
        onAdd={() => setShowModal(true)}
        onEdit={handleEdit}
        onDelete={authAPI.admin.deleteCentre}
        onExport={handleExport}
        addLabel="Add Centre"
        addIcon={<div className="w-5 h-5">🏢</div>}
        mobileCardRender={mobileCardRender}
      />

      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editCentre ? '🏢 Edit Centre' : '✨ Add New Centre'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Centre Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-5 py-4 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              placeholder="Enter centre name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Centre Identifier</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({...formData, slug: e.target.value})}
              className="w-full px-5 py-4 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              placeholder="Enter centre identifier (slug)"
              required
            />
          </div>
          <div className="flex space-x-4 pt-8">
            <button
              type="submit"
              className="flex-1 text-white py-4 rounded-2xl hover:opacity-80 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
              style={{backgroundColor: '#0f172a'}}
            >
              {editCentre ? '🏢 Update Centre' : '✨ Create Centre'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 bg-slate-200 text-slate-700 py-4 rounded-2xl hover:bg-slate-300 transition-all duration-200 font-semibold text-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}