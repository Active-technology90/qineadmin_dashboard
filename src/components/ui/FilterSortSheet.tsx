// src/components/shared/FilterSortSheet.tsx
import React from 'react';
import BottomSheet from './BottomSheet';
import { CustomSelect, type SelectOption } from '../ui/CustomSelect';
import { X } from 'lucide-react';

interface FilterSortSheetProps {
  open: boolean;
  onClose: () => void;
  sortOptions: SelectOption[];
  tempSort: string;
  onTempSortChange: (val: string) => void;
  categoryOptions: SelectOption[];
  tempCategory: string;
  onTempCategoryChange: (val: string) => void;
  categoryNameMap?: Record<string, string>; // for displaying active filter chip
  onApply: () => void;
  onClearAll: () => void;
}

const FilterSortSheet: React.FC<FilterSortSheetProps> = ({
  open,
  onClose,
  sortOptions,
  tempSort,
  onTempSortChange,
  categoryOptions,
  tempCategory,
  onTempCategoryChange,
  categoryNameMap = {},
  onApply,
  onClearAll,
}) => (
  <BottomSheet
    open={open}
    onClose={onClose}
    title="Filters & Sort"
    maxHeight="90vh"
    footer={
      <>
        <button
          onClick={onClearAll}
          className="flex-1 h-12 rounded-2xl bg-gray-100 text-sm font-semibold text-gray-700 active:scale-[0.98] transition-all"
        >
          Clear
        </button>
        <button
          onClick={onApply}
          className="flex-1 h-12 rounded-2xl bg-[#6750A4] text-sm font-semibold text-white shadow-lg shadow-[#6750A4]/20 active:scale-[0.98] transition-all"
        >
          Apply Filters
        </button>
      </>
    }
  >
    <div className="space-y-12">
      {/* Sort section */}
      <div>
        <label className="text-xs font-semibold tracking-wide uppercase text-gray-500 mb-2 block">
          Sort By
        </label>
        <CustomSelect
          value={tempSort}
          onChange={onTempSortChange}
          options={sortOptions}
          className="w-full"
        />
      </div>
      {/* Category filter */}
      <div>
        <label className="text-xs font-semibold tracking-wide uppercase text-gray-500 mb-2 block">
          Category
        </label>
        <CustomSelect
          value={tempCategory}
          onChange={onTempCategoryChange}
          options={categoryOptions}
          className="w-full"
        />
        {tempCategory !== 'all' && categoryNameMap[tempCategory] && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
              {categoryNameMap[tempCategory]}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => onTempCategoryChange('all')}
              />
            </span>
          </div>
        )}
      </div>
    </div>
  </BottomSheet>
);

export default React.memo(FilterSortSheet);