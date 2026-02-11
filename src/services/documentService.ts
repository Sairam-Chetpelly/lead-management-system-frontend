import api from '@/lib/api';

export const documentService = {
  // Upload document
  uploadDocument: async (formData: FormData) => {
    const response = await api.post('/api/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Get documents
  getDocuments: async (folderId?: string, keyword?: string, keywords?: string[]) => {
    const params = new URLSearchParams();
    if (folderId) params.append('folderId', folderId);
    if (keyword) params.append('keyword', keyword);
    if (keywords && keywords.length > 0) params.append('keywords', keywords.join(','));
    const response = await api.get(`/api/documents?${params.toString()}`);
    return response.data;
  },

  // Get single document
  getDocument: async (id: string) => {
    const response = await api.get(`/api/documents/${id}`);
    return response.data;
  },

  // Download document
  downloadDocument: async (id: string) => {
    const response = await api.get(`/api/documents/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Delete document
  deleteDocument: async (id: string) => {
    const response = await api.delete(`/api/documents/${id}`);
    return response.data;
  },

  // Update document
  updateDocument: async (id: string, data: { title?: string; subtitle?: string; category?: string; keywords?: string[] }) => {
    const response = await api.put(`/api/documents/${id}`, data);
    return response.data;
  }
};
