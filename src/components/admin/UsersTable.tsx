'use client';

import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/auth';
import { usePagination } from '@/hooks/usePagination';
import Modal from '../Modal';
import ModernLoader from '../ModernLoader';
import PaginationFooter from '../PaginationFooter';
import { Search, FileSpreadsheet, Eye, Edit, Trash2, Filter, Camera } from 'lucide-react';
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
  const { pagination, handlePageChange, handleLimitChange, updatePagination } = usePagination({ initialLimit: 10 });
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
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
      updatePagination(response.data.pagination);
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
    handlePageChange(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let userId;
      if (editUser) {
        await authAPI.updateUser(editUser._id, formData);
        userId = editUser._id;
      } else {
        const response = await authAPI.createUser(formData);
        userId = response.data._id;
      }
      
      // Upload profile image if selected
      if (profileImage && userId) {
        await authAPI.uploadProfileImage(userId, profileImage);
      }
      
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleEdit = (user: User) => {
    setEditUser(user);
    const selectedRole = roles.find(r => r._id === user.roleId._id);
    const mainBranch = centres.find(c => c.name.toLowerCase().includes('main'));
    
    setFormData({
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      password: '',
      designation: user.designation,
      roleId: user.roleId._id || '',
      statusId: user.statusId._id || '',
      centreId: selectedRole && ['admin', 'hod_presales', 'manager_presales', 'presales_agent'].includes(selectedRole.slug) && mainBranch
        ? mainBranch._id
        : user.centreId?._id || '',
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
    setProfileImage(null);
    setImagePreview(null);
    setShowModal(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
              } catch (error: any) {
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
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
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
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              {users.map((user, index) => (
                <div key={user._id} className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 animate-stagger ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`} style={{animationDelay: `${index * 0.05}s`}}>
                  <div className="col-span-2 flex items-center space-x-3">
                    {user.profileImage ? (
                      <img 
                        src={`http://localhost:5000/api/users/profile-image/${user.profileImage}`}
                        alt={user.name}
                        className="w-10 h-10 rounded-xl object-cover shadow-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                        {user.name.charAt(0)}
                      </div>
                    )}
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
                    {/* <button onClick={() => handleDelete(user._id)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all">
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
            {users.map((user) => (
              <div key={user._id} className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {user.profileImage ? (
                      <img 
                        src={`http://localhost:5000/api/users/profile-image/${user.profileImage}`}
                        alt={user.name}
                        className="w-12 h-12 rounded-xl object-cover shadow-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0)}
                      </div>
                    )}
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

        <PaginationFooter
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          itemName="users"
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editUser ? '✏️ Edit User' : '➕ Add New User'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs mr-2">👤</span>
              Personal Information
            </h4>
            
            {/* Profile Image Upload */}
            <div className="mb-6 flex flex-col items-center">
              <div className="relative">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Profile preview" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : editUser?.profileImage ? (
                  <img 
                    src={`http://localhost:5000/api/users/profile-image/${editUser.profileImage}`}
                    alt="Current profile" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-lg">
                    {formData.name.charAt(0) || '?'}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                  <Camera size={16} />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-600 mt-2">Click camera icon to upload profile image</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
                <input
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter mobile number"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password {editUser ? <span className="text-gray-500 text-xs">(leave blank to keep current)</span> : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs mr-2">🔐</span>
              Role & Access
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Role *</label>
                <select
                  value={formData.roleId}
                  onChange={(e) => {
                    const selectedRole = roles.find(r => r._id === e.target.value);
                    const mainBranch = centres.find(c => c.name.toLowerCase().includes('main'));
                    
                    setFormData({
                      ...formData, 
                      roleId: e.target.value,
                      centreId: selectedRole && ['admin', 'hod_presales', 'manager_presales', 'presales_agent'].includes(selectedRole.slug) && mainBranch
                        ? mainBranch._id
                        : ''
                    });
                  }}
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
                  disabled={(() => {
                    const selectedRole = roles.find(r => r._id === formData.roleId);
                    return selectedRole && ['admin', 'hod_presales', 'manager_presales', 'presales_agent'].includes(selectedRole.slug);
                  })()}
                  className={`w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium ${
                    (() => {
                      const selectedRole = roles.find(r => r._id === formData.roleId);
                      return selectedRole && ['admin', 'hod_presales', 'manager_presales', 'presales_agent'].includes(selectedRole.slug)
                        ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                        : 'bg-white'
                    })()
                  }`}
                >
                  <option value="">Select Centre</option>
                  {(() => {
                    const selectedRole = roles.find(r => r._id === formData.roleId);
                    const isRestrictedRole = selectedRole && ['admin', 'hod_presales', 'manager_presales', 'presales_agent'].includes(selectedRole.slug);
                    
                    if (isRestrictedRole) {
                      return centres.map(centre => (
                        <option key={centre._id} value={centre._id}>{centre.name}</option>
                      ));
                    } else {
                      return centres.filter(centre => !centre.name.toLowerCase().includes('main')).map(centre => (
                        <option key={centre._id} value={centre._id}>{centre.name}</option>
                      ));
                    }
                  })()}
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
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs mr-2">🌐</span>
              Languages
            </h4>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Select Languages</label>
              
              {/* Available Languages */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 max-h-48 overflow-y-auto scrollbar-hide">
                <div className="text-sm font-medium text-slate-600 mb-3">Available Languages:</div>
                <div className="flex flex-wrap gap-2">
                  {languages.filter(lang => !formData.languageIds.includes(lang._id)).map(language => (
                    <button
                      key={language._id}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          languageIds: [...prev.languageIds, language._id]
                        }));
                      }}
                      className="inline-flex items-center px-3 py-2 rounded-xl text-sm bg-slate-100 hover:bg-green-100 text-slate-700 hover:text-green-800 border border-slate-200 hover:border-green-300 transition-all duration-200 cursor-pointer"
                    >
                      <span className="mr-2">+</span>
                      {language.name}
                    </button>
                  ))}
                  {languages.filter(lang => !formData.languageIds.includes(lang._id)).length === 0 && (
                    <span className="text-slate-400 text-sm italic">All languages selected</span>
                  )}
                </div>
              </div>
              
              {/* Selected Languages */}
              {formData.languageIds.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-slate-600 mb-3">Selected Languages:</div>
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
                            className="ml-3 text-green-600 hover:text-green-800 font-bold transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 text-white py-3 px-6 rounded-lg hover:opacity-90 transition-all font-medium flex items-center justify-center"
              style={{backgroundColor: '#0f172a'}}
            >
              {editUser ? 'Update User' : 'Create User'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-all font-medium flex items-center justify-center"
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