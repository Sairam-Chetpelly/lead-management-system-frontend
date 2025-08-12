'use client';

import { Search, Filter } from 'lucide-react';

interface FilterField {
  key: string;
  type: 'search' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
  span?: number;
}

interface TableFiltersProps {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  showMobileToggle?: boolean;
  isVisible?: boolean;
  onToggleVisible?: () => void;
}

export default function TableFilters({
  fields,
  values,
  onChange,
  showMobileToggle = true,
  isVisible = true,
  onToggleVisible
}: TableFiltersProps) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
      {showMobileToggle && (
        <div className={`md:hidden ${isVisible ? 'mb-4' : ''}`}>
          <button
            onClick={onToggleVisible}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium text-sm hover:bg-blue-200 transition-all"
          >
            <Filter size={16} />
            <span>Filters</span>
          </button>
        </div>
      )}
      
      <div className={`${showMobileToggle && !isVisible ? 'hidden' : 'block'} md:block`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {fields.map((field) => (
            <div key={field.key} className={field.span ? `lg:col-span-${field.span}` : ''}>
              {field.type === 'search' ? (
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={field.placeholder || 'Search...'}
                    value={values[field.key] || ''}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
                  />
                </div>
              ) : (
                <select
                  value={values[field.key] || ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
                >
                  <option value="">{field.placeholder || 'All'}</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}