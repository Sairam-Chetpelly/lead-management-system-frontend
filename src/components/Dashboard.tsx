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
  totalLeadsHistorically: number;
  leadsMonthToDate: number;
  todayLeads: number;
  totalCallsHistorically: number;
  callsMTD: number;
  todayCalls: number;
  totalQualifiedHistorically: number;
  qualifiedMTD: number;
  qualifiedToday: number;
  totalLostHistorically?: number;
  lostMTD?: number;
  lostToday?: number;
  mqlPercentage: number;
  dailyMqlPercentage: number;
  dailyLeadTrend: WeeklyTrendItem[];
  dailyCallTrend: WeeklyTrendItem[];
  dailyLeadsVsCalls: { date: string; leads: number; calls: number; }[];
  dailyQualifiedTrend: WeeklyTrendItem[];
  dailyLostTrend: WeeklyTrendItem[];
  // Legacy fields
  totalLeads: number;
  weekLeads: number;
  wonLeads: number;
  lostLeads: number;
  weeklyTrend: WeeklyTrendItem[];
  statusDistribution: StatusDistributionItem[];
  leadValueDistribution?: StatusDistributionItem[];
  sourceDistribution?: StatusDistributionItem[];
  sourceQualifiedDistribution?: StatusDistributionItem[];
  sourceWonDistribution?: StatusDistributionItem[];
  centerDistribution?: StatusDistributionItem[];
  languageDistribution?: StatusDistributionItem[];
  leadSubStatusDistribution?: StatusDistributionItem[];
}

interface PresalesAgent {
  _id: string;
  name: string;
}


