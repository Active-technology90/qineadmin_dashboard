// src/components/dashboard/orders/OrderDetailModal.tsx (upgraded)
import { useEffect, useRef, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Package,
  CreditCard,
  Building2,
  Calendar,
  MapPin,
  Truck,
  User,
  Hash,
  Receipt,
  Copy,
  Check,
  Phone,
  TrendingUp,
} from "lucide-react";
import type { MasterOrder, VendorOrder } from "../../../types";

// -----------------------------------------------------------------------------
// Helper functions
// -----------------------------------------------------------------------------
const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getInitials = (name: string) =>
  name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

const getStatusBadge = (status: string) => {
  const s = status?.toLowerCase();
  if (s === "completed" || s === "delivered")
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (s === "paid" || s === "out_for_delivery")
    return "bg-purple-100 text-purple-800 border-purple-200";
  if (s === "pending") return "bg-amber-100 text-amber-800 border-amber-200";
  if (s === "processing" || s === "shipped")
    return "bg-blue-100 text-blue-800 border-blue-200";
  if (s === "approved" || s === "accepted")
    return "bg-green-100 text-green-800 border-green-200";
  if (s === "rejected" || s === "cancelled")
    return "bg-red-100 text-red-800 border-red-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
};

const getPaymentStatusColor = (ps?: string) => {
  const p = ps?.toLowerCase();
  if (p === "paid") return "bg-green-100 text-green-800 border-green-200";
  if (p === "verifying receipt")
    return "bg-orange-100 text-orange-800 border-orange-200";
  if (p === "checkout initiated")
    return "bg-gray-100 text-gray-800 border-gray-200";
  if (p === "cancelled") return "bg-red-100 text-red-800 border-red-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
};

