import api from './api';
import { adminServices, leadServices, exportCSV } from './apiService';
import { API_ENDPOINTS, buildQueryString } from '@/config/apiEndpoints';
import { Lead, LeadResponse } from '@/types/lead';
import { timelineService } from '@/services/timelineService';

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  centre?: string;
  presalesUserId?: string;
  salesUserId?: string;
  leadStatusId?: string;
  leadSubStatusId?: string;
  languageId?: string;
  sourceId?: string;
  centreId?: string;
  leadValue?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const authAPI = {
  // Auth endpoints
  login: (credentials: { email: string; password: string }) =>
    api.post(API_ENDPOINTS.AUTH_LOGIN, credentials),
  
  forgotPassword: (data: { email: string }) =>
    api.post('/api/auth/forgot-password', data),
  
  resetPassword: (data: { token: string; password: string }) =>
    api.post(API_ENDPOINTS.AUTH_RESET_PASSWORD, data),
  
  checkStatus: () => api.get(API_ENDPOINTS.AUTH_STATUS),
  
  get: (url: string) => api.get(url),
  
  // User management
  getUsers: (params: PaginationParams = {}) => adminServices.users.getAll(params),
  createUser: (userData: any) => adminServices.users.create(userData),
  updateUser: (id: string, userData: any) => adminServices.users.update(id, userData),
  deleteUser: (id: string) => adminServices.users.delete(id),
  exportUsers: (params: PaginationParams = {}) => exportCSV(API_ENDPOINTS.USERS_EXPORT, params),
  
  uploadProfileImage: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('profileImage', file);
    return api.post(API_ENDPOINTS.USERS_PROFILE_IMAGE(id), formData, {
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
    exportRoles: () => exportCSV(API_ENDPOINTS.ADMIN_ROLES_EXPORT),
    
    // Centres
    getCentres: adminServices.centres.getAll,
    getAllCentres: adminServices.centres.getAllSimple,
    createCentre: adminServices.centres.create,
    updateCentre: adminServices.centres.update,
    deleteCentre: adminServices.centres.delete,
    exportCentres: (params: PaginationParams = {}) => exportCSV(API_ENDPOINTS.ADMIN_CENTRES_EXPORT, params),

    // Languages
    getLanguages: adminServices.languages.getAll,
    getAllLanguages: adminServices.languages.getAllSimple,
    createLanguage: adminServices.languages.create,
    updateLanguage: adminServices.languages.update,
    deleteLanguage: adminServices.languages.delete,
    exportLanguages: (params: PaginationParams = {}) => exportCSV(API_ENDPOINTS.ADMIN_LANGUAGES_EXPORT, params),
    
    // Statuses
    getStatuses: adminServices.statuses.getAll,
    getAllStatuses: adminServices.statuses.getAllSimple,
    createStatus: adminServices.statuses.create,
    updateStatus: adminServices.statuses.update,
    deleteStatus: adminServices.statuses.delete,
    exportStatuses: (params: PaginationParams = {}) => exportCSV(API_ENDPOINTS.ADMIN_STATUSES_EXPORT, params),
    
    // Users
    getUsers: adminServices.users.getAll,    
    // Leads
    deleteLead: (id: string) => api.delete(API_ENDPOINTS.ADMIN_LEADS_DELETE(id)),
    
    // Lead Sources
    getAllLeadSources: () => api.get(API_ENDPOINTS.LEAD_SOURCES_ALL),
  },
  
  // Lead Sources CRUD
  getLeadSources: leadServices.sources.getAll,
  createLeadSource: leadServices.sources.create,
  updateLeadSource: leadServices.sources.update,
  deleteLeadSource: leadServices.sources.delete,
  exportLeadSources: (params: PaginationParams = {}) => exportCSV(API_ENDPOINTS.LEAD_SOURCES_EXPORT, params),
  
  // Project House Types CRUD
  getProjectHouseTypes: leadServices.projectHouseTypes.getAll,
  createProjectHouseType: leadServices.projectHouseTypes.create,
  updateProjectHouseType: leadServices.projectHouseTypes.update,
  deleteProjectHouseType: leadServices.projectHouseTypes.delete,
  exportProjectHouseTypes: (params: PaginationParams = {}) => exportCSV(API_ENDPOINTS.PROJECT_HOUSE_TYPES_EXPORT, params),
  
  // Leads CRUD
  getLeads: (params: PaginationParams = {}) => {
    const queryString = buildQueryString(params);
    return api.get(`${API_ENDPOINTS.LEADS}${queryString ? `?${queryString}` : ''}`);
  },
  getLead: (id: string) => api.get(API_ENDPOINTS.LEADS_BY_ID(id)),
  getLeadActivities: (id: string) => api.get(API_ENDPOINTS.LEADS_ACTIVITIES(id)),
  getLeadTimeline: (id: string) => api.get(API_ENDPOINTS.LEADS_TIMELINE(id)),
  createLead: (leadData: any) => api.post(API_ENDPOINTS.LEADS, leadData),
  updateLead: (id: string, leadData: any) => api.put(API_ENDPOINTS.LEADS_BY_ID(id), leadData),
  deleteLead: (id: string) => api.delete(API_ENDPOINTS.LEADS_BY_ID(id)),
  createCallLog: (leadId: string) => {
    timelineService.clearCache(leadId);
    return api.post(API_ENDPOINTS.LEADS_CALL(leadId));
  },
  createActivityLog: (leadId: string, type: 'call' | 'manual', comment: string, document?: File) => {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('comment', comment);
    if (document) {
      formData.append('document', document);
    }
    timelineService.clearCache(leadId);
    return api.post(API_ENDPOINTS.LEADS_ACTIVITY(leadId), formData, {
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
    return api.post(API_ENDPOINTS.LEADS_LEAD_ACTIVITY(leadId), formData, {
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
    return api.post(API_ENDPOINTS.LEADS_PRESALES_ACTIVITY(leadId), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  exportLeads: (params: PaginationParams = {}) => exportCSV(API_ENDPOINTS.LEADS_EXPORT, params),
  exportLeadsExcel: (params: PaginationParams = {}) => exportCSV(API_ENDPOINTS.LEADS_EXPORT_EXCEL, params),
  getLeadFormData: () => api.get(API_ENDPOINTS.LEADS_FORM_DATA),
  bulkUploadLeads: (formData: FormData) => 
    api.post(API_ENDPOINTS.LEADS_BULK_UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  bulkUploadSalesLeads: (formData: FormData) => 
    api.post(API_ENDPOINTS.LEADS_BULK_UPLOAD_SALES, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  changeLanguage: (leadId: string, data: { languageId: string }) => 
    api.post(API_ENDPOINTS.LEADS_CHANGE_LANGUAGE(leadId), data),
  getUnsignedLeads: () => api.get(API_ENDPOINTS.LEADS_UNSIGNED),
  assignLead: (id: string, data: { presalesUserId?: string; salesUserId?: string }) => 
    api.post(API_ENDPOINTS.LEADS_ASSIGN(id), data),
  getAdValues: (field: 'adname' | 'adset' | 'campaign') => 
    api.get(API_ENDPOINTS.LEADS_AD_VALUES(field)),
  
  // Role-specific dashboards
  getAdminDashboard: (params: any = {}) => {
    const queryString = buildQueryString(params);
    return api.get(`${API_ENDPOINTS.DASHBOARD_ADMIN}${queryString ? `?${queryString}` : ''}`);
  },
  exportAdminDashboard: (params: any = {}) => {
    const queryString = buildQueryString(params);
    return api.get(`${API_ENDPOINTS.DASHBOARD_ADMIN}/export${queryString ? `?${queryString}` : ''}`, { responseType: 'blob' });
  },
  getAdminUsers: (type: string) => api.get(API_ENDPOINTS.DASHBOARD_ADMIN_USERS(type)),
  getAdminSources: () => api.get(API_ENDPOINTS.DASHBOARD_ADMIN_SOURCES),
  
  // Call Logs
  getCallLogs: (params: any = {}) => {
    const queryString = buildQueryString(params);
    return api.get(`/api/call-logs${queryString ? `?${queryString}` : ''}`);
  },
  exportCallLogs: (params: any = {}) => {
    const queryString = buildQueryString(params);
    return api.get(`/api/call-logs/export${queryString ? `?${queryString}` : ''}`, { responseType: 'blob' });
  },
  
  // Activity Logs
  getActivityLogs: (params: any = {}) => {
    const queryString = buildQueryString(params);
    return api.get(`/api/activity-logs${queryString ? `?${queryString}` : ''}`);
  },
  exportActivityLogs: (params: any = {}) => {
    const queryString = buildQueryString(params);
    return api.get(`/api/activity-logs/export${queryString ? `?${queryString}` : ''}`, { responseType: 'blob' });
  },
  
  // Lead Activities
  getAllLeadActivities: (params: any = {}) => {
    const queryString = buildQueryString(params);
    return api.get(`/api/lead-activities${queryString ? `?${queryString}` : ''}`);
  },
  exportLeadActivities: (params: PaginationParams = {}) => exportCSV(API_ENDPOINTS.LEAD_ACTIVITIES_EXPORT, params),
};

export default api;