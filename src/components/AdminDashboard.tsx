'use client';

import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/auth';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface AdminDashboardProps {
  user: any;
}

interface DailyTrend {
  date: string;
  leads: number;
  calls: number;
  qualified: number;
  lost: number;
  won: number;
}

interface QualificationRate {
  date: string;
  rate: number;
  allocated: number;
  qualified: number;
}

interface CallsPerLead {
  date: string;
  ratio: number;
  calls: number;
  allocated: number;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    totalLeads: 0, leadsMTD: 0, leadsToday: 0,
    totalCalls: 0, callsMTD: 0, callsToday: 0,
    totalQualified: 0, qualifiedMTD: 0, qualifiedToday: 0,
    totalLost: 0, lostMTD: 0, lostToday: 0,
    totalWon: 0, wonMTD: 0, wonToday: 0,
    siteVisits: 0, centerVisits: 0, virtualMeetings: 0,
    dailyLeads: [] as any[],
    dailyCalls: [] as any[],
    dailyQualified: [] as any[],
    dailyLost: [] as any[],
    dailyWon: [] as any[],
    dailySiteVisits: [] as any[],
    dailyCenterVisits: [] as any[],
    dailyVirtualMeetings: [] as any[],
    dailyQualificationRate: [] as any[],
    dailyCallsPerLead: [] as any[],

