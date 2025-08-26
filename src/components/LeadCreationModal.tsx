'use client';

import React, { useState, useCallback, useRef } from 'react';
import { User, Upload, FileText, Download } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { authAPI } from '@/lib/auth';
import Modal from './Modal';
import LeadCreationForm from './LeadCreationForm';

interface LeadCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LeadCreationModal({ isOpen, onClose, onSuccess }: LeadCreationModalProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleClose = () => {
    // Reset all state when closing
    setActiveTab('manual');
    setFile(null);
    setUploadResult(null);
    setUploading(false);
    setDragActive(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      
      // Reset previous results
      setUploadResult(null);
      
      // Validate file type
      if (!droppedFile.type.includes('csv') && !droppedFile.name.toLowerCase().endsWith('.csv')) {
        showToast('Please upload only CSV files', 'error');
        return;
      }
      
      // Validate file size (5MB max)
      if (droppedFile.size > 5 * 1024 * 1024) {
        showToast('File size too large. Maximum size is 5MB', 'error');
        return;
      }
      
      setFile(droppedFile);
    }
  }, [showToast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Reset previous results
      setUploadResult(null);
      
      // Validate file type
      if (!selectedFile.type.includes('csv') && !selectedFile.name.toLowerCase().endsWith('.csv')) {
        showToast('Please upload only CSV files', 'error');
        e.target.value = '';
        return;
      }
      
      // Validate file size (5MB max)
      if (selectedFile.size > 5 * 1024 * 1024) {
        showToast('File size too large. Maximum size is 5MB', 'error');
        e.target.value = '';
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = `name,email,contactNumber,comment,leadSource
John Doe,john.doe@example.com,+1234567890,Interested in premium properties,organic
Jane Smith,jane.smith@example.com,9876543210,Looking for budget-friendly options,facebook
Mike Johnson,mike.johnson@example.com,+91-9999999999,Needs consultation for investment,instagram
Sarah Wilson,sarah.wilson@example.com,1122334455,Enquiry about 2BHK apartments,instagram-dm
David Brown,david.brown@example.com,+44-7700900123,International client interested in luxury homes,cp`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadFailedEntries = async () => {
    if (uploadResult?.failedFileUrl) {
      try {
        const response = await authAPI.get(uploadResult.failedFileUrl);
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `failed_leads_${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        showToast('Failed to download file', 'error');
      }
    }
  };

  const handleBulkUpload = async () => {
    if (!file) {
      showToast('Please select a CSV file', 'error');
      return;
    }

    setUploading(true);
    setUploadResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await authAPI.bulkUploadLeads(formData);
      const result = response.data;
      
      setUploadResult(result);
      
      if (result.successful > 0) {
        if (result.failed > 0) {
          showToast(`Partial success: ${result.successful} leads created, ${result.failed} failed`, 'info');
        } else {
          showToast(`Success: ${result.successful} leads created successfully`, 'success');
          setFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          onSuccess?.();
        }
      } else {
        showToast('No leads were created. Please check the errors below.', 'error');
      }
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to upload leads';
      showToast(errorMessage, 'error');
      
      // If there's detailed error info, show it
      if (error.response?.data?.errors) {
        setUploadResult(error.response.data);
      }
    } finally {
      setUploading(false);
      // Clear file input after upload attempt (success or failure)
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualSuccess = () => {
    onSuccess?.();
    handleClose();
  };

  const handleTabChange = (tab: 'manual' | 'bulk') => {
    setActiveTab(tab);
    // Reset bulk upload state when switching tabs
    if (tab === 'manual') {
      setFile(null);
      setUploadResult(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Lead" size="lg">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="grid grid-cols-2 gap-4">
          <label className={`flex items-center justify-center p-4 border border-gray-300 rounded-xl cursor-pointer transition-all ${
            activeTab === 'manual' ? 'bg-blue-50 border-blue-300' : 'hover:bg-blue-50'
          }`}>
            <input
              type="radio"
              name="leadCreationType"
              value="manual"
              checked={activeTab === 'manual'}
              onChange={() => handleTabChange('manual')}
              className="mr-3"
            />
            <User size={16} className="mr-2" />
            <span className="font-medium">Manual Entry</span>
          </label>
          <label className={`flex items-center justify-center p-4 border border-gray-300 rounded-xl cursor-pointer transition-all ${
            activeTab === 'bulk' ? 'bg-blue-50 border-blue-300' : 'hover:bg-blue-50'
          }`}>
            <input
              type="radio"
              name="leadCreationType"
              value="bulk"
              checked={activeTab === 'bulk'}
              onChange={() => handleTabChange('bulk')}
              className="mr-3"
            />
            <Upload size={16} className="mr-2" />
            <span className="font-medium">Bulk Upload</span>
          </label>
        </div>

        {/* Tab Content */}
        {activeTab === 'manual' ? (
          <LeadCreationForm onSuccess={handleManualSuccess} onCancel={handleClose} />
        ) : (
          <div className="space-y-6">
            {/* Sample CSV Download */}
            <div className="bg-blue-50 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">CSV Format Requirements</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Download the sample CSV file to see the required format
                  </p>
                </div>
                <button
                  onClick={downloadSampleCSV}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download size={16} className="mr-2" />
                  Download Sample
                </button>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>Required Values:</strong> name, email, contactNumber, comment, leadSource (contactNumber & leadSource are mandatory)</div>
                <div><strong>File limits:</strong> Max 1000 rows, Max 5MB file size</div>
                <div><strong>Email format:</strong> Valid email addresses only</div>
                <div><strong>Contact Number format:</strong> 10-15 digits, can include +, -, (), spaces</div>
                <div><strong>Lead Source:</strong> Must match existing lead source names (partial matching supported)</div>
                <div><strong>Assignment:</strong> CP sources assigned to CP presales, others to regular presales</div>
              </div>
            </div>

            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : file 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText size={24} className="text-gray-500" />
                  </div>
                  {file ? (
                    <div>
                      <p className="text-green-600 font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">File selected successfully</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-600 font-medium">
                        Drag and drop your CSV file here, or click to browse
                      </p>
                      <p className="text-sm text-gray-500">Only CSV files are accepted</p>
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Upload Results */}
            {uploadResult && (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border ${
                  uploadResult.successful > 0 && uploadResult.failed === 0 
                    ? 'bg-green-50 border-green-200' 
                    : uploadResult.successful > 0 && uploadResult.failed > 0
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">Upload Results</h3>
                    <div className="text-sm text-gray-600">
                      Total: {uploadResult.totalRows || 0} | 
                      Success: {uploadResult.successful || 0} | 
                      Failed: {uploadResult.failed || 0}
                    </div>
                  </div>
                  
                  {uploadResult.message && (
                    <p className="text-sm text-gray-700 mb-3">{uploadResult.message}</p>
                  )}
                  
                  {/* Successful Results */}
                  {uploadResult.results && uploadResult.results.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-green-700 mb-2">Successfully Created Leads:</h4>
                      <div className="max-h-32 overflow-y-auto bg-white rounded-lg p-2 border">
                        {uploadResult.results.slice(0, 10).map((result: any, index: number) => (
                          <div key={index} className="text-xs text-gray-600 py-1">
                            Row {result.row}: {result.name} ({result.email}) | Source: {result.leadSource} → {result.assignedTo}
                          </div>
                        ))}
                        {uploadResult.results.length > 10 && (
                          <div className="text-xs text-gray-500 italic">... and {uploadResult.results.length - 10} more</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Errors */}
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-red-700">Errors:</h4>
                        {uploadResult.failedFileUrl && (
                          <button
                            onClick={downloadFailedEntries}
                            className="flex items-center px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Download size={12} className="mr-1" />
                            Download Failed Entries
                          </button>
                        )}
                      </div>
                      <div className="max-h-32 overflow-y-auto bg-white rounded-lg p-2 border">
                        {uploadResult.errors.slice(0, 20).map((error: string, index: number) => (
                          <div key={index} className="text-xs text-red-600 py-1">
                            {error}
                          </div>
                        ))}
                        {uploadResult.errors.length > 20 && (
                          <div className="text-xs text-gray-500 italic">... and {uploadResult.errors.length - 20} more errors</div>
                        )}
                      </div>
                      {uploadResult.failedFileUrl && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                          <strong>Tip:</strong> Download the failed entries file to see all original data with failure reasons. Fix the issues and re-upload.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {uploadResult.successful > 0 && uploadResult.failed === 0 && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setFile(null);
                        setUploadResult(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                        onSuccess?.();
                        handleClose();
                      }}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Upload Button */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={handleClose}
                className="px-6 py-3 text-gray-700 bg-gray-100 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpload}
                disabled={!file || uploading}
                className="px-8 py-3 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
                style={{backgroundColor: '#0f172a'}}
              >
                {uploading ? 'Uploading...' : 'Upload Leads'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}