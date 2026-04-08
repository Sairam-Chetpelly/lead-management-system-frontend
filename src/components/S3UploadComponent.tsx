import React, { useState } from 'react';
import { s3DocumentService } from '@/services/s3DocumentService';
import { documentService } from '@/services/documentService';
import { storageOptions } from '@/config/s3Config';

interface S3UploadComponentProps {
  folderId?: string;
  onUploadSuccess?: (document: any) => void;
  onUploadError?: (error: string) => void;
}

const S3UploadComponent: React.FC<S3UploadComponentProps> = ({
  folderId,
  onUploadSuccess,
  onUploadError
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState('');
  const [keywords, setKeywords] = useState('');
  const [description, setDescription] = useState('');
  const [storageType, setStorageType] = useState<'local' | 's3'>('s3');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.split('.')[0]);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      onUploadError?.('Please select a file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('subtitle', subtitle);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('keywords', keywords);
      if (folderId) {
        formData.append('folderId', folderId);
      }

      let result;
      if (storageType === 's3') {
        result = await s3DocumentService.uploadDocument(formData, true);
      } else {
        result = await documentService.uploadDocument(formData, false);
      }

      onUploadSuccess?.(result);
      
      // Reset form
      setFile(null);
      setTitle('');
      setSubtitle('');
      setCategory('');
      setKeywords('');
      setDescription('');
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
    } catch (error: any) {
      console.error('Upload error:', error);
      onUploadError?.(error.response?.data?.message || error.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Upload Document</h3>
      
      <form onSubmit={handleUpload} className="space-y-4">
        {/* Storage Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Storage Location
          </label>
          <div className="flex space-x-4">
            {storageOptions.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="storageType"
                  value={option.value}
                  checked={storageType === option.value}
                  onChange={(e) => setStorageType(e.target.value as 'local' | 's3')}
                  disabled={option.disabled}
                  className="mr-2"
                />
                <span className={`text-sm ${option.disabled ? 'text-gray-400' : 'text-gray-700'}`}>
                  {option.label}
                </span>
                {option.disabled && (
                  <span className="text-xs text-gray-400 ml-1">(Not configured)</span>
                )}
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {storageType === 's3' ? 'Files will be stored in AWS S3' : 'Files will be stored on server'}
          </p>
        </div>

        {/* File Input */}
        <div>
          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
            Select File
          </label>
          <input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required
          />
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Subtitle */}
        <div>
          <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-2">
            Subtitle
          </label>
          <input
            id="subtitle"
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <input
            id="category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Keywords */}
        <div>
          <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
            Keywords (comma-separated)
          </label>
          <input
            id="keywords"
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="keyword1, keyword2, keyword3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading || !file}
          className={`w-full py-2 px-4 rounded-md font-medium ${
            uploading || !file
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {uploading ? 'Uploading...' : `Upload to ${storageType === 's3' ? 'S3' : 'Server'}`}
        </button>
      </form>
    </div>
  );
};

export default S3UploadComponent;