    sourceLeads: [] as any[],
    sourceQualified: [] as any[],
    sourceWon: [] as any[],
    showFilters: true,
    role: 'admin'
  });
  const [filters, setFilters] = useState({
    userType: '',
    agentId: '',
    startDate: '',
    endDate: '',
    sourceId: '',
    centreId: ''
  });
  const [users, setUsers] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [centres, setCentres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (initialLoad) {
      console.log('Initial load, fetching stats');

      // Set default userType based on user role
      let defaultUserType = '';
      if (user.role === 'sales_agent' || user.role === 'sales_manager' || user.role === 'hod_sales') {
        defaultUserType = 'sales';
      } else if (user.role === 'presales_agent' || user.role === 'manager_presales' || user.role === 'hod_presales') {
        defaultUserType = 'presales';
      }

      if (defaultUserType && !filters.userType) {
        setFilters(prev => ({ ...prev, userType: defaultUserType }));
      }

      fetchStats();
      fetchSources();
      fetchCentres();
      setInitialLoad(false);
    } else {
      console.log('Filters changed, fetching stats:', filters);
      fetchStats();
    }
  }, [filters, user.role]);

  useEffect(() => {
    if (!initialLoad && stats.showFilters !== false && filters.userType) {
      fetchUsers();
    }
  }, [filters.userType, stats.showFilters, initialLoad]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      console.log('Fetching stats with filters:', filters);
      const params: any = {};
      if (filters.userType) params.userType = filters.userType;
      if (filters.agentId) params.agentId = filters.agentId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.sourceId) params.sourceId = filters.sourceId;
      if (filters.centreId) params.centreId = filters.centreId;

      console.log('API params:', params);
      const response = await authAPI.getAdminDashboard(params);
      console.log('Admin Dashboard Response:', response.data);
      setStats(response.data);

      // If user is presales agent, clear filters to prevent confusion (only if filters are not already empty)
      if (response.data.role === 'presales_agent' && (filters.userType || filters.agentId || filters.startDate || filters.endDate || filters.sourceId || filters.centreId)) {
        console.log('Clearing filters for presales agent');
        setFilters({ userType: '', agentId: '', startDate: '', endDate: '', sourceId: '', centreId: '' });
      }
    } catch (error) {
      console.error('Error fetching admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const userType = filters.userType || 'all-users';
      const response = await authAPI.getAdminUsers(userType);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchSources = async () => {
    try {
      if (stats.showFilters !== false) {
        const response = await authAPI.getAdminSources();
        setSources(response.data);
      }
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  };

  const fetchCentres = async () => {
    try {
      if (stats.showFilters !== false) {
        const response = await authAPI.get('/api/dashboard/admin/centres');
        setCentres(response.data);
      }
    } catch (error) {
      console.error('Error fetching centres:', error);
    }
  };

  const clearFilters = () => {
    // Preserve userType for sales and presales users
    let preservedUserType = '';
    if (user.role === 'sales_agent' || user.role === 'sales_manager' || user.role === 'hod_sales') {
      preservedUserType = 'sales';
    } else if (user.role === 'presales_agent' || user.role === 'manager_presales' || user.role === 'hod_presales') {
      preservedUserType = 'presales';
    }
    
    setFilters({ userType: preservedUserType, agentId: '', startDate: '', endDate: '', sourceId: '', centreId: '' });
    
    // Refetch users if userType is preserved to maintain agent dropdown
    if (preservedUserType) {
      fetchUsers();
    } else {
      setUsers([]);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        {/* <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1> */}
        <p className="text-gray-600">Welcome back, {user.name}</p>
      </div>

      {/* Filters - Only show for admin users */}
      {stats.showFilters !== false && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {loading && (
              <div className="flex items-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                Loading...
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {(stats.role !== 'sales_agent') && (
              <>
                <select
                  value={filters.userType}
                  onChange={(e) => setFilters(prev => ({ ...prev, userType: e.target.value, agentId: '' }))}
                  disabled={user.role === 'sales_agent' || user.role === 'sales_manager' || user.role === 'hod_sales' || user.role === 'presales_agent' || user.role === 'manager_presales' || user.role === 'hod_presales'}
                  className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${user.role === 'sales_agent' || user.role === 'sales_manager' || user.role === 'hod_sales' || user.role === 'presales_agent' || user.role === 'manager_presales' || user.role === 'hod_presales'
                      ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                >
                  <option value="">All User Types</option>
                  <option value="sales">Sales</option>
                  <option value="presales">Presales</option>
                </select>

                {filters.userType && (
                  <select
                    value={filters.agentId}
                    onChange={(e) => setFilters(prev => ({ ...prev, agentId: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Agents</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>{user.name}</option>
                    ))}
                  </select>
                )}
              </>
            )}

            <select
              value={filters.sourceId}
              onChange={(e) => setFilters(prev => ({ ...prev, sourceId: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sources</option>
              {sources.map(source => (
                <option key={source._id} value={source._id}>{source.name}</option>
              ))}
            </select>

            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Start Date"
            />

            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="End Date"
            />

            {user.role === 'hod_sales' && (
              <select
                value={filters.centreId}
                onChange={(e) => setFilters(prev => ({ ...prev, centreId: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Centres</option>
                {centres.map(centre => (
                  <option key={centre._id} value={centre._id}>{centre.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear Filters
            </button>
          </div>
          <div className="mt-4">
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600">Total Leads All</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalLeads}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600">Leads Month to Date</p>
            <p className="text-2xl font-bold text-green-600">{stats.leadsMTD}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600">Leads Today</p>
            <p className="text-2xl font-bold text-indigo-600">{stats.leadsToday}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600">Total Calls All</p>
            <p className="text-2xl font-bold text-purple-600">{stats.totalCalls}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600">Calls Month to Date</p>
            <p className="text-2xl font-bold text-orange-600">{stats.callsMTD}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600">Calls Today</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.callsToday}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600">Total Qualified All</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.totalQualified}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600">Qualified Month to Date</p>
            <p className="text-2xl font-bold text-teal-600">{stats.qualifiedMTD}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600">Qualified Today</p>
            <p className="text-2xl font-bold text-cyan-600">{stats.qualifiedToday}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600">Total Lost All</p>
            <p className="text-2xl font-bold text-red-600">{stats.totalLost}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600">Lost Month to Date</p>
            <p className="text-2xl font-bold text-pink-600">{stats.lostMTD}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600">Lost Today</p>
            <p className="text-2xl font-bold text-rose-600">{stats.lostToday}</p>
          </div>
        </div>
        {(['admin', 'sales_manager', 'sales_agent', 'hod_sales', 'marketing'].includes(stats.role)) && (
          ((filters.agentId !=='all' && filters.userType !== 'presales')) && (
            <>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600">Total Won All</p>
                  <p className="text-2xl font-bold text-green-600">{stats.totalWon}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600">Won Month to Date</p>
                  <p className="text-2xl font-bold text-lime-600">{stats.wonMTD}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600">Won Today</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.wonToday}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600">Site Visits</p>
                  <p className="text-2xl font-bold text-cyan-600">{stats.siteVisits}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600">Center Visits</p>
                  <p className="text-2xl font-bold text-pink-600">{stats.centerVisits}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600">Virtual Meetings</p>
                  <p className="text-2xl font-bold text-rose-600">{stats.virtualMeetings}</p>
                </div>
              </div>
            </>
          )
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads Each Day</h3>
          <div className="h-64">
            {stats.dailyLeads && stats.dailyLeads.length > 0 ? (
              <Line
                data={{
                  labels: stats.dailyLeads.map(item =>
                    new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  ),
                  datasets: [{
                    label: 'Leads',
                    data: stats.dailyLeads.map(item => item.count),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Calls Each Day</h3>
          <div className="h-64">
            {stats.dailyCalls && stats.dailyCalls.length > 0 ? (
              <Line
                data={{
                  labels: stats.dailyCalls.map(item =>
                    new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  ),
                  datasets: [{
                    label: 'Calls',
                    data: stats.dailyCalls.map(item => item.count),
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Qualified Each Day</h3>
          <div className="h-64">
            {stats.dailyQualified && stats.dailyQualified.length > 0 ? (
              <Line
                data={{
                  labels: stats.dailyQualified.map(item =>
                    new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  ),
                  datasets: [{
                    label: 'Qualified',
                    data: stats.dailyQualified.map(item => item.count),
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Lost Each Day</h3>
          <div className="h-64">
            {stats.dailyLost && stats.dailyLost.length > 0 ? (
              <Line
                data={{
                  labels: stats.dailyLost.map(item =>
                    new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  ),
                  datasets: [{
                    label: 'Lost',
                    data: stats.dailyLost.map(item => item.count),
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>
        {(['admin', 'sales_manager', 'sales_agent', 'hod_sales', 'marketing'].includes(stats.role)) && (
          ((filters.agentId !=='all' && filters.userType !== 'presales')) && (

          <>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Won Each Day</h3>
              <div className="h-64">
                {stats.dailyWon && stats.dailyWon.length > 0 ? (
                  <Line
                    data={{
                      labels: stats.dailyWon.map(item =>
                        new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      ),
                      datasets: [{
                        label: 'Won',
                        data: stats.dailyWon.map(item => item.count),
                        borderColor: 'rgb(168, 85, 247)',
                        backgroundColor: 'rgba(168, 85, 247, 0.1)',
                        tension: 0.4,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true } },
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Visits Each Day</h3>
              <div className="h-64">
                {stats.dailySiteVisits && stats.dailySiteVisits.length > 0 ? (
                  <Line
                    data={{
                      labels: stats.dailySiteVisits.map(item =>
                        new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      ),
                      datasets: [{
                        label: 'Site Visits',
                        data: stats.dailySiteVisits.map(item => item.count),
                        borderColor: 'rgb(6, 182, 212)',
                        backgroundColor: 'rgba(6, 182, 212, 0.1)',
                        tension: 0.4,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true } },
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Center Visits Each Day</h3>
              <div className="h-64">
                {stats.dailyCenterVisits && stats.dailyCenterVisits.length > 0 ? (
                  <Line
                    data={{
                      labels: stats.dailyCenterVisits.map(item =>
                        new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      ),
                      datasets: [{
                        label: 'Center Visits',
                        data: stats.dailyCenterVisits.map(item => item.count),
                        borderColor: 'rgb(236, 72, 153)',
                        backgroundColor: 'rgba(236, 72, 153, 0.1)',
                        tension: 0.4,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true } },
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>


            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Virtual Meetings Each Day</h3>
              <div className="h-64">
                {stats.dailyVirtualMeetings && stats.dailyVirtualMeetings.length > 0 ? (
                  <Line
                    data={{
                      labels: stats.dailyVirtualMeetings.map(item =>
                        new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      ),
                      datasets: [{
                        label: 'Virtual Meetings',
                        data: stats.dailyVirtualMeetings.map(item => item.count),
                        borderColor: 'rgb(244, 63, 94)',
                        backgroundColor: 'rgba(244, 63, 94, 0.1)',
                        tension: 0.4,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true } },
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>
          </>
          )
        )}
        {/* Agent-specific charts - show for presales agents or when agent filter is applied */}
        {(['presales_agent', 'manager_presales', 'hod_presales'].includes(stats.role) || (filters.agentId && filters.userType == 'presales')) && (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Qualification Rate (%)</h3>
              <div className="h-64">
                {stats.dailyQualificationRate && stats.dailyQualificationRate.length > 0 ? (
                  <Line
                    data={{
                      labels: stats.dailyQualificationRate.map(item =>
                        new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      ),
                      datasets: [{
                        label: 'Qualification Rate (%)',
                        data: stats.dailyQualificationRate.map(item => item.rate),
                        borderColor: 'rgb(99, 102, 241)',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.4,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            afterLabel: function (context: any) {
                              const dataPoint = stats.dailyQualificationRate[context.dataIndex];
                              return [`Qualified: ${dataPoint.qualified}`, `Allocated: ${dataPoint.allocated}`];
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          ticks: {
                            callback: function (value) {
                              return value + '%';
                            }
                          }
                        }
                      },
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Calls Per Lead</h3>
              <div className="h-64">
                {stats.dailyCallsPerLead && stats.dailyCallsPerLead.length > 0 ? (
                  <Line
                    data={{
                      labels: stats.dailyCallsPerLead.map(item =>
                        new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      ),
                      datasets: [{
                        label: 'Calls Per Lead',
                        data: stats.dailyCallsPerLead.map(item => item.ratio),
                        borderColor: 'rgb(245, 158, 11)',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.4,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            afterLabel: function (context: any) {
                              const dataPoint = stats.dailyCallsPerLead[context.dataIndex];
                              return [`Calls: ${dataPoint.calls}`, `Allocated: ${dataPoint.allocated}`];
                            }
                          }
                        }
                      },
                      scales: { y: { beginAtZero: true } },
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Source Wise Leads</h3>
          <div className="space-y-2">
            {stats.sourceLeads && stats.sourceLeads.length > 0 ? (
              stats.sourceLeads.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{item._id}</span>
                  <span className="text-sm font-bold text-blue-600">{item.count}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                No data available
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Source Wise Qualified Leads</h3>
          <div className="space-y-2">
            {stats.sourceQualified && stats.sourceQualified.length > 0 ? (
              stats.sourceQualified.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{item._id}</span>
                  <span className="text-sm font-bold text-green-600">{item.count}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                No data available
              </div>
            )}
          </div>
        </div>
        {(['admin', 'sales_manager', 'sales_agent', 'hod_sales', 'marketing'].includes(stats.role)) && (
            ((filters.agentId !=='all' && filters.userType !== 'presales')) && (


          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Source Wise Won Leads</h3>
            <div className="space-y-2">
              {stats.sourceWon && stats.sourceWon.length > 0 ? (
                stats.sourceWon.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{item._id}</span>
                    <span className="text-sm font-bold text-purple-600">{item.count}</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No data available
                </div>
              )}
            </div>
          </div>
            )
        )}



      </div>
    </div >
  );
}