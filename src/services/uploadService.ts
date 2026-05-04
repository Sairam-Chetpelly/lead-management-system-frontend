import axios from 'axios';
import { WatermarkService } from './watermarkService';

// API Configuration
const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api',
  TIMEOUT: 500000,
  API_KEY: process.env.NEXT_PUBLIC_API_KEY || 'lms-secure-api-key-2024',
};

// Create axios instance for upload service
const createApiInstance = () => {
  const instance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_CONFIG.API_KEY,
    },
  });

  // Add token to requests
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return instance;
};

interface UploadUrl {
  key: string;
  url: string;
  publicUrl: string;
}

interface UploadParams {
  folderId?: string;
  category: string;
  title?: string;
  subtitle?: string;
  keywords?: string[];
  description?: string;
}

export class UploadService {
  // Get presigned upload URL for direct S3 upload
  static async getUploadUrl(fileName: string, fileType: string, folderId?: string): Promise<UploadUrl> {
    const api = createApiInstance();
    const response = await api.post('/api/documents/upload-urls', {
      fileName,
      fileType,
      folderId
    });
    return response.data.data;
  }

  // Upload file directly to S3 using presigned URL
  static async uploadToS3(
    url: string, 
    file: File, 
    contentType: string, 
    onProgress?: (progress: number) => void
  ): Promise<void> {
    await axios.put(url, file, {
      headers: { 'Content-Type': contentType },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
  }

  // Create document record after S3 upload
  static async createDocument(params: {
    s3Key: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  } & UploadParams) {
    const api = createApiInstance();
    const response = await api.post('/api/documents/create', {
      s3Key: params.s3Key,
      fileName: params.fileName,
      fileSize: params.fileSize,
      fileType: params.fileType,
      folderId: params.folderId,
      category: params.category,
      title: params.title,
      subtitle: params.subtitle,
      keywords: params.keywords,
      description: params.description
    });
    return response.data.data;
  }

  // Complete upload process with watermark (get URL, add watermark, upload to S3, create document)
  static async uploadDocument(
    file: File,
    params: UploadParams,
    onProgress?: (progress: number) => void
  ) {
    try {
      // Step 1: Add watermark if supported
      onProgress?.(5);
      let processedFile = file;
      if (WatermarkService.supportsWatermark(file)) {
        try {
          processedFile = await WatermarkService.addWatermark(file);
          onProgress?.(15);
        } catch (error) {
          console.warn('Watermark failed, uploading original file:', error);
          onProgress?.(15);
        }
      } else {
        onProgress?.(15);
      }
      
      // Step 2: Get presigned URL
      onProgress?.(20);
      const uploadUrl = await this.getUploadUrl(processedFile.name, processedFile.type, params.folderId);
      
      // Step 3: Upload directly to S3
      onProgress?.(25);
      await this.uploadToS3(uploadUrl.url, processedFile, processedFile.type, (progress) => {
        // Map S3 upload progress to 25-90%
        onProgress?.(25 + (progress * 0.65));
      });
      
      // Step 4: Create document record
      onProgress?.(95);
      const document = await this.createDocument({
        s3Key: uploadUrl.key,
        fileName: file.name, // Use original filename
        fileSize: processedFile.size, // Use processed file size
        fileType: processedFile.type, // Use processed file type
        ...params
      });
      
      onProgress?.(100);
      return document;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }
}

export const uploadService = UploadService;