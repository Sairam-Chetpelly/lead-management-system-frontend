'use client';

interface UploadProgressProps {
  progress: number;
  fileName?: string;
  fileSize?: number;
  status?: 'uploading' | 'processing' | 'complete' | 'error';
  className?: string;
}

export default function UploadProgress({
  progress,
  fileName,
  fileSize,
  status = 'uploading',
  className = ''
}: UploadProgressProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return progress < 5 ? 'Preparing...' : 'Uploading to S3...';
      case 'processing':
        return 'Processing...';
      case 'complete':
        return 'Upload Complete!';
      case 'error':
        return 'Upload Failed';
      default:
        return 'Uploading...';
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'complete':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'processing':
        return 'bg-blue-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case 'complete':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={`p-4 rounded-xl border ${getBackgroundColor()} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {status === 'uploading' || status === 'processing' ? (
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : status === 'complete' ? (
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {getStatusText()}
            </p>
            {fileName && (
              <p className="text-xs text-slate-600 truncate max-w-xs">
                {fileName} {fileSize && `(${formatFileSize(fileSize)})`}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-900">{progress}%</p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-white/60 rounded-full h-2.5 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-300 ease-out ${getProgressColor()}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      
      {/* Additional Info */}
      {fileSize && fileSize > 100 * 1024 * 1024 && (
        <div className="mt-2 text-xs text-slate-500">
          Large file - Using optimized S3 upload
        </div>
      )}
    </div>
  );
}