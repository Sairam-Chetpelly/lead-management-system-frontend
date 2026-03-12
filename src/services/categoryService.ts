import api from '@/lib/api';

export const categoryService = {
  // Create category
  createCategory: async (data: { name: string }) => {
    const response = await api.post('/api/categories', data);
    return response.data.data || response.data;
  },

  // Get all categories
  getCategories: async () => {
    const response = await api.get('/api/categories');
    return response.data.data?.categories || response.data.categories || response.data;
  },

  // Update category
  updateCategory: async (id: string, data: { name: string }) => {
    const response = await api.put(`/api/categories/${id}`, data);
    return response.data.data || response.data;
  },

  // Delete category
  deleteCategory: async (id: string) => {
    const response = await api.delete(`/api/categories/${id}`);
    return response.data.data || response.data;
  }
};
