import api from '@/lib/api';

export const folderService = {
  // Create folder
  createFolder: async (data: { name: string; parentFolderId?: string }) => {
    const response = await api.post('/api/folders', data);
    return response.data;
  },

  // Get folders
  getFolders: async (parentFolderId?: string) => {
    const params = parentFolderId ? `?parentFolderId=${parentFolderId}` : '';
    const response = await api.get(`/api/folders${params}`);
    return response.data;
  },

  // Get folder contents
  getFolderContents: async (id: string) => {
    const response = await api.get(`/api/folders/${id}`);
    return response.data;
  },

  // Update folder
  updateFolder: async (id: string, data: { name: string }) => {
    const response = await api.put(`/api/folders/${id}`, data);
    return response.data;
  },

  // Delete folder
  deleteFolder: async (id: string) => {
    const response = await api.delete(`/api/folders/${id}`);
    return response.data;
  },

  // Update folder
  updateFolder: async (id: string, data: { name: string }) => {
    const response = await api.put(`/api/folders/${id}`, data);
    return response.data;
  }
};
