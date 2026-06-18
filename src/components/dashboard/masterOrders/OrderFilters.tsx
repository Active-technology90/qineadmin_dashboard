import { Search, X, ChevronDown, RefreshCw } from "lucide-react";
import { TableControls } from "../../ui/TableControls";
import { SearchInput } from "../../ui/SearchInput";
import { CustomSelect } from "../../ui/CustomSelect";

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
<div className="hidden md:block">
  <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/80 px-4 py-3 mb-6">

        <TableControls pageSize={pageSize} onPageSizeChange={onPageSizeChange}>
          <div className="flex flex-wrap items-end gap-3 w-full">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <SearchInput
                value={searchTerm}
                onChange={onSearchChange}
                placeholder="Search by order ID, customer name, phone, or address..."
                loading={false}
                showClearButton={!!searchTerm}
              />
            </div>

            {/* Payment Status */}
            <div className="w-full sm:w-48">
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
                placeholder="Payment status"
                className="w-full"
              />
            </div>

            {/* Fulfillment Type */}
            <div className="w-full sm:w-44">
              <CustomSelect
                value={fulfillmentTypeFilter}
                onChange={onFulfillmentTypeChange}
                options={[
                  { value: "", label: "All Fulfillment Types" },
                  { value: "delivery", label: "Delivery" },
                  { value: "pickup", label: "Pickup" },
                ]}
                placeholder="Fulfillment type"
                className="w-full"
              />
            </div>

            {/* Refresh & Clear Buttons */}
            <div className="flex items-center gap-2 ml-auto">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="p-2 rounded-full text-gray-400 hover:text-secondary hover:bg-secondary/10 transition-all duration-200"
                  title="Refresh orders"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
              {hasFilters && (
                <button
                  onClick={onClear}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition text-sm font-medium"
                >
                  <X size={14} />
                  Clear all
                </button>
              )}
            </div>
          </div>        {/* closes flex container */}
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
        </TableControls>
    </div>
  </div>
  );
}