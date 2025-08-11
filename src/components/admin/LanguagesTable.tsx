'use client';

import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/auth';

import Modal from '../Modal';
import ModernLoader from '../ModernLoader';
import { Search, FileSpreadsheet, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

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
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10
  });
  
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, current: page }));
  };
  
  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, current: 1 }));
  };
  
  const resetPagination = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
  };
  const [formData, setFormData] = useState({ name: '', slug: '', code: '' });

  useEffect(() => {
    fetchLanguages();
  }, [pagination.current, pagination.limit, debouncedSearch]);

  const fetchLanguages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authAPI.admin.getLanguages({
        page: pagination.current,
        limit: pagination.limit,
        search: debouncedSearch
      });
      setLanguages(response.data.data);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (error) {
      console.error('Error fetching languages:', error);
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
      if (editLanguage) {
        await authAPI.admin.updateLanguage(editLanguage._id, formData);
      } else {
        await authAPI.admin.createLanguage(formData);
      }
      resetForm();
      fetchLanguages();
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await authAPI.admin.deleteLanguage(id);
      fetchLanguages();
    } catch (error) {
      console.error('Error deleting language:', error);
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
                alert('Export failed. Please try again.');
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
          <div className="flex-1 overflow-y-auto custom-scrollbar">
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
                    <button onClick={() => handleDelete(language._id)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Mobile Cards */}
        <div className="lg:hidden flex-1 overflow-y-auto custom-scrollbar p-4">
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
                  <button onClick={() => handleDelete(language._id)} className="flex-1 flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-xl font-medium text-sm">
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
                Showing {((pagination.current - 1) * pagination.limit) + 1}-{Math.min(pagination.current * pagination.limit, pagination.total)} of {pagination.total} languages
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
                  const page = Math.max(1, Math.min(pagination.current - 2 + i, pagination.pages - 4 + i));
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 shadow-sm text-sm font-medium ${
                        pagination.current === page
                          ? 'text-white'
                          : 'bg-white border border-slate-300 hover:bg-slate-50'
                      }`}
                      style={pagination.current === page ? {backgroundColor: '#0f172a'} : {}}
                    >
                      {page}
                    </button>
                  );
                })}
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
    </div>
  );
}