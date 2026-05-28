import React from 'react';
import { ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { SkeletonRow } from './SkeletonRow';
import { SortableHeader } from './SortableHeader';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortKey?: string;
  width?: string;
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
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

export function DataTable<
  T extends { id?: number | string; slug?: string }
>({
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

  const startIndex = currentPage
    ? (currentPage - 1) * itemsPerPage + 1
    : 0;

  const endIndex = currentPage
    ? Math.min(
        currentPage * itemsPerPage,
        totalItems || data.length
      )
    : data.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-visible">
      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <table className="min-w-[800px] lg:min-w-full table-fixed">
          <thead className="sticky top-0 bg-gradient-to-r from-secondary/5 via-secondary/10 to-secondary/5 backdrop-blur-sm z-8 shadow-sm">
            <tr>
              {columns.map((col, idx) => {
                const headerContent = (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    {col.header}
                  </span>
                );

                if (
                  col.sortable &&
                  onSort &&
                  sortField !== undefined &&
                  sortOrder !== undefined
                ) {
                  return (
                    <SortableHeader
                      key={idx}
                      field={col.sortKey || (col.key as string)}
                      currentSort={{
                        field: sortField,
                        order: sortOrder,
                      }}
                      onSort={onSort}
                      className={`
                        ${col.width || ''}
                        px-1.5 sm:px-4
                        py-2 sm:py-3
                        text-left
                        text-[9px] sm:text-xs
                        font-semibold
                        text-secondary
                        uppercase
                        tracking-wider
                        whitespace-nowrap
                        ${col.className || ''}
                      `}
                    >
                      {headerContent}
                    </SortableHeader>
                  );
                }

                return (
                  <th
                    key={idx}
                    className={`
                      ${col.width || ''}
                      px-1.5 sm:px-4
                      py-2 sm:py-3
                      text-left
                      text-[9px] sm:text-xs
                      font-semibold
                      text-secondary
                      uppercase
                      tracking-wider
                      whitespace-nowrap
                      ${col.className || ''}
                    `}
                  >
                    {headerContent}
                  </th>
                );
              })}

              {(onEdit || onDelete) && (
                <th className="w-[90px] px-1.5 sm:px-4 py-2 sm:py-3 text-right text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Actions
                  </span>
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <SkeletonRow
                  key={i}
                  cols={
                    columns.length +
                    (onEdit || onDelete ? 1 : 0)
                  }
                />
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    columns.length +
                    (onEdit || onDelete ? 1 : 0)
                  }
                  className="px-4 sm:px-6 py-12 text-center text-gray-400 text-sm sm:text-base"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr
                  key={item.id ?? idx}
                  className="hover:bg-gray-50/80 transition-colors duration-200"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`
                        px-2 sm:px-4
                        py-2 sm:py-3
                        text-xs sm:text-sm
                        text-gray-700
                        align-middle
                        break-words
                        ${col.className || ''}
                      `}
                    >
                      {renderCell(item, col)}
                    </td>
                  ))}

                  {(onEdit || onDelete) && (
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="inline-flex items-center justify-center p-1.5 sm:p-2 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            title="Edit"
                            aria-label="Edit"
                          >
                            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        )}

                        {onDelete && (
                          <button
                            onClick={() => onDelete(item)}
                            className="inline-flex items-center justify-center p-1.5 sm:p-2 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                            title="Delete"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading &&
        totalPages &&
        totalPages > 1 &&
        onPageChange && (
          <div className="px-3 py-3 sm:px-4 sm:py-3 md:px-6 border-t border-gray-200 bg-gray-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="text-[11px] sm:text-xs md:text-sm text-gray-500 order-2 sm:order-1">
              Showing{' '}
              <span className="font-medium text-gray-700">
                {startIndex}
              </span>{' '}
              to{' '}
              <span className="font-medium text-gray-700">
                {endIndex}
              </span>{' '}
              of{' '}
              <span className="font-medium text-gray-700">
                {totalItems ?? data.length}
              </span>{' '}
              entries
            </div>

            <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
              <button
                onClick={() => onPageChange(currentPage! - 1)}
                disabled={currentPage === 1}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary/50"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => onPageChange(currentPage! + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary/50"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
    </div>
  );
}