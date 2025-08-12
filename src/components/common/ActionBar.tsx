'use client';

import { ReactNode } from 'react';
import { FileSpreadsheet, Plus } from 'lucide-react';

interface ActionBarProps {
  onAdd?: () => void;
  onExport?: () => void;
  addLabel?: string;
  addIcon?: ReactNode;
  exportLabel?: string;
  customActions?: ReactNode;
}

export default function ActionBar({
  onAdd,
  onExport,
  addLabel = 'Add Item',
  addIcon = <Plus size={20} />,
  exportLabel = 'Export',
  customActions
}: ActionBarProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex flex-wrap gap-3">
        {onExport && (
          <button 
            onClick={onExport}
            className="flex items-center space-x-3 px-4 lg:px-6 py-3 bg-white/80 backdrop-blur-sm border border-emerald-200 rounded-2xl hover:bg-emerald-50 transition-all duration-300 shadow-lg hover:shadow-xl group"
          >
            <FileSpreadsheet size={20} className="text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-emerald-700 font-semibold hidden sm:inline">{exportLabel}</span>
          </button>
        )}
        {onAdd && (
          <button 
            onClick={onAdd}
            className="flex items-center space-x-3 px-4 lg:px-6 py-3 text-white rounded-2xl hover:opacity-80 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            style={{backgroundColor: '#0f172a'}}
          >
            {addIcon}
            <span className="font-semibold">{addLabel}</span>
          </button>
        )}
        {customActions}
      </div>
    </div>
  );
}