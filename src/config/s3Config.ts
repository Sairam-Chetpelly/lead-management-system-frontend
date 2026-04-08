// S3 Configuration for frontend
export const s3Config = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  bucketName: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || '',
  
  // Check if S3 is configured
  isConfigured: () => {
    return !!(process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME);
  },
  
  // Get S3 URL for a key
  getS3Url: (key: string) => {
    const region = s3Config.region;
    const bucket = s3Config.bucketName;
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }
};

// Storage options for UI
export const storageOptions = [
  { value: 'local', label: 'Local Storage', description: 'Store files on server' },
  { value: 's3', label: 'AWS S3', description: 'Store files in cloud', disabled: !s3Config.isConfigured() }
];

export default s3Config;