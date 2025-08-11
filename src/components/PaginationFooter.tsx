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
}

export default function PaginationFooter({ 
  pagination, 
  onPageChange, 
  onLimitChange, 
  itemName = 'items' 
}: PaginationFooterProps) {
  return (
    <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 px-4 lg:px-8 py-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center space-x-4">
          <select 
            value={pagination.limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-slate-600 font-medium text-sm lg:text-base">Records per page</span>
        </div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          <span className="text-slate-600 font-medium text-sm lg:text-base">
            Showing {((pagination.current - 1) * pagination.limit) + 1}-{Math.min(pagination.current * pagination.limit, pagination.total)} of {pagination.total} {itemName}
          </span>
          <div className="flex space-x-2">
            <button 
              onClick={() => onPageChange(pagination.current - 1)}
              disabled={pagination.current === 1}
              className="w-10 h-10 flex items-center justify-center bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const page = Math.max(1, Math.min(pagination.current - 2 + i, pagination.pages - 4 + i));
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 shadow-sm text-sm font-medium ${
                    pagination.current === page
                      ? 'text-white'
                      : 'bg-white border border-slate-300 hover:bg-slate-50'
                  }`}
                  style={pagination.current === page ? {backgroundColor: '#0f172a'} : {}}
                >
                  {page}
                </button>
              );
            })}
            <button 
              onClick={() => onPageChange(pagination.current + 1)}
              disabled={pagination.current === pagination.pages}
              className="w-10 h-10 flex items-center justify-center bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}