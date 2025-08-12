'use client';

import { ReactNode } from 'react';
import ModernLoader from '../ModernLoader';
import PaginationFooter from '../PaginationFooter';

interface Column {
  key: string;
  label: string;
  span: number;
  render?: (item: any) => ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  loading?: boolean;
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  itemName: string;
  actions?: (item: any) => ReactNode;
  mobileCardRender?: (item: any) => ReactNode;
  headerColor?: string;
}

export default function DataTable({
  data,
  columns,
  loading = false,
  pagination,
  onPageChange,
  onLimitChange,
  itemName,
  actions,
  mobileCardRender,
  headerColor = '#0f172a'
}: DataTableProps) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative flex flex-col" style={{minHeight: 'calc(100vh - 400px)'}}>
      {loading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 transition-opacity duration-200">
          <ModernLoader size="lg" variant="primary" />
        </div>
      )}
      
      {/* Desktop Table */}
      <div className="hidden lg:flex flex-col flex-1 min-h-0">
        <div className="text-white" style={{backgroundColor: headerColor}}>
          <div className="grid grid-cols-12 gap-4 px-6 py-4">
            {columns.map((column) => (
              <div key={column.key} className={`col-span-${column.span} text-left font-semibold text-sm uppercase tracking-wider`}>
                {column.label}
              </div>
            ))}
            {actions && <div className="col-span-2 text-left font-semibold text-sm uppercase tracking-wider">Actions</div>}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {data.map((item, index) => (
              <div key={item._id} className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                {columns.map((column) => (
                  <div key={column.key} className={`col-span-${column.span} flex items-center`}>
                    {column.render ? column.render(item) : (
                      <span className="text-slate-700 font-medium truncate">
                        {item[column.key] || '--'}
                      </span>
                    )}
                  </div>
                ))}
                {actions && (
                  <div className="col-span-2 flex items-center space-x-1">
                    {actions(item)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Mobile Cards */}
      <div className="lg:hidden flex-1 overflow-y-auto p-4">
        <div className={`space-y-4 transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
          {data.map((item) => (
            <div key={item._id} className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
              {mobileCardRender ? mobileCardRender(item) : (
                <div>
                  {columns.slice(0, 3).map((column) => (
                    <div key={column.key} className="mb-2">
                      <span className="font-medium">{column.label}:</span> {item[column.key] || '--'}
                    </div>
                  ))}
                  {actions && (
                    <div className="flex space-x-2 mt-4">
                      {actions(item)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <PaginationFooter
        pagination={pagination}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        itemName={itemName}
      />
    </div>
  );
}