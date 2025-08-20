'use client';

import React, { useState } from 'react';
import { PhoneCall, Clock, User, X, Phone } from 'lucide-react';
import Modal from './Modal';

interface CallLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCall: () => void;
}

export default function CallLogModal({ isOpen, onClose, onCall }: CallLogModalProps) {
  const [calling, setCalling] = useState(false);

  const handleCall = async () => {
    setCalling(true);
    try {
      await onCall();
      onClose();
    } catch (error) {
      console.error('Error making call:', error);
    } finally {
      setCalling(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Make a Call">
      <div className="space-y-6">
        {/* Call Information */}
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <PhoneCall size={32} className="text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ready to Make a Call?
          </h3>
          <p className="text-gray-600">
            This will log a call activity for this lead. Make sure you're ready to connect with the customer.
          </p>
        </div>

        {/* Call Guidelines */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h4 className="font-medium text-green-800 mb-3 flex items-center">
            <Phone size={16} className="mr-2" />
            Call Guidelines
          </h4>
          <ul className="text-sm text-green-700 space-y-2">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Introduce yourself and your company clearly</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Listen actively to customer needs and concerns</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Take notes during the conversation</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Schedule follow-up if needed</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Add activity log after the call with details</span>
            </li>
          </ul>
        </div>

        {/* Call Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Clock size={20} className="mx-auto text-gray-600 mb-1" />
            <div className="text-sm font-medium text-gray-900">Best Time</div>
            <div className="text-xs text-gray-600">9 AM - 6 PM</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <User size={20} className="mx-auto text-gray-600 mb-1" />
            <div className="text-sm font-medium text-gray-900">Professional</div>
            <div className="text-xs text-gray-600">Be courteous</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <PhoneCall size={20} className="mx-auto text-gray-600 mb-1" />
            <div className="text-sm font-medium text-gray-900">Follow Up</div>
            <div className="text-xs text-gray-600">Log activity</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={calling}
          >
            <X size={16} />
            <span>Cancel</span>
          </button>
          
          <button
            onClick={handleCall}
            disabled={calling}
            className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300"
          >
            {calling ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Logging Call...</span>
              </>
            ) : (
              <>
                <PhoneCall size={16} />
                <span>Start Call</span>
              </>
            )}
          </button>
        </div>

        {/* Note */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Remember to add detailed activity notes after your call for better lead tracking.
          </p>
        </div>
      </div>
    </Modal>
  );
}