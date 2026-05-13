import axios from 'axios';

// API Configuration
const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  S3_BASE_URL: process.env.NEXT_PUBLIC_S3_BASE_URL || '',
  TIMEOUT: 3600000,
  API_KEY: process.env.NEXT_PUBLIC_API_KEY || 'lms-secure-api-key-2024',
};

// Create axios instance
const createApiInstance = () => {
  const instance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_CONFIG.API_KEY,
    },
  });

  // Add auth token
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  return instance;
};

interface DownloadOptions {
  method?: 'direct' | 'backend' | 'auto';
  trackDownload?: boolean;
  zipMethod?: 'frontend' | 'backend' | 'auto';
  onProgress?: (progress: number, status: string) => void;
}

export class DownloadService {

  // Ensure proper file extension
  static ensureFileExtension(
    fileName: string,
    s3Key?: string,
    mimeType?: string
  ): string {

    // Already has extension
    if (/\.[a-zA-Z0-9]+$/.test(fileName)) {
      return fileName;
    }

    let extension = '';

    // From s3 key
    if (s3Key) {
      const s3Extension = s3Key.match(/\.([a-zA-Z0-9]+)$/);

      if (s3Extension) {
        extension = '.' + s3Extension[1];
      }
    }

    // From mime type
    if (!extension && mimeType) {

      const mimeExtensions: { [key: string]: string } = {
        'application/pdf': '.pdf',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'application/vnd.ms-excel': '.xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
        'application/vnd.ms-powerpoint': '.ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',

        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'image/svg+xml': '.svg',

        'video/mp4': '.mp4',
        'video/avi': '.avi',
        'video/quicktime': '.mov',

        'audio/mpeg': '.mp3',
        'audio/wav': '.wav',
        'audio/ogg': '.ogg',

        'text/plain': '.txt',
        'text/csv': '.csv',

        'application/json': '.json',
        'application/xml': '.xml',

        'application/zip': '.zip',
        'application/x-rar-compressed': '.rar',
      };

      extension = mimeExtensions[mimeType] || '';
    }

    return fileName + extension;
  }

  // Check download limit
  static async checkDownloadLimit(): Promise<{
    canDownload: boolean;
    downloadsToday: number;
    limit: number;
    isAdmin: boolean;
  }> {

    try {

      const api = createApiInstance();

      const response = await api.get('/api/documents/download-limit');

      return response.data.data;

    } catch (error: any) {

      console.error('Failed to check download limit:', error);

      return {
        canDownload: true,
        downloadsToday: 0,
        limit: 50,
        isAdmin: false,
      };
    }
  }

  // Log download
  static async logDownload(documentId: string): Promise<void> {

    try {

      const api = createApiInstance();

      await api.post('/api/documents/log-download', {
        documentId,
      });

    } catch (error: any) {

      console.error('Failed to log download:', error);
    }
  }

