// ServiceBookingFilters.tsx
import { X } from "lucide-react";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";

interface ServiceBookingFiltersProps {
  statusFilter: string;
  onStatusChange: (val: string) => void;
  dateFilter: string;
  onDateChange: (val: string) => void;
  staffFilter?: string;
  onStaffChange?: (val: string) => void;
  staffOptions?: SelectOption[];
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
  // optional class name for layout overrides
  className?: string;
  statusOptions: SelectOption[];
  pageSizeOptions: SelectOption[];
}

export function ServiceBookingFilters({
  statusFilter,
  onStatusChange,
  dateFilter,
  onDateChange,
  staffFilter = "all",
  onStaffChange,
  staffOptions = [],
  pageSize,
  onPageSizeChange,
  hasActiveFilters,
  onClear,
  className = "",
  statusOptions,
  pageSizeOptions,
}: ServiceBookingFiltersProps) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <CustomSelect
        value={statusFilter}
        onChange={onStatusChange}
        options={statusOptions}
        placeholder="All Statuses"
        className="w-40"
      />
      {staffOptions.length > 0 && onStaffChange && (
        <CustomSelect
          value={staffFilter}
          onChange={onStaffChange}
          options={staffOptions}
          placeholder="All Specialists"
          className="w-44"
        />
      )}
      <input
        type="date"
        value={dateFilter}
        onChange={(e) => onDateChange(e.target.value)}
        className="rounded-xl border border-secondary bg-gray-50 px-3 py-2 text-sm h-10 focus:outline-none focus:ring-2 focus:ring-secondary/20"
      />
      <CustomSelect
        value={String(pageSize)}
        onChange={(val) => onPageSizeChange(Number(val))}
        options={pageSizeOptions}
        placeholder="10 / page"
        className="w-32"
      />
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition whitespace-nowrap"
        >
          <X className="h-4 w-4" />
          Clear
        </button>
      )}
    </div>
  );
}