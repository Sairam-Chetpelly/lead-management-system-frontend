'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export default function Modal({ isOpen, onClose, title, children, size = 'lg' }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key and body scroll lock
  useEffect(() => {
    if (!isOpen || !mounted) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Lock body scroll with CSS class
    document.body.classList.add('modal-open');
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, mounted]);

  // Don't render on server or if not mounted
  if (!mounted || !isOpen) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'max-w-md';
      case 'md': return 'max-w-2xl';
      case 'lg': return 'max-w-4xl';
      case 'xl': return 'max-w-6xl';
      case '2xl': return 'max-w-7xl';
      default: return 'max-w-4xl';
    }
  };

  const getHeightClasses = () => {
    return size === 'xl' || size === '2xl' ? 'h-[90vh]' : 'max-h-[95vh]';
  };

  const modalContent = (
    <div className="modal-overlay flex items-center justify-center p-2 sm:p-4 lg:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-all duration-300" 
        onClick={handleBackdropClick}
      />
      
      {/* Modal Content */}
      <div 
        className={`modal-content w-full bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col transform transition-all duration-300 scale-100 animate-scale-in ${getSizeClasses()} ${getHeightClasses()}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 flex-shrink-0 bg-gray-50 rounded-t-xl">
          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 truncate pr-2">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:scale-110 flex-shrink-0"
            type="button"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document body level
  return createPortal(modalContent, document.body);
}