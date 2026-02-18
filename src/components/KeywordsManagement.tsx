'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tags, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { keywordService } from '@/services/keywordService';
import { useToast } from '@/contexts/ToastContext';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import PaginationFooter from './PaginationFooter';
import ModernLoader from './ModernLoader';
import DeleteDialog from './DeleteDialog';
import Modal from './Modal';

export default function KeywordsManagement() {
  const [keywords, setKeywords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [keywordName, setKeywordName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'usageCount'>('usageCount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean, id: string, name: string }>({ isOpen: false, id: '', name: '' });
  const { showToast } = useToast();
  const { pagination, handlePageChange, handleLimitChange, updatePagination } = usePagination({ initialLimit: 10 });
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    fetchKeywords();
  }, [pagination.current, pagination.limit, debouncedSearch, sortBy, sortOrder]);

  const fetchKeywords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await keywordService.getAllKeywords({
        page: pagination.current,
        limit: pagination.limit,
        search: debouncedSearch,
        sortBy,
        sortOrder
      });
      
      if (response.keywords) {
        setKeywords(response.keywords);
        if (response.pagination) {
          updatePagination(response.pagination);
        }
      } else {
        setKeywords(Array.isArray(response) ? response : []);
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to load keywords', 'error');
      setKeywords([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.limit, debouncedSearch, sortBy, sortOrder, updatePagination]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywordName.trim()) {
      showToast('Keyword name is required', 'error');
      return;
    }

    try {
      if (editingId) {
        await keywordService.updateKeyword(editingId, { name: keywordName });
        showToast('Keyword updated successfully', 'success');
      } else {
        await keywordService.createKeyword({ name: keywordName });
        showToast('Keyword created successfully', 'success');
      }
      setShowModal(false);
      setKeywordName('');
      setEditingId(null);
      fetchKeywords();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to save keyword', 'error');
    }
  };

  const handleEdit = (keyword: any) => {
    setEditingId(keyword._id);
    setKeywordName(keyword.name);
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await keywordService.deleteKeyword(deleteDialog.id);
      showToast('Keyword deleted successfully', 'success');
      fetchKeywords();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to delete keyword';
      showToast(errorMessage, 'error');
    } finally {
      setDeleteDialog({ isOpen: false, id: '', name: '' });
    }
  };

  const resetForm = () => {
    setKeywordName('');
    setEditingId(null);
    setShowModal(false);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 min-h-full">
      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            />
          </div>
          <button
            onClick={() => setSearchTerm('')}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-2xl font-medium text-sm hover:bg-gray-200 transition-all"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={() => {
            setEditingId(null);
            setKeywordName('');
            setShowModal(true);
          }}
          className="flex items-center space-x-3 px-4 lg:px-6 py-3 text-white rounded-2xl hover:opacity-80 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          style={{ backgroundColor: '#0f172a' }}
        >
          <Plus size={20} />
          <span className="font-semibold">New Keyword</span>
        </button>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'usageCount')}
            className="px-3 py-2 bg-white/80 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
          >
            <option value="usageCount">Usage Count</option>
            <option value="name">Name</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="px-3 py-2 bg-white/80 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative flex flex-col" style={{ minHeight: 'calc(100vh - 400px)' }}>
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
            <ModernLoader size="lg" variant="primary" />
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden md:flex flex-col flex-1 min-h-0">
          <div className="text-white" style={{ backgroundColor: '#0f172a' }}>
            <div className="grid grid-cols-12 gap-4 px-6 py-4">
              <div className="col-span-6 text-left font-semibold text-xs uppercase tracking-wider">Keyword</div>
              <div className="col-span-3 text-left font-semibold text-xs uppercase tracking-wider">Usage Count</div>
              <div className="col-span-3 text-left font-semibold text-xs uppercase tracking-wider">Actions</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              {keywords.map((keyword) => (
                <div key={keyword._id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">
                  <div className="col-span-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Tags size={20} className="text-white" />
                    </div>
                    <span className="font-semibold text-slate-900">{keyword.name}</span>
                  </div>
                  <div className="col-span-3 flex items-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-blue-100 text-blue-800">
                      {keyword.usageCount}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(keyword)}
                      className="p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-all"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteDialog({ isOpen: true, id: keyword._id, name: keyword.name })}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden flex-1 overflow-y-auto p-4">
          <div className={`space-y-4 transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {keywords.map((keyword) => (
              <div key={keyword._id} className="rounded-2xl p-4 shadow-lg border border-slate-100 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center">
                      <Tags size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{keyword.name}</div>
                      <div className="text-sm text-slate-600">Used {keyword.usageCount} times</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleEdit(keyword)}
                    className="flex items-center justify-center px-3 py-2 bg-orange-100 text-orange-700 rounded-lg font-medium text-sm"
                  >
                    <Edit2 size={14} className="mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteDialog({ isOpen: true, id: keyword._id, name: keyword.name })}
                    className="flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-lg font-medium text-sm"
                  >
                    <Trash2 size={14} className="mr-1" /> Delete
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
          itemName="keywords"
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingId ? '🏷️ Edit Keyword' : '✨ Add New Keyword'}
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Keyword Name <span className="text-xs text-red-500">*</span></label>
            <input
              type="text"
              value={keywordName}
              onChange={(e) => setKeywordName(e.target.value)}
              className="w-full px-5 py-4 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              placeholder="Enter keyword name"
              required
              autoFocus
            />
          </div>
          <div className="flex space-x-4 pt-8">
            <button
              type="submit"
              className="flex-1 text-white py-4 rounded-2xl hover:opacity-80 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
              style={{backgroundColor: '#0f172a'}}
            >
              {editingId ? '🏷️ Update Keyword' : '✨ Create Keyword'}
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
        title="Delete Keyword"
        message={`Are you sure you want to delete keyword "${deleteDialog.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: '', name: '' })}
      />
    </div>
  );
}
