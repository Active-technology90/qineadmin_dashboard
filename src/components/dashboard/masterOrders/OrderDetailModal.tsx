// src/components/dashboard/orders/OrderDetailModal.tsx
import { useEffect, useRef, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Package,
  Truck,
  Receipt,
  Calendar,
  MapPin,
  Copy,
  Check,
  User,
  ImageIcon,

  Loader2,
  RefreshCw,
  PhoneCall,
  Building2,

  Store,
  Sparkles,
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
  const base =
    "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border shadow-sm ";

  if (s === "completed" || s === "delivered")
    return base + "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "paid" || s === "out_for_delivery")
    return base + "bg-violet-50 text-violet-700 border-violet-200";
  if (s === "pending") return base + "bg-amber-50 text-amber-700 border-amber-200";
  if (s === "processing" || s === "shipped")
    return base + "bg-sky-50 text-sky-700 border-sky-200";
  if (s === "approved" || s === "accepted")
    return base + "bg-green-50 text-green-700 border-green-200";
  if (s === "rejected" || s === "cancelled")
    return base + "bg-rose-50 text-rose-700 border-rose-200";
  return base + "bg-gray-50 text-gray-600 border-gray-200";
};

const getPaymentStatusColor = (ps?: string) => {
  const p = ps?.toLowerCase();
  if (p === "paid") return "bg-green-50 text-green-700 border-green-200";
  if (p === "verifying receipt")
    return "bg-orange-50 text-orange-700 border-orange-200";
  if (p === "checkout initiated")
    return "bg-gray-50 text-gray-700 border-gray-200";
  if (p === "cancelled") return "bg-red-50 text-red-700 border-red-200";
  return "bg-gray-50 text-gray-700 border-gray-200";
};

// -----------------------------------------------------------------------------
// Reusable Subcomponents
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
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleCopy}
      className="text-gray-400 hover:text-[#6750A4] transition-colors p-1 rounded-md bg-white/50 backdrop-blur-sm"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </motion.button>
  );
});
CopyButton.displayName = "CopyButton";

