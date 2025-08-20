import api from './api';
import { adminServices, leadServices } from './apiService';

interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  centre?: string;
}

export const authAPI = {
  // Auth endpoints
  login: (credentials: { email: string; password: string }) =>
    api.post('/api/auth/login', credentials),
  
  checkStatus: () => api.get('/api/auth/status'),
  
  get: (url: string) => api.get(url),
  
  // User management
  getUsers: (params: PaginationParams = {}) => adminServices.users.getAll(params),
  createUser: (userData: any) => adminServices.users.create(userData),
  updateUser: (id: string, userData: any) => adminServices.users.update(id, userData),
  deleteUser: (id: string) => adminServices.users.delete(id),
  exportUsers: () => adminServices.users.export(),
  
  uploadProfileImage: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('profileImage', file);
    return api.post(`/api/users/${id}/profile-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Dropdown data
  getRoles: () => adminServices.roles.getAllSimple(),
  getStatuses: () => adminServices.statuses.getAllSimple(),
  getCentres: () => adminServices.centres.getAllSimple(),

  // Admin CRUD operations
  admin: {
    // Roles
    getRoles: adminServices.roles.getAll,
    getAllRoles: adminServices.roles.getAllSimple,
    createRole: adminServices.roles.create,
    updateRole: adminServices.roles.update,
    deleteRole: adminServices.roles.delete,
    exportRoles: adminServices.roles.export,
    
    // Centres
    getCentres: adminServices.centres.getAll,
    getAllCentres: adminServices.centres.getAllSimple,
    createCentre: adminServices.centres.create,
    updateCentre: adminServices.centres.update,
    deleteCentre: adminServices.centres.delete,
    exportCentres: adminServices.centres.export,
    
    // Languages
    getLanguages: adminServices.languages.getAll,
    getAllLanguages: adminServices.languages.getAllSimple,
    createLanguage: adminServices.languages.create,
    updateLanguage: adminServices.languages.update,
    deleteLanguage: adminServices.languages.delete,
    exportLanguages: adminServices.languages.export,
    
    // Statuses
    getStatuses: adminServices.statuses.getAll,
    getAllStatuses: adminServices.statuses.getAllSimple,
    createStatus: adminServices.statuses.create,
    updateStatus: adminServices.statuses.update,
    deleteStatus: adminServices.statuses.delete,
    exportStatuses: adminServices.statuses.export,
    
    // Users
    getUsers: adminServices.users.getAll,
    
    // Lead Sources
    getAllLeadSources: () => api.get('/api/lead-sources/all'),
  },
  
  // Lead Sources CRUD
  getLeadSources: leadServices.sources.getAll,
  createLeadSource: leadServices.sources.create,
  updateLeadSource: leadServices.sources.update,
  deleteLeadSource: leadServices.sources.delete,
  exportLeadSources: leadServices.sources.export,
  
  // Project House Types CRUD
  getProjectHouseTypes: leadServices.projectHouseTypes.getAll,
  createProjectHouseType: leadServices.projectHouseTypes.create,
  updateProjectHouseType: leadServices.projectHouseTypes.update,
  deleteProjectHouseType: leadServices.projectHouseTypes.delete,
  exportProjectHouseTypes: leadServices.projectHouseTypes.export,
  
  // Leads CRUD
  getLeads: (params: PaginationParams = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    const queryString = queryParams.toString();
    return api.get(`/api/leads${queryString ? `?${queryString}` : ''}`);
  },
  getLead: (id: string) => api.get(`/api/leads/${id}`),
  getLeadActivities: (id: string) => api.get(`/api/leads/${id}/activities`),
  getLeadTimeline: (id: string) => api.get(`/api/leads/${id}/timeline`),
  createLead: (leadData: any) => api.post('/api/leads', leadData),
  updateLead: (id: string, leadData: any) => api.put(`/api/leads/${id}`, leadData),
  deleteLead: (id: string) => api.delete(`/api/leads/${id}`),
  createCallLog: (leadId: string) => api.post(`/api/leads/${leadId}/call`),
  createActivityLog: (leadId: string, type: 'call' | 'manual', comment: string, document?: File) => {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('comment', comment);
    if (document) {
      formData.append('document', document);
    }
    return api.post(`/api/leads/${leadId}/activity`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  createLeadActivity: (leadId: string, leadData: any, files?: File[]) => {
    const formData = new FormData();
    Object.keys(leadData).forEach(key => {
      if (leadData[key] !== undefined && leadData[key] !== null && leadData[key] !== '') {
        formData.append(key, leadData[key]);
      }
    });
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('files', file);
      });
    }
    return api.post(`/api/leads/${leadId}/lead-activity`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  createPresalesActivity: (leadId: string, leadData: any, files?: File[]) => {
    const formData = new FormData();
    Object.keys(leadData).forEach(key => {
      if (leadData[key] !== undefined && leadData[key] !== null && leadData[key] !== '') {
        formData.append(key, leadData[key]);
      }
    });
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('files', file);
      });
    }
    return api.post(`/api/leads/${leadId}/presales-activity`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  exportLeads: () => api.get('/api/leads/export'),
  getLeadFormData: () => api.get('/api/leads/form/data'),
  bulkUploadLeads: (formData: FormData) => 
    api.post('/api/leads/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  changeLanguage: (leadId: string, data: { languageId: string; presalesUserId: string }) => 
    api.post(`/api/leads/${leadId}/change-language`, data),
};

export default api;