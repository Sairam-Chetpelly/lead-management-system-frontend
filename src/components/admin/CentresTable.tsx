'use client';

import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/auth';
import { downloadExcel } from '@/lib/exportUtils';
import Modal from '../Modal';
import { Search, FileSpreadsheet, Edit, Trash2 } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import PaginationFooter from '../PaginationFooter';
import { useDebounce } from '@/hooks/useDebounce';

interface Centre {
  _id: string;
  name: string;
  slug: string;
}

export default function CentresTable() {
  const [centres, setCentres] = useState<Centre[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editCentre, setEditCentre] = useState<Centre | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const { pagination, setPagination, handlePageChange, handleLimitChange, resetPagination } = usePagination();
  const [formData, setFormData] = useState({ name: '', slug: '' });

  useEffect(() => {
    fetchCentres();
  }, [pagination.current, pagination.limit, debouncedSearch]);

  const fetchCentres = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authAPI.admin.getCentres({
        page: pagination.current,
        limit: pagination.limit,
        search: debouncedSearch
      });
      setCentres(response.data.data);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (error) {
      console.error('Error fetching centres:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.limit, debouncedSearch, setPagination]);
  
  const handleSearchChange = (value: string) => {
    setSearch(value);
    resetPagination();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editCentre) {
        await authAPI.admin.updateCentre(editCentre._id, formData);
      } else {
        await authAPI.admin.createCentre(formData);
      }
      resetForm();
      fetchCentres();
    } catch (error) {
      console.error('Error saving centre:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await authAPI.admin.deleteCentre(id);
      fetchCentres();
    } catch (error) {
      console.error('Error deleting centre:', error);
    }
  };

  const handleEdit = (centre: Centre) => {
    setEditCentre(centre);
    setFormData({ name: centre.name, slug: centre.slug });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', slug: '' });
    setEditCentre(null);
    setShowModal(false);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Search */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search centres..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
          />
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={async () => {
              try {
                const response = await authAPI.admin.exportCentres();
                downloadExcel(response.data, 'centres.xlsx');
              } catch (error) {
                console.error('Export failed:', error);
              }
            }}
            className="flex items-center space-x-3 px-4 lg:px-6 py-3 bg-white/80 backdrop-blur-sm border border-emerald-200 rounded-2xl hover:bg-emerald-50 transition-all duration-300 shadow-lg hover:shadow-xl group"
          >
            <FileSpreadsheet size={20} className="text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-emerald-700 font-semibold hidden sm:inline">Export</span>
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-3 px-4 lg:px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-2xl hover:from-green-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <div className="w-5 h-5">🏢</div>
            <span className="font-semibold">Add Centre</span>
          </button>
        </div>
      </div>

      {/* Modern Table Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative flex flex-col h-[600px]">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 transition-opacity duration-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        )}
        
        {/* Desktop Table */}
        <div className="hidden lg:flex flex-col flex-1 min-h-0">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
            <div className="grid grid-cols-12 gap-4 px-6 py-4">
              <div className="col-span-5 text-left font-semibold text-sm uppercase tracking-wider">Centre Name</div>
              <div className="col-span-4 text-left font-semibold text-sm uppercase tracking-wider">Identifier</div>
              <div className="col-span-3 text-left font-semibold text-sm uppercase tracking-wider">Actions</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              {centres.map((centre, index) => (
                <div key={centre._id} className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 hover:bg-gradient-to-r hover:from-green-50 hover:to-teal-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <div className="col-span-5 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                      🏢
                    </div>
                    <div className="text-slate-900 font-bold truncate">{centre.name}</div>
                  </div>
                  <div className="col-span-4 flex items-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 truncate">
                      {centre.slug}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center space-x-2">
                    <button onClick={() => handleEdit(centre)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDelete(centre._id)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Mobile Cards */}
        <div className="lg:hidden flex-1 overflow-y-auto p-4">
          <div className={`space-y-4 transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {centres.map((centre) => (
              <div key={centre._id} className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
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
                <div className="flex space-x-2 mt-4">
                  <button onClick={() => handleEdit(centre)} className="flex-1 flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded-xl font-medium text-sm">
                    <Edit size={16} className="mr-1" /> Edit
                  </button>
                  <button onClick={() => handleDelete(centre._id)} className="flex-1 flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-xl font-medium text-sm">
                    <Trash2 size={16} className="mr-1" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <PaginationFooter 
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          itemName="centres"
        />
      </div>

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
              className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 rounded-2xl hover:from-green-700 hover:to-teal-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
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
    </div>
  );
}