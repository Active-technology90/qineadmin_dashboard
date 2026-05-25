import { Search, X, Filter, ChevronDown, RefreshCw } from "lucide-react";
import type { CompanyListItem } from "../../../types";

interface VendorOrderFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;

  orderStatusFilter: string;
  onOrderStatusChange: (val: string) => void;

  deliveryStatusFilter: string;
  onDeliveryStatusChange: (val: string) => void;

  paymentMethodFilter: string;
  onPaymentMethodChange: (val: string) => void;

  selectedCompanyId: string;
  onCompanyChange: (val: string) => void;

  companies: CompanyListItem[];

  pageSize: number;
  onPageSizeChange?: (size: number) => void;
  onRefresh?: () => void;

  onClear: () => void;

  hideCompanyFilter?: boolean;
}

export function VendorOrderFilters({
  searchTerm,
  onSearchChange,
  orderStatusFilter,
  onOrderStatusChange,
  deliveryStatusFilter,
  onDeliveryStatusChange,
  paymentMethodFilter,
  onPaymentMethodChange,
  selectedCompanyId,
  onCompanyChange,
  companies,
  pageSize,
  onPageSizeChange,
  onClear,
  onRefresh,
  hideCompanyFilter = false,
}: VendorOrderFiltersProps) {
  const hasFilters =
    !!searchTerm ||
    !!orderStatusFilter ||
    !!deliveryStatusFilter ||
    !!paymentMethodFilter ||
    (!!selectedCompanyId && !hideCompanyFilter);

  const ORDER_STATUS_LABELS: Record<string, string> = {
    contacted: "Confirmed",

    processing: "Prepared",
    shipped: "In Transit",
    fulfilled: "Delivered",

    pending: "Assigned",
    out_for_delivery: "In Transit",
    delivered: "Completed",
  };
  return (
    <>
      {/* Mobile Toggle Button - REMOVED (now using floating button in parent) */}

      {/* Filters Container - Hidden on mobile, visible on desktop */}
      <div className="hidden lg:block w-full bg-white rounded-2xl border border-gray-100 shadow-sm transition-all">
        {/* Header – only title & utility buttons */}
        <div className="flex items-center justify-between px-3 sm:px-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-700">Filters</h2>
            {hasFilters && (
              <span className="text-xs bg-[#674FA3]/10 text-[#674FA3] px-2 py-0.5 rounded-full font-medium">
                Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasFilters && (
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

        {/* Body – search + filters + page size inline */}
        <div className="p-3 sm:p-5 space-y-3 sm:space-y-5">
          {/* Search with Refresh Button */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID, customer name, or company..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-xl border border-gray-200 bg-gray-50
                       focus:bg-white focus:border-[#674FA3] focus:ring-2 focus:ring-[#674FA3]/20
                       outline-none transition text-xs sm:text-sm"
              />
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="flex items-center justify-center w-full sm:w-10 h-10 rounded-xl border border-gray-200 bg-gray-50
                         hover:bg-white hover:border-[#674FA3] transition-all duration-200 group flex-shrink-0"
                title="Refresh orders"
              >
                <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 group-hover:text-[#674FA3] group-hover:rotate-180 transition-all duration-300" />
              </button>
            )}
          </div>

          {/* Filters + Page Size – all in one grid row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2 sm:gap-3">
            {/* Order Status */}
            <div className="relative">
              <select
                value={orderStatusFilter}
                onChange={(e) => onOrderStatusChange(e.target.value)}
                className="w-full appearance-none px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-[#674FA3] focus:ring-2 focus:ring-[#674FA3]/20
                         text-xs sm:text-sm pr-6 sm:pr-8 outline-none transition"
              >
                <option value="">All Order Status</option>

                <option value="pending">Pending</option>
                <option value="contacted">
                  {ORDER_STATUS_LABELS.contacted}
                </option>
                <option value="processing">
                  {ORDER_STATUS_LABELS.processing}
                </option>
                <option value="fulfilled">
                  {ORDER_STATUS_LABELS.fulfilled}
                </option>
                <option value="shipped">{ORDER_STATUS_LABELS.shipped}</option>

                <option value="payment_rejected">Payment Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Delivery Status */}
            <div className="relative">
              <select
                value={deliveryStatusFilter}
                onChange={(e) => onDeliveryStatusChange(e.target.value)}
                className="w-full appearance-none px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-[#674FA3] focus:ring-2 focus:ring-[#674FA3]/20
                         text-xs sm:text-sm pr-6 sm:pr-8 outline-none transition"
              >
                <option value="">All Delivery Status</option>

                <option value="pending">{ORDER_STATUS_LABELS.pending}</option>
                <option value="accepted">Accepted</option>
                <option value="picked_up">Picked Up</option>

                <option value="out_for_delivery">
                  {ORDER_STATUS_LABELS.out_for_delivery}
                </option>

                <option value="delivered">
                  {ORDER_STATUS_LABELS.delivered}
                </option>
                <option value="failed">Failed</option>
              </select>
              <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Payment Method */}
            <div className="relative">
              <select
                value={paymentMethodFilter}
                onChange={(e) => onPaymentMethodChange(e.target.value)}
                className="w-full appearance-none px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-[#674FA3] focus:ring-2 focus:ring-[#674FA3]/20
                         text-xs sm:text-sm pr-6 sm:pr-8 outline-none transition"
              >
                <option value="">All Payment Method</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="chapa">Chapa</option>
                <option value="cod">COD</option>
              </select>
              <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Company (conditional) */}
            {!hideCompanyFilter && (
              <div className="relative">
                <select
                  value={selectedCompanyId}
                  onChange={(e) => onCompanyChange(e.target.value)}
                  className="w-full appearance-none px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 bg-gray-50
                           focus:bg-white focus:border-[#674FA3] focus:ring-2 focus:ring-[#674FA3]/20
                           text-xs sm:text-sm pr-6 sm:pr-8 outline-none transition"
                >
                  <option value=""> All Companies</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
              </div>
            )}

            {/* Page Size – now in the same row! */}
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                className="w-full appearance-none px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-[#674FA3] focus:ring-2 focus:ring-[#674FA3]/20
                         text-xs sm:text-sm pr-6 sm:pr-8 outline-none transition"
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={15}>15 / page</option>
                <option value={30}>30 / page</option>
                <option value={60}>60 / page</option>
              </select>
              <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