  // FORCE DOWNLOAD FROM S3
  // This downloads ALL file types without opening new tab
  static async downloadDirectFromS3(
    s3Key: string,
    fileName: string,
    onProgress?: (progress: number, status: string) => void
  ): Promise<void> {

    try {

      onProgress?.(0, 'Preparing download...');

      const s3Url = `${API_CONFIG.S3_BASE_URL}${s3Key}`;

      const finalFileName = this.ensureFileExtension(
        fileName,
        s3Key
      );

      onProgress?.(20, 'Fetching file...');

      // Fetch file as blob
      const response = await fetch(s3Url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }

      onProgress?.(50, 'Processing file...');

      // Convert to blob
      const blob = await response.blob();

      // Create blob URL
      const blobUrl = window.URL.createObjectURL(blob);

      onProgress?.(80, 'Starting download...');

      // Create hidden download link
      const link = document.createElement('a');

      // IMPORTANT
      link.href = blobUrl;

      // FORCE DOWNLOAD
      link.setAttribute('download', finalFileName);

      // Prevent open in new tab
      link.setAttribute('target', '_self');

      link.style.display = 'none';

      document.body.appendChild(link);

      // Trigger download
      link.click();

      // Cleanup
      document.body.removeChild(link);

      // Revoke URL later
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 2000);

      onProgress?.(100, 'Download completed!');

    } catch (error: any) {

      console.error('Direct S3 download failed:', error);

      throw new Error(
        error?.message || 'Failed to download file directly from storage'
      );
    }
  }

  // Backend download
  static async downloadViaBackend(
    documentId: string,
    fileName: string,
    onProgress?: (progress: number, status: string) => void
  ): Promise<void> {

    try {

      onProgress?.(0, 'Connecting to server...');

      const api = createApiInstance();

      onProgress?.(30, 'Requesting file...');

      const response = await api.get(
        `/api/documents/${documentId}/download`,
        {
          responseType: 'blob',
        }
      );

      onProgress?.(60, 'Processing file...');

      const blob = new Blob([response.data]);

      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');

      // IMPORTANT
      link.href = blobUrl;

      // FORCE DOWNLOAD
      link.setAttribute('download', fileName);

      // Prevent open
      link.setAttribute('target', '_self');

      link.style.display = 'none';

      document.body.appendChild(link);

      // Trigger
      link.click();

      // Cleanup
      document.body.removeChild(link);

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 2000);

      onProgress?.(100, 'Download completed!');

    } catch (error: any) {

      console.error('Backend download failed:', error);

      throw new Error('Download failed');
    }
  }

  // Smart download
  static async downloadDocument(
    documentId: string,
    fileName: string,
    s3Key?: string,
    options: DownloadOptions = {}
  ): Promise<void> {

    const {
      method = 'auto',
      trackDownload = true,
      onProgress,
    } = options;

    try {

      onProgress?.(0, 'Checking permissions...');

      // Check limits
      if (trackDownload) {

        const limitCheck = await this.checkDownloadLimit();

        if (!limitCheck.canDownload && !limitCheck.isAdmin) {

          throw new Error(
            `Daily download limit reached (${limitCheck.downloadsToday}/${limitCheck.limit})`
          );
        }
      }

      onProgress?.(5, 'Preparing download...');

      // Determine method
      let downloadMethod = method;

      if (method === 'auto') {

        downloadMethod =
          (s3Key && API_CONFIG.S3_BASE_URL)
            ? 'direct'
            : 'backend';
      }

      // Direct download
      if (downloadMethod === 'direct' && s3Key) {

        await this.downloadDirectFromS3(
          s3Key,
          fileName,
          onProgress
        );

        // Track
        if (trackDownload) {
          await this.logDownload(documentId);
        }

      } else {

        // Backend
        await this.downloadViaBackend(
          documentId,
          fileName,
          onProgress
        );
      }

    } catch (error: any) {

      console.error('Download failed:', error);

      throw error;
    }
  }

  // Multiple document download
  static async downloadMultipleDocuments(
    documentIds: string[],
    options: {
      zipMethod?: 'frontend' | 'backend' | 'auto';
      onProgress?: (progress: number, status: string) => void;
    } = {}
  ): Promise<void> {

    const {
      zipMethod = 'auto',
      onProgress,
    } = options;

    try {

      let useMethod = zipMethod;

      if (zipMethod === 'auto') {

        const { frontendZipService } = await import('./frontendZipService');

        useMethod = frontendZipService.isSupported()
          ? 'frontend'
          : 'backend';
      }

      // Frontend ZIP
      if (useMethod === 'frontend') {

        const api = createApiInstance();

        const response = await api.post(
          '/api/documents/details',
          { documentIds }
        );

        const documents = response.data.data || response.data;

        const { frontendZipService } = await import('./frontendZipService');

        await frontendZipService.createDocumentZip(
          documents,
          undefined,
          onProgress
        );

      } else {

        // Backend ZIP
        const api = createApiInstance();

        const response = await api.post(
          '/api/documents/multi-download',
          { documentIds },
          {
            responseType: 'blob',
          }
        );

        const blob = new Blob([response.data]);

        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');

        link.href = blobUrl;
        link.setAttribute(
          'download',
          `documents_${Date.now()}.zip`
        );

        link.style.display = 'none';

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
        }, 2000);
      }

    } catch (error: any) {

      console.error('Bulk download failed:', error);

      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        'Bulk download failed'
      );
    }
  }

  // Folder download
  static async downloadFolder(
    folderId: string,
    folderName: string,
    options: {
      zipMethod?: 'frontend' | 'backend' | 'auto';
      onProgress?: (progress: number, status: string) => void;
    } = {}
  ): Promise<void> {

    const {
      zipMethod = 'auto',
      onProgress,
    } = options;

    try {

      let useMethod = zipMethod;

      if (zipMethod === 'auto') {

        const { frontendZipService } = await import('./frontendZipService');

        useMethod = frontendZipService.isSupported()
          ? 'frontend'
          : 'backend';
      }

      // Frontend ZIP
      if (useMethod === 'frontend') {

        const { frontendZipService } = await import('./frontendZipService');

        await frontendZipService.createFolderZip(
          folderId,
          folderName,
          onProgress
        );

      } else {

        // Backend ZIP
        const api = createApiInstance();

        const response = await api.get(
          `/api/folders/${folderId}/download`,
          {
            responseType: 'blob',
          }
        );

        const blob = new Blob([response.data]);

        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');

        link.href = blobUrl;

        link.setAttribute(
          'download',
          `${folderName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.zip`
        );

        link.style.display = 'none';

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
        }, 2000);
      }

    } catch (error: any) {

      console.error('Folder download failed:', error);

      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        'Folder download failed'
      );
    }
  }

  // Download stats
  static async getDownloadStats(): Promise<{
    downloadsToday: number;
    totalDownloads: number;
    limit: number;
  }> {

    try {

      const api = createApiInstance();

      const response = await api.get(
        '/api/documents/download-stats'
      );

      return response.data.data;

    } catch (error: any) {

      console.error('Failed to get download stats:', error);

      return {
        downloadsToday: 0,
        totalDownloads: 0,
        limit: 50,
      };
    }
  }
}

export const downloadService = DownloadService;