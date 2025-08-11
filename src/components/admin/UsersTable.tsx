'use client';

import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/auth';

import Modal from '../Modal';
import ModernLoader from '../ModernLoader';
import { Search, ChevronLeft, ChevronRight, FileSpreadsheet, Eye, Edit, Trash2, Filter } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface User {
  _id: string;
  userId?: string;
  name: string;
  email: string;
  mobileNumber: string;
  designation: string;
  roleId: { _id: string; name: string; slug: string };
  statusId: { _id: string; name: string; slug: string };
  centreId?: { _id: string; name: string };
  languageIds?: { _id: string; name: string }[];
  qualification: string;
}

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [centres, setCentres] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination and filters
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10
  });
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    centre: ''
  });
  const debouncedFilters = useDebounce(filters, 300);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    password: '',
    designation: '',
    roleId: '',
    statusId: '',
    centreId: '',
    languageIds: [] as string[],
    qualification: 'high_value'
  });

  useEffect(() => {
    fetchUsers();
    fetchDropdownData();
  }, [pagination.current, pagination.limit, debouncedFilters]);
  
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authAPI.getUsers({
        page: pagination.current,
        limit: pagination.limit,
        ...debouncedFilters
      });
      setUsers(response.data.data);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.limit, debouncedFilters]);
  
  const fetchDropdownData = async () => {
    try {
      const [rolesRes, statusesRes, centresRes, languagesRes] = await Promise.all([
        authAPI.admin.getAllRoles(),
        authAPI.admin.getAllStatuses(),
        authAPI.admin.getAllCentres(),
        authAPI.admin.getAllLanguages()
      ]);
      
      setRoles(rolesRes.data.data);
      setStatuses(statusesRes.data.data);
      setCentres(centresRes.data.data);
      setLanguages(languagesRes.data.data);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

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
      if (editUser) {
        await authAPI.updateUser(editUser._id, formData);
      } else {
        await authAPI.createUser(formData);
      }
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleEdit = (user: User) => {
    setEditUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      password: '',
      designation: user.designation,
      roleId: user.roleId._id || '',
      statusId: user.statusId._id || '',
      centreId: user.centreId?._id || '',
      languageIds: user.languageIds?.map(lang => lang._id) || [],
      qualification: user.qualification
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      mobileNumber: '',
      password: '',
      designation: '',
      roleId: '',
      statusId: '',
      centreId: '',
      languageIds: [],
      qualification: 'high_value'
    });
    setEditUser(null);
    setShowModal(false);
  };

  const handleView = (user: User) => {
    setViewUser(user);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await authAPI.deleteUser(id);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };


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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative lg:col-span-2">
              <Search size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              />
            </div>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role._id} value={role._id}>{role.name}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={status._id} value={status._id}>{status.name}</option>
              ))}
            </select>
            <select
              value={filters.centre}
              onChange={(e) => handleFilterChange('centre', e.target.value)}
              className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            >
              <option value="">All Centres</option>
              {centres.map(centre => (
                <option key={centre._id} value={centre._id}>{centre.name}</option>
              ))}
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
                const response = await authAPI.exportUsers();
                const { downloadCSV } = await import('@/lib/exportUtils');
                downloadCSV(response.data, 'users.csv');
              } catch (error) {
                console.error('Export failed:', error);
                alert(`Export failed: ${error.response?.data?.error || error.message}`);
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
            <div className="w-5 h-5">➕</div>
            <span className="font-semibold">Add User</span>
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
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">User</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Contact</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Centre</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Languages</div>
              <div className="col-span-1 text-left font-semibold text-sm uppercase tracking-wider">Role</div>
              <div className="col-span-1 text-left font-semibold text-sm uppercase tracking-wider">Status</div>
              <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Actions</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              {users.map((user, index) => (
                <div key={user._id} className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 animate-stagger ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`} style={{animationDelay: `${index * 0.05}s`}}>
                  <div className="col-span-2 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-slate-900 font-bold truncate">{user.name}</div>
                      <div className="text-slate-600 text-sm truncate">{user.userId || 'N/A'}</div>
                      <div className="text-slate-500 text-xs truncate">{user.designation}</div>
                    </div>
                  </div>
                  <div className="col-span-2 flex flex-col justify-center min-w-0">
                    <div className="text-slate-700 font-medium truncate">{user.email}</div>
                    <div className="text-slate-500 text-sm truncate">{user.mobileNumber}</div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 truncate">
                      {user.centreId?.name || '--'}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <div className="flex flex-wrap gap-1">
                      {user.languageIds?.slice(0, 2).map(lang => (
                        <span key={lang._id} className="inline-flex px-2 py-1 text-xs font-semibold rounded-lg bg-blue-100 text-blue-700">
                          {lang.name}
                        </span>
                      )) || <span className="text-gray-400 text-xs">--</span>}
                      {user.languageIds && user.languageIds.length > 2 && (
                        <span className="text-xs text-gray-500">+{user.languageIds.length - 2}</span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800 truncate">
                      {user.roleId.name}
                    </span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${
                      user.statusId.slug === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-1 ${
                        user.statusId.slug === 'active' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      {user.statusId.name}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center space-x-1">
                    <button onClick={() => handleView(user)} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all">
                      <Eye size={14} />
                    </button>
                    <button onClick={() => handleEdit(user)} className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDelete(user._id)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all">
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
            {users.map((user) => (
              <div key={user._id} className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{user.name}</div>
                      <div className="text-sm text-slate-600">{user.userId || 'N/A'}</div>
                      <div className="text-xs text-slate-500">{user.designation}</div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                    user.statusId.slug === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.statusId.name}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Email:</span> {user.email}</div>
                  <div><span className="font-medium">Mobile:</span> {user.mobileNumber}</div>
                  <div><span className="font-medium">Role:</span> {user.roleId.name}</div>
                  <div><span className="font-medium">Centre:</span> {user.centreId?.name || '--'}</div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button onClick={() => handleView(user)} className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium text-sm">
                    <Eye size={16} className="mr-1" /> View
                  </button>
                  <button onClick={() => handleEdit(user)} className="flex-1 flex items-center justify-center px-3 py-2 bg-purple-100 text-purple-700 rounded-xl font-medium text-sm">
                    <Edit size={16} className="mr-1" /> Edit
                  </button>
                  <button onClick={() => handleDelete(user._id)} className="flex-1 flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-xl font-medium text-sm">
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
                Showing {((pagination.current - 1) * pagination.limit) + 1}-{Math.min(pagination.current * pagination.limit, pagination.total)} of {pagination.total} users
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
        title={editUser ? '✏️ Edit User' : '➕ Add New User'}
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100">
            <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm mr-3">👤</span>
              Personal Information
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Mobile Number *</label>
                <input
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
                  placeholder="Enter mobile number"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Password {editUser ? <span className="text-slate-500 text-xs">(leave blank to keep current)</span> : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
                  placeholder="Enter password"
                  required={!editUser}
                />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-3">Designation *</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({...formData, designation: e.target.value})}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
                  placeholder="Enter designation"
                  required
                />
              </div>
            </div>
          </div>

          {/* Role & Access Section */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100">
            <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm mr-3">🔐</span>
              Role & Access
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Role *</label>
                <select
                  value={formData.roleId}
                  onChange={(e) => setFormData({...formData, roleId: e.target.value})}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
                  required
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role._id} value={role._id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Status *</label>
                <select
                  value={formData.statusId}
                  onChange={(e) => setFormData({...formData, statusId: e.target.value})}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
                  required
                >
                  <option value="">Select Status</option>
                  {statuses.filter(status => status.type === 'status').map(status => (
                    <option key={status._id} value={status._id}>{status.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Centre</label>
                <select
                  value={formData.centreId}
                  onChange={(e) => setFormData({...formData, centreId: e.target.value})}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
                >
                  <option value="">Select Centre</option>
                  {centres.map(centre => (
                    <option key={centre._id} value={centre._id}>{centre.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Qualification *</label>
                <select
                  value={formData.qualification}
                  onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
                  required
                >
                  <option value="high_value">High Value</option>
                  <option value="low_value">Low Value</option>
                </select>
              </div>
            </div>
          </div>

          {/* Languages Section */}
          <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-2xl border border-green-100">
            <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm mr-3">🌐</span>
              Languages
            </h4>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Select Languages</label>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value && !formData.languageIds.includes(e.target.value)) {
                    setFormData(prev => ({
                      ...prev,
                      languageIds: [...prev.languageIds, e.target.value]
                    }));
                  }
                }}
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium mb-4"
              >
                <option value="">Add Language</option>
                {languages.filter(lang => !formData.languageIds.includes(lang._id)).map(language => (
                  <option key={language._id} value={language._id}>{language.name}</option>
                ))}
              </select>
              
              {formData.languageIds.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {formData.languageIds.map(langId => {
                    const language = languages.find(l => l._id === langId);
                    return (
                      <span key={langId} className="inline-flex items-center px-4 py-2 rounded-2xl text-sm bg-white border border-green-200 text-green-800 shadow-sm">
                        <span className="mr-2">🌐</span>
                        {language?.name}
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            languageIds: prev.languageIds.filter(id => id !== langId)
                          }))}
                          className="ml-3 text-green-600 hover:text-green-800 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200">
            <button
              type="submit"
              className="flex-1 text-white py-4 px-8 rounded-2xl hover:opacity-80 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
              style={{backgroundColor: '#0f172a'}}
            >
              {editUser ? '✏️ Update User' : '✨ Create User'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 bg-slate-200 text-slate-700 py-4 px-8 rounded-2xl hover:bg-slate-300 transition-all duration-200 font-semibold text-lg flex items-center justify-center"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* View User Modal */}
      <Modal
        isOpen={!!viewUser}
        onClose={() => setViewUser(null)}
        title="User Details"
      >
        {viewUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-sm text-gray-900">{viewUser.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{viewUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Mobile</label>
                <p className="text-sm text-gray-900">{viewUser.mobileNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Designation</label>
                <p className="text-sm text-gray-900">{viewUser.designation}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="text-sm text-gray-900">{viewUser.roleId.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="text-sm text-gray-900">{viewUser.statusId.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Centre</label>
                <p className="text-sm text-gray-900">{viewUser.centreId?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Qualification</label>
                <p className="text-sm text-gray-900">{viewUser.qualification}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Languages</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {viewUser.languageIds?.map(lang => (
                  <span key={lang._id} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {lang.name}
                  </span>
                )) || <span className="text-gray-400 text-sm">None</span>}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}