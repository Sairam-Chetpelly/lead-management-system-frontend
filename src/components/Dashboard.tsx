'use client';

import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/auth';
import AccessControl from './AccessControl';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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
  const [leadStats, setLeadStats] = useState({
    totalLeads: 0,
    weekLeads: 0,
    todayLeads: 0,
    todayCalls: 0,
    wonLeads: 0,
    lostLeads: 0,
    weeklyTrend: [],
    statusDistribution: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    fetchLeadStats();
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
        totalRoles: rolesRes.data.data?.length || rolesRes.data.length || 0,
        totalCentres: centresRes.data.data?.length || centresRes.data.length || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setStats({ totalUsers: 0, activeUsers: 0, totalRoles: 0, totalCentres: 0 });
    }
  };

  const fetchLeadStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || 'lms-secure-api-key-2024'
        }
      });
      const data = await response.json();
      console.log('Lead stats data:', data);
      setLeadStats(data);
    } catch (error) {
      console.error('Error fetching lead stats:', error);
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

      {/* Lead Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <i className="fas fa-chart-line text-blue-600 text-sm sm:text-base"></i>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Leads</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{leadStats.totalLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
              <i className="fas fa-calendar-week text-green-600 text-sm sm:text-base"></i>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">This Week</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{leadStats.weekLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
              <i className="fas fa-calendar-day text-indigo-600 text-sm sm:text-base"></i>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Today's Leads</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{leadStats.todayLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
              <i className="fas fa-phone text-yellow-600 text-sm sm:text-base"></i>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Today's Calls</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{leadStats.todayCalls}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
              <i className="fas fa-trophy text-emerald-600 text-sm sm:text-base"></i>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Won Leads</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{leadStats.wonLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
              <i className="fas fa-times-circle text-red-600 text-sm sm:text-base"></i>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Lost Leads</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{leadStats.lostLeads}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Weekly Trend Chart */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Lead Trend</h3>
          <div className="h-64">
            <Line
              data={{
                labels: leadStats.weeklyTrend.map(item => 
                  new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
                ),
                datasets: [
                  {
                    label: 'Leads',
                    data: leadStats.weeklyTrend.map(item => item.count),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Lead Status Distribution */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Status Distribution</h3>
          <div className="h-64">
            {leadStats.statusDistribution && leadStats.statusDistribution.length > 0 ? (
              <Doughnut
                data={{
                  labels: leadStats.statusDistribution.map(item => item._id || 'No Status'),
                  datasets: [
                    {
                      data: leadStats.statusDistribution.map(item => item.count),
                      backgroundColor: [
                        '#3B82F6',
                        '#10B981', 
                        '#F59E0B',
                        '#EF4444',
                        '#8B5CF6',
                        '#F97316',
                      ],
                      borderWidth: 2,
                      borderColor: '#ffffff',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 20,
                        usePointStyle: true,
                      },
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const label = context.label || '';
                          const value = context.parsed || 0;
                          return `${label}: ${value} leads`;
                        }
                      }
                    }
                  },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <i className="fas fa-chart-pie text-4xl mb-2 opacity-50"></i>
                  <p>No lead status data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Stats Cards */}
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
          <AccessControl requiredRole="admin">
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