'use client';

import { useRef, useState } from 'react';
import { Upload, File, X, CheckCircle } from 'lucide-react';

interface FileUploadZoneProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
}

export default function FileUploadZone({
  onFileSelect,
  selectedFile,
  accept = '*/*',
  maxSize = 2048, // Default 2GB
  className = '',
  disabled = false
}: FileUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`;
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeFile = () => {
    setError(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200
          ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}
          ${error ? 'border-red-400 bg-red-50' : ''}
          ${selectedFile ? 'border-green-400 bg-green-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center
            ${selectedFile ? 'bg-green-100' : error ? 'bg-red-100' : 'bg-blue-100'}
          `}>
            {selectedFile ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <Upload className={`w-8 h-8 ${error ? 'text-red-600' : 'text-blue-600'}`} />
            )}
          </div>
          
          {selectedFile ? (
            <div className="text-center">
              <p className="text-sm font-semibold text-green-700 mb-1">
                File Selected
              </p>
              <p className="text-xs text-slate-600">
                Click to change or drag a new file
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-700 mb-2">
                {dragOver ? 'Drop file here' : 'Choose file or drag & drop'}
              </p>
              <p className="text-sm text-slate-500">
                Maximum file size: {maxSize}MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="flex items-center justify-between p-4 bg-white border border-green-200 rounded-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <File className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 truncate max-w-xs">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-500">
                {formatFileSize(selectedFile.size)}
                {selectedFile.size > 100 * 1024 * 1024 && (
                  <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    Large File
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeFile();
            }}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
            <X className="w-3 h-3 text-red-600" />
          </div>
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}