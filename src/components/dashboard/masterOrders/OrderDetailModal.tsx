import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Package,
  CreditCard,
  Receipt,
  Building2,
  Calendar,
  MapPin,
  Truck,
  User,
  Hash,
  ImageIcon,
  TrendingUp,
  Clock,
  CheckCircle,
  Copy,
  Check,
} from "lucide-react";
import type { MasterOrder, VendorOrder } from "../../../types";

// -----------------------------------------------------------------------------
// Subcomponents (light theme, no dark mode)
// -----------------------------------------------------------------------------


const OrderHeader = ({
  orderId,
  onClose,
}: {
  orderId: number;
  onClose: () => void;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`#${orderId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-bold bg-gradient-to-r from-[#6750A4] to-[#9B7DD4] bg-clip-text text-transparent">
          Order #{orderId}
        </h3>
        <button
          onClick={handleCopy}
          className="p-1.5 text-gray-400 hover:text-[#6750A4] transition-colors rounded-lg hover:bg-gray-100"
          aria-label="Copy order ID"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
        <span className="text-xs text-green-600 ml-1">
          {copied && "Copied!"}
        </span>
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-[#6750A4] transition-colors p-1 rounded-full hover:bg-gray-100"
        aria-label="Close modal"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};

const SummaryCard = ({
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
  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-md hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div
        className="p-2 rounded-lg"
        style={{ backgroundColor: `${accentColor}10` }}
      >
        <Icon className="h-5 w-5" style={{ color: accentColor }} />
      </div>
      {badge && (
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full border ${badge.color}`}
        >
          {badge.text}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold mt-3 text-gray-900">{value ?? "—"}</p>
    <p className="text-xs text-gray-500 mt-1">{label}</p>
  </div>
);

const FinancialCard = ({ order }: { order: MasterOrder }) => (
  <div className="bg-[#6750A4] text-white rounded-xl border border-gray-100 p-5 shadow-sm">
    <p className="text-sm font-semibold text-gray-50 flex items-center gap-2 mb-4">
      <Receipt className="h-4 w-4 text-white" /> Financial Breakdown
    </p>
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-gray-50">Subtotal</span>
        <span className="font-medium text-gray-50">
          {Number(order.subtotal).toLocaleString()} ETB
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-50">Tax</span>
        <span className="font-medium text-gray-50">
          {Number(order.tax_total).toLocaleString()} ETB
        </span>
      </div>
      <div className="border-t border-gray-100 pt-2 flex justify-between text-base font-bold">
        <span className="text-gray-50">Total</span>
        <span className="text-white font-bold">
          {Number(order.total_amount).toLocaleString()} ETB
        </span>
      </div>
    </div>
  </div>
);

