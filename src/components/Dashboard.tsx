'use client';

import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/auth';
import { API_ENDPOINTS } from '@/config/apiEndpoints';
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

interface WeeklyTrendItem {
  date: string;
  count: number;
}

interface StatusDistributionItem {
  _id: string;
  count: number;
}

interface LeadStats {
  totalLeads: number;
  weekLeads: number;
  todayLeads: number;
  todayCalls: number;
  wonLeads: number;
  lostLeads: number;
  weeklyTrend: WeeklyTrendItem[];
  statusDistribution: StatusDistributionItem[];
}


export default function Dashboard({ user }: DashboardProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRoles: 0,
    totalCentres: 0
  });
  const [leadStats, setLeadStats] = useState<LeadStats>({
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
      const [rolesRes, centresRes] = await Promise.all([
        authAPI.admin.getAllRoles(),
        authAPI.admin.getAllCentres()
      ]);

      setStats({
        totalUsers: 0, // Will be set from leadStats
        activeUsers: 0, // Will be set from leadStats
        totalRoles: rolesRes.data.data?.length || rolesRes.data.length || 0,
        totalCentres: centresRes.data.data?.length || centresRes.data.length || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setStats({ totalUsers: 0, activeUsers: 0, totalRoles: 0, totalCentres: 0 });
    }
  };
  const getCurrentUserRole = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        return user.role;
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    return null;
  };

  const userRole = getCurrentUserRole();
  const isSalesAgent = userRole === 'sales_agent';
  const isPreSalesAgent = userRole === 'presales_agent';
  const isSalesManager = userRole === 'sales_manager';
  const isHodSales = userRole === 'hod_sales';
  const isPreSalesManager = userRole === 'manager_presales';
  const isPreSalesHod = userRole === 'hod_presales';
  const isAdmin = userRole === 'admin';

  const fetchLeadStats = async () => {
    try {
      const response = await authAPI.get(API_ENDPOINTS.DASHBOARD_STATS);
      const data = response.data;
      console.log('Lead stats data:', data);
      setLeadStats(data);

      // Update user stats from lead stats response
      if (data.totalUsers !== undefined && data.activeUsers !== undefined) {
        setStats(prev => ({
          ...prev,
          totalUsers: data.totalUsers,
          activeUsers: data.activeUsers
        }));
      }
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
        {isAdmin && (
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
        )}
        {isAdmin && (
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
        )}
      </div>
      {/* System Stats Cards */}
      <div hidden={isSalesAgent || isPreSalesAgent} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <AccessControl>
          <div hidden={isSalesAgent || isPreSalesAgent} className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
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
          <div hidden={isSalesAgent || isPreSalesAgent} className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
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
        {isAdmin && (
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
        )}
        {isAdmin && (
          <AccessControl >
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
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        {/* Weekly Trend Chart */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Lead Trend</h3>
          <div className="h-64">
            <Line
              data={{
                labels: (leadStats.weeklyTrend || []).map((item: WeeklyTrendItem) =>
                  new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
                ),
                datasets: [
                  {
                    label: 'Leads',
                    data: (leadStats.weeklyTrend || []).map((item: WeeklyTrendItem) => item.count),
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

        {/* Calling Chart for Presales and Sales Agents */}
        {(isPreSalesAgent || isSalesAgent) && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Calls</h3>
            <div className="h-64">
              <Line
                data={{
                  labels: (leadStats.weeklyTrend || []).map((item: WeeklyTrendItem) =>
                    new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
                  ),
                  datasets: [
                    {
                      label: 'Calls Made',
                      data: (leadStats.weeklyCallTrend || []).map((item: WeeklyTrendItem) => item.count),
                      borderColor: 'rgb(16, 185, 129)',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
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
        )}

        {/* Lead Value Distribution for Presales Agents */}
        {!isPreSalesAgent && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Value Distribution</h3>
            <div className="h-64">
              {leadStats.leadValueDistribution && leadStats.leadValueDistribution.length > 0 ? (
                <Doughnut
                  data={{
                    labels: leadStats.leadValueDistribution.map((item: StatusDistributionItem) =>
                      item._id === 'high value' ? 'High Value' :
                        item._id === 'low value' ? 'Low Value' : 'Not Set'
                    ),
                    datasets: [
                      {
                        data: leadStats.leadValueDistribution.map((item: StatusDistributionItem) => item.count),
                        backgroundColor: [
                          '#EF4444', // Red for High Value
                          '#F59E0B', // Yellow for Medium Value  
                          '#10B981', // Green for Low Value
                          '#6B7280', // Gray for Not Set
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
                          label: function (context) {
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
                    <p>No lead value data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Source Distribution Chart */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Sources</h3>
          <div className="h-64">
            {leadStats.sourceDistribution && leadStats.sourceDistribution.length > 0 ? (
              <Doughnut
                data={{
                  labels: leadStats.sourceDistribution.map((item: StatusDistributionItem) => item._id || 'Unknown'),
                  datasets: [
                    {
                      data: leadStats.sourceDistribution.map((item: StatusDistributionItem) => item.count),
                      backgroundColor: [
                        '#3B82F6', // Blue
                        '#10B981', // Green
                        '#F59E0B', // Yellow
                        '#EF4444', // Red
                        '#8B5CF6', // Purple
                        '#F97316', // Orange
                        '#06B6D4', // Cyan
                        '#84CC16', // Lime
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
                        label: function (context) {
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
                  <p>No source data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lead Status Distribution */}
        <div hidden={isSalesAgent || isPreSalesAgent} className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Status Distribution</h3>
          <div className="h-64">
            {leadStats.statusDistribution && leadStats.statusDistribution.length > 0 ? (
              <Doughnut
                data={{
                  labels: leadStats.statusDistribution.map((item: StatusDistributionItem) => item._id || 'No Status'),
                  datasets: [
                    {
                      data: leadStats.statusDistribution.map((item: StatusDistributionItem) => item.count),
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
                        label: function (context) {
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
        {/* Center Distribution Chart */}
        {!isPreSalesAgent && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Center Distribution</h3>
            <div className="h-64">
              {leadStats.centerDistribution && leadStats.centerDistribution.length > 0 ? (
                <Doughnut
                  data={{
                    labels: leadStats.centerDistribution.map((item: StatusDistributionItem) => item._id || 'No Centre'),
                    datasets: [
                      {
                        data: leadStats.centerDistribution.map((item: StatusDistributionItem) => item.count),
                        backgroundColor: [
                          '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1', '#14B8A6', '#F59E0B'
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
                      legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            return `${context.label}: ${context.parsed} leads`;
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
                    <p>No center data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Language Distribution Chart */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Distribution</h3>
          <div className="h-64">
            {leadStats.languageDistribution && leadStats.languageDistribution.length > 0 ? (
              <Doughnut
                data={{
                  labels: leadStats.languageDistribution.map((item: StatusDistributionItem) => item._id || 'No Language'),
                  datasets: [
                    {
                      data: leadStats.languageDistribution.map((item: StatusDistributionItem) => item.count),
                      backgroundColor: [
                        '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#F97316', '#06B6D4', '#EC4899'
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
                    legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } },
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          return `${context.label}: ${context.parsed} leads`;
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
                  <p>No language data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lead Sub-Status Distribution for Sales Users and Admin */}
        {(isSalesAgent || (!isSalesAgent && !isPreSalesAgent)) && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Sub-Status Distribution</h3>
            <div className="h-64">
              {leadStats.leadSubStatusDistribution && leadStats.leadSubStatusDistribution.length > 0 ? (
                <Doughnut
                  data={{
                    labels: leadStats.leadSubStatusDistribution.map((item: StatusDistributionItem) => item._id || 'No Sub Status'),
                    datasets: [
                      {
                        data: leadStats.leadSubStatusDistribution.map((item: StatusDistributionItem) => item.count),
                        backgroundColor: [
                          '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
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
                      legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            return `${context.label}: ${context.parsed} leads`;
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
                    <p>No sub-status data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}