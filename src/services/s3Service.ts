import AWS from 'aws-sdk';

// Configure AWS SDK for frontend
const s3 = new AWS.S3({
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
  region: process.env.NEXT_PUBLIC_AWS_REGION,
});

const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME;

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface S3UploadResult {
  success: boolean;
  s3Key: string;
  s3Url: string;
  fileName: string;
  error?: string;
}

// Generate S3 key path based on folder structure
const generateS3Key = (file: File, folderPath?: string): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1E9);
  const fileExtension = file.name.split('.').pop();
  const fileName = `${timestamp}-${randomSuffix}.${fileExtension}`;
  
  if (folderPath && folderPath.trim()) {
    return `documents/${folderPath}/${fileName}`;
  }
  return `documents/${fileName}`;
};

// Upload file directly to S3 from frontend
export const uploadFileToS3 = async (
  file: File,
  folderPath?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<S3UploadResult> => {
  try {
    const s3Key = generateS3Key(file, folderPath);
    
    const params = {
      Bucket: BUCKET_NAME!,
      Key: s3Key,
      Body: file,
      ContentType: file.type,
      ACL: 'private' as const,
    };

    const upload = s3.upload(params);

    // Track upload progress
    if (onProgress) {
      upload.on('httpUploadProgress', (progress) => {
        const percentage = Math.round((progress.loaded / progress.total) * 100);
        onProgress({
          loaded: progress.loaded,
          total: progress.total,
          percentage,
        });
      });
    }

    const result = await upload.promise();

    return {
      success: true,
      s3Key,
      s3Url: result.Location,
      fileName: file.name,
    };
  } catch (error: any) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      s3Key: '',
      s3Url: '',
      fileName: file.name,
      error: error.message,
    };
  }
};

// Generate presigned URL for file access
export const generatePresignedUrl = async (s3Key: string): Promise<string> => {
  try {
    const params = {
      Bucket: BUCKET_NAME!,
      Key: s3Key,
      Expires: 3600, // 1 hour
    };

    return await s3.getSignedUrlPromise('getObject', params);
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
};

// Delete file from S3
export const deleteFileFromS3 = async (s3Key: string): Promise<boolean> => {
  try {
    const params = {
      Bucket: BUCKET_NAME!,
      Key: s3Key,
    };

    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    return false;
  }
};

export default {
  uploadFileToS3,
  generatePresignedUrl,
  deleteFileFromS3,
};