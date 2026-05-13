import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { downloadService } from './downloadService';

// API Configuration
const API_CONFIG = {
  S3_BASE_URL: process.env.NEXT_PUBLIC_S3_BASE_URL || '',
  API_KEY: process.env.NEXT_PUBLIC_API_KEY || 'lms-secure-api-key-2024',
};

interface ProgressCallback {
  (progress: number, status: string): void;
}

interface DocumentInfo {
  _id: string;
  fileName: string;
  s3Key: string;
  fileType: string;
  fileSize?: number;
  folderPath?: string;
}

interface FolderInfo {
  _id: string;
  name: string;
  path?: string;
}

export class FrontendZipService {
  // Download a single file as blob
  private static async downloadFileAsBlob(s3Key: string, fileName: string): Promise<{ blob: Blob; fileName: string }> {
    try {
      const s3Url = `${API_CONFIG.S3_BASE_URL}${s3Key}`;
      
      // Try with no-cors mode first to avoid CORS issues
      let response;
      try {
        response = await fetch(s3Url, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache'
        });
      } catch (corsError) {
        // Fallback to no-cors mode
        response = await fetch(s3Url, {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-cache'
        });
      }
      
      if (!response.ok && response.status !== 0) { // status 0 is normal for no-cors
        throw new Error(`Failed to download ${fileName}: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Verify blob has content
      if (blob.size === 0) {
        throw new Error(`Downloaded file ${fileName} is empty`);
      }
      
      return { blob, fileName };
    } catch (error) {
      console.error(`Error downloading ${fileName}:`, error);
      throw error;
    }
  }

  // Create ZIP from multiple documents
  static async createDocumentZip(
    documents: DocumentInfo[],
    zipName: string = `documents_${Date.now()}.zip`,
    onProgress?: ProgressCallback
  ): Promise<void> {
    try {
      onProgress?.(0, 'Initializing ZIP creation...');
      
      // Check download limits first
      const limitCheck = await downloadService.checkDownloadLimit();
      if (!limitCheck.canDownload && !limitCheck.isAdmin) {
        throw new Error(`Daily download limit reached (${limitCheck.downloadsToday}/${limitCheck.limit}). Limit resets at midnight.`);
      }

      if (!limitCheck.isAdmin && limitCheck.downloadsToday + documents.length > limitCheck.limit) {
        throw new Error(`Daily download limit exceeded. You can download ${limitCheck.limit - limitCheck.downloadsToday} more documents today.`);
      }

      const zip = new JSZip();
      const totalFiles = documents.length;
      let processedFiles = 0;

      onProgress?.(5, `Downloading ${totalFiles} files...`);

      // Download all files and add to ZIP
      for (const doc of documents) {
        try {
          onProgress?.(
            5 + (processedFiles / totalFiles) * 80, 
            `Downloading ${doc.fileName}... (${processedFiles + 1}/${totalFiles})`
          );

          const { blob, fileName } = await this.downloadFileAsBlob(doc.s3Key, doc.fileName);
          
          // Ensure proper file extension
          const finalFileName = downloadService.ensureFileExtension 
            ? downloadService.ensureFileExtension(fileName, doc.s3Key, doc.fileType)
            : fileName;
          
          zip.file(finalFileName, blob);
          processedFiles++;

          // Log download for tracking (for non-admin users)
          if (!limitCheck.isAdmin) {
            try {
              await downloadService.logDownload(doc._id);
            } catch (logError) {
              console.warn('Failed to log download:', logError);
            }
          }
        } catch (error) {
          console.error(`Failed to download ${doc.fileName}:`, error);
          // Skip failed files instead of adding error files
          processedFiles++;
        }
      }

      onProgress?.(85, 'Creating ZIP file...');

      // Generate ZIP
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      onProgress?.(95, 'Downloading ZIP file...');

      // Download ZIP
      saveAs(zipBlob, zipName);

      onProgress?.(100, 'Download complete!');
    } catch (error) {
      console.error('ZIP creation failed:', error);
      throw error;
    }
  }

  // Create ZIP from folder structure
  static async createFolderZip(
    folderId: string,
    folderName: string,
    onProgress?: ProgressCallback
  ): Promise<void> {
    try {
      onProgress?.(0, 'Loading folder structure...');

      // Get folder structure from backend
      const folderData = await this.getFolderStructure(folderId);
      
      if (!folderData.documents || folderData.documents.length === 0) {
        throw new Error('No documents found in this folder');
      }

      // Check download limits
      const limitCheck = await downloadService.checkDownloadLimit();
      if (!limitCheck.canDownload && !limitCheck.isAdmin) {
        throw new Error(`Daily download limit reached (${limitCheck.downloadsToday}/${limitCheck.limit}). Limit resets at midnight.`);
      }

      if (!limitCheck.isAdmin && limitCheck.downloadsToday + folderData.documents.length > limitCheck.limit) {
        throw new Error(`Daily download limit exceeded. This folder contains ${folderData.documents.length} documents. You can download ${limitCheck.limit - limitCheck.downloadsToday} more documents today.`);
      }

      onProgress?.(10, 'Creating folder structure...');

      const zip = new JSZip();
      const totalFiles = folderData.documents.length;
      let processedFiles = 0;

      // Create folder structure and download files
      for (const doc of folderData.documents) {
        try {
          onProgress?.(
            10 + (processedFiles / totalFiles) * 75,
            `Downloading ${doc.fileName}... (${processedFiles + 1}/${totalFiles})`
          );

          const { blob, fileName } = await this.downloadFileAsBlob(doc.s3Key, doc.fileName);
          
          // Ensure proper file extension
          const finalFileName = downloadService.ensureFileExtension 
            ? downloadService.ensureFileExtension(fileName, doc.s3Key, doc.fileType)
            : fileName;

          // Create file path with folder structure
          const filePath = doc.folderPath ? `${doc.folderPath}${finalFileName}` : finalFileName;
          zip.file(filePath, blob);
          
          processedFiles++;

          // Log download for tracking (for non-admin users)
          if (!limitCheck.isAdmin) {
            try {
              await downloadService.logDownload(doc._id);
            } catch (logError) {
              console.warn('Failed to log download:', logError);
            }
          }
        } catch (error) {
          console.error(`Failed to download ${doc.fileName}:`, error);
          // Skip failed files instead of adding error files
          processedFiles++;
        }
      }

      onProgress?.(85, 'Creating ZIP file...');

      // Generate ZIP
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      onProgress?.(95, 'Downloading ZIP file...');

      // Download ZIP
      const zipName = `${folderName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.zip`;
      saveAs(zipBlob, zipName);

      onProgress?.(100, 'Download complete!');
    } catch (error) {
      console.error('Folder ZIP creation failed:', error);
      throw error;
    }
  }

  // Get folder structure from backend
  private static async getFolderStructure(folderId: string): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/folders/${folderId}/structure`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-api-key': API_CONFIG.API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get folder structure: ${response.status}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Failed to get folder structure:', error);
      throw error;
    }
  }

  // Create ZIP from mixed selection (documents and folders)
  static async createMixedZip(
    documents: DocumentInfo[],
    folders: FolderInfo[],
    zipName: string = `mixed_download_${Date.now()}.zip`,
    onProgress?: ProgressCallback
  ): Promise<void> {
    try {
      onProgress?.(0, 'Preparing download...');

      const zip = new JSZip();
      let totalFiles = documents.length;
      let processedFiles = 0;

      // First, get all documents from folders
      const allFolderDocuments: DocumentInfo[] = [];
      for (const folder of folders) {
        try {
          const folderData = await this.getFolderStructure(folder._id);
          if (folderData.documents) {
            allFolderDocuments.push(...folderData.documents);
          }
        } catch (error) {
          console.error(`Failed to get folder ${folder.name}:`, error);
        }
      }

      totalFiles += allFolderDocuments.length;

      // Check download limits
      const limitCheck = await downloadService.checkDownloadLimit();
      if (!limitCheck.canDownload && !limitCheck.isAdmin) {
        throw new Error(`Daily download limit reached (${limitCheck.downloadsToday}/${limitCheck.limit}). Limit resets at midnight.`);
      }

      if (!limitCheck.isAdmin && limitCheck.downloadsToday + totalFiles > limitCheck.limit) {
        throw new Error(`Daily download limit exceeded. Total files: ${totalFiles}. You can download ${limitCheck.limit - limitCheck.downloadsToday} more documents today.`);
      }

      onProgress?.(10, `Downloading ${totalFiles} files...`);

      // Download individual documents
      for (const doc of documents) {
        try {
          onProgress?.(
            10 + (processedFiles / totalFiles) * 80,
            `Downloading ${doc.fileName}... (${processedFiles + 1}/${totalFiles})`
          );

          const { blob, fileName } = await this.downloadFileAsBlob(doc.s3Key, doc.fileName);
          const finalFileName = downloadService.ensureFileExtension 
            ? downloadService.ensureFileExtension(fileName, doc.s3Key, doc.fileType)
            : fileName;
          
          zip.file(finalFileName, blob);
          processedFiles++;

          if (!limitCheck.isAdmin) {
            await downloadService.logDownload(doc._id);
          }
        } catch (error) {
          console.error(`Failed to download ${doc.fileName}:`, error);
          // Skip failed files instead of adding error files
          processedFiles++;
        }
      }

      // Download folder documents
      for (const doc of allFolderDocuments) {
        try {
          onProgress?.(
            10 + (processedFiles / totalFiles) * 80,
            `Downloading ${doc.fileName}... (${processedFiles + 1}/${totalFiles})`
          );

          const { blob, fileName } = await this.downloadFileAsBlob(doc.s3Key, doc.fileName);
          const finalFileName = downloadService.ensureFileExtension 
            ? downloadService.ensureFileExtension(fileName, doc.s3Key, doc.fileType)
            : fileName;
          
          const filePath = doc.folderPath ? `${doc.folderPath}${finalFileName}` : finalFileName;
          zip.file(filePath, blob);
          processedFiles++;

          if (!limitCheck.isAdmin) {
            await downloadService.logDownload(doc._id);
          }
        } catch (error) {
          console.error(`Failed to download ${doc.fileName}:`, error);
          // Skip failed files instead of adding error files
          processedFiles++;
        }
      }

      onProgress?.(85, 'Creating ZIP file...');

      // Generate ZIP
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      onProgress?.(95, 'Downloading ZIP file...');

      // Download ZIP
      saveAs(zipBlob, zipName);

      onProgress?.(100, 'Download complete!');
    } catch (error) {
      console.error('Mixed ZIP creation failed:', error);
      throw error;
    }
  }

  // Utility method to check if frontend ZIP is supported
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 
           typeof Blob !== 'undefined' && 
           typeof URL !== 'undefined' &&
           API_CONFIG.S3_BASE_URL !== '';
  }

  // Get estimated download size
  static async getEstimatedSize(documents: DocumentInfo[]): Promise<number> {
    return documents.reduce((total, doc) => total + (doc.fileSize || 0), 0);
  }
}

export const frontendZipService = FrontendZipService;