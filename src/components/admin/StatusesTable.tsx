'use client';

import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/auth';
import { usePagination } from '@/hooks/usePagination';
import Modal from '../Modal';
import ModernLoader from '../ModernLoader';
import PaginationFooter from '../PaginationFooter';
import { Search, FileSpreadsheet, Activity, Edit, Trash2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/contexts/ToastContext';
import DeleteDialog from '../DeleteDialog';
import { downloadCSV } from '@/lib/exportUtils';

interface Status {
  _id: string;
  type: 'status' | 'leadStatus' | 'leadSubStatus';
  name: string;
  slug: string;
  description: string;
}

export default function StatusesTable() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editStatus, setEditStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const { pagination, handlePageChange, handleLimitChange, updatePagination } = usePagination({ initialLimit: 10 });
  const [formData, setFormData] = useState<{ type: '' | 'status' | 'leadStatus' | 'leadSubStatus', name: string, slug: string, description: string }>({ type: '', name: '', slug: '', description: '' });
  const { showToast } = useToast();
  const [deleteDialog, setDeleteDialog] = useState<{isOpen: boolean, id: string, name: string}>({isOpen: false, id: '', name: ''});

  useEffect(() => {
    fetchStatuses();
  }, [pagination.current, pagination.limit, debouncedSearch, updatePagination]);

  const fetchStatuses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authAPI.admin.getStatuses({
        page: pagination.current,
        limit: pagination.limit,
        search: debouncedSearch
      });
      console.log('Statuses response:', response.data);
      const data = response.data.data || response.data;
      console.log('Extracted data:', data);
      const statusesArray = Array.isArray(data) ? data : (data?.statuses || data?.statuss || []);
      console.log('Statuses array:', statusesArray);
      setStatuses(statusesArray);
      updatePagination(data?.pagination || response.data.pagination);
    } catch (error) {
      console.error('Error fetching statuses:', error);
      showToast('Failed to fetch statuses', 'error');
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.limit, debouncedSearch, updatePagination]);
  
  const handleSearchChange = (value: string) => {
    setSearch(value);
    handlePageChange(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editStatus) {
        await authAPI.admin.updateStatus(editStatus._id, formData);
      } else {
        await authAPI.admin.createStatus(formData);
      }
      showToast(editStatus ? 'Status updated successfully' : 'Status created successfully', 'success');
      resetForm();
      fetchStatuses();
    } catch (error: any) {
      console.error('Error saving status:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to save status';
      showToast(errorMessage, 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await authAPI.admin.deleteStatus(deleteDialog.id);
      showToast('Status deleted successfully', 'success');
      fetchStatuses();
    } catch (error: any) {
      console.error('Error deleting status:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to delete status';
      showToast(errorMessage, 'error');
    } finally {
      setDeleteDialog({isOpen: false, id: '', name: ''});
    }
  };

  const handleEdit = (status: Status) => {
    setEditStatus(status);
    setFormData({ type: status.type, name: status.name, slug: status.slug, description: status.description });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ type: '', name: '', slug: '', description: '' });
    setEditStatus(null);
    setShowModal(false);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 min-h-full">
      {/* Search */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search statuses..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
          />
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={async () => {
              try {
                const response = await authAPI.admin.exportStatuses();
                // downloadCSV imported at top
                const exportData = response.data.data || response.data;
                if (!exportData || (Array.isArray(exportData) && exportData.length === 0)) {
                  showToast('No data to export', 'error');
                  return;
                }
                downloadCSV(exportData, 'statuses.csv');
              } catch (error) {
                console.error('Export failed:', error);
                showToast('Export failed. Please try again.', 'error');
              }
            }}
            className="flex items-center space-x-3 px-4 lg:px-6 py-3 bg-white/80 backdrop-blur-sm border border-emerald-200 rounded-2xl hover:bg-emerald-50 transition-all duration-300 shadow-lg hover:shadow-xl group"
          >
            <FileSpreadsheet size={20} className="text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-emerald-700 font-semibold hidden sm:inline">Export</span>
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-3 px-4 lg:px-6 py-3 text-white rounded-2xl hover:opacity-80 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            style={{backgroundColor: '#0f172a'}}
          >
            <div className="w-5 h-5">
              <Activity size={20} className="text-white" />
            </div>
            <span className="font-semibold">Add Status</span>
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
              <div className="col-span-3 text-left font-semibold text-sm uppercase tracking-wider">Name</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Slug</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Type</div>
              <div className="col-span-3 text-left font-semibold text-sm uppercase tracking-wider">Description</div>
              {/* <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Actions</div> */}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              {statuses.map((status, index) => (
                <div 
                  key={status._id} 
                  className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-200 animate-fadeInUp ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="col-span-3 flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                      <Activity size={16} />
                    </div>
                    <div className="text-slate-900 font-bold truncate">{status.name}</div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 truncate">
                      {status.slug}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      status.type === 'leadStatus' ? 'bg-blue-100 text-blue-800' :
                      status.type === 'leadSubStatus' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {status.type}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center">
                    <span className="text-slate-600 text-sm truncate">{status.description}</span>
                  </div>
                  {/* <div className="col-span-2 flex items-center space-x-2">
                    <button onClick={() => handleEdit(status)} className="p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-all">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => setDeleteDialog({isOpen: true, id: status._id, name: status.name})} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div> */}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Mobile Cards */}
        <div className="lg:hidden flex-1 overflow-y-auto scrollbar-hide p-4">
          <div className={`space-y-4 transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {statuses.map((status, index) => (
              <div 
                key={status._id} 
                className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100 animate-fadeInUp"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-600 rounded-xl flex items-center justify-center text-white font-bold">
                      📊
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{status.name}</div>
                      <div className="text-sm text-slate-600">{status.slug}</div>
                    </div>
                  </div>
                </div>
                {/* <div className="flex space-x-2 mt-4">
                  <button onClick={() => handleEdit(status)} className="flex-1 flex items-center justify-center px-3 py-2 bg-orange-100 text-orange-700 rounded-xl font-medium text-sm">
                    <Edit size={16} className="mr-1" /> Edit
                  </button>
                  <button onClick={() => setDeleteDialog({isOpen: true, id: status._id, name: status.name})} className="flex-1 flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-xl font-medium text-sm">
                    <Trash2 size={16} className="mr-1" /> Delete
                  </button>
                </div> */}
              </div>
            ))}
          </div>
        </div>

        <PaginationFooter
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          itemName="statuses"
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editStatus ? '📊 Edit Status' : '✨ Add New Status'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Status Type <span className="text-xs text-red-500">*</span></label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as any})}
              className="w-full px-5 py-4 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              required
            >
              <option value="" disabled>Select Status Type</option>
              <option value="status">Status</option>
              <option value="leadStatus">Lead Status</option>
              <option value="leadSubStatus">Lead Sub Status</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Status Name <span className="text-xs text-red-500">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-5 py-4 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              placeholder="Enter status name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Status Identifier <span className="text-xs text-red-500">*</span></label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({...formData, slug: e.target.value})}
              className="w-full px-5 py-4 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              placeholder="Enter status identifier (slug)"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Description <span className="text-xs text-red-500">*</span></label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-5 py-4 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              placeholder="Enter status description"
              rows={3}
              required
            />
          </div>
          <div className="flex space-x-4 pt-8">
            <button
              type="submit"
              className="flex-1 text-white py-4 rounded-2xl hover:opacity-80 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
              style={{backgroundColor: '#0f172a'}}
            >
              {editStatus ? '📊 Update Status' : '✨ Create Status'}
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

      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Status"
        message={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({isOpen: false, id: '', name: ''})}
      />
    </div>
  );
}