// -----------------------------------------------------------------------------
// Reusable Subcomponents (memoised)
// -----------------------------------------------------------------------------
const CopyButton = memo(({ text }: { text?: string | number | null }) => {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  const handleCopy = () => {
    navigator.clipboard.writeText(String(text));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="text-gray-400 hover:text-[#6750A4] transition-colors p-1 rounded"
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
});
CopyButton.displayName = "CopyButton";

const CustomerCard = memo(({ order }: { order: MasterOrder }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
      <User className="h-4 w-4 text-[#6750A4]" /> Customer Information
    </h4>
    <div className="flex items-start gap-4">
      <div className="w-14 h-14 rounded-full bg-[#6750A4]/10 flex items-center justify-center text-[#6750A4] font-bold text-xl flex-shrink-0">
        {getInitials(order.recipient_name || "?")}
      </div>
      <div className="space-y-1 text-sm">
        <p className="font-bold text-gray-900 text-lg">
          {order.recipient_name || "N/A"}
        </p>
        <div className="flex items-center gap-2 text-gray-500">
          <Phone className="h-3.5 w-3.5" />
          <span>{order.shipping_phone || "No phone"}</span>
          <CopyButton text={order.shipping_phone} />
        </div>
      </div>
    </div>
  </div>
));
CustomerCard.displayName = "CustomerCard";

const ShippingCard = memo(({ order }: { order: MasterOrder }) => (
  <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm hover:shadow-md transition-shadow">
    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
      <MapPin className="h-4 w-4 text-[#6750A4]" /> Shipping Address
    </h4>
    <div className="space-y-3 text-sm">
      <div>
        <span className="text-xs text-gray-500">Recipient</span>
        <p className="font-medium text-gray-900">
          {order.recipient_name || "N/A"}
        </p>
      </div>
      <div>
        <span className="text-xs text-gray-500">Phone</span>
        <p className="font-medium text-gray-900">
          {order.shipping_phone || "N/A"}
        </p>
      </div>
      <div>
        <span className="text-xs text-gray-500">Address</span>
        <p className="text-gray-700 whitespace-pre-line leading-relaxed">
          {order.shipping_address_text || "N/A"}
        </p>
      </div>
    </div>
  </div>
));
ShippingCard.displayName = "ShippingCard";

const VendorCard = memo(({ vendorOrder }: { vendorOrder: VendorOrder }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
    className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
  >
    <div className="bg-gray-50/80 px-5 py-4 flex flex-wrap justify-between items-center gap-3 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200 shadow-sm">
          {vendorOrder.company?.logo ? (
            <img
              src={vendorOrder.company.logo}
              alt={`${vendorOrder.company.name} logo`}
              className="w-7 h-7 object-contain"
            />
          ) : (
            <Building2 className="h-5 w-5 text-[#6750A4]" />
          )}
        </div>
        <span className="font-semibold text-gray-800">
          {vendorOrder.company?.name || "Unknown Company"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(vendorOrder.status)}`}
        >
          {vendorOrder.status}
        </span>
        <span className="text-sm font-bold text-[#6750A4]">
          {Number(vendorOrder.amount).toLocaleString()} ETB
        </span>
      </div>
    </div>

    {vendorOrder.delivery && (
      <div className="bg-purple-50/30 px-5 py-3 border-b border-dashed border-purple-100">
        <p className="text-xs font-semibold text-[#6750A4] flex items-center gap-2 mb-2">
          <Truck className="h-3.5 w-3.5" /> Delivery Tracking
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {vendorOrder.delivery.delivery_person_name && (
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-gray-700">
                <span className="text-gray-500">Driver:</span>{" "}
                {vendorOrder.delivery.delivery_person_name}
              </span>
            </div>
          )}
          {vendorOrder.delivery.tracking_id && (
            <div className="flex items-center gap-2">
              <Hash className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-gray-700">
                <span className="text-gray-500">Tracking:</span>{" "}
                {vendorOrder.delivery.tracking_id.split("-")[0]}
              </span>
              <CopyButton text={vendorOrder.delivery.tracking_id.split("-")[0]} />
            </div>
          )}
          {vendorOrder.delivery.status && (
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${getStatusBadge(vendorOrder.delivery.status)}`}
              >
                {vendorOrder.delivery.status}
              </span>
            </div>
          )}
        </div>
      </div>
    )}

    {vendorOrder.items.length > 0 && (
      <div className="p-5">
        <p className="text-xs font-semibold text-gray-500 mb-3">Order Items</p>
        <div className="space-y-3">
          {vendorOrder.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center border border-gray-200">
                {item.product_image ? (
                  <img
                    src={item.product_image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {item.title}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                  <span>SKU: {item.sku || "—"}</span>
                  <span>Qty: {item.qty}</span>
                  <span>Unit: {Number(item.unit_price).toLocaleString()} ETB</span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-bold text-[#6750A4]">
                  {Number(item.line_total).toLocaleString()} ETB
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </motion.div>
));
VendorCard.displayName = "VendorCard";

const FinancialCard = memo(({ order }: { order: MasterOrder }) => (
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#6750A4] via-[#5a448c] to-[#4a3a78] p-6 shadow-lg">
    {/* Glow accent */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
    <div className="relative z-10">
      <p className="text-sm font-semibold text-gray-100 flex items-center gap-2 mb-4">
        <Receipt className="h-4 w-4" /> Financial Breakdown
      </p>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-200">Subtotal</span>
          <span className="font-medium text-white">
            {Number(order.subtotal).toLocaleString()} ETB
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-200">Tax</span>
          <span className="font-medium text-white">
            {Number(order.tax_total).toLocaleString()} ETB
          </span>
        </div>
        <div className="border-t border-white/20 pt-2 flex justify-between text-base font-bold text-white">
          <span>Total</span>
          <span className="text-lg">
            {Number(order.total_amount).toLocaleString()} ETB
          </span>
        </div>
      </div>
    </div>
  </div>
));
FinancialCard.displayName = "FinancialCard";

const TimelineCard = memo(({ order }: { order: MasterOrder }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
      <Calendar className="h-4 w-4 text-[#6750A4]" /> Timeline
    </h4>
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#6750A4] mt-1.5 ring-2 ring-[#6750A4]/20" />
          <div className="w-px h-full bg-gray-200" />
        </div>
        <div className="pb-4">
          <p className="text-xs text-gray-500">Order Created</p>
          <p className="text-sm font-medium text-gray-800">
            {formatDateTime(order.created_at)}
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#6750A4] mt-1.5 ring-2 ring-[#6750A4]/20" />
        </div>
        <div>
          <p className="text-xs text-gray-500">Last Updated</p>
          <p className="text-sm font-medium text-gray-800">
            {formatDateTime(order.updated_at)}
          </p>
        </div>
      </div>
    </div>
  </div>
));
TimelineCard.displayName = "TimelineCard";

const SummaryCard = memo(
  ({
    icon: Icon,
    label,
    value,
    badge,
    accentColor = "#6750A4",
  }: {
    icon: React.ElementType;
    label: string;
    value?: string | number;
    badge?: { text: string; color: string };
    accentColor?: string;
  }) => (
    <div className="group bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div
          className="p-2.5 rounded-xl transition-colors"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <Icon className="h-5 w-5" style={{ color: accentColor }} />
        </div>
        {badge && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.color}`}
          >
            {badge.text}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold mt-3 text-gray-900">{value ?? "—"}</p>
      <p className="text-xs font-medium text-gray-500 mt-1">{label}</p>
    </div>
  )
);
SummaryCard.displayName = "SummaryCard";

// -----------------------------------------------------------------------------
// Focus trap helper
// -----------------------------------------------------------------------------
const useFocusTrap = (ref: React.RefObject<HTMLElement | null>, active: boolean) => {
  useEffect(() => {
    if (!active || !ref.current) return;
    const focusable = ref.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0] as HTMLElement;
    const last = focusable[focusable.length - 1] as HTMLElement;
    first.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleTab);
    return () => window.removeEventListener("keydown", handleTab);
  }, [active, ref]);
};

// -----------------------------------------------------------------------------
// Main Modal Component
// -----------------------------------------------------------------------------
const modalVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15, ease: "easeIn" } },
} as const;

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export function OrderDetailModal({
  order,
  onClose,
}: {
  order: MasterOrder | null;
  onClose: () => void;
}) {
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(modalRef, !!order);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setShowTopShadow(scrollTop > 8);
      setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 8);
    };
    const el = scrollRef.current;
    el?.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => el?.removeEventListener("scroll", handleScroll);
  }, [order]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!order) return null;

  return (
    <AnimatePresence>
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
        aria-labelledby="order-detail-title"
      >
        <motion.div
          ref={modalRef}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-white rounded-3xl w-full max-w-7xl max-h-[90vh] flex flex-col shadow-2xl shadow-black/10 ring-1 ring-black/5 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 sm:px-8 py-4 sm:py-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h2
                id="order-detail-title"
                className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#6750A4] to-[#9B7DD4] bg-clip-text text-transparent"
              >
                Order #{order.id}
              </h2>
              <CopyButton text={order.id} />
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-[#6750A4] p-2 rounded-full hover:bg-gray-100 transition"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
            {showTopShadow && (
              <div className="sticky top-0 h-6 bg-gradient-to-b from-white via-white to-transparent pointer-events-none z-10" />
            )}

            <div className="p-6 sm:p-8 space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                  icon={Package}
                  label="Order Status"
                  value={order.status}
                  badge={{ text: order.status, color: getStatusBadge(order.status) }}
                />
                <SummaryCard
                  icon={CreditCard}
                  label="Payment"
                  value={order.payment_method}
                  badge={{
                    text: order.payment_status || "Unknown",
                    color: getPaymentStatusColor(order.payment_status),
                  }}
                />
                <SummaryCard
                  icon={Building2}
                  label="Active Vendors"
                  value={order.vendor_orders?.length ?? 0}
                />
                <SummaryCard
                  icon={TrendingUp}
                  label="Total Amount"
                  value={`${Number(order.total_amount).toLocaleString()} ETB`}
                />
              </div>

              {/* Customer & Shipping (only for delivery) */}
              {order.fulfillment_type === "delivery" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CustomerCard order={order} />
                  <ShippingCard order={order} />
                </div>
              )}

              {/* Vendor Orders */}
              {order.vendor_orders && order.vendor_orders.length > 0 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#6750A4]" />
                    <h4 className="text-base font-semibold text-gray-800">
                      Vendor Orders ({order.vendor_orders.length})
                    </h4>
                  </div>
                  {order.vendor_orders.map((vo) => (
                    <VendorCard key={vo.id} vendorOrder={vo} />
                  ))}
                </div>
              )}

              {/* Financial & Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FinancialCard order={order} />
                <TimelineCard order={order} />
              </div>

              {/* Empty state */}
              {(!order.vendor_orders || order.vendor_orders.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No vendor orders found</p>
                </div>
              )}
            </div>

            {showBottomShadow && (
              <div className="sticky bottom-0 h-6 bg-gradient-to-t from-white via-white to-transparent pointer-events-none z-10" />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}