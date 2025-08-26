'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Globe } from 'lucide-react';
import Modal from './Modal';
import { authAPI } from '@/lib/auth';
import { useToast } from '@/contexts/ToastContext';

interface LanguageChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  currentLanguageId?: string;
  onSuccess: () => void;
}

export default function LanguageChangeModal({ 
  isOpen, 
  onClose, 
  leadId, 
  currentLanguageId,
  onSuccess 
}: LanguageChangeModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedLanguageId, setSelectedLanguageId] = useState(currentLanguageId || '');
  const [languages, setLanguages] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchLanguages();
      setSelectedLanguageId(currentLanguageId || '');
    }
  }, [isOpen, currentLanguageId]);

  const fetchLanguages = async () => {
    setLoading(true);
    try {
      const response = await authAPI.admin.getAllLanguages();
      setLanguages(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching languages:', error);
      showToast('Failed to fetch languages', 'error');
    } finally {
      setLoading(false);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLanguageId) {
      showToast('Please select a language', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await authAPI.changeLanguage(leadId, {
        languageId: selectedLanguageId
      });

      showToast('Language changed successfully', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error changing language:', error);
      showToast('Failed to change language', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedLanguageId(currentLanguageId || '');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Change Language">
      <form onSubmit={handleSubmit} className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe size={16} className="inline mr-2" />
                Select Language *
              </label>
              <select
                value={selectedLanguageId}
                onChange={(e) => setSelectedLanguageId(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Language</option>
                {languages.map((language) => (
                  <option key={language._id} value={language._id}>
                    {language.name}
                  </option>
                ))}
              </select>
            </div>



            {/* Info Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> If you can handle this language, the lead will remain with you. 
                Otherwise, it will be automatically assigned to an available presales agent who speaks this language.
              </p>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={submitting}
          >
            <X size={16} />
            <span>Cancel</span>
          </button>
          
          <button
            type="submit"
            disabled={!selectedLanguageId || submitting}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Change Language</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}