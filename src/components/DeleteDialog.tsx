'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !mounted) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.body.classList.add('modal-open');
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onCancel, mounted]);

  if (!mounted || !isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const dialogContent = (
    <div className="modal-overlay flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={handleBackdropClick}
      />
      <div 
        className="modal-content bg-white rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-600 sm:w-6 sm:h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-sm sm:text-base text-gray-600 mb-6">{message}</p>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={onCancel}
            className="w-full px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
};

export default DeleteDialog;