export default function Dashboard({ user }: DashboardProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRoles: 0,
    totalCentres: 0
  });
  const [leadStats, setLeadStats] = useState<LeadStats>({
    totalLeadsHistorically: 0,
    leadsMonthToDate: 0,
    todayLeads: 0,
    totalCallsHistorically: 0,
    callsMTD: 0,
    todayCalls: 0,
    totalQualifiedHistorically: 0,
    qualifiedMTD: 0,
    qualifiedToday: 0,
    totalLostHistorically: 0,
    lostMTD: 0,
    lostToday: 0,
    mqlPercentage: 0,
    dailyMqlPercentage: 0,
    dailyLeadTrend: [],
    dailyCallTrend: [],
    dailyLeadsVsCalls: [],
    dailyQualifiedTrend: [],
    dailyLostTrend: [],
    totalLeads: 0,
    weekLeads: 0,
    wonLeads: 0,
    lostLeads: 0,
    weeklyTrend: [],
    statusDistribution: [],
    leadValueDistribution: [],
    sourceDistribution: [],
    sourceQualifiedDistribution: [],
    sourceWonDistribution: [],
    centerDistribution: [],
    languageDistribution: [],
    leadSubStatusDistribution: []
  });
  const [presalesAgents, setPresalesAgents] = useState<PresalesAgent[]>([]);
  const [selectedPresalesAgent, setSelectedPresalesAgent] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    fetchPresalesAgents();
    fetchLeadStats();
  }, []);

  useEffect(() => {
    fetchLeadStats();
  }, [selectedPresalesAgent, dateRange]);

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

  const fetchPresalesAgents = async () => {
    try {
      const response = await authAPI.get(API_ENDPOINTS.DASHBOARD_PRESALES_AGENTS);
      setPresalesAgents(response.data);
    } catch (error) {
      console.error('Error fetching presales agents:', error);
    }
  };

  const fetchLeadStats = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedPresalesAgent) {
        params.append('presalesAgent', selectedPresalesAgent);
      }
      if (dateRange.start && dateRange.end) {
        params.append('dateRange', `${dateRange.start},${dateRange.end}`);
      }
      
      const url = `${API_ENDPOINTS.DASHBOARD_STATS}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await authAPI.get(url);
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

      {/* Filters - Show for Sales Manager and other roles except Presales Agents */}
      {!isPreSalesAgent && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pre Sales Agent</label>
              <select
                value={selectedPresalesAgent}
                onChange={(e) => setSelectedPresalesAgent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Agents</option>
                {presalesAgents.map((agent) => (
                  <option key={agent._id} value={agent._id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Numbers at Top */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <i className="fas fa-chart-line text-blue-600 text-sm sm:text-base"></i>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                {isPreSalesAgent ? 'Total Leads Assigned' : 'Total Leads Historically'}
              </p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{leadStats.totalLeadsHistorically}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
              <i className="fas fa-calendar-alt text-green-600 text-sm sm:text-base"></i>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                {isPreSalesAgent ? 'Leads Assigned MTD' : 'Leads Month to Date'}
              </p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{leadStats.leadsMonthToDate}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
              <i className="fas fa-calendar-day text-indigo-600 text-sm sm:text-base"></i>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                {isPreSalesAgent ? 'Leads Assigned Today' : "Today's Leads"}
              </p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{leadStats.todayLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
              <i className="fas fa-phone text-purple-600 text-sm sm:text-base"></i>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Calls Historically</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{leadStats.totalCallsHistorically}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
              <i className="fas fa-phone-alt text-yellow-600 text-sm sm:text-base"></i>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Calls MTD</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{leadStats.callsMTD}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
              <i className="fas fa-phone-volume text-red-600 text-sm sm:text-base"></i>
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
              <i className="fas fa-check-circle text-emerald-600 text-sm sm:text-base"></i>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Qualified Historically</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{leadStats.totalQualifiedHistorically}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-teal-100 rounded-lg flex-shrink-0">
              <i className="fas fa-calendar-check text-teal-600 text-sm sm:text-base"></i>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Qualified MTD</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{leadStats.qualifiedMTD}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-cyan-100 rounded-lg flex-shrink-0">
              <i className="fas fa-star text-cyan-600 text-sm sm:text-base"></i>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Qualified Today</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{leadStats.qualifiedToday}</p>
            </div>
          </div>
        </div>

        {/* Lost Leads Cards - Only for Presales */}
        {isPreSalesAgent && (
          <>
            <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                  <i className="fas fa-times-circle text-red-600 text-sm sm:text-base"></i>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Lost Historically</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{leadStats.totalLostHistorically || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                  <i className="fas fa-calendar-times text-orange-600 text-sm sm:text-base"></i>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Lost MTD</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{leadStats.lostMTD || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-pink-100 rounded-lg flex-shrink-0">
                  <i className="fas fa-exclamation-triangle text-pink-600 text-sm sm:text-base"></i>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Lost Today</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{leadStats.lostToday || 0}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {/* System Stats Cards */}
      <div hidden={isSalesAgent || isPreSalesAgent} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
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
        {/* 1. Call Done Chart */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">1. Call Done</h3>
          <div className="h-64">
            <Line
              data={{
                labels: (leadStats.dailyCallTrend || []).map((item: WeeklyTrendItem) =>
                  new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                ),
                datasets: [
                  {
                    label: 'Calls',
                    data: (leadStats.dailyCallTrend || []).map((item: WeeklyTrendItem) => item.count),
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

        {/* 2. Leads Generated Each Day */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {isPreSalesAgent ? 'Leads Assigned Each Day' : '2. Leads Generated Each Day'}
          </h3>
          <div className="h-64">
            <Line
              data={{
                labels: (leadStats.dailyLeadTrend || []).map((item: WeeklyTrendItem) =>
                  new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                ),
                datasets: [
                  {
                    label: isPreSalesAgent ? 'Leads Assigned' : 'Leads',
                    data: (leadStats.dailyLeadTrend || []).map((item: WeeklyTrendItem) => item.count),
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

        {/* Leads Assigned vs Qualified vs Lost - Only for Presales */}
        {isPreSalesAgent && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads Assigned vs Qualified vs Lost</h3>
            <div className="h-64">
              <Line
                data={{
                  labels: (leadStats.dailyLeadTrend || []).map((item) =>
                    new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  ),
                  datasets: [
                    {
                      label: 'Leads Assigned',
                      data: (leadStats.dailyLeadTrend || []).map((item) => item.count),
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      tension: 0.4,
                    },
                    {
                      label: 'Leads Qualified',
                      data: (leadStats.dailyQualifiedTrend || []).map((item) => item.count),
                      borderColor: 'rgb(34, 197, 94)',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      tension: 0.4,
                    },
                    {
                      label: 'Leads Lost',
                      data: (leadStats.dailyLostTrend || []).map((item) => item.count),
                      borderColor: 'rgb(239, 68, 68)',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      tension: 0.4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
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

        {/* Leads Vs Calls - Only for Presales */}
        {isPreSalesAgent && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads Vs Calls</h3>
            <div className="h-64">
              <Line
                data={{
                  labels: (leadStats.dailyLeadsVsCalls || []).map((item) =>
                    new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  ),
                  datasets: [
                    {
                      label: 'Leads Assigned',
                      data: (leadStats.dailyLeadsVsCalls || []).map((item) => item.leads),
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      tension: 0.4,
                    },
                    {
                      label: 'Calls Made',
                      data: (leadStats.dailyLeadsVsCalls || []).map((item) => item.calls),
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
                      display: true,
                      position: 'top',
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

        {/* 3. MQL % - Show for Sales Manager and Presales roles */}
        {(isSalesManager || isAdmin || isPreSalesManager || isPreSalesHod || isPreSalesAgent) && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">3. MQL %</h3>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{leadStats.mqlPercentage}%</div>
                <p className="text-gray-600 text-sm">Overall MQL Rate</p>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-green-600 mb-1">{leadStats.dailyMqlPercentage}%</div>
                  <p className="text-gray-600 text-sm">Today's MQL Rate</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {leadStats.totalQualifiedHistorically} of {leadStats.totalLeadsHistorically} leads qualified
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 5. Source Vs Won - Show for Sales Manager */}
        {(isSalesManager || isAdmin) && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">5. Source Vs Won</h3>
            <div className="h-64">
              {leadStats.sourceWonDistribution && leadStats.sourceWonDistribution.length > 0 ? (
                <Line
                  data={{
                    labels: leadStats.sourceWonDistribution.map((item: StatusDistributionItem) => item._id || 'Unknown'),
                    datasets: [
                      {
                        label: 'Won Leads',
                        data: leadStats.sourceWonDistribution.map((item: StatusDistributionItem) => item.count),
                        borderColor: 'rgb(16, 185, 129)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true,
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
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <i className="fas fa-chart-line text-4xl mb-2 opacity-50"></i>
                    <p>No won leads data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. Source Vs Qualified - Show for Sales Manager */}
        {(isSalesManager || isAdmin || isPreSalesManager || isPreSalesHod) && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">4. Source Vs Qualified</h3>
            <div className="h-64">
              {leadStats.sourceQualifiedDistribution && leadStats.sourceQualifiedDistribution.length > 0 ? (
                <Line
                  data={{
                    labels: leadStats.sourceQualifiedDistribution.map((item: StatusDistributionItem) => item._id || 'Unknown'),
                    datasets: [
                      {
                        label: 'Qualified Leads',
                        data: leadStats.sourceQualifiedDistribution.map((item: StatusDistributionItem) => item.count),
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        tension: 0.4,
                        fill: true,
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
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <i className="fas fa-chart-line text-4xl mb-2 opacity-50"></i>
                    <p>No qualified leads data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. Qualified Leads Distribution - Show for Sales Manager */}
        {(isSalesManager || isAdmin || isPreSalesManager || isPreSalesHod) && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">6. Qualified</h3>
          <div className="h-64">
            {leadStats.statusDistribution && leadStats.statusDistribution.length > 0 ? (
              <Doughnut
                data={{
                  labels: leadStats.statusDistribution.map((item: StatusDistributionItem) => item._id || 'No Status'),
                  datasets: [
                    {
                      data: leadStats.statusDistribution.map((item: StatusDistributionItem) => item.count),
                      backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'
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
                  <p>No qualified leads data available</p>
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