// src/components/admin/category-management/CategoryTable.tsx
import React, { useMemo } from 'react';
import {
  ImageIcon, Hash, ListOrdered, Building2, Pencil, Trash2, Tag, Layers,
} from 'lucide-react';
import { DataTable, type Column } from '../../ui/DataTable';
import { Pagination } from '../../ui/Pagination';
import { TableControls } from '../../ui/TableControls';
import { SearchInput } from '../../ui/SearchInput';
import { CustomSelect, type SelectOption } from '../../ui/CustomSelect';
import MobileCardSkeleton from "../../ui/MobileCardSkeleton";
import MobileActionBar from "../../ui/MobileActionBar";
import SortSheet from "../../ui/SortSheet";
import FilterSortSheet from "../../ui/FilterSortSheet";
import type { Category } from '../../../types';

const MemoizedDataTable = React.memo(DataTable) as typeof DataTable;
const MemoizedPagination = React.memo(Pagination);

interface CategoryTableProps {
  loading: boolean;
  readOnly: boolean;
  categoriesWithRowNumber: (Category & { rowNumber?: number })[];
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  sortField: string;
  sortOrder: string;
  onSort: (field: string) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  sortOptions: SelectOption[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function CategoryTable({
  loading,
  readOnly,
  categoriesWithRowNumber,
  onEdit,
  onDelete,
  sortField,
  sortOrder,
  onSort,
  pageSize,
  onPageSizeChange,
  inputValue,
  onInputChange,
  sortOptions,
  currentPage,
  totalPages,
  onPageChange,
}: CategoryTableProps) {
  const columns: Column<Category>[] = useMemo(
    () => [
      {
        key: 'rowNumber',
        header: 'No.',
        sortable: false,
        render: (cat) => <span className="text-xs text-gray-500">{cat.rowNumber}</span>,
      },
      {
        key: 'icon',
        header: 'Icon',
        sortable: false,
        render: (cat) =>
          cat.icon ? (
            <img src={cat.icon} alt={cat.name} className="h-10 w-10 rounded-xl object-cover shadow-sm border border-gray-100" />
          ) : (
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center border border-gray-200">
              <ImageIcon size={16} className="text-gray-400" />
            </div>
          ),
      },
      {
        key: 'name',
        header: 'Name',
        sortable: true,
        render: (cat) => (
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate">{cat.name}</p>
            {cat.name_am && <p className="text-xs text-gray-500 truncate">{cat.name_am}</p>}
          </div>
        ),
      },
      {
        key: 'slug',
        header: 'Slug',
        sortable: true,
        render: (cat) => (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-600 bg-gray-50 rounded-lg px-2 py-1">
            <Hash size={12} className="text-gray-400" />{cat.slug}
          </span>
        ),
      },
      {
        key: 'code',
        header: 'Code',
        sortable: true,
        render: (cat) => cat.code || <span className="text-gray-400">—</span>,
      },
      {
        key: 'order',
        header: 'Priority',
        sortable: true,
        render: (cat) => (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700">
            <ListOrdered size={12} className="text-gray-400" />{cat.order ?? '—'}
          </span>
        ),
      },
      {
        key: 'is_active',
        header: 'Status',
        sortable: true,
        render: (cat) => (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${cat.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cat.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            {cat.is_active ? 'Active' : 'Inactive'}
          </span>
        ),
      },
      {
        key: 'company_count',
        header: 'Companies',
        sortable: true,
        render: (cat) => (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
            <Building2 size={12} className="text-gray-400" />{cat.company_count ?? 0}
          </span>
        ),
      },
    ],
    [],
  );

  const handleSortChange = (value: string) => {
    const [field, order] = value.split('|');
    if (field === sortField) {
      if (order !== sortOrder) onSort(field);
    } else {
      onSort(field);
      if (order === 'desc') onSort(field);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-0">
      {/* Mobile sticky search */}
      <div className="sm:hidden sticky top-0 z-20 bg-white/90 backdrop-blur-lg border-b border-gray-200/80 px-4 py-3 space-y-3">
        <SearchInput
          value={inputValue}
          onChange={onInputChange}
          loading={loading}
          placeholder="Search by name, slug, code..."
          debounceMs={0}
        />
      </div>

      {/* Desktop controls */}
      <div className="hidden sm:block">
        <TableControls pageSize={pageSize} onPageSizeChange={onPageSizeChange}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div className="flex-1 w-full min-w-0">
              <SearchInput value={inputValue} onChange={onInputChange} loading={loading} placeholder="Search by name, slug, code..." debounceMs={0} />
            </div>
            <CustomSelect value={`${sortField}|${sortOrder}`} options={sortOptions} onChange={handleSortChange} className="w-full sm:w-36" />
          </div>
        </TableControls>
      </div>

      {/* Mobile card view */}
      <div className="block sm:hidden">
        {loading ? (
          <MobileCardSkeleton count={3} metaLinePairs={2} showActions={true} />
        ) : categoriesWithRowNumber.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Layers className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No categories found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search or create a new category.</p>
          </div>
        ) : (
          <div className="space-y-3 xs:space-y-4 px-4">
            {categoriesWithRowNumber.map((cat) => (
              <div key={cat.id} className="bg-white rounded-xl p-4 xs:p-5 shadow-sm border border-gray-200 hover:border-purple-200 transition-all duration-200">
                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    {cat.icon ? (
                      <img src={cat.icon} alt={cat.name} className="h-12 w-12 xs:h-14 xs:w-14 rounded-xl object-cover shadow-sm border" />
                    ) : (
                      <div className="h-12 w-12 xs:h-14 xs:w-14 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center border border-gray-200">
                        <ImageIcon size={20} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm xs:text-base text-gray-900 truncate">{cat.name}</h3>
                        {cat.name_am && <p className="text-xs text-gray-500 mt-0.5 truncate">{cat.name_am}</p>}
                      </div>
                      <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] xs:text-xs font-medium rounded-full ${cat.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cat.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-gray-600 min-w-0"><Hash size={13} className="text-gray-400 shrink-0" /><span className="truncate">{cat.slug}</span></div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 min-w-0"><Tag size={13} className="text-gray-400 shrink-0" /><span className="truncate">{cat.code || '—'}</span></div>
                  <div className="flex items-center gap-2 text-xs text-gray-600"><ListOrdered size={13} className="text-gray-400 shrink-0" /><span>{cat.order ?? '—'}</span></div>
                  <div className="flex items-center gap-2 text-xs text-gray-600"><Building2 size={13} className="text-gray-400 shrink-0" /><span>{cat.company_count ?? 0} companies</span></div>
                </div>
                {!readOnly && (
                  <div className="mt-4 flex gap-2 pt-3 border-t border-gray-100">
                    <button onClick={() => onEdit(cat)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 active:bg-purple-200 transition-colors min-h-[44px]"><Pencil size={14} />Edit</button>
                    <button onClick={() => onDelete(cat)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 transition-colors min-h-[44px]"><Trash2 size={14} />Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
        <MemoizedDataTable<Category>
          data={categoriesWithRowNumber}
          columns={columns}
          loading={loading}
          emptyMessage="No categories found"
          onEdit={readOnly ? undefined : onEdit}
          onDelete={readOnly ? undefined : onDelete}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSort}
        />
      </div>

      <div className="mt-6 px-4 sm:px-0">
        <MemoizedPagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  );
}