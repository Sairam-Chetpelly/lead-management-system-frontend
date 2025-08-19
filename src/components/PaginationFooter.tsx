'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationFooterProps {
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  itemName?: string;
  limitOptions?: number[];
  className?: string;
}

export default function PaginationFooter({ 
  pagination, 
  onPageChange, 
  onLimitChange, 
  itemName = 'items',
  limitOptions = [10, 25, 50],
  className = ''
}: PaginationFooterProps) {
  const getPageNumbers = () => {
    const { current, pages } = pagination;
    const maxVisible = 5;
    
    if (pages <= maxVisible) {
      return Array.from({ length: pages }, (_, i) => i + 1);
    }
    
    let start = Math.max(1, current - 2);
    let end = Math.min(pages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className={`bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 px-4 lg:px-8 py-4 sm:py-6 flex-shrink-0 ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <select 
            value={pagination.limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {limitOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <span className="text-slate-600 font-medium text-xs sm:text-sm">Records per page</span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <span className="text-slate-600 font-medium text-xs sm:text-sm">
            Showing {((pagination.current - 1) * pagination.limit) + 1}-{Math.min(pagination.current * pagination.limit, pagination.total)} of {pagination.total} {itemName}
          </span>
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto">
            <button 
              onClick={() => onPageChange(pagination.current - 1)}
              disabled={pagination.current === 1}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
            </button>
            {getPageNumbers().map(page => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all duration-200 shadow-sm text-xs sm:text-sm font-medium flex-shrink-0 ${
                  pagination.current === page
                    ? 'text-white'
                    : 'bg-white border border-slate-300 hover:bg-slate-50'
                }`}
                style={pagination.current === page ? {backgroundColor: '#0f172a'} : {}}
              >
                {page}
              </button>
            ))}
            <button 
              onClick={() => onPageChange(pagination.current + 1)}
              disabled={pagination.current === pagination.pages}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <ChevronRight size={14} className="sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}