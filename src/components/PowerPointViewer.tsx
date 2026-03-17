"use client"
import { useState, useEffect } from 'react';
import { X, Download, AlertCircle, RefreshCw } from 'lucide-react';

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
      const url = `${process.env.NEXT_PUBLIC_API_URL}/uploads/documents/${fileName}`;
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900 truncate">
              📊 {document.title || document.fileName}
            </h2>
            {document.subtitle && (
              <p className="text-sm text-slate-600 mt-1 truncate">{document.subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-3 ml-4">
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all shadow-sm"
              title="Retry Loading"
            >
              <RefreshCw size={16} />
              Retry
            </button>
            <button
              onClick={() => onDownload(document._id, document.fileName)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all shadow-sm"
              title="Download PowerPoint"
            >
              <Download size={16} />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-slate-50 relative">
          {error ? (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center max-w-2xl">
                <div className="w-32 h-32 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-2xl mb-6 mx-auto">
                  <AlertCircle className="w-16 h-16 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Unable to Load Presentation</h3>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
                  <p className="text-sm text-red-800 leading-relaxed">
                    {error}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleRetry}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all shadow-lg"
                  >
                    <RefreshCw size={20} />
                    Try Again
                  </button>
                  <button
                    onClick={() => onDownload(document._id, document.fileName)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg"
                  >
                    <Download size={20} />
                    Download File
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-700 font-medium text-lg">Loading PowerPoint Presentation...</p>
                    <p className="text-sm text-slate-500 mt-2">Please wait while we prepare your presentation</p>
                    {retryCount > 0 && (
                      <p className="text-xs text-blue-600 mt-2">Retry attempt: {retryCount}</p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="h-full w-full">
                {/* Option A: Google Docs Viewer (Recommended) */}
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                  className="w-full h-full border-0"
                  title={document.fileName}
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setError('Failed to load presentation. Try downloading instead.');
                    setIsLoading(false);
                  }}
                />
                
                {/* Option B: Microsoft Office Online Viewer (Alternative) */}
                {/* <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
                  className="w-full h-full border-0"
                  title={document.fileName}
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setError('Failed to load presentation. Try downloading instead.');
                    setIsLoading(false);
                  }}
                /> */}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}