// Premium Card Component
const Card = ({
  children,
  title,
  icon: Icon,
  status,
  className = "",
}: {
  children: React.ReactNode;
  title: string;
  icon: React.ElementType;
  status?: string;
  className?: string;
}) => (
  <motion.div
    variants={itemVariants}
    className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100/20 p-5 shadow-md hover:shadow-lg transition-shadow duration-300 ${className}`}
  >
    <div className="flex flex-row justify-between items-start">
      <div className="flex items-center gap-2 mb-4 pb-3 w-full relative">
        <div className="p-1.5 bg-gradient-to-br from-[#6750A4]/20 to-[#8B6BB5]/20 rounded-lg shadow-inner">
          <Icon className="h-4 w-4 text-[#6750A4]" />
        </div>
        <h4 className="text-sm font-bold bg-gradient-to-r from-[#6750A4] to-[#8B6BB5] bg-clip-text text-transparent">
          {title}
        </h4>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#6750A4] via-[#8B6BB5] to-transparent rounded-full" />
      </div>
      {status && <span className={getStatusBadge(status)}>{status}</span>}
    </div>
    {children}
  </motion.div>
);

// Premium Vendor Transaction Card (similar to vendor modal's main content)
const VendorOrderCard = memo(({ vendorOrder }: { vendorOrder: VendorOrder }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2 }}
    transition={{ duration: 0.2 }}
    className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
  >
    {/* Company header */}
    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100">
          {vendorOrder.company?.logo ? (
            <img
              src={vendorOrder.company.logo}
              alt={`${vendorOrder.company.name} logo`}
              className="w-6 h-6 object-contain"
            />
          ) : (
            <Store className="h-5 w-5 text-[#6750A4]" />
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-800">
            {vendorOrder.company?.name || "Unknown Company"}
          </p>
          <p className="text-xs text-gray-500">Vendor order</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(vendorOrder.status)}`}>
          {vendorOrder.status}
        </span>
        <div className="text-right">
          <span className="text-lg font-bold text-[#6750A4] tracking-tight block">
            {Number(vendorOrder.amount).toLocaleString()} ETB
          </span>
          {Number(vendorOrder.delivery_fee) > 0 && (
            <span className="text-[10px] font-medium text-gray-500 block">
              Incl. {Number(vendorOrder.delivery_fee).toLocaleString()} ETB Delivery
            </span>
          )}
        </div>
      </div>
    </div>

    {/* Delivery tracking (if exists) */}
    {vendorOrder.delivery && (
      <div className="bg-gradient-to-r from-purple-50/40 to-transparent px-6 py-3 border-b border-purple-100/50">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#6750A4] mb-2">
          <Truck className="h-3.5 w-3.5" />
          <span>Delivery tracking</span>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          {vendorOrder.delivery.delivery_person_name && (
            <div className="flex items-center gap-2 bg-white/50 rounded-full px-3 py-1">
              <User className="h-3 w-3 text-gray-500" />
              <span className="text-gray-700">
                {vendorOrder.delivery.delivery_person_name}
              </span>
            </div>
          )}
          {vendorOrder.delivery.tracking_id && (
            <div className="flex items-center gap-2 bg-white/50 rounded-full px-3 py-1">
              <span className="text-gray-700 font-mono text-xs">
                {vendorOrder.delivery.tracking_id.split("-")[0]}
              </span>
              <CopyButton text={vendorOrder.delivery.tracking_id.split("-")[0]} />
            </div>
          )}
          {vendorOrder.delivery.status && (
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${getStatusBadge(vendorOrder.delivery.status)}`}>
              {vendorOrder.delivery.status}
            </div>
          )}
        </div>
      </div>
    )}

  {vendorOrder.items.length > 0 && (
  <div className="px-5 py-6 sm:px-6">
    {/* ===================================================== */}
    {/* Header */}
    {/* ===================================================== */}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#6750A4]/10 bg-gradient-to-br from-[#6750A4]/10 to-violet-100 shadow-sm">
          <Package className="h-4 w-4 text-[#6750A4]" />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
            Order Items
          </p>

          <h3 className="mt-1 text-sm font-bold text-gray-900">
            {vendorOrder.items.length} Product
            {vendorOrder.items.length > 1 ? "s" : ""}
          </h3>
        </div>
      </div>

      <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-[#6750A4]/10 bg-[#6750A4]/5 px-3 py-2">
        <div className="h-2 w-2 rounded-full bg-[#6750A4] animate-pulse" />

        <span className="text-[11px] font-bold tracking-wide text-[#6750A4]">
          Vendor Products
        </span>
      </div>
    </div>

    {/* ===================================================== */}
    {/* Premium Container */}
    {/* ===================================================== */}
    <div className="overflow-hidden rounded-[26px] border border-gray-200/80 bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
      {/* Desktop Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white px-6 py-4">
        <div className="col-span-6">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Product
          </span>
        </div>

        <div className="col-span-2 text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Qty
          </span>
        </div>

        <div className="col-span-2 text-right">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Unit Price
          </span>
        </div>

        <div className="col-span-2 text-right">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Total
          </span>
        </div>
      </div>

      {/* ===================================================== */}
      {/* Items */}
      {/* ===================================================== */}
      <div className="divide-y divide-gray-100">
        {vendorOrder.items.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.25,
              delay: idx * 0.04,
            }}
            className="
              group
              grid
              grid-cols-1
              md:grid-cols-12
              gap-5
              md:gap-4
              px-5
              py-5
              md:px-6
              transition-all
              duration-300
              hover:bg-gradient-to-r
              hover:from-violet-50/40
              hover:to-transparent
            "
          >
            {/* ===================================================== */}
            {/* Product */}
            {/* ===================================================== */}
            <div className="md:col-span-6 min-w-0">
              <div className="flex items-center gap-4 min-w-0">
                {/* Image */}
                <div
                  className="
                    relative
                    h-16
                    w-16
                    flex-shrink-0
                    overflow-hidden
                    rounded-2xl
                    border
                    border-gray-100
                    bg-gradient-to-br
                    from-gray-50
                    to-gray-100
                    shadow-sm
                  "
                >
                  {item.product_image ? (
                    <img
                      src={item.product_image}
                      alt={item.title}
                      className="
                        h-full
                        w-full
                        object-cover
                        transition-transform
                        duration-500
                        group-hover:scale-105
                      "
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-gray-300" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/[0.03] to-transparent" />
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-bold leading-tight text-gray-900">
                    {item.title}
                  </h4>

                  <div className="mt-2 flex items-center gap-2 min-w-0">
                    <span className="inline-flex flex-shrink-0 items-center rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                      SKU
                    </span>

                    <span className="truncate font-mono text-[11px] text-gray-400">
                      {item.sku || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ===================================================== */}
            {/* Qty */}
            {/* ===================================================== */}
            <div className="md:col-span-2 flex md:justify-center items-center">
              <div className="w-full md:w-auto flex items-center justify-between md:block">
                <span className="md:hidden text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  Qty
                </span>

                <div
                  className="
                    inline-flex
                    h-10
                    min-w-[54px]
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-[#6750A4]/10
                    bg-gradient-to-br
                    from-[#6750A4]/8
                    to-violet-50
                    px-4
                    shadow-sm
                  "
                >
                  <span className="text-sm font-black text-[#6750A4]">
                    ×{item.qty}
                  </span>
                </div>
              </div>
            </div>

            {/* ===================================================== */}
            {/* Unit Price */}
            {/* ===================================================== */}
            <div className="md:col-span-2 flex md:justify-end items-center">
              <div className="w-full md:w-auto flex items-center justify-between md:block md:text-right">
                <span className="md:hidden text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  Unit Price
                </span>

                <div>
                  <p className="text-sm font-bold tracking-tight text-gray-700">
                    {Number(item.unit_price).toLocaleString()}
                  </p>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    ETB
                  </p>
                </div>
              </div>
            </div>

            {/* ===================================================== */}
            {/* Total */}
            {/* ===================================================== */}
            <div className="md:col-span-2 flex md:justify-end items-center">
              <div className="w-full md:w-auto flex items-center justify-between md:block md:text-right">
                <span className="md:hidden text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  Total
                </span>

                <div>
                  <p className="text-base font-black tracking-tight text-gray-900">
                    {Number(item.line_total).toLocaleString()}
                  </p>

                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6750A4]">
                    ETB
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
)}
  </motion.div>
));
VendorOrderCard.displayName = "VendorOrderCard";

// Premium Financial Overview Card (Aggregated)
const FinancialCard = memo(({ order }: { order: MasterOrder }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#6750A4] via-[#5a448c] to-[#4a3a78] p-6 shadow-lg"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-white/70" />
          <p className="text-sm font-semibold text-white/90">Financial breakdown</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Total</p>
          <h3 className="text-2xl font-black text-white">
            {Number(order.total_amount).toLocaleString()} <span className="text-sm">ETB</span>
          </h3>
        </div>
      </div>
      <div className="space-y-3 pt-2 border-t border-white/10">
        <div className="flex justify-between text-xs font-medium text-white/70">
          <span>Subtotal</span>
          <span>{Number(order.subtotal).toLocaleString()} ETB</span>
        </div>
        <div className="flex justify-between text-xs font-medium text-white/70">
          <span>Tax</span>
          <span>{Number(order.tax_total).toLocaleString()} ETB</span>
        </div>
        {/* Render each vendor order's delivery fee separately */}
        {order.vendor_orders?.map((vo) => (
          <div key={vo.id} className="flex justify-between text-xs font-medium text-white/70 pl-3 border-l border-white/20">
            <span className="opacity-80">{vo.company?.name || "Vendor"} Delivery</span>
            <span>{Number(vo.delivery_fee || 0).toLocaleString()} ETB</span>
          </div>
        ))}
        {Number(order.delivery_fee) > 0 && (
          <div className="flex justify-between text-xs font-bold text-white pt-1 border-t border-white/10">
            <span>Total Delivery Fee</span>
            <span>{Number(order.delivery_fee).toLocaleString()} ETB</span>
          </div>
        )}
      </div>
    </div>
    <Sparkles className="absolute bottom-3 right-3 h-6 w-6 text-white/10" />
  </motion.div>
));
FinancialCard.displayName = "FinancialCard";

// Timeline Activity
const TimelineCard = memo(({ order }: { order: MasterOrder }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
  >
    <div className="flex items-center gap-2 mb-6">
      <Calendar className="h-4 w-4 text-[#6750A4]" />
      <h4 className="text-sm font-semibold text-gray-900">Timeline</h4>
    </div>
    <div className="space-y-6">
      <div className="relative flex gap-4">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-[#6750A4] ring-4 ring-[#6750A4]/10" />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-px h-8 bg-gray-200" />
          </div>
        </div>
        <div className="pb-4 flex-1">
          <p className="text-sm font-medium text-gray-800">Order created</p>
          <p className="text-xs text-gray-500 mt-1">{formatDateTime(order.created_at)}</p>
        </div>
      </div>
      <div className="relative flex gap-4">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-[#6750A4] ring-4 ring-[#6750A4]/10" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">Last updated</p>
          <p className="text-xs text-gray-500 mt-1">{formatDateTime(order.updated_at)}</p>
        </div>
      </div>
    </div>
  </motion.div>
));
TimelineCard.displayName = "TimelineCard";

// Customer Profile Card (simplified for master order)
const CustomerCard = memo(({ order }: { order: MasterOrder }) => (
  <Card title="Customer Profile" icon={User}>
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-white shadow-sm flex items-center justify-center text-[#6750A4] font-black text-xl">
        {getInitials(order.recipient_name || "?")}
      </div>
      <div className="space-y-1">
        <p className="font-black bg-gradient-to-r from-[#6750A4] to-[#8B6BB5] bg-clip-text text-transparent">
          {order.recipient_name || "N/A"}
        </p>
        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50/50 px-3 py-1.5 rounded-lg w-fit border border-blue-200 shadow-sm">
          <PhoneCall className="h-3.5 w-3.5 text-green-600" />
          <span className="text-xs font-mono font-bold text-green-700 tracking-tight">
            {order.shipping_phone || "No phone"}
          </span>
          <CopyButton text={order.shipping_phone} />
        </div>
      </div>
    </div>
  </Card>
));
CustomerCard.displayName = "CustomerCard";

// Shipping Card
const ShippingCard = memo(({ order }: { order: MasterOrder }) => (
  <Card title="Shipping Destination" icon={MapPin}>
    <div className="space-y-3">
      <div className="flex items-start gap-2 p-2 rounded-lg bg-purple-50/30 border-l-4 border-[#6750A4]">
        <span className="text-xs font-bold text-gray-500 min-w-[100px]">Recipient:</span>
        <span className="text-sm font-bold text-[#6750A4]">{order.recipient_name || "N/A"}</span>
      </div>
      <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-50/30 border-l-4 border-green-500">
        <span className="text-xs font-bold text-gray-500 min-w-[100px]">Phone:</span>
        <div className="flex items-center gap-2">
          <PhoneCall className="h-3.5 w-3.5 text-green-600" />
          <span className="text-sm font-mono font-bold text-green-700">{order.shipping_phone || "N/A"}</span>
          <CopyButton text={order.shipping_phone} />
        </div>
      </div>
      <div className="flex items-start gap-2 p-2 rounded-lg bg-purple-50/30 border-l-4 border-[#6750A4]">
        <span className="text-xs font-bold text-gray-500 min-w-[100px]">Address:</span>
        <span className="text-sm text-gray-700 leading-relaxed">{order.shipping_address_text || "N/A"}</span>
      </div>
    </div>
  </Card>
));
ShippingCard.displayName = "ShippingCard";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// Focus trap hook
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
export function OrderDetailModal({
  order,
  onClose,
  onRefresh,
}: {
  order: MasterOrder | null;
  onClose: () => void;
  onRefresh?: () => Promise<void>;
}) {
  const [refreshing, setRefreshing] = useState(false);
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

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          ref={modalRef}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="relative bg-gradient-to-br from-white via-white to-gray-50/50 w-full max-w-7xl max-h-[92vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-white/20 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Premium Glass Header */}
          <div className="bg-gradient-to-r from-white via-white/95 to-purple-50/30 backdrop-blur-md border-b border-purple-100/30 px-8 py-5 flex justify-between items-center sticky top-0 z-20 shadow-sm">
            <div className="flex items-center gap-5">
              <div className="h-12 w-12 bg-gradient-to-br from-[#6750A4] to-[#8B6BB5] rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 ring-1 ring-white/20">
                <Package className="text-white h-6 w-6 drop-shadow-sm" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
                    Order #{order.id}
                  </h2>
                  <span className={getStatusBadge(order.status)}>{order.status}</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="flex items-center gap-2 bg-[#6750A4]/10 px-4 py-1.5 rounded-full border border-[#6750A4]/20 shadow-sm">
                    <Calendar className="h-3.5 w-3.5 text-[#6750A4]" />
                    <span className="font-mono text-[12px] font-semibold text-gray-700 tracking-tight">
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      <span className="text-[#6750A4] mx-0.5">•</span>{" "}
                      {new Date(order.created_at).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <Building2 className="h-3.5 w-3.5 text-gray-400" />
                    <span className="font-medium">
                      {order.vendor_orders?.length || 0} {order.vendor_orders?.length === 1 ? "company" : "companies"}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onRefresh && (
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="group flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white
                     hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100
                     active:scale-95 transition-all duration-200
                     disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                >
                  {refreshing ? (
                    <Loader2 className="h-4 w-4 text-[#6750A4] animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 text-gray-500 group-hover:text-[#6750A4] transition-colors" />
                  )}
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-[#6750A4]">
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </span>
                </button>
              )}
              <button
                onClick={onClose}
                className="group p-3 rounded-xl bg-white border border-gray-200 shadow-sm
                   hover:bg-rose-50 hover:border-rose-200
                   active:scale-95 transition-all duration-200"
              >
                <X className="h-5 w-5 text-gray-400 group-hover:text-rose-500 transition-colors" />
              </button>
            </div>
          </div>

          {/* Scrollable Content Grid */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto custom-scrollbar scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-gray-100"
          >
            {showTopShadow && (
              <div className="sticky top-0 h-8 bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none z-10" />
            )}
            <div className="p-8">
              <div className="grid grid-cols-12 gap-8">
                {/* Left Side: Customer & Shipping + Vendor Orders */}
                <div className="col-span-12 lg:col-span-8 space-y-8">
                  {/* Customer + Shipping (only for delivery) */}
                  {order.fulfillment_type === "delivery" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <CustomerCard order={order} />
                      <ShippingCard order={order} />
                    </div>
                  )}

                  {/* Vendor Orders Section */}
                  {order.vendor_orders && order.vendor_orders.length > 0 ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-[#6750A4]" />
                        <h4 className="text-base font-semibold text-gray-800">
                          Company orders ({order.vendor_orders.length})
                        </h4>
                      </div>
                      <div className="space-y-5">
                        {order.vendor_orders.map((vo) => (
                          <VendorOrderCard key={vo.id} vendorOrder={vo} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-16 bg-gray-50/30 rounded-2xl border border-dashed border-gray-200"
                    >
                      <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500 text-sm font-medium">
                        No vendor orders associated
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Right Side: Financial & Timeline */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                  <FinancialCard order={order} />
                  <TimelineCard order={order} />
                </div>
              </div>
            </div>
            {showBottomShadow && (
              <div className="sticky bottom-0 h-8 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}