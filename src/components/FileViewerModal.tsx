'use client';

import React from 'react';
import { X, Download } from 'lucide-react';

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileUrl: string;
}

export default function FileViewerModal({ isOpen, onClose, fileName, fileUrl }: FileViewerModalProps) {
  if (!isOpen) return null;

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const renderFileContent = () => {
    const ext = getFileExtension(fileName);
    
    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return (
        <div className="flex items-center justify-center h-full">
          <img src={fileUrl} alt={fileName} className="max-w-full max-h-full object-contain" />
        </div>
      );
    }
    
    // Videos
    if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext)) {
      return (
        <div className="flex items-center justify-center h-full">
          <video controls className="max-w-full max-h-full">
            <source src={fileUrl} type={`video/${ext}`} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
    
    // Audio
    if (['mp3', 'wav', 'ogg', 'aac'].includes(ext)) {
      return (
        <div className="flex items-center justify-center h-full">
          <audio controls className="w-full max-w-md">
            <source src={fileUrl} type={`audio/${ext}`} />
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }
    
    // PDF
    if (ext === 'pdf') {
      return (
        <iframe 
          src={fileUrl} 
          className="w-full h-full"
          title={fileName}
        />
      );
    }
    
    // Text files
    if (['txt', 'csv', 'json', 'xml'].includes(ext)) {
      return (
        <iframe 
          src={fileUrl} 
          className="w-full h-full bg-white"
          title={fileName}
        />
      );
    }
    
    // Default - show download option
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-gray-500 mb-4">
            Cannot preview this file type ({ext.toUpperCase()})
          </div>
          <a 
            href={fileUrl} 
            download 
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download size={16} />
            <span>Download File</span>
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">{fileName}</h3>
          <div className="flex items-center space-x-2">
            <a 
              href={fileUrl} 
              download 
              className="inline-flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Download size={14} />
              <span>Download</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderFileContent()}
        </div>
      </div>
    </div>
  );
}