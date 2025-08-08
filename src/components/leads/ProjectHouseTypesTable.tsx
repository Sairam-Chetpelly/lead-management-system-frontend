'use client';

import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Plus, Search, ChevronLeft, ChevronRight, Filter, FileSpreadsheet } from 'lucide-react';
import Modal from '../Modal';
import { authAPI } from '@/lib/auth';
import { useDebounce } from '@/hooks/useDebounce';

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
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ProjectHouseType | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10
  });
  const [filters, setFilters] = useState({
    search: '',
    type: ''
  });
  const debouncedFilters = useDebounce(filters, 300);
  const [formData, setFormData] = useState<ProjectHouseTypeFormData>({
    name: '',
    type: 'project',
    description: ''
  });

  useEffect(() => {
    fetchTypes();
  }, [pagination.current, pagination.limit, debouncedFilters]);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authAPI.leads.getProjectHouseTypes({
        page: pagination.current,
        limit: pagination.limit,
        ...debouncedFilters
      });
      setTypes(Array.isArray(response.data) ? response.data : response.data.data || []);
      if (response.data.pagination) {
        setPagination(prev => ({ ...prev, ...response.data.pagination }));
      }
    } catch (error) {
      console.error('Error fetching types:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.limit, debouncedFilters]);
  
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };
  
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, current: page }));
  };
  
  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, current: 1 }));
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

  if (loading) return <div className="flex items-center justify-center h-64"><div>Loading...</div></div>;

  return (
    <div className="p-4 lg:p-8 space-y-6 min-h-full">
      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
        <div className={`md:hidden ${showFilters ? 'mb-4' : ''}`}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium text-sm hover:bg-blue-200 transition-all"
          >
            <Filter size={16} />
            <span>Filters</span>
          </button>
        </div>
        
        <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative lg:col-span-2">
              <Search size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search types..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              />
            </div>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            >
              <option value="">All Types</option>
              <option value="project">Project</option>
              <option value="house">House</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={async () => {
              try {
                const response = await authAPI.leads.exportProjectHouseTypes();
                const { downloadCSV } = await import('@/lib/exportUtils');
                downloadCSV(response.data, 'project-house-types.csv');
              } catch (error) {
                console.error('Export failed:', error);
                alert('Export failed. Please try again.');
              }
            }}
            className="flex items-center space-x-3 px-4 lg:px-6 py-3 bg-white/80 backdrop-blur-sm border border-emerald-200 rounded-2xl hover:bg-emerald-50 transition-all duration-300 shadow-lg hover:shadow-xl group"
          >
            <FileSpreadsheet size={20} className="text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-emerald-700 font-semibold hidden sm:inline">Export</span>
          </button>
          <button 
            onClick={() => openModal()}
            className="flex items-center space-x-3 px-4 lg:px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus size={20} />
            <span className="font-semibold">Add Type</span>
          </button>
        </div>
      </div>

      {/* Modern Table Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative flex flex-col" style={{minHeight: 'calc(100vh - 400px)'}}>
        {/* Desktop Table */}
        <div className="hidden lg:flex flex-col flex-1 min-h-0">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
            <div className="grid grid-cols-12 gap-4 px-6 py-4">
              <div className="col-span-3 text-left font-semibold text-sm uppercase tracking-wider">Name</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Type</div>
              <div className="col-span-4 text-left font-semibold text-sm uppercase tracking-wider">Description</div>
              <div className="col-span-1 text-left font-semibold text-sm uppercase tracking-wider">Created</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Actions</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div>
              {types.map((type, index) => (
                <div key={type._id} className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <div className="col-span-3 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                      🏠
                    </div>
                    <div className="text-slate-900 font-bold truncate">{type.name}</div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold capitalize ${
                      type.type === 'project' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {type.type}
                    </span>
                  </div>
                  <div className="col-span-4 flex items-center">
                    <span className="text-slate-600 text-sm truncate">{type.description}</span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className="text-slate-500 text-xs">
                      {new Date(type.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center space-x-1">
                    <button onClick={() => openModal(type)} className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(type._id)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all">
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
          <div className="space-y-4">
            {types.map((type) => (
              <div key={type._id} className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                      🏠
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{type.name}</div>
                      <div className="text-sm text-slate-600 capitalize">{type.type}</div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize ${
                    type.type === 'project' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {type.type}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Description:</span> {type.description}</div>
                  <div><span className="font-medium">Created:</span> {new Date(type.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button onClick={() => openModal(type)} className="flex-1 flex items-center justify-center px-3 py-2 bg-purple-100 text-purple-700 rounded-xl font-medium text-sm">
                    <Pencil size={16} className="mr-1" /> Edit
                  </button>
                  <button onClick={() => handleDelete(type._id)} className="flex-1 flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-xl font-medium text-sm">
                    <Trash2 size={16} className="mr-1" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Enhanced Footer */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 px-4 lg:px-8 py-6 flex-shrink-0">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center space-x-4">
              <select 
                value={pagination.limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-slate-600 font-medium text-sm lg:text-base">Records per page</span>
            </div>
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              <span className="text-slate-600 font-medium text-sm lg:text-base">
                Showing {((pagination.current - 1) * pagination.limit) + 1}-{Math.min(pagination.current * pagination.limit, pagination.total)} of {pagination.total} types
              </span>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handlePageChange(pagination.current - 1)}
                  disabled={pagination.current === 1}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let startPage = Math.max(1, pagination.current - 2);
                  if (startPage + 4 > pagination.pages) {
                    startPage = Math.max(1, pagination.pages - 4);
                  }
                  const page = startPage + i;
                  if (page > pagination.pages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 shadow-sm text-sm font-medium ${
                        pagination.current === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                }).filter(Boolean)}
                <button 
                  onClick={() => handlePageChange(pagination.current + 1)}
                  disabled={pagination.current === pagination.pages}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
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