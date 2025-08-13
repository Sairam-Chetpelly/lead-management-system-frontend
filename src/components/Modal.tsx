'use client';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6">
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-all duration-300" 
        onClick={onClose}
      ></div>
      
      <div className="relative w-full max-w-4xl max-h-[95vh] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col transform transition-all duration-300 scale-100 animate-in fade-in zoom-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 flex-shrink-0 bg-gray-50">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:scale-110"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
}