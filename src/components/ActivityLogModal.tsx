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
    <Modal isOpen={isOpen} onClose={onClose} title="📝 Log Activity" size="md">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="grid grid-cols-2 gap-4">
          <label className={`flex items-center justify-center p-4 border border-gray-300 rounded-xl cursor-pointer transition-all ${
            activeTab === 'call' ? 'bg-blue-50 border-blue-300' : 'hover:bg-blue-50'
          }`}>
            <input
              type="radio"
              name="activityType"
              value="call"
              checked={activeTab === 'call'}
              onChange={() => setActiveTab('call')}
              className="mr-3"
            />
            <Phone size={16} className="mr-2" />
            <span className="font-medium">Call Activity</span>
          </label>
          <label className={`flex items-center justify-center p-4 border border-gray-300 rounded-xl cursor-pointer transition-all ${
            activeTab === 'manual' ? 'bg-blue-50 border-blue-300' : 'hover:bg-blue-50'
          }`}>
            <input
              type="radio"
              name="activityType"
              value="manual"
              checked={activeTab === 'manual'}
              onChange={() => setActiveTab('manual')}
              className="mr-3"
            />
            <FileText size={16} className="mr-2" />
            <span className="font-medium">Manual</span>
          </label>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Enter ${activeTab === 'call' ? 'call notes' : 'manual activity'} comment...`}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading || !comment.trim()}
              className="px-8 py-3 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
              style={{backgroundColor: '#0f172a'}}
            >
              {loading ? 'Logging...' : `Log ${activeTab === 'call' ? 'Call' : 'Manual'}`}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}