const TimelineCard = ({ order }: { order: MasterOrder }) => {
  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  return (
    <div className="bg-[#6750A4] rounded-xl border border-gray-100 p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-50 flex items-center gap-2 mb-4">
        <Calendar className="h-4 w-4 text-white" /> Timeline
      </p>
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-50">Created</span>
          <span className="font-medium text-gray-50">
            {formatDateTime(order.created_at)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-50">Last Updated</span>
          <span className="font-medium text-gray-50">
            {formatDateTime(order.updated_at)}
          </span>
        </div>
      </div>
    </div>
  );
};

const ShippingCard = ({ order }: { order: MasterOrder }) => (
  <div className="bg-white rounded-xl border border-blue-100 p-5 shadow-sm">
    <p className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
      <MapPin className="h-4 w-4 text-[#6750A4]" /> Shipping Information
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div>
        <p className="text-xs text-gray-500">Recipient</p>
        <p className="font-medium text-gray-900">
          {order.recipient_name || "N/A"}
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Phone</p>
        <p className="font-medium text-gray-900">
          {order.shipping_phone || "N/A"}
        </p>
      </div>
      <div className="md:col-span-2">
        <p className="text-xs text-gray-500">Full Address</p>
        <p className="text-gray-700">{order.shipping_address_text || "N/A"}</p>
      </div>
    </div>
  </div>
);

const ItemRow = ({ item }: { item: VendorOrder["items"][0] }) => (
  <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50  transition-colors">
    <div className="flex-shrink-0 w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center border border-gray-200">
      {item.product_image ? (
        <img
          src={item.product_image}
          alt={item.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <ImageIcon className="h-6 w-6 text-gray-400" />
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
);

const VendorCard = ({ vendorOrder }: { vendorOrder: VendorOrder }) => {
  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed")
      return "bg-green-100 text-green-800 border-green-200";
    if (s === "paid") return "bg-blue-100 text-blue-800 border-blue-200";
    if (s === "pending")
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (s === "cancelled") return "bg-red-100 text-red-800 border-red-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getDeliveryStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "delivered")
      return {
        label: "Delivered",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      };
    if (s === "out_for_delivery")
      return {
        label: "Out for Delivery",
        color: "bg-purple-100 text-purple-800",
        icon: Truck,
      };
    if (s === "shipped")
      return {
        label: "Shipped",
        color: "bg-blue-100 text-blue-800",
        icon: Package,
      };
    if (s === "processing")
      return {
        label: "Processing",
        color: "bg-amber-100 text-amber-800",
        icon: Clock,
      };
    return {
      label: status || "Pending",
      color: "bg-gray-100 text-gray-800",
      icon: Clock,
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="bg-gray-50/80 px-5 py-3 flex flex-wrap justify-between items-center gap-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 shadow-sm">
            {vendorOrder.company?.logo ? (
              <img
                src={vendorOrder.company.logo}
                alt={`${vendorOrder.company.name} logo`}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="h-4 w-4 text-[#6750A4]" />
            )}
          </div>
          <span className="font-semibold text-gray-800">
            {vendorOrder.company?.name || "Unknown Company"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(vendorOrder.status)}`}
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
              </div>
            )}
            {vendorOrder.delivery.status && (
              <div className="flex items-center gap-2">
                {(() => {
                  const badge = getDeliveryStatusBadge(
                    vendorOrder.delivery.status,
                  );
                  const Icon = badge.icon;
                  return (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${badge.color}`}
                    >
                      <Icon className="h-3 w-3" /> {badge.label}
                    </span>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
      {vendorOrder.items.length > 0 && (
        <div className="p-5">
          <p className="text-xs font-semibold text-gray-500 mb-3">
            Order Items
          </p>
          <div className="space-y-3">
            {vendorOrder.items.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// -----------------------------------------------------------------------------
// Main Component (light theme, white backdrop)
// -----------------------------------------------------------------------------

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: "easeOut"  as const },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15, ease: "easeIn"  as const },
  },
};

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

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setShowTopShadow(scrollTop > 5);
      setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 5);
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

  const statusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed")
      return "bg-green-100 text-green-800 border-green-200";
    if (s === "paid") return "bg-blue-100 text-blue-800 border-blue-200";
    if (s === "pending")
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (s === "cancelled") return "bg-red-100 text-red-800 border-red-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const paymentStatusColor = (ps: string) => {
    const p = ps?.toLowerCase();
    if (p === "paid") return "bg-green-100 text-green-800 border-green-200";
    if (p === "verifying receipt")
      return "bg-orange-100 text-orange-800 border-orange-200";
    if (p === "checkout initiated")
      return "bg-gray-100 text-gray-800 border-gray-200";
    if (p === "cancelled") return "bg-red-100 text-red-800 border-red-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <AnimatePresence>
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50  p-4"
        onClick={onClose}
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl ring-1 ring-black/5 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <OrderHeader orderId={order.id} onClose={onClose} />

          <div
            ref={scrollRef}
            className="flex-1 overflow-auto relative scroll-smooth"
          >
            {/* Scroll shadow top */}
            {showTopShadow && (
              <div className="sticky top-0 h-4 bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />
            )}

            <div className="p-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                  icon={Package}
                  label="Order Status"
                  badge={{
                    text: order.status,
                    color: statusColor(order.status),
                  }}
                />
                <SummaryCard
                  icon={CreditCard}
                  label="Payment"
                  value={order.payment_method}
                  badge={{
                    text: order.payment_status || "Unknown",
                    color: paymentStatusColor(order.payment_status),
                  }}
                />
                <SummaryCard
                  icon={Building2}
                  label="Active Vendors"
                  value={order.vendor_count ?? order.vendor_orders?.length ?? 0}
                />
                <SummaryCard
                  icon={TrendingUp}
                  label="Total Amount"
                  value={`${Number(order.total_amount).toLocaleString()} ETB`}
                  accentColor="#6750A4"
                />
              </div>

              {/* Shipping */}
              {order.fulfillment_type === "delivery" && (
                <ShippingCard order={order} />
              )}

              {/* Vendor Orders */}
              {order.vendor_orders && order.vendor_orders.length > 0 && (
                <div className="space-y-5 shadow-md">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FinancialCard order={order} />
                <TimelineCard order={order} />
              </div>

              {/* Empty State */}
              {(!order.vendor_orders || order.vendor_orders.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No vendor orders found</p>
                </div>
              )}
            </div>

            {/* Scroll shadow bottom */}
            {showBottomShadow && (
              <div className="sticky bottom-0 h-4 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
