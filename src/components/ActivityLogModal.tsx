'use client';

import React, { useState } from 'react';
import { FileText, Phone } from 'lucide-react';
import { authAPI } from '@/lib/auth';
import { useToast } from '@/contexts/ToastContext';
import Modal from './Modal';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
}

export default function ActivityLogModal({ isOpen, onClose, leadId }: ActivityLogModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'call' | 'manual'>('call');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      showToast('Comment is required', 'error');
      return;
    }

    setLoading(true);
    try {
      await authAPI.createActivityLog(leadId, activeTab, comment.trim());
      showToast(`${activeTab === 'call' ? 'Call' : 'Manual'} activity logged successfully`, 'success');
      setComment('');
      onClose();
    } catch (error) {
      console.error('Error logging activity:', error);
      showToast('Failed to log activity', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Activity">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('call')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'call'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Phone size={16} />
            <span>Call Activity</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'manual'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText size={16} />
            <span>Manual</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Enter ${activeTab === 'call' ? 'call notes' : 'manual activity'} comment...`}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !comment.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Logging...' : `Log ${activeTab === 'call' ? 'Call' : 'Manual'}`}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}