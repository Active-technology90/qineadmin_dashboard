// src/components/ui/DataTable.tsx
import React from 'react';
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { SkeletonRow } from './SkeletonRow';
import { SortableHeader } from './SortableHeader';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;      // new
  sortKey?: string;        // optional, for nested fields like "category_name"
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  // Sorting props
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

export function DataTable<T extends { id?: number | string; slug?: string }>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data found',
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 10,
  sortField,
  sortOrder,
  onSort,
}: DataTableProps<T>) {
  const renderCell = (item: T, column: Column<T>) => {
    if (column.render) return column.render(item);
    const value = item[column.key as keyof T];
    return value?.toString() ?? '-';
  };

  const startIndex = currentPage ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endIndex = currentPage
    ? Math.min(currentPage * itemsPerPage, totalItems || data.length)
    : data.length;

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col, idx) => {
                if (col.sortable && onSort && sortField !== undefined && sortOrder !== undefined) {
                  return (
                    <SortableHeader
                      key={idx}
                      field={col.sortKey || (col.key as string)}
                      currentSort={{ field: sortField, order: sortOrder }}
                      onSort={onSort}
                      className={col.className}
                    >
                      {col.header}
                    </SortableHeader>
                  );
                }
                return (
                  <th
                    key={idx}
                   className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide ${col.className || ''}`}
                  >
                    {col.header}
                  </th>
                );
              })}
              {(onEdit || onDelete) && (
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <SkeletonRow key={i} cols={columns.length + (onEdit || onDelete ? 1 : 0)} />
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr key={item.id ?? idx} className="hover:bg-gray-50 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-2 py-2 text-sm align-top ${col.className || ''}`}>
                      {renderCell(item, col)}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-2 py-2 text-right space-x-1 whitespace-nowrap">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalPages && totalPages > 1 && onPageChange && (
        <div className="px-6 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50">
          <div className="text-sm text-gray-500">
            Showing {startIndex} to {endIndex} of {totalItems ?? data.length} entries
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange(currentPage! - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(currentPage! + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}