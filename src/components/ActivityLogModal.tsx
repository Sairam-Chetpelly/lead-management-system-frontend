'use client';

import React, { useState } from 'react';
import { MessageSquare, PhoneCall, X, Send, Upload, FileText } from 'lucide-react';
import { authAPI } from '@/lib/auth';
import { useToast } from '@/contexts/ToastContext';
import Modal from './Modal';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId?: string;
  onSubmit?: (type: 'call' | 'manual', comment: string, document?: File) => void;
}

export default function ActivityLogModal({ isOpen, onClose, leadId, onSubmit }: ActivityLogModalProps) {
  const { showToast } = useToast();
  const [type, setType] = useState<'call' | 'manual'>('manual');
  const [comment, setComment] = useState('');
  const [document, setDocument] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setDocument(file);
      setFileName(file.name);
    }
  };

  const removeFile = () => {
    setDocument(null);
    setFileName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      if (onSubmit) {
        // Use custom submit handler (for LeadView)
        await onSubmit(type, comment.trim(), document || undefined);
      } else if (leadId) {
        // Use default API call (for regular ActivityLogModal)
        await authAPI.createActivityLog(leadId, type, comment.trim(), document || undefined);
        showToast('Activity logged successfully', 'success');
      }
      setComment('');
      setDocument(null);
      setFileName('');
      setType('manual');
      onClose();
    } catch (error) {
      console.error('Error submitting activity:', error);
      showToast('Failed to log activity', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setComment('');
    setDocument(null);
    setFileName('');
    setType('manual');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Activity Log">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Activity Type Selection */}
        <div className="grid grid-cols-2 gap-4">
          <label className={`flex items-center justify-center p-4 border border-gray-300 rounded-xl cursor-pointer transition-all ${
            type === 'manual' ? 'bg-blue-50 border-blue-300' : 'hover:bg-blue-50'
          }`}>
            <input
              type="radio"
              name="activityType"
              value="manual"
              checked={type === 'manual'}
              onChange={(e) => setType(e.target.value as 'manual')}
              className="mr-3"
            />
            <MessageSquare size={16} className="mr-2" />
            <span className="font-medium">Manual Activity</span>
          </label>
          
          <label className={`flex items-center justify-center p-4 border border-gray-300 rounded-xl cursor-pointer transition-all ${
            type === 'call' ? 'bg-blue-50 border-blue-300' : 'hover:bg-blue-50'
          }`}>
            <input
              type="radio"
              name="activityType"
              value="call"
              checked={type === 'call'}
              onChange={(e) => setType(e.target.value as 'call')}
              className="mr-3"
            />
            <PhoneCall size={16} className="mr-2" />
            <span className="font-medium">Call Activity</span>
          </label>
        </div>

        {/* Activity Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Activity Description
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder={
              type === 'call' 
                ? 'Describe the call conversation, outcomes, next steps...' 
                : 'Describe the activity, notes, observations...'
            }
            required
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {type === 'call' ? 'Call activity details' : 'Manual activity notes'}
            </p>
            <span className={`text-sm ${comment.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>
              {comment.length}/500
            </span>
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Document (Optional)
          </label>
          {!fileName ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors relative">
              <Upload size={24} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG (Max 10MB)</p>
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-center space-x-3">
                <FileText size={20} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-900">{fileName}</span>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Activity Guidelines */}
        {/* <div className={`p-4 rounded-xl border-l-4 ${
          type === 'call' 
            ? 'bg-green-50 border-green-400' 
            : 'bg-blue-50 border-blue-400'
        }`}>
          <h4 className={`font-medium mb-2 ${
            type === 'call' ? 'text-green-800' : 'text-blue-800'
          }`}>
            {type === 'call' ? 'Call Activity Guidelines' : 'Manual Activity Guidelines'}
          </h4>
          <ul className={`text-sm space-y-1 ${
            type === 'call' ? 'text-green-700' : 'text-blue-700'
          }`}>
            {type === 'call' ? (
              <>
                <li>• Record call duration and outcome</li>
                <li>• Note customer responses and concerns</li>
                <li>• Document next steps or follow-up actions</li>
                <li>• Include any commitments made</li>
                <li>• Upload call recordings or notes if available</li>
              </>
            ) : (
              <>
                <li>• Document important observations</li>
                <li>• Record meeting notes or interactions</li>
                <li>• Note changes in lead status or interest</li>
                <li>• Include relevant updates or progress</li>
                <li>• Attach supporting documents if needed</li>
              </>
            )}
          </ul>
        </div> */}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-3 text-gray-700 bg-gray-100 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-300"
            disabled={submitting}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={!comment.trim() || comment.length > 500 || submitting}
            className="px-8 py-3 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
            style={{backgroundColor: '#0f172a'}}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Adding...
              </>
            ) : (
              <>
                Add Activity
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}