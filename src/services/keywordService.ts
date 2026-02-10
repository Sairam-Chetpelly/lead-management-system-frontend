import api from '@/lib/api';

export const keywordService = {
  // Create keyword
  createKeyword: async (data: { name: string }) => {
    const response = await api.post('/api/keywords', data);
    return response.data;
  },

  // Get all keywords with pagination
  getAllKeywords: async (params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const response = await api.get(`/api/keywords${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
    return response.data;
  },

  // Get single keyword
  getKeyword: async (id: string) => {
    const response = await api.get(`/api/keywords/${id}`);
    return response.data;
  },

  // Update keyword
  updateKeyword: async (id: string, data: { name: string }) => {
    const response = await api.put(`/api/keywords/${id}`, data);
    return response.data;
  },

  // Delete keyword
  deleteKeyword: async (id: string) => {
    const response = await api.delete(`/api/keywords/${id}`);
    return response.data;
  }
};
