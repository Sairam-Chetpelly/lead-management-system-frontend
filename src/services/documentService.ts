import api from '@/lib/api';

interface S3UploadResponse {
  uploadType: 'single' | 'multipart';
  s3Key: string;
  presignedUrl?: string;
  uploadId?: string;
  totalParts?: number;
  presignedUrls?: Array<{ partNumber: number; presignedUrl: string }>;
}

interface UploadPart {
  partNumber: number;
  etag: string;
}

export const documentService = {
  // Initialize S3 upload
  initializeS3Upload: async (fileName: string, fileSize: number, fileType: string, folderId?: string): Promise<S3UploadResponse> => {
    const response = await api.post('/api/documents/s3/initialize', {
      fileName,
      fileSize,
      fileType,
      folderId
    });
    return response.data.data;
  },

  // Upload file to S3 (single upload)
  uploadToS3Single: async (presignedUrl: string, file: File): Promise<void> => {
    await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
  },

  // Upload file chunk to S3 (multipart)
  uploadChunkToS3: async (presignedUrl: string, chunk: Blob): Promise<string> => {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: chunk,
    });
    
    const etag = response.headers.get('ETag');
    if (!etag) {
      throw new Error('Failed to get ETag from S3 response');
    }
    return etag;
  },

  // Complete S3 upload
  completeS3Upload: async (uploadData: {
    s3Key: string;
    uploadId?: string;
    parts?: UploadPart[];
    fileName: string;
    fileSize: number;
    fileType: string;
    category?: string;
    description?: string;
    folderId?: string;
    keywords?: string[];
    title?: string;
    subtitle?: string;
  }) => {
    const response = await api.post('/api/documents/s3/complete', uploadData);
    return response.data.data;
  },

  // Abort S3 upload
  abortS3Upload: async (s3Key: string, uploadId: string): Promise<void> => {
    await api.post('/api/documents/s3/abort', { s3Key, uploadId });
  },

  // Upload large file with progress
  uploadLargeFile: async (
    file: File,
    metadata: {
      folderId?: string;
      description?: string;
      keywords?: string[];
      title?: string;
      subtitle?: string;
      category?: string;
    },
    onProgress?: (progress: number) => void
  ) => {
    const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB chunks for better performance with large files
    
    try {
      console.log('Starting large file upload:', file.name, file.size, 'bytes');
      onProgress?.(1); // Start progress
      
      // Initialize upload
      const initResponse = await documentService.initializeS3Upload(
        file.name,
        file.size,
        file.type,
        metadata.folderId
      );

      console.log('S3 upload initialized:', initResponse.uploadType);
      onProgress?.(5); // Initialization complete

      if (initResponse.uploadType === 'single') {
        console.log('Using single upload method');
        // Single upload for smaller files with realistic progress simulation
        onProgress?.(10);
        
        // Start upload and simulate progress
        const uploadPromise = documentService.uploadToS3Single(initResponse.presignedUrl!, file);
        
        // More realistic progress simulation
        let progress = 10;
        const progressInterval = setInterval(() => {
          if (progress < 80) {
            progress += Math.random() * 12 + 3; // 3-15% increments
            const newProgress = Math.min(progress, 80);
            console.log(`Single upload progress: ${Math.round(newProgress)}%`);
            onProgress?.(Math.round(newProgress));
          }
        }, 1000); // Update every 1000ms
        
        await uploadPromise;
        clearInterval(progressInterval);
        onProgress?.(85);
        
        console.log('Single upload completed, completing S3 upload...');
        const result = await documentService.completeS3Upload({
          s3Key: initResponse.s3Key,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          ...metadata
        });
        
        onProgress?.(100);
        console.log('Large file upload completed successfully');
        return result;
      } else {
        console.log('Using multipart upload method');
        // Multipart upload for large files with real chunk progress
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const parts: UploadPart[] = [];
        
        console.log(`Starting multipart upload: ${totalChunks} chunks of ${CHUNK_SIZE} bytes each`);
        
        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);
          
          const presignedUrlData = initResponse.presignedUrls!.find(p => p.partNumber === i + 1);
          if (!presignedUrlData) {
            throw new Error(`Missing presigned URL for part ${i + 1}`);
          }
          
          console.log(`Uploading chunk ${i + 1}/${totalChunks} (${start}-${end})`);
          
          const etag = await documentService.uploadChunkToS3(presignedUrlData.presignedUrl, chunk);
          parts.push({ partNumber: i + 1, etag });
          
          // Calculate progress: 5% for init + 75% for chunks + 20% for completion
          const chunkProgress = 5 + ((i + 1) / totalChunks) * 75;
          onProgress?.(Math.round(chunkProgress));
          
          console.log(`Chunk ${i + 1}/${totalChunks} uploaded successfully (${Math.round(chunkProgress)}%)`);
        }
        
        onProgress?.(85); // Starting completion
        console.log('All chunks uploaded, completing multipart upload...');
        
        const result = await documentService.completeS3Upload({
          s3Key: initResponse.s3Key,
          uploadId: initResponse.uploadId,
          parts,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          ...metadata
        });
        
        onProgress?.(100);
        console.log('Multipart upload completed successfully');
        return result;
      }
    } catch (error) {
      console.error('Large file upload failed:', error);
      throw error;
    }
  },
  // Upload document (now uses S3 by default)
  uploadDocument: async (formData: FormData) => {
    // For small files, use the legacy endpoint which now uploads to S3
    const response = await api.post('/api/documents/upload', formData, {
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
    const response = await api.get(`/api/documents?${params.toString()}`);
    return response.data.data?.documents || response.data.documents || response.data;
  },

  // Get single document
  getDocument: async (id: string) => {
    const response = await api.get(`/api/documents/${id}`);
    return response.data.data || response.data;
  },

  // Download document
  downloadDocument: async (id: string) => {
    const response = await api.get(`/api/documents/${id}/download`, {
      responseType: 'blob'
    });
    
    // Get filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'download';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    // Create download URL from blob
    const url = window.URL.createObjectURL(response.data);
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    // Add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up blob URL
    window.URL.revokeObjectURL(url);
    
    return response.data;
  },

  // Delete document
  deleteDocument: async (id: string) => {
    const response = await api.delete(`/api/documents/${id}`);
    return response.data.data || response.data;
  },

  // Update document
  updateDocument: async (id: string, data: { title?: string; subtitle?: string; category?: string; keywords?: string[] }) => {
    const response = await api.put(`/api/documents/${id}`, data);
    return response.data.data || response.data;
  }
};
