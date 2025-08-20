'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Globe, User } from 'lucide-react';
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
  const [selectedPresalesUserId, setSelectedPresalesUserId] = useState('');
  const [languages, setLanguages] = useState<any[]>([]);
  const [presalesUsers, setPresalesUsers] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchLanguages();
      setSelectedLanguageId(currentLanguageId || '');
      setSelectedPresalesUserId('');
      setPresalesUsers([]);
    }
  }, [isOpen, currentLanguageId]);

  useEffect(() => {
    if (selectedLanguageId) {
      fetchPresalesUsers();
    } else {
      setPresalesUsers([]);
      setSelectedPresalesUserId('');
    }
  }, [selectedLanguageId]);

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

  const fetchPresalesUsers = async () => {
    try {
      const response = await authAPI.getUsers({ 
        role: 'presales_agent',
        limit: 1000 
      });
      const allUsers = response.data.data || response.data || [];
      
      // Filter users by selected language
      const filteredUsers = allUsers.filter((user: any) => 
        user.languageIds && user.languageIds.some((lang: any) => 
          (typeof lang === 'string' ? lang : lang._id) === selectedLanguageId
        )
      );
      
      setPresalesUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching presales users:', error);
      showToast('Failed to fetch presales users', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLanguageId || !selectedPresalesUserId) {
      showToast('Please select both language and presales agent', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await authAPI.createPresalesActivity(leadId, {
        languageId: selectedLanguageId,
        presalesUserId: selectedPresalesUserId,
        comment: 'Language changed and lead reassigned'
      });

      showToast('Lead reassigned successfully', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error reassigning lead:', error);
      showToast('Failed to reassign lead', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedLanguageId(currentLanguageId || '');
    setSelectedPresalesUserId('');
    setPresalesUsers([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Change Language & Reassign Lead">
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

            {/* Presales Agent Selection */}
            {selectedLanguageId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User size={16} className="inline mr-2" />
                  Select Presales Agent *
                </label>
                {presalesUsers.length > 0 ? (
                  <select
                    value={selectedPresalesUserId}
                    onChange={(e) => setSelectedPresalesUserId(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Presales Agent</option>
                    {presalesUsers.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    No presales agents available for selected language
                  </div>
                )}
              </div>
            )}

            {/* Info Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Changing the language will reassign this lead to the selected presales agent. 
                The lead will be removed from your panel and added to the selected agent's panel.
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
            disabled={!selectedLanguageId || !selectedPresalesUserId || submitting || presalesUsers.length === 0}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Reassigning...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Reassign Lead</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}