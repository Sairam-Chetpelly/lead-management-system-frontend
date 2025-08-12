'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import DataTable from './DataTable';
import TableFilters from './TableFilters';
import ActionBar from './ActionBar';
import { useTableData } from '@/hooks/useTableData';

interface SimpleTableProps {
  fetchFn: (params: any) => Promise<any>;
  columns: Array<{
    key: string;
    label: string;
    span: number;
    render?: (item: any) => React.ReactNode;
  }>;
  filters: Array<{
    key: string;
    type: 'search' | 'select';
    placeholder?: string;
    options?: { value: string; label: string }[];
    span?: number;
  }>;
  itemName: string;
  onAdd?: () => void;
  onEdit?: (item: any) => void;
  onDelete?: (id: string) => void;
  onExport?: () => void;
  addLabel?: string;
  addIcon?: React.ReactNode;
  mobileCardRender?: (item: any) => React.ReactNode;
  customActions?: (item: any) => React.ReactNode;
}

export default function SimpleTable({
  fetchFn,
  columns,
  filters,
  itemName,
  onAdd,
  onEdit,
  onDelete,
  onExport,
  addLabel,
  addIcon,
  mobileCardRender,
  customActions
}: SimpleTableProps) {
  const [showFilters, setShowFilters] = useState(false);
  const {
    data,
    loading,
    filters: filterValues,
    pagination,
    handleFilterChange,
    handlePageChange,
    handleLimitChange,
    refetch
  } = useTableData({ fetchFn });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await onDelete?.(id);
        refetch();
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const defaultActions = (item: any) => (
    <>
      {onEdit && (
        <button 
          onClick={() => onEdit(item)} 
          className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all"
        >
          <Pencil size={14} />
        </button>
      )}
      {onDelete && (
        <button 
          onClick={() => handleDelete(item._id)} 
          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
        >
          <Trash2 size={14} />
        </button>
      )}
      {customActions?.(item)}
    </>
  );

  return (
    <div className="p-4 lg:p-8 space-y-6 min-h-full">
      <TableFilters
        fields={filters}
        values={filterValues}
        onChange={handleFilterChange}
        isVisible={showFilters}
        onToggleVisible={() => setShowFilters(!showFilters)}
      />

      <ActionBar
        onAdd={onAdd}
        onExport={onExport}
        addLabel={addLabel}
        addIcon={addIcon}
      />

      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        itemName={itemName}
        actions={defaultActions}
        mobileCardRender={mobileCardRender}
      />
    </div>
  );
}