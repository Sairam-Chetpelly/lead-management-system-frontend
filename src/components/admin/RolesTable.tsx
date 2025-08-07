'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { authAPI } from '@/lib/auth';
import { downloadExcel } from '@/lib/exportUtils';
import Modal from '../Modal';
import { Search, FileSpreadsheet, Edit, Trash2 } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import PaginationFooter from '../PaginationFooter';
import { useDebounce } from '@/hooks/useDebounce';

interface Role {
  _id: string;
  name: string;
  slug: string;
}

export default function RolesTable() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const { pagination, setPagination, handlePageChange, handleLimitChange, resetPagination } = usePagination();
  const [formData, setFormData] = useState({ name: '', slug: '' });

  useEffect(() => {
    fetchRoles();
  }, [pagination.current, pagination.limit, debouncedSearch]);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authAPI.admin.getRoles({
        page: pagination.current,
        limit: pagination.limit,
        search: debouncedSearch
      });
      setRoles(response.data.data);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (error) {
      console.error('Error fetching roles:', error);
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
      if (editRole) {
        await authAPI.admin.updateRole(editRole._id, formData);
      } else {
        await authAPI.admin.createRole(formData);
      }
      resetForm();
      fetchRoles();
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await authAPI.admin.deleteRole(id);
      fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  const handleEdit = (role: Role) => {
    setEditRole(role);
    setFormData({ name: role.name, slug: role.slug });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', slug: '' });
    setEditRole(null);
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
            placeholder="Search roles..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
          />
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={async () => {
              try {
                const response = await authAPI.admin.exportRoles();
                downloadExcel(response.data, 'roles.xlsx');
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
            className="flex items-center space-x-3 px-4 lg:px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <div className="w-5 h-5">🎭</div>
            <span className="font-semibold">Add Role</span>
          </button>
        </div>
      </div>

      {/* Modern Table Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative flex flex-col" style={{minHeight: 'calc(100vh - 400px)'}}>
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 transition-opacity duration-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}
        
        {/* Desktop Table */}
        <div className="hidden lg:flex flex-col flex-1 min-h-0">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
            <div className="grid grid-cols-12 gap-4 px-6 py-4">
              <div className="col-span-5 text-left font-semibold text-sm uppercase tracking-wider">Role Name</div>
              <div className="col-span-4 text-left font-semibold text-sm uppercase tracking-wider">Identifier</div>
              <div className="col-span-3 text-left font-semibold text-sm uppercase tracking-wider">Actions</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              {roles.map((role, index) => (
                <div key={role._id} className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <div className="col-span-5 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                      🎭
                    </div>
                    <div className="text-slate-900 font-bold truncate">{role.name}</div>
                  </div>
                  <div className="col-span-4 flex items-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 truncate">
                      {role.slug}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center space-x-2">
                    <button onClick={() => handleEdit(role)} className="p-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDelete(role._id)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all">
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
            {roles.map((role) => (
              <div key={role._id} className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                      🎭
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{role.name}</div>
                      <div className="text-sm text-slate-600">{role.slug}</div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button onClick={() => handleEdit(role)} className="flex-1 flex items-center justify-center px-3 py-2 bg-indigo-100 text-indigo-700 rounded-xl font-medium text-sm">
                    <Edit size={16} className="mr-1" /> Edit
                  </button>
                  <button onClick={() => handleDelete(role._id)} className="flex-1 flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-xl font-medium text-sm">
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
          itemName="roles"
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editRole ? '🎭 Edit Role' : '✨ Add New Role'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Role Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-5 py-4 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              placeholder="Enter role name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Role Identifier</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({...formData, slug: e.target.value})}
              className="w-full px-5 py-4 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              placeholder="Enter role identifier (slug)"
              required
            />
          </div>
          <div className="flex space-x-4 pt-8">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {editRole ? '🎭 Update Role' : '✨ Create Role'}
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