import { Search, X, ChevronDown, RefreshCw } from "lucide-react";
import { CustomSelect, } from "../../ui/CustomSelect";

interface OrderFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  // onStatusChange: (val: string) => void;
  deliveryStatusFilter: string;
  // onDeliveryStatusChange: (val: string) => void;
  paymentStatusFilter: string;
  onPaymentStatusChange: (val: string) => void;
  fulfillmentTypeFilter: string;
  onFulfillmentTypeChange: (val: string) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  onRefresh?: () => void;
  onClear: () => void;
  showMobile?: boolean;
  onToggleMobile?: () => void;
}

export function OrderFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  // onStatusChange,
  deliveryStatusFilter,
  // onDeliveryStatusChange,
  paymentStatusFilter,
  onPaymentStatusChange,
  fulfillmentTypeFilter,
  onFulfillmentTypeChange,
  pageSize,
  onPageSizeChange,
  onRefresh,
  onClear,
}: OrderFiltersProps) {
  const hasFilters =
    !!searchTerm ||
    !!statusFilter ||
    !!deliveryStatusFilter ||
    !!paymentStatusFilter ||
    !!fulfillmentTypeFilter;


  const paymentStatusLabels: Record<string, string> = {
    Paid: "Paid",
    "Verifying Receipt": "Verifying Receipt",
    "Pay on Delivery": "Pay on Delivery",
    "Checkout Initiated": "Checkout Initiated",
    "Awaiting Bank Transfer": "Awaiting Bank Transfer",
  };

  const fulfillmentLabels: Record<string, string> = {
    delivery: "Delivery",
    pickup: "Pickup",
  };

  return (
    <div className="hidden lg:block w-full bg-white rounded-2xl border border-gray-100 shadow-sm transition-all overflow-visible relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-3 border-b border-gray-100">
        <div className="flex items-center gap-2" />
        <div className="flex items-center gap-2">
          {hasFilters && (
              <button
                onClick={onClear}
                className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-medium
                         border border-red-200 text-red-600 hover:bg-red-50 transition"
              >
                <X size={12} className="sm:w-[14px] sm:h-[14px]" />
                <span className="hidden xs:inline">Clear</span>
              </button>
          )}
 
        </div>
      </div>

      {/* Body */}
      <div className="p-3 sm:p-5 space-y-3 sm:space-y-5">
        {/* Search + Refresh - HIDDEN ON MOBILE (visible only on desktop) */}
        <div className="hidden lg:flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID, customer name, phone, or address..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20
                         outline-none transition text-xs sm:text-sm"
            />
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center justify-center w-full sm:w-10 h-10 rounded-xl border border-gray-200 bg-gray-50
                         hover:bg-white hover:border-secondary transition-all duration-200 group flex-shrink-0"
              title="Refresh orders"
            >
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 group-hover:text-secondary group-hover:rotate-180 transition-all duration-300" />
            </button>
          )}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-40">
          {/* Order Status */}
          {/* <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20
                         text-sm pr-8 outline-none transition"
            >
              <option value="">All Order Statuses</option>
              {Object.entries(orderStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div> */}

          {/* Delivery Status */}
          {/* <div className="relative">
            <select
              value={deliveryStatusFilter}
              onChange={(e) => onDeliveryStatusChange(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20
                         text-sm pr-8 outline-none transition"
            >
              <option value="">All Delivery Statuses</option>
              {Object.entries(deliveryStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div> */}

          {/* Payment Status - Desktop uses CustomSelect, Mobile uses native select */}
          <div className="hidden md:block relative z-50">
            <CustomSelect
              value={paymentStatusFilter}
              onChange={onPaymentStatusChange}
              options={[
                { value: "", label: "All Payment Statuses" },
                { value: "Paid", label: "Paid" },
                { value: "Verifying Receipt", label: "Verifying Receipt" },
                { value: "Pay on Delivery", label: "Pay on Delivery" },
                { value: "Checkout Initiated", label: "Checkout Initiated" },
                { value: "Awaiting Bank Transfer", label: "Awaiting Bank Transfer" },
              ]}
              placeholder="All Payment Statuses"
              className="w-full"
            />
          </div>
          <div className="md:hidden relative">
            <select
              value={paymentStatusFilter}
              onChange={(e) => onPaymentStatusChange(e.target.value)}
              className="w-full appearance-none px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20
                         text-xs sm:text-sm pr-6 sm:pr-8 outline-none transition"
            >
              <option value="">All Payment Statuses</option>
              {Object.entries(paymentStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Fulfillment Type - Desktop uses CustomSelect, Mobile uses native select */}
          <div className="hidden md:block relative z-50">
            <CustomSelect
              value={fulfillmentTypeFilter}
              onChange={onFulfillmentTypeChange}
              options={[
                { value: "", label: "All Fulfillment Types" },
                { value: "delivery", label: "Delivery" },
                { value: "pickup", label: "Pickup" },
              ]}
              placeholder="All Fulfillment Types"
              className="w-full"
            />
          </div>
          <div className="md:hidden relative">
            <select
              value={fulfillmentTypeFilter}
              onChange={(e) => onFulfillmentTypeChange(e.target.value)}
              className="w-full appearance-none px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20
                         text-xs sm:text-sm pr-6 sm:pr-8 outline-none transition"
            >
              <option value="">All Fulfillment Types</option>
              {Object.entries(fulfillmentLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Page Size - Desktop uses CustomSelect, Mobile uses native select */}
          <div className="hidden md:block relative z-50">
            <CustomSelect
              value={String(pageSize)}
              onChange={(val) => onPageSizeChange(Number(val))}
              options={[
                { value: "5", label: "5 / page" },
                { value: "10", label: "10 / page" },
                { value: "15", label: "15 / page" },
                { value: "30", label: "30 / page" },
                { value: "60", label: "60 / page" },
              ]}
              placeholder="5 / page"
              className="w-full"
            />
          </div>
          <div className="md:hidden relative">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="w-full appearance-none px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20
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
  );
}