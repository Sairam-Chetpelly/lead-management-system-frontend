'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning';
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export default function Toast({ id, type, message, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'error':
        return <XCircle size={20} className="text-red-600" />;
      case 'warning':
        return <AlertCircle size={20} className="text-yellow-600" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  return (
    <div className={`flex items-center p-4 mb-3 border rounded-lg shadow-lg animate-slide-in ${getStyles()}`}>
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={() => onClose(id)}
        className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}