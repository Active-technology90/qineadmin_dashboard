import { Search, X, ChevronDown, RefreshCw } from "lucide-react";
import type { CompanyListItem } from "../../../types";
import { TableControls } from "../../ui/TableControls";
import { SearchInput } from "../../ui/SearchInput";
import { CustomSelect } from "../../ui/CustomSelect";

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
<div className="hidden md:block">
  <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/80 px-4 py-3 mb-6">


        {/* Body – search + filters + page size inline */}
        <TableControls pageSize={pageSize} onPageSizeChange={onPageSizeChange}>
          <div className="flex flex-wrap items-end gap-3 w-full">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <SearchInput
                value={searchTerm}
                onChange={onSearchChange}
                placeholder="Search by order ID, customer name, or company..."
                loading={false}
                showClearButton={!!searchTerm}
              />
            </div>

            {/* Order Status */}
            <div className="w-full sm:w-44">
              <CustomSelect
                value={orderStatusFilter}
                onChange={onOrderStatusChange}
                options={[
                  { value: "", label: "All Order Status" },
                  { value: "pending", label: "Pending" },
                  { value: "contacted", label: "Confirmed" },
                  { value: "processing", label: "Prepared" },
                  { value: "fulfilled", label: "Delivered" },
                  { value: "shipped", label: "In Transit" },
                  { value: "payment_rejected", label: "Payment Rejected" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
                placeholder="Order status"
                className="w-full"
              />
            </div>

            {/* Delivery Status */}
            <div className="w-full sm:w-44">
              <CustomSelect
                value={deliveryStatusFilter}
                onChange={onDeliveryStatusChange}
                options={[
                  { value: "", label: "All Delivery Status" },
                  { value: "pending", label: "Assigned" },
                  { value: "accepted", label: "Accepted" },
                  { value: "picked_up", label: "Picked Up" },
                  { value: "out_for_delivery", label: "In Transit" },
                  { value: "delivered", label: "Completed" },
                  { value: "failed", label: "Failed" },
                ]}
                placeholder="Delivery status"
                className="w-full"
              />
            </div>

            {/* Payment Method */}
            <div className="w-full sm:w-40">
              <CustomSelect
                value={paymentMethodFilter}
                onChange={onPaymentMethodChange}
                options={[
                  { value: "", label: "All Payment Method" },
                  { value: "bank_transfer", label: "Bank Transfer" },
                  { value: "chapa", label: "Chapa" },
                  { value: "cod", label: "COD" },
                ]}
                placeholder="Payment method"
                className="w-full"
              />
            </div>

            {/* Company (conditional) */}
            {!hideCompanyFilter && (
              <div className="w-full sm:w-48">
                <CustomSelect
                  value={selectedCompanyId}
                  onChange={onCompanyChange}
                  options={[
                    { value: "", label: "All Companies" },
                    ...companies.map((c) => ({
                      value: String(c.id),
                      label: c.name,
                    })),
                  ]}
                  placeholder="Company"
                  className="w-full"
                />
              </div>
            )}
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
          </div>       
        </TableControls>
      </div>            
    </div>              
    </>
  );
}
