import api from './api';
import { API_ENDPOINTS, buildQueryString } from '@/config/apiEndpoints';

interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: any;
}

/**
 * Generic API service factory for CRUD operations
 * @param baseEndpoint - Base API endpoint (e.g., '/api/admin/roles')
 * @returns Object with CRUD methods
 */
export const createApiService = (baseEndpoint: string) => {
  return {
    // Get all items with pagination
    getAll: (params: PaginationParams = {}) => {
      const queryString = buildQueryString(params);
      return api.get(`${baseEndpoint}${queryString ? `?${queryString}` : ''}`);
    },

    // Get all items without pagination (for dropdowns)
    getAllSimple: () => api.get(`${baseEndpoint}/all`),

    // Get single item by ID
    getById: (id: string) => api.get(`${baseEndpoint}/${id}`),

    // Create new item
    create: (data: any) => api.post(baseEndpoint, data),

    // Update item
    update: (id: string, data: any) => api.put(`${baseEndpoint}/${id}`, data),

    // Delete item
    delete: (id: string) => api.delete(`${baseEndpoint}/${id}`),

    // Export items
    export: () => api.get(`${baseEndpoint}/export`)
  };
};

// Pre-configured services
export const adminServices = {
  roles: createApiService(API_ENDPOINTS.ADMIN_ROLES),
  centres: createApiService(API_ENDPOINTS.ADMIN_CENTRES),
  languages: createApiService(API_ENDPOINTS.ADMIN_LANGUAGES),
  statuses: createApiService(API_ENDPOINTS.ADMIN_STATUSES),
  users: createApiService(API_ENDPOINTS.USERS),
  usersAll: createApiService(API_ENDPOINTS.USERS_ALL)
};

export const leadServices = {
  sources: createApiService(API_ENDPOINTS.LEAD_SOURCES),
  projectHouseTypes: createApiService(API_ENDPOINTS.PROJECT_HOUSE_TYPES)
};