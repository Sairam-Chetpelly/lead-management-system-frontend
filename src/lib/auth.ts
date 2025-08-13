import api from './api';

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
  
  checkStatus: () => api.get('/api/auth/status'),
  
  get: (url: string) => api.get(url),
  
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
  
  exportUsers: () => api.get('/api/users/export'),
  
  getRoles: () => api.get('/api/setup/roles'),
  
  getStatuses: () => api.get('/api/setup/statuses'),
  
  getCentres: () => api.get('/api/setup/centres'),
  


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
    exportRoles: () => api.get('/api/admin/roles/export'),
    
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
    exportCentres: () => api.get('/api/admin/centres/export'),
    
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
    exportLanguages: () => api.get('/api/admin/languages/export'),
    
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
    exportStatuses: () => api.get('/api/admin/statuses/export'),
    
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
    getLeads: (params: { page?: number; limit?: number; search?: string; source?: string; status?: string; assignedTo?: string } = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
      return api.get(`/api/leads?${queryParams}`);
    },
    getLead: (id: string) => api.get(`/api/leads/${id}`),
    getLeadDetails: (id: string) => api.get(`/api/leads/${id}/details`),
    createLead: (data: any) => api.post('/api/leads', data),
    updateLead: (id: string, data: any) => api.put(`/api/leads/${id}`, data),
    deleteLead: (id: string) => api.delete(`/api/leads/${id}`),
    
    // Lead Sources CRUD
    getLeadSources: (params: { page?: number; limit?: number; search?: string; isApiSource?: string } = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
      return api.get(`/api/lead-sources?${queryParams}`);
    },
    createLeadSource: (data: any) => api.post('/api/lead-sources', data),
    updateLeadSource: (id: string, data: any) => api.put(`/api/lead-sources/${id}`, data),
    deleteLeadSource: (id: string) => api.delete(`/api/lead-sources/${id}`),
    
    // Project House Types CRUD
    getProjectHouseTypes: (params: { page?: number; limit?: number; search?: string; type?: string } = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
      return api.get(`/api/project-house-types?${queryParams}`);
    },
    createProjectHouseType: (data: any) => api.post('/api/project-house-types', data),
    updateProjectHouseType: (id: string, data: any) => api.put(`/api/project-house-types/${id}`, data),
    deleteProjectHouseType: (id: string) => api.delete(`/api/project-house-types/${id}`),
    
    // Call Logs CRUD
    getCallLogs: (params: { page?: number; limit?: number; search?: string; user?: string; lead?: string } = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
      return api.get(`/api/call-logs?${queryParams}`);
    },
    getCallLogsByLead: (leadId: string) => api.get(`/api/call-logs/lead/${leadId}`),
    createCallLog: (data: any) => api.post('/api/call-logs', data),
    updateCallLog: (id: string, data: any) => api.put(`/api/call-logs/${id}`, data),
    deleteCallLog: (id: string) => api.delete(`/api/call-logs/${id}`),
    
    // Lead Activities CRUD
    getLeadActivities: (params: { page?: number; limit?: number; search?: string; leadValue?: string; isCompleted?: string } = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
      return api.get(`/api/lead-activities?${queryParams}`);
    },
    getLeadActivitiesByLead: (leadId: string) => api.get(`/api/lead-activities/lead/${leadId}`),
    getLatestLeadActivity: (leadId: string) => api.get(`/api/lead-activities/lead/${leadId}/latest`),
    createLeadActivity: (data: any) => api.post('/api/lead-activities', data),
    updateLeadActivity: (id: string, data: any) => api.put(`/api/lead-activities/${id}`, data),
    deleteLeadActivity: (id: string) => api.delete(`/api/lead-activities/${id}`),
    
    // Export functions
    exportLeads: () => api.get('/api/leads/export'),
    exportLeadSources: () => api.get('/api/lead-sources/export'),
    exportCallLogs: () => api.get('/api/call-logs/export'),
    exportLeadActivities: () => api.get('/api/lead-activities/export'),
    exportProjectHouseTypes: () => api.get('/api/project-house-types/export'),
  },
};

export default api;