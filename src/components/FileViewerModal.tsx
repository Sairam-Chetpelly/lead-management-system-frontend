'use client';

import React from 'react';
import { X, Download } from 'lucide-react';
import Modal from './Modal';

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileUrl: string;
}

export default function FileViewerModal({ isOpen, onClose, fileName, fileUrl }: FileViewerModalProps) {

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
    <Modal isOpen={isOpen} onClose={onClose} title={fileName} size="2xl">
      <div className="flex flex-col h-full">
        {/* Download Button */}
        <div className="flex justify-end mb-4">
          <a 
            href={fileUrl} 
            download 
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={16} />
            <span>Download</span>
          </a>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden rounded-lg border border-gray-200">
          {renderFileContent()}
        </div>
      </div>
    </Modal>
  );
}