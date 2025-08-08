import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.com' 
  : 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  centre?: string;
}

export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/api/auth/login', credentials),
  
  getUsers: (params: PaginationParams = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });
    return api.get(`/api/users?${queryParams}`);
  },
  
  createUser: (userData: any) => api.post('/api/users', userData),
  
  updateUser: (id: string, userData: any) => api.put(`/api/users/${id}`, userData),
  
  deleteUser: (id: string) => api.delete(`/api/users/${id}`),
  
  exportUsers: () => api.get('/api/users/export', { responseType: 'blob' }),
  
  getRoles: () => api.get('/api/setup/roles'),
  
  getStatuses: () => api.get('/api/setup/statuses'),
  
  getCentres: () => api.get('/api/setup/centres'),
  
  initSystem: () => api.post('/api/setup/init'),

  // Admin CRUD operations
  admin: {
    // Roles
    getRoles: (params: { page?: number; limit?: number; search?: string } = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
      return api.get(`/api/admin/roles?${queryParams}`);
    },
    getAllRoles: () => api.get('/api/admin/roles/all'),
    createRole: (data: any) => api.post('/api/admin/roles', data),
    updateRole: (id: string, data: any) => api.put(`/api/admin/roles/${id}`, data),
    deleteRole: (id: string) => api.delete(`/api/admin/roles/${id}`),
    exportRoles: () => api.get('/api/admin/roles/export', { responseType: 'blob' }),
    
    // Centres
    getCentres: (params: { page?: number; limit?: number; search?: string } = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
      return api.get(`/api/admin/centres?${queryParams}`);
    },
    getAllCentres: () => api.get('/api/admin/centres/all'),
    createCentre: (data: any) => api.post('/api/admin/centres', data),
    updateCentre: (id: string, data: any) => api.put(`/api/admin/centres/${id}`, data),
    deleteCentre: (id: string) => api.delete(`/api/admin/centres/${id}`),
    exportCentres: () => api.get('/api/admin/centres/export', { responseType: 'blob' }),
    
    // Languages
    getLanguages: (params: { page?: number; limit?: number; search?: string } = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
      return api.get(`/api/admin/languages?${queryParams}`);
    },
    getAllLanguages: () => api.get('/api/admin/languages/all'),
    createLanguage: (data: any) => api.post('/api/admin/languages', data),
    updateLanguage: (id: string, data: any) => api.put(`/api/admin/languages/${id}`, data),
    deleteLanguage: (id: string) => api.delete(`/api/admin/languages/${id}`),
    exportLanguages: () => api.get('/api/admin/languages/export', { responseType: 'blob' }),
    
    // Statuses
    getStatuses: (params: { page?: number; limit?: number; search?: string } = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
      return api.get(`/api/admin/statuses?${queryParams}`);
    },
    getAllStatuses: () => api.get('/api/admin/statuses/all'),
    createStatus: (data: any) => api.post('/api/admin/statuses', data),
    updateStatus: (id: string, data: any) => api.put(`/api/admin/statuses/${id}`, data),
    deleteStatus: (id: string) => api.delete(`/api/admin/statuses/${id}`),
    exportStatuses: () => api.get('/api/admin/statuses/export', { responseType: 'blob' }),
    
    // Users
    getUsers: (params: { page?: number; limit?: number; search?: string } = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
      return api.get(`/api/users?${queryParams}`);
    },
  },
  
  // Leads Management
  leads: {
    // Leads CRUD
    getLeads: () => api.get('/api/leads'),
    getLead: (id: string) => api.get(`/api/leads/${id}`),
    getLeadDetails: (id: string) => api.get(`/api/leads/${id}/details`),
    createLead: (data: any) => api.post('/api/leads', data),
    updateLead: (id: string, data: any) => api.put(`/api/leads/${id}`, data),
    deleteLead: (id: string) => api.delete(`/api/leads/${id}`),
    
    // Lead Sources CRUD
    getLeadSources: () => api.get('/api/lead-sources'),
    createLeadSource: (data: any) => api.post('/api/lead-sources', data),
    updateLeadSource: (id: string, data: any) => api.put(`/api/lead-sources/${id}`, data),
    deleteLeadSource: (id: string) => api.delete(`/api/lead-sources/${id}`),
    
    // Project House Types CRUD
    getProjectHouseTypes: () => api.get('/api/project-house-types'),
    createProjectHouseType: (data: any) => api.post('/api/project-house-types', data),
    updateProjectHouseType: (id: string, data: any) => api.put(`/api/project-house-types/${id}`, data),
    deleteProjectHouseType: (id: string) => api.delete(`/api/project-house-types/${id}`),
    
    // Call Logs CRUD
    getCallLogs: () => api.get('/api/call-logs'),
    getCallLogsByLead: (leadId: string) => api.get(`/api/call-logs/lead/${leadId}`),
    createCallLog: (data: any) => api.post('/api/call-logs', data),
    updateCallLog: (id: string, data: any) => api.put(`/api/call-logs/${id}`, data),
    deleteCallLog: (id: string) => api.delete(`/api/call-logs/${id}`),
    
    // Lead Activities CRUD
    getLeadActivities: () => api.get('/api/lead-activities'),
    getLeadActivitiesByLead: (leadId: string) => api.get(`/api/lead-activities/lead/${leadId}`),
    getLatestLeadActivity: (leadId: string) => api.get(`/api/lead-activities/lead/${leadId}/latest`),
    createLeadActivity: (data: any) => api.post('/api/lead-activities', data),
    updateLeadActivity: (id: string, data: any) => api.put(`/api/lead-activities/${id}`, data),
    deleteLeadActivity: (id: string) => api.delete(`/api/lead-activities/${id}`),
  },
};

export default api;