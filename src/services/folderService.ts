import api from '@/lib/api';

export const folderService = {
  // Create folder
  createFolder: async (data: { name: string; parentFolderId?: string; restricted?: boolean }) => {
    const response = await api.post('/api/folders', data);
    return response.data.data || response.data;
  },

  // Get folders
  getFolders: async (parentFolderId?: string) => {
    const params = parentFolderId ? `?parentFolderId=${parentFolderId}` : '';
    const response = await api.get(`/api/folders${params}`);
    return response.data.data?.folders || response.data.folders || response.data;
  },

  // Get all folders (for tree view)
  getAllFolders: async () => {
    const response = await api.get('/api/folders/all');
    return response.data.data?.folders || response.data.folders || response.data;
  },

  // Get folder contents
  getFolderContents: async (id: string) => {
    const response = await api.get(`/api/folders/${id}`);
    return response.data.data || response.data;
  },

  // Update folder
  updateFolder: async (id: string, data: { name: string; restricted?: boolean }) => {
    const response = await api.put(`/api/folders/${id}`, data);
    return response.data.data || response.data;
  },

  // Delete folder
  deleteFolder: async (id: string) => {
    const response = await api.delete(`/api/folders/${id}`);
    return response.data.data || response.data;
  },

  // Multi-download documents
  multiDownload: async (documentIds: string[]) => {
    try {
      const response = await api.post('/api/folders/multi-download', 
        { documentIds },
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error: any) {
      // Handle blob error responses
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          const jsonError = JSON.parse(text);
          throw { ...error, response: { ...error.response, data: jsonError } };
        } catch {
          throw error;
        }
      }
      throw error;
    }
  },

  // Download entire folder
  downloadFolder: async (folderId: string) => {
    try {
      const response = await api.get(`/api/folders/${folderId}/download`, 
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error: any) {
      // Handle blob error responses
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          const jsonError = JSON.parse(text);
          throw { ...error, response: { ...error.response, data: jsonError } };
        } catch {
          throw error;
        }
      }
      throw error;
    }
  }
};
