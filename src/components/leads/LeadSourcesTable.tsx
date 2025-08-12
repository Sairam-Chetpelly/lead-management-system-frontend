'use client';

import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Plus, Search, FileSpreadsheet, Filter, Waypoints } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import Modal from '../Modal';
import ModernLoader from '../ModernLoader';
import PaginationFooter from '../PaginationFooter';
import { authAPI } from '@/lib/auth';
import { useDebounce } from '@/hooks/useDebounce';

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
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination and filters
  const { pagination, handlePageChange, handleLimitChange, updatePagination } = usePagination({ initialLimit: 10 });
  const [filters, setFilters] = useState({
    search: '',
    isApiSource: ''
  });
  const debouncedFilters = useDebounce(filters, 300);
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
  }, [pagination.current, pagination.limit, debouncedFilters]);

  const fetchLeadSources = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authAPI.leads.getLeadSources({
        page: pagination.current,
        limit: pagination.limit,
        ...debouncedFilters
      });
      setLeadSources(Array.isArray(response.data) ? response.data : response.data.data || []);
      if (response.data.pagination) {
        updatePagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching lead sources:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.limit, debouncedFilters]);

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

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    handlePageChange(1);
  };

  if (loading && leadSources.length === 0) return <div className="flex items-center justify-center h-64"><ModernLoader size="lg" variant="primary" /></div>;

  return (
    <div className="p-4 lg:p-8 space-y-6 min-h-full">
      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
        {/* Mobile Filter Button */}
        <div className={`md:hidden ${showFilters ? 'mb-4' : ''}`}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium text-sm hover:bg-blue-200 transition-all"
          >
            <Filter size={16} />
            <span>Filters</span>
          </button>
        </div>
        
        {/* Filter Controls */}
        <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative lg:col-span-2">
              <Search size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search lead sources..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              />
            </div>
            <select
              value={filters.isApiSource}
              onChange={(e) => handleFilterChange('isApiSource', e.target.value)}
              className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            >
              <option value="">All Types</option>
              <option value="true">API Sources</option>
              <option value="false">Manual Sources</option>
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
                const response = await authAPI.leads.exportLeadSources();
                const { downloadCSV } = await import('@/lib/exportUtils');
                downloadCSV(response.data, 'lead-sources.csv');
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
            className="flex items-center space-x-3 px-4 lg:px-6 py-3 text-white rounded-2xl hover:opacity-80 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            style={{backgroundColor: '#0f172a'}}
          >
            <Plus size={20} />
            <span className="font-semibold">Add Lead Source</span>
          </button>
        </div>
      </div>

      {/* Modern Table Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative flex flex-col" style={{minHeight: 'calc(100vh - 400px)'}}>
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 transition-opacity duration-200">
            <ModernLoader size="lg" variant="primary" />
          </div>
        )}
        
        {/* Desktop Table */}
        <div className="hidden lg:flex flex-col flex-1 min-h-0">
          <div className="text-white" style={{backgroundColor: '#0f172a'}}>
            <div className="grid grid-cols-12 gap-4 px-6 py-4">
              <div className="col-span-3 text-left font-semibold text-sm uppercase tracking-wider">Source Name</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Identifier</div>
              <div className="col-span-4 text-left font-semibold text-sm uppercase tracking-wider">Description</div>
              <div className="col-span-1 text-left font-semibold text-sm uppercase tracking-wider">Type</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Actions</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              {leadSources.map((source, index) => (
                <div key={source._id} className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 animate-stagger ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`} style={{animationDelay: `${index * 0.05}s`}}>
                  <div className="col-span-3 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                    <Waypoints size={24} className="text-white" />
                    </div>
                    <div className="text-slate-900 font-bold truncate">{source.name}</div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 truncate">
                      {source.slug}
                    </span>
                  </div>
                  <div className="col-span-4 flex items-center">
                    <span className="text-slate-600 text-sm truncate">{source.description}</span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${
                      source.isApiSource ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {source.isApiSource ? 'API' : 'Manual'}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center space-x-1">
                    <button onClick={() => openModal(source)} className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all">
                      <Pencil size={14} />
                    </button>
                    {/* <button onClick={() => handleDelete(source._id)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all">
                      <Trash2 size={14} />
                    </button> */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Mobile Cards */}
        <div className="lg:hidden flex-1 overflow-y-auto p-4">
          <div className={`space-y-4 transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {leadSources.map((source) => (
              <div key={source._id} className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                      📊
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{source.name}</div>
                      <div className="text-sm text-slate-600">{source.slug}</div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                    source.isApiSource ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {source.isApiSource ? 'API' : 'Manual'}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Description:</span> {source.description}</div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button onClick={() => openModal(source)} className="flex-1 flex items-center justify-center px-3 py-2 bg-purple-100 text-purple-700 rounded-xl font-medium text-sm">
                    <Pencil size={16} className="mr-1" /> Edit
                  </button>
                  <button onClick={() => handleDelete(source._id)} className="flex-1 flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-xl font-medium text-sm">
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
          itemName="sources"
        />
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
              className="text-white px-6 py-3 rounded-lg font-semibold hover:opacity-80 hover:shadow-lg transition-all duration-300"
              style={{backgroundColor: '#0f172a'}}
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