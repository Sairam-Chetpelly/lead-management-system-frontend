'use client';

import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/auth';
import AccessControl from './AccessControl';

interface DashboardProps {
  user: any;
}

export default function Dashboard({ user }: DashboardProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRoles: 0,
    totalCentres: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [usersRes, rolesRes, centresRes] = await Promise.all([
        authAPI.getUsers({ limit: 1 }),
        authAPI.admin.getAllRoles(),
        authAPI.admin.getAllCentres()
      ]);
      
      setStats({
        totalUsers: usersRes.data.pagination?.total || 0,
        activeUsers: usersRes.data.pagination?.total || 0,
        totalRoles: rolesRes.data.length || 0,
        totalCentres: centresRes.data.length || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setStats({ totalUsers: 0, activeUsers: 0, totalRoles: 0, totalCentres: 0 });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center p-6 sm:p-8 min-h-64">
      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className="container-responsive space-y-4 sm:space-y-6 min-h-full">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 text-sm sm:text-base">Welcome back, {user.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <AccessControl>
          <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <i className="fas fa-users text-blue-600 text-sm sm:text-base"></i>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Users</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>
        </AccessControl>

        <AccessControl>
          <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <i className="fas fa-user-check text-green-600 text-sm sm:text-base"></i>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Active Users</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
              </div>
            </div>
          </div>
        </AccessControl>

        <AccessControl>
          <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                <i className="fas fa-user-tag text-yellow-600 text-sm sm:text-base"></i>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Roles</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalRoles}</p>
              </div>
            </div>
          </div>
        </AccessControl>

        <AccessControl>
          <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <i className="fas fa-building text-purple-600 text-sm sm:text-base"></i>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Centres</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalCentres}</p>
              </div>
            </div>
          </div>
        </AccessControl>
      </div>

      {/* Reports Section */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Reports</h2>
        </div>
        <div className="p-4 sm:p-6">
          <AccessControl 
            requiredRole={['admin', 'hod_presales', 'hod_sales', 'manager_presales', 'sales_manager']}
            fallback={
              <div className="text-center text-gray-500 p-6 sm:p-8">
                <i className="fas fa-lock text-2xl sm:text-4xl mb-3 sm:mb-4"></i>
                <p className="text-sm sm:text-base">You don't have permission to view reports.</p>
                <p className="text-xs sm:text-sm mt-1">Contact your administrator for access.</p>
              </div>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <button className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
                <i className="fas fa-users text-blue-600 mb-2 text-sm sm:text-base"></i>
                <h3 className="font-medium text-sm sm:text-base">User Reports</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">View user activity and performance</p>
              </button>
              
              <button className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
                <i className="fas fa-chart-bar text-green-600 mb-2 text-sm sm:text-base"></i>
                <h3 className="font-medium text-sm sm:text-base">System Reports</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">System usage and statistics</p>
              </button>
              
              <button className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors sm:col-span-2 lg:col-span-1">
                <i className="fas fa-cog text-purple-600 mb-2 text-sm sm:text-base"></i>
                <h3 className="font-medium text-sm sm:text-base">Admin Reports</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Administrative insights and metrics</p>
              </button>
            </div>
          </AccessControl>
        </div>
      </div>
    </div>
  );
}