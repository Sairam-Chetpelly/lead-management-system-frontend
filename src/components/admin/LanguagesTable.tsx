'use client';

import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/auth';
import { usePagination } from '@/hooks/usePagination';
import Modal from '../Modal';
import ModernLoader from '../ModernLoader';
import PaginationFooter from '../PaginationFooter';
import { Search, FileSpreadsheet, Edit, Trash2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/contexts/ToastContext';
import DeleteDialog from '../DeleteDialog';

interface Language {
  _id: string;
  name: string;
  slug: string;
  code: string;
}

export default function LanguagesTable() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editLanguage, setEditLanguage] = useState<Language | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const { pagination, handlePageChange, handleLimitChange, updatePagination } = usePagination({ initialLimit: 10 });
  const [formData, setFormData] = useState({ name: '', slug: '', code: '' });
  const { showToast } = useToast();
  const [deleteDialog, setDeleteDialog] = useState<{isOpen: boolean, id: string, name: string}>({isOpen: false, id: '', name: ''});

  useEffect(() => {
    fetchLanguages();
  }, [pagination.current, pagination.limit, debouncedSearch, updatePagination]);

  const fetchLanguages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authAPI.admin.getLanguages({
        page: pagination.current,
        limit: pagination.limit,
        search: debouncedSearch
      });
      setLanguages(response.data.data);
      updatePagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching languages:', error);
      showToast('Failed to fetch languages', 'error');
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
      if (editLanguage) {
        await authAPI.admin.updateLanguage(editLanguage._id, formData);
      } else {
        await authAPI.admin.createLanguage(formData);
      }
      showToast(editLanguage ? 'Language updated successfully' : 'Language created successfully', 'success');
      resetForm();
      fetchLanguages();
    } catch (error) {
      console.error('Error saving language:', error);
      showToast('Failed to save language', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await authAPI.admin.deleteLanguage(deleteDialog.id);
      showToast('Language deleted successfully', 'success');
      fetchLanguages();
    } catch (error) {
      console.error('Error deleting language:', error);
      showToast('Failed to delete language', 'error');
    } finally {
      setDeleteDialog({isOpen: false, id: '', name: ''});
    }
  };

  const handleEdit = (language: Language) => {
    setEditLanguage(language);
    setFormData({ name: language.name, slug: language.slug, code: language.code });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', slug: '', code: '' });
    setEditLanguage(null);
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
            placeholder="Search languages..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
          />
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={async () => {
              try {
                const response = await authAPI.admin.exportLanguages();
                const { downloadCSV } = await import('@/lib/exportUtils');
                downloadCSV(response.data, 'languages.csv');
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
            <div className="w-5 h-5">🌐</div>
            <span className="font-semibold">Add Language</span>
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
              <div className="col-span-4 text-left font-semibold text-sm uppercase tracking-wider">Language Name</div>
              <div className="col-span-3 text-left font-semibold text-sm uppercase tracking-wider">Identifier</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Code</div>
              <div className="col-span-3 text-left font-semibold text-sm uppercase tracking-wider">Actions</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              {languages.map((language, index) => (
                <div 
                  key={language._id} 
                  className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-200 animate-fadeInUp ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="col-span-4 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                      🌐
                    </div>
                    <div className="text-slate-900 font-bold truncate">{language.name}</div>
                  </div>
                  <div className="col-span-3 flex items-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 truncate">
                      {language.slug}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-xl text-sm font-bold bg-cyan-100 text-cyan-800 font-mono truncate">
                      {language.code}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center space-x-2">
                    <button onClick={() => handleEdit(language)} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all">
                      <Edit size={14} />
                    </button>
                    {/* <button onClick={() => handleDelete(language._id)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all">
                      <Trash2 size={14} />
                    </button> */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Mobile Cards */}
        <div className="lg:hidden flex-1 overflow-y-auto scrollbar-hide p-4">
          <div className={`space-y-4 transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {languages.map((language, index) => (
              <div 
                key={language._id} 
                className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100 animate-fadeInUp"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold">
                      🌐
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{language.name}</div>
                      <div className="text-sm text-slate-600">{language.slug} • {language.code}</div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button onClick={() => handleEdit(language)} className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium text-sm">
                    <Edit size={16} className="mr-1" /> Edit
                  </button>
                  <button onClick={() => setDeleteDialog({isOpen: true, id: language._id, name: language.name})} className="flex-1 flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-xl font-medium text-sm">
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
          itemName="languages"
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editLanguage ? '🌐 Edit Language' : '✨ Add New Language'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Language Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-5 py-4 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              placeholder="Enter language name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Language Identifier</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({...formData, slug: e.target.value})}
              className="w-full px-5 py-4 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              placeholder="Enter language identifier (slug)"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Language Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value})}
              className="w-full px-5 py-4 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium font-mono"
              placeholder="e.g., en, hi, ta, fr"
              required
            />
          </div>
          <div className="flex space-x-4 pt-8">
            <button
              type="submit"
              className="flex-1 text-white py-4 rounded-2xl hover:opacity-80 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
              style={{backgroundColor: '#0f172a'}}
            >
              {editLanguage ? '🌐 Update Language' : '✨ Create Language'}
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
        title="Delete Language"
        message={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({isOpen: false, id: '', name: ''})}
      />
    </div>
  );
}