import api from '@/lib/api';

export const s3DocumentService = {
  // Upload document with S3 support
  uploadDocument: async (formData: FormData, useS3: boolean = true) => {
    // Add S3 flag to form data
    formData.append('useS3', useS3.toString());
    
    const response = await api.post('/api/s3-documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data || response.data;
  },

  // Get documents
  getDocuments: async (folderId?: string, keyword?: string, keywords?: string[], categories?: string[], startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (folderId) params.append('folderId', folderId);
    if (keyword) params.append('keyword', keyword);
    if (keywords && keywords.length > 0) params.append('keywords', keywords.join(','));
    if (categories && categories.length > 0) params.append('categories', categories.join(','));
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/api/s3-documents?${params.toString()}`);
    return response.data.data?.documents || response.data.documents || response.data;
  },

  // Get single document
  getDocument: async (id: string) => {
    const response = await api.get(`/api/s3-documents/${id}`);
    return response.data.data || response.data;
  },

  // Download document (works for both S3 and local)
  downloadDocument: async (id: string) => {
    try {
      const response = await api.get(`/api/s3-documents/${id}/download`, {
        responseType: 'blob'
      });
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

  // View/Preview document (works for both S3 and local)
  viewDocument: async (id: string) => {
    const response = await api.get(`/api/s3-documents/${id}/view`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Delete document
  deleteDocument: async (id: string) => {
    const response = await api.delete(`/api/s3-documents/${id}`);
    return response.data.data || response.data;
  },

  // Update document
  updateDocument: async (id: string, data: { title?: string; subtitle?: string; category?: string; keywords?: string[] }) => {
    const response = await api.put(`/api/s3-documents/${id}`, data);
    return response.data.data || response.data;
  },

  // Get S3 presigned URL (for future direct uploads)
  getS3PresignedUrl: async (fileName: string, fileType: string) => {
    const response = await api.post('/api/s3-documents/s3-presigned-url', {
      fileName,
      fileType
    });
    return response.data.data || response.data;
  }
};

// Helper function to determine if document is stored in S3
export const isS3Document = (document: any): boolean => {
  return document.storageType === 's3' && document.s3Url;
};

// Helper function to get document URL for preview
export const getDocumentPreviewUrl = (document: any): string => {
  if (isS3Document(document)) {
    return `/api/s3-documents/${document._id}/view`;
  }
  return `/api/documents/${document._id}/view`;
};

// Helper function to get document download URL
export const getDocumentDownloadUrl = (document: any): string => {
  if (isS3Document(document)) {
    return `/api/s3-documents/${document._id}/download`;
  }
  return `/api/documents/${document._id}/download`;
};