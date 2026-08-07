import { Search, X, RefreshCw } from "lucide-react";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";

interface ServiceBookingAdvancedFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  paymentStatusFilter: string;
  onPaymentStatusChange: (val: string) => void;
  paymentMethodFilter: string;
  onPaymentMethodChange: (val: string) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
  onRefresh?: () => void;
  statusOptions: SelectOption[];
  pageSizeOptions: SelectOption[];
}

export function ServiceBookingAdvancedFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  paymentStatusFilter,
  onPaymentStatusChange,
  paymentMethodFilter,
  onPaymentMethodChange,
  pageSize,
  onPageSizeChange,
  hasActiveFilters,
  onClear,
  onRefresh,
  statusOptions,
  pageSizeOptions,
}: ServiceBookingAdvancedFiltersProps) {
  const PAYMENT_STATUS_OPTIONS: SelectOption[] = [
    { value: "", label: "All Payment Status" },
    { value: "not_required", label: "Not Required" },
    { value: "pending", label: "Pending" },
    { value: "paid", label: "Paid" },
    { value: "failed", label: "Failed" },
  ];

  const PAYMENT_METHOD_OPTIONS: SelectOption[] = [
    { value: "", label: "All Payment Methods" },
    { value: "cod", label: "COD" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "chapa", label: "Chapa" },
    // add any other methods your API uses
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-700">Filters</h2>
          {hasActiveFilters && (
            <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-medium">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium
                         border border-red-200 text-red-600 hover:bg-red-50 transition"
            >
              <X size={12} className="sm:w-[14px] sm:h-[14px]" />
              <span className="hidden xs:inline">Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-3 sm:p-5 space-y-3 sm:space-y-5">
        {/* Search + Refresh */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, customer, service, or phone..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20
                         outline-none transition text-xs sm:text-sm"
            />
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-gray-50
                         hover:bg-white hover:border-secondary transition-all duration-200 group flex-shrink-0"
              title="Refresh bookings"
            >
              <RefreshCw className="h-4 w-4 text-gray-500 group-hover:text-secondary group-hover:rotate-180 transition-all duration-300" />
            </button>
          )}
        </div>

        {/* Dropdown filters + page size */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3">
          <CustomSelect
            value={statusFilter}
            onChange={onStatusChange}
            options={statusOptions}
            placeholder="All Statuses"
            className="w-full"
          />
          <CustomSelect
            value={paymentStatusFilter}
            onChange={onPaymentStatusChange}
            options={PAYMENT_STATUS_OPTIONS}
            placeholder="All Payment Status"
            className="w-full"
          />
          <CustomSelect
            value={paymentMethodFilter}
            onChange={onPaymentMethodChange}
            options={PAYMENT_METHOD_OPTIONS}
            placeholder="All Payment Methods"
            className="w-full"
          />
          <CustomSelect
            value={String(pageSize)}
            onChange={(val) => onPageSizeChange(Number(val))}
            options={pageSizeOptions}
            placeholder="10 / page"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}