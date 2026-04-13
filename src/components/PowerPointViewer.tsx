"use client"
import { useState, useEffect } from 'react';
import { Download, AlertCircle, RefreshCw } from 'lucide-react';
import Modal from './Modal';

interface PowerPointViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    _id: string;
    fileName: string;
    title?: string;
    subtitle?: string;
    filePath: string;
    fileType: string;
  } | null;
  onDownload: (id: string, fileName: string) => void;
}

export default function PowerPointViewer({ isOpen, onClose, document, onDownload }: PowerPointViewerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [fileUrl, setFileUrl] = useState<string>('');

  useEffect(() => {
    if (document && isOpen) {
      setIsLoading(true);
      setError(null);
      
      // Construct the file URL
      const fileName = document.filePath.split('/').pop() || document.filePath.split('\\\\').pop();
      const url = `${process.env.NEXT_PUBLIC_S3_BASE_URL}${document.filePath}`;
      setFileUrl(url);
      
      // Check if file is accessible
      fetch(url, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            throw new Error(`File not accessible: ${response.status}`);
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error('File access error:', err);
          setError('Unable to access the PowerPoint file. Please check if the file exists and is accessible.');
          setIsLoading(false);
        });
    }
  }, [document, isOpen, retryCount]);

  const isPowerPointFile = (fileName: string, fileType: string) => {
    return fileType.includes('presentation') || 
           fileType.includes('powerpoint') ||
           /\.(ppt|pptx|pps|ppsx|potx|potm|pptm)$/i.test(fileName);
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (!isOpen || !document) return null;

  // Only render for PowerPoint files
  if (!isPowerPointFile(document.fileName, document.fileType)) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={document.title || document.fileName} size="2xl">
      <div className="flex flex-col h-full">

        
        {/* Content */}
        <div className="flex-1 overflow-hidden rounded-lg border border-gray-200 relative">
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-500 mb-4">
                  <AlertCircle size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Presentation</h3>
                <p className="text-gray-600 mb-4">{error}</p>

              </div>
            </div>
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-700">Loading PowerPoint Presentation...</p>
                    {retryCount > 0 && (
                      <p className="text-xs text-blue-600 mt-1">Retry attempt: {retryCount}</p>
                    )}
                  </div>
                </div>
              )}
              
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                className="w-full h-full"
                title={document.fileName}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setError('Failed to load presentation. Try downloading instead.');
                  setIsLoading(false);
                }}
              />
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}