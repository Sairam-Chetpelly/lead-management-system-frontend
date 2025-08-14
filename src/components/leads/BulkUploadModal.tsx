'use client';

import { useState } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Modal from '../Modal';
import { authAPI } from '@/lib/auth';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadResult {
  success: Array<{ row: number; name: string; leadId: string }>;
  errors: Array<{ row: number; error: string }>;
}

export default function BulkUploadModal({ isOpen, onClose, onSuccess }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        selectedFile.type === 'application/vnd.ms-excel') {
      setFile(selectedFile);
      setResult(null);
    } else {
      alert('Please select an Excel file (.xlsx or .xls)');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await authAPI.leads.downloadLeadsTemplate();
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'leads_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Failed to download template');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const response = await authAPI.leads.bulkUploadLeads(file);
      setResult(response.data.results);
      if (response.data.results.success.length > 0) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setResult(null);
    setUploading(false);
    setDragActive(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Bulk Upload Leads">
      <div className="space-y-6">
        {/* Download Template */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Download Template</h3>
              <p className="text-sm text-blue-700 mt-1">
                Download the Excel template with sample data and instructions
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={16} />
              <span>Template</span>
            </button>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Upload Excel File</h3>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FileSpreadsheet size={48} className="mx-auto text-gray-400 mb-4" />
            
            {file ? (
              <div className="space-y-2">
                <p className="text-green-600 font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={() => setFile(null)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-600">
                  Drag and drop your Excel file here, or{' '}
                  <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                    browse
                    <input
                      type="file"
                      className="hidden"
                      accept=".xlsx,.xls"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    />
                  </label>
                </p>
                <p className="text-sm text-gray-500">
                  Supports .xlsx and .xls files (max 5MB)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Button */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Upload size={16} />
            <span>{uploading ? 'Uploading...' : 'Upload'}</span>
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="border-t pt-6 space-y-4">
            <h3 className="font-medium text-gray-900">Upload Results</h3>
            
            {/* Success Summary */}
            {result.success.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle size={20} className="text-green-600" />
                  <span className="font-medium text-green-800">
                    {result.success.length} leads created successfully
                  </span>
                </div>
                <div className="max-h-32 overflow-y-auto">
                  {result.success.map((item, index) => (
                    <div key={index} className="text-sm text-green-700">
                      Row {item.row}: {item.name} (ID: {item.leadId})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Summary */}
            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <XCircle size={20} className="text-red-600" />
                  <span className="font-medium text-red-800">
                    {result.errors.length} errors occurred
                  </span>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {result.errors.map((item, index) => (
                    <div key={index} className="text-sm text-red-700">
                      <span className="font-medium">Row {item.row}:</span> {item.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions for fixing errors */}
            {result.errors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">To fix errors:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Check that all required fields are filled</li>
                      <li>Ensure email addresses are unique and valid</li>
                      <li>Verify contact numbers are unique</li>
                      <li>Make sure language names match exactly</li>
                      <li>Check that source and center names exist in the system</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}