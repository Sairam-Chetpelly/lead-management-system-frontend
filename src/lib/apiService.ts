import api from './api';

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
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      const queryString = queryParams.toString();
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
  roles: createApiService('/api/admin/roles'),
  centres: createApiService('/api/admin/centres'),
  languages: createApiService('/api/admin/languages'),
  statuses: createApiService('/api/admin/statuses'),
  users: createApiService('/api/users')
};

export const leadServices = {
  sources: createApiService('/api/lead-sources'),
  projectHouseTypes: createApiService('/api/project-house-types')
};