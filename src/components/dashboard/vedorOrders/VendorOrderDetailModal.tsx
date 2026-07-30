import React, { useEffect, useState, useMemo } from "react";
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
  Banknote,
  Loader2,
  RefreshCw,
  CreditCard,
  Eye,
  AlertCircle,
  ShieldCheck,
  PhoneCall,
  ZoomIn,
  CheckCircle,
  Building2,
  Navigation,
  History,
  Clock,
} from "lucide-react";
import {
  getCompanyStaffByRole,
  reviewReceipt,
  assignDelivery,
  updateDeliveryPerson,
  prepareVendorOrder,
  confirmCODPayment,
} from "../../../services/api";
import { useToast } from "../../../hooks/useToast";
import { ConfirmationModal } from "../../ui/confimationModal";
import { CustomSelect } from "../../ui/CustomSelect";

// ---------- Animation Variants ----------
const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// ---------- Helpers ----------
const getInitials = (name?: string) =>
  name
    ?.trim()
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

const formatAddress = (address?: string | null) => {
  if (!address) return "";
  return address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
};
// ─── Order Timeline Builder ──────────────────────────────
const buildOrderTimeline = (order: any) => {
  const events: any[] = [];

  // 1. Order Placed
  if (order.created_at) {
    events.push({
      id: "placed",
      label: "Order Placed",
      icon: "📦",
      time: order.created_at,
      actor: "Customer",
      status: "completed",
    });
  }

  // 2. Payment Approved (from receipt history)
  const approvedReceipt = order.receipt_history?.find(
    (h: any) => h.status === "approved"
  );
  if (approvedReceipt) {
    events.push({
      id: "payment",
      label: "Payment Approved",
      icon: "💳",
      time: approvedReceipt.updated_at || approvedReceipt.created_at,
      actor: "Admin",
      status: "completed",
    });
  } else if (order.payment_method === "chapa" && order.payment_status === "paid") {
    events.push({
      id: "payment",
      label: "Payment Confirmed",
      icon: "💳",
      time: order.created_at,
      actor: "Chapa",
      status: "completed",
    });
  }

  // 3. Order Prepared (if status is processing or fulfilled)
  if (order.status?.toLowerCase() === "processing" || order.status?.toLowerCase() === "fulfilled") {
    events.push({
      id: "prepared",
      label: "Order Prepared",
      icon: "✅",
      time: order.updated_at || order.created_at,
      actor: "Admin",
      status: "completed",
    });
  }

  // 4. Out for Delivery (from delivery status)
  if (order.delivery?.status?.toLowerCase() === "out_for_delivery") {
    events.push({
      id: "out_for_delivery",
      label: "In Transit",
      icon: "🚚",
      time: order.delivery.updated_at || order.delivery.created_at,
      actor: order.delivery.delivery_person_name || "Driver",
      status: "completed",
    });
  }

  // 5. Delivered / Completed
  if (
    order.delivery?.status?.toLowerCase() === "delivered" ||
    order.status?.toLowerCase() === "fulfilled"
  ) {
    events.push({
      id: "delivered",
      label: "Delivered",
      icon: "🏁",
      time: order.delivery?.updated_at || order.updated_at,
      actor: order.delivery?.delivery_person_name || "System",
      status: "completed",
    });
  }

  // If order is still pending, add a "pending" indicator
  if (order.status?.toLowerCase() === "pending" && !approvedReceipt) {
    events.push({
      id: "pending",
      label: "Awaiting Payment",
      icon: "⏳",
      time: order.created_at,
      actor: "Waiting for customer",
      status: "pending",
    });
  }

  // Sort by time (oldest first)
  events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  return events;
};

const getDisplayStatus = (
  status: string,
  customLabels?: Record<string, string>,
) => {
  const statusMap: Record<string, string> = {
    contacted: "Confirmed",

    processing: "Prepared",
    shipped: "In Transit",
    fulfilled: "Delivered",

    pending: "Assigned",
    out_for_delivery: "In Transit",
    delivered: "Completed",

    ...customLabels, // override default labels
  };

  return statusMap[status?.toLowerCase()] || status;
};

const getStatusBadge = (status: string) => {
  const s = status?.toLowerCase();

  const base =
    "px-2 md:px-3 py-1 text-[8px] md:text-[10px] font-bold uppercase tracking-wider rounded-full border shadow-sm";

  if (s === "completed" || s === "delivered" || s === "approved")
    return base + "bg-emerald-50 text-emerald-700 border-emerald-200";

  if (s === "paid" || s === "out_for_delivery")
    return (
      base +
      "bg-violet-50 text-violet-700 border-violet-200 flex flex-row w-24 items-center justify-center"
    );

  if (s === "pending")
    return base + "bg-amber-50 text-amber-700 border-amber-200";

  if (s === "rejected" || s === "cancelled" || s === "failed")
    return base + "bg-rose-50 text-rose-700 border-rose-200";

  return base + "bg-gray-50 text-gray-600 border-gray-200";
};

// ---------- Sub-Components ----------

const Card = ({ children, title, icon: Icon, status, className = "" }: any) => (
  <motion.div
    variants={itemVariants}
    className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100/20 p-2 md:p-5 shadow-md hover:shadow-lg transition-shadow duration-300 ${className}`}
  >
    <div className="flex flex-row justify-between items-start">
      <div className="flex items-center gap-2 mb-2 md:mb-4 pb-2 md:pb-3 w-full relative">
        <div className="p-1.5 bg-gradient-to-br from-secondary/20 to-secondary-light/20 rounded-lg shadow-inner">
          <Icon className="h-4 w-4 text-secondary" />
        </div>

        <h4 className="text-sm font-bold bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent">
          {title}
        </h4>
        {/* Decorative gradient line under header */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-secondary via-secondary-light to-transparent rounded-full"></div>
      </div>
      {status && (
        <div className="flex flex-row justify-start">
          <span className={getStatusBadge(status)}>
            {title === "Cash on Delivery" ? status : getDisplayStatus(status)}
          </span>
        </div>
      )}
    </div>
    {children}
  </motion.div>
);

const StatusBadge = ({
  status,
  customLabels,
}: {
  status: string;
  customLabels?: Record<string, string>;
}) => {
  const s = status?.toLowerCase();

  const styles: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",

    paid: "bg-violet-100 text-violet-700 border-violet-200",
    out_for_delivery: "bg-violet-100 text-violet-700 border-violet-200",

    pending: "bg-amber-100 text-amber-700 border-amber-200",

    processing: "bg-sky-100 text-sky-700 border-sky-200",
    shipped: "bg-sky-100 text-sky-700 border-sky-200",

    approved: "bg-green-100 text-green-700 border-green-200",

    rejected: "bg-rose-100 text-rose-700 border-rose-200",
    cancelled: "bg-rose-100 text-rose-700 border-rose-200",
  };

  const displayStatus = getDisplayStatus(status, customLabels);

  return (
    <span
      className={`px-2 md:px-2.5 py-0.5 md:py-1 text-[8px] md:text-[11px] font-bold uppercase tracking-wider rounded-full border shadow-sm ${
        styles[s] || "bg-gray-100 text-gray-600 border-gray-200"
      }`}
    >
      {displayStatus}
    </span>
  );
};
const CopyButton = ({ text }: { text?: string | null }) => {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="text-gray-400 hover:text-secondary transition-colors"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
};
const DeliveryCard = ({
  order,
  onUpdate,
  readOnly,
  onOpenLiveTracking,
}: any) => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [assigning, setAssigning] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);

  const [usernameMap, setUsernameMap] = useState<Map<string, string>>(
    new Map(),
  );
  const { showToast } = useToast();
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [ratingMap, setRatingMap] = useState<
    Map<string, { average_rating: string; total_reviews: number }>
  >(new Map());
  const delivery = order.delivery;
  const canManage = !readOnly && order.status?.toLowerCase() === "processing";

  const cod = order.payment_method === "cod";
  const deliveryStatus = delivery?.status?.toLowerCase() === "picked_up";
  console.log(deliveryStatus);
  // DEBUG: Log the delivery object to see what fields are available
  console.log("Delivery object:", delivery);
  if (delivery?.delivery_person_name) {
    console.log("Delivery person name:", delivery.delivery_person_name);
    console.log("All delivery keys:", Object.keys(delivery));
  }
  const renderRating = (avg?: string, reviews?: number) => {
    if (!avg || avg === "0.00" || !reviews || reviews === 0)
      return "No reviews";
    const rating = parseFloat(avg).toFixed(1);
    return `⭐ ${rating} (${reviews})`;
  };
  const staffOptions = staffList.map((s) => ({
    value: String(s.id),
    label: `${s.name} (${s.phone || "No Phone"}) — ${renderRating(s.average_rating, s.total_reviews)}`,
    // icon: optional – could add a user icon if desired
  }));

  // ── Get order cancellation/failure reason ──
  const getOrderFailureReason = () => {
    // Check delivery first
    if (delivery?.failure_reason) return delivery.failure_reason;
    if (delivery?.cancellation_reason) return delivery.cancellation_reason;
    if (delivery?.cancelled_reason) return delivery.cancelled_reason;
    if (delivery?.reason) return delivery.reason;
    if (delivery?.status_reason) return delivery.status_reason;

    // Check vendor_order_detail
    if (order?.vendor_order_detail?.failure_reason)
      return order.vendor_order_detail.failure_reason;
    if (order?.vendor_order_detail?.cancellation_reason)
      return order.vendor_order_detail.cancellation_reason;
    if (order?.vendor_order_detail?.cancelled_reason)
      return order.vendor_order_detail.cancelled_reason;
    if (order?.vendor_order_detail?.reason)
      return order.vendor_order_detail.reason;

    // Check order directly
    if (order?.failure_reason) return order.failure_reason;
    if (order?.cancellation_reason) return order.cancellation_reason;
    if (order?.cancelled_reason) return order.cancelled_reason;
    if (order?.reason) return order.reason;

    // Check status reason
    if (order?.status_reason) return order.status_reason;
    if (order?.cancel_reason) return order.cancel_reason;

    // Check notes (delivery_notes is where the reason is stored!)
    if (order?.delivery_notes) return order.delivery_notes;
    if (order?.notes) return order.notes;
    if (order?.admin_notes) return order.admin_notes;
    if (order?.cancellation_note) return order.cancellation_note;

    return null;
  };

  const failureReason = getOrderFailureReason();
  const isOrderFailed =
    order.status?.toLowerCase() === "cancelled" ||
    order.status?.toLowerCase() === "failed" ||
    order.status?.toLowerCase() === "rejected" ||
    delivery?.status?.toLowerCase() === "failed" ||
    delivery?.status?.toLowerCase() === "cancelled" ||
    delivery?.status?.toLowerCase() === "rejected";
  useEffect(() => {
    if (!order.company?.slug) return; // still need a company slug
    const fetchStaff = async () => {
      try {
        const res = await getCompanyStaffByRole(
          order.company.slug!,
          "delivery",
        );
        const mapped = (res.data.results || res.data).map((s: any) => ({
          id: s.user.id,
          name: `${s.user.username || s.user.first_name || ""}`.trim(),
          phone: s.user.phone_number,
          username: s.user.username,
          average_rating: s.user.average_rating,
          total_reviews: s.user.total_reviews,
        }));
        setStaffList(mapped);

        // Build rating map
        const ratingMap = new Map();
        mapped.forEach((staff: any) => {
          if (staff.phone) {
            ratingMap.set(staff.phone, {
              average_rating: staff.average_rating,
              total_reviews: staff.total_reviews,
            });
          }
        });
        setRatingMap(ratingMap); // ✅ store in state

        // Build username map
        const map = new Map();
        mapped.forEach((staff: any) => {
          if (staff.phone && staff.username) {
            map.set(staff.phone, staff.username);
          }
        });
        setUsernameMap(map);
      } finally {
        // nothing to cleanup
      }
    };
    fetchStaff();
  }, [showAssignForm, order.company?.slug]);

  const handleAssign = async () => {
    setAssigning(true);
    try {
      if (delivery) {
        await updateDeliveryPerson(delivery.id.toString(), selectedUserId);
      } else {
        await assignDelivery({
          vendor_order: order.id,
          delivery_person: selectedUserId,
        });
      }
      // 👇 Wait for the parent to fetch the updated order
      await onUpdate();
      showToast("success", "Delivery person assigned successfully");
      setShowAssignForm(false);
    } catch (err: any) {
      showToast("error", "Failed to assign delivery person");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <>
      <Card
        title="Delivery Details"
        icon={Truck}
        status={delivery?.status}
        className={
          (!delivery && deliveryStatus) || canManage || cod
            ? "ring-2 ring-purple-100 border-purple-200"
            : ""
        }
      >
        <AnimatePresence mode="wait">
          {!showAssignForm ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {delivery?.delivery_person_name ? (
                <div className="flex items-center gap-4">
                  {delivery.delivery_person_image ? (
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => setShowFullscreenImage(true)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          setShowFullscreenImage(true);
                      }}
                    >
                      <img
                        src={delivery.delivery_person_image}
                        alt={
                          delivery.delivery_person_username ||
                          delivery.delivery_person_name
                        }
                        className="w-14 h-14 rounded-full object-contain ring-2 ring-transparent group-hover:ring-purple-400 group-hover:shadow-lg transition-all duration-300"
                      />
                      <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <ZoomIn className="h-6 w-6 text-white drop-shadow-lg" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full p-1 shadow-md">
                        <div className="h-2 w-2 rounded-full bg-white"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 flex items-center justify-center font-bold text-lg border border-purple-200 shadow-sm">
                      {getInitials(
                        usernameMap.get(delivery.delivery_person_phone) ||
                          delivery.delivery_person_name,
                      )}
                    </div>
                  )}{" "}
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">
                      {usernameMap.get(delivery.delivery_person_phone) ||
                        delivery.delivery_person_name}
                    </p>

                    <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50/50 px-2 py-1 rounded-lg w-fit border border-blue-200">
                      <PhoneCall className="h-3 w-3 text-blue-600" />
                      <span className="text-[11px] font-mono font-bold text-blue-700 tracking-tight">
                        {delivery.delivery_person_phone}
                      </span>

                      <CopyButton text={delivery.delivery_person_phone} />
                    </div>
                    {delivery?.status === "out_for_delivery" &&
                      onOpenLiveTracking && (
                        <button
                          onClick={onOpenLiveTracking}
                          className="mt-3 inline-flex w-full sm:w-auto items-center justify-center gap-2
      rounded-xl border border-emerald-200
      bg-gradient-to-r from-emerald-500 to-green-600
      px-4 py-1.5
      text-xs sm:text-sm font-semibold text-white
      shadow-sm transition-all duration-200
      hover:from-emerald-600 hover:to-green-700
      hover:shadow-lg hover:-translate-y-0.5
      active:translate-y-0
      focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                        >
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                          </span>

                          <Navigation className="h-4 w-4" />

                          <span>Live Tracking</span>
                        </button>
                      )}
                    {ratingMap.has(delivery.delivery_person_phone) && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                        <span>
                          {renderRating(
                            ratingMap.get(delivery.delivery_person_phone)!
                              .average_rating,
                            ratingMap.get(delivery.delivery_person_phone)!
                              .total_reviews,
                          )}
                        </span>
                      </div>
                    )}
                    {/* ── ORDER CANCELLATION/FAILURE REASON ── */}
                    {isOrderFailed && failureReason && (
                      <div className="mt-2 p-2.5 bg-rose-50/90 border border-rose-200 rounded-xl flex items-start gap-2.5 shadow-sm">
                        <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-[9px] font-semibold text-rose-600">
                            Reason
                          </p>
                          <p className="text-xs text-rose-700 font-medium leading-relaxed">
                            {failureReason}
                          </p>
                        </div>
                      </div>
                    )}
                    {/* <div className="mt-1">
                    <span className={getStatusBadge(delivery.status)}>{delivery.status?.replace(/_/g, " ")}</span>
                  </div> */}
                  </div>
                  {deliveryStatus ||
                    ((canManage || cod) && (
                      <button
                        onClick={() => setShowAssignForm(true)}
                        className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold border border-gray-100 hover:bg-gray-100 transition-colors"
                      >
                        Change
                      </button>
                    ))}
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-xs text-gray-400 mb-3 italic">
                    No delivery person assigned yet
                  </p>
                  {deliveryStatus ||
                    (canManage && (
                      <button
                        onClick={() => setShowAssignForm(true)}
                        className="w-full py-2 bg-secondary text-white rounded-xl text-xs font-bold hover:bg-[#59409A] shadow-md transition-all"
                      >
                        Assign Delivery person
                      </button>
                    ))}
                  {/* ── ORDER CANCELLATION/FAILURE REASON (when no delivery person) ── */}
                  {isOrderFailed && failureReason && (
                    <div className="mt-3 p-2.5 bg-rose-50/90 border border-rose-200 rounded-xl flex items-start gap-2.5 text-left shadow-sm">
                      <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-[9px] font-semibold text-rose-600">
                          Reason
                        </p>
                        <p className="text-xs text-rose-700 font-medium leading-relaxed">
                          {failureReason}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Select Delivery person
              </label>
              <CustomSelect
                value={selectedUserId}
                onChange={(val) => setSelectedUserId(val)}
                options={staffOptions}
                placeholder="Choose from the list..."
                className="w-full"
              />

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAssign}
                  disabled={assigning || !selectedUserId}
                  className="flex-1 bg-secondary text-white py-2 rounded-xl text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {assigning ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    "Confirm Assignment"
                  )}
                </button>
                <button
                  onClick={() => setShowAssignForm(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Fullscreen Modal - moved outside to avoid animation conflicts */}
      <AnimatePresence>
        {showFullscreenImage && delivery?.delivery_person_image && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-lg flex items-center justify-center p-4"
            onClick={() => setShowFullscreenImage(false)}
          >
            <button
              onClick={() => setShowFullscreenImage(false)}
              className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 hover:scale-110 transition-all duration-300 backdrop-blur-sm z-10"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-white/70 text-xs font-medium flex items-center gap-2">
              <ZoomIn className="h-3.5 w-3.5" />
              <span>Click anywhere to close</span>
            </div>

            <motion.img
              src={delivery.delivery_person_image}
              alt="Delivery Person"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
// ---------- REFINED RECEIPT REVIEW CARD ----------
// ---------- REFINED RECEIPT REVIEW CARD (with COD confirm button) ----------
// Receipt Review Card – accepts readOnly prop
const ReceiptReviewCard = ({
  receipt,
  paymentMethod,
  onUpdate,
  readOnly,
  status,
  orderId,
  companySlug,
  orderStatus,
  receiptHistory,
  fulfillmentType,
}: {
  receipt?: any | null;
  paymentMethod?: string;
  onUpdate: () => void;
  readOnly: boolean;
  status?: string;
  orderId?: string;
  companySlug?: string;
  orderStatus?: string;
  receiptHistory?: any[];
  fulfillmentType?: string;
}) => {
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // image modal (KEEP SECOND UI)
  const [previewImage, setPreviewImage] = useState<string | null>(null);

const [submittingAction, setSubmittingAction] = useState<"approved" | "rejected" | null>(null);
  // review confirmation
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "approved" | "rejected" | null
  >(null);

  // COD confirmation
  const [showCODConfirm, setShowCODConfirm] = useState(false);
  const [codConfirming, setCodConfirming] = useState(false);

  const { showToast } = useToast();

  const displayHistory = receiptHistory
    ? receiptHistory.filter((h: any) => {
        // Skip the current active receipt only if it is pending review
        if (h.id === receipt?.id && receipt?.status === "pending") {
          return false;
        }
        return true;
      })
    : [];

  // =========================================================
  // COD CONFIRMATION
  // =========================================================
 const handleConfirmCOD = async () => {
  if (!companySlug || !orderId) return;

  setCodConfirming(true);
  try {
    await confirmCODPayment(companySlug, Number(orderId));
    showToast("success", "COD payment confirmed successfully");
    setShowCODConfirm(false);

    // 👇 Await the parent refresh – this keeps the loading visible
    await onUpdate();   // <-- THIS IS THE KEY CHANGE

  } catch (err: any) {
    showToast(
      "error",
      err.response?.data?.detail || err.message || "Failed to confirm COD payment"
    );
  } finally {
    setCodConfirming(false);
  }
};

  // =========================================================
  // CHAPA
  // =========================================================
  if (paymentMethod === "chapa") {
    return (
      <Card
        title="Payment Information"
        icon={CreditCard}
        status="approved"
        className="ring-1 ring-indigo-100"
      >
        <div className="flex flex-col items-center ">
          <div className="flex items-center gap-2 bg-white px-4 ">
            <div className="w-9 md:w-12 h-9 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-2 shadow-inner">
              <ShieldCheck className="h-5 w-5 md:h-8 md:w-8 text-indigo-600" />
            </div>

            <p className="text-sm font-semibold text-gray-700">Verified by</p>

            <img src="/chapa.png" alt="Chapa" className="h-8 object-contain" />
          </div>

          {/* <p className="text-xs text-gray-500 mt-4 text-center max-w-xs leading-relaxed">
            This payment was automatically verified through secure online
            payment confirmation.
          </p> */}

          {/* <div className="mt-4 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            Payment Verified
          </div> */}
        </div>
      </Card>
    );
  }

  if (paymentMethod === "cod") {
    const isPaid = status?.toLowerCase() === "paid";
    const currentOrderStatus = orderStatus?.toLowerCase();
    const isPickup = fulfillmentType?.toLowerCase() === "pickup";
    const isOnspot = fulfillmentType?.toLowerCase() === "onspot";
    const isInStoreOrder = isPickup || isOnspot;
    const canCollect =
      currentOrderStatus === "fulfilled" ||
      (isInStoreOrder && currentOrderStatus === "processing");

    return (
      <>
        <Card
          title="Cash on Delivery"
          icon={Banknote}
          status={isPaid ? "approved" : "pending"}
          className={`ring-1 ${isPaid ? "ring-emerald-100 border-emerald-200" : "ring-amber-100"}`}
        >
          <div className="flex flex-col items-center text-center">
            {isPaid ? (
              <div className="flex flex-row items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-2 shadow-inner">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-sm font-black text-emerald-700 uppercase tracking-wide">
                  Payment Collected
                </p>
                {/* <p className="text-xs text-gray-500 mt-2 max-w-xs leading-relaxed">
                  The Cash on Delivery payment has been physically collected and confirmed.
                </p> */}
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-4 max-w-xs leading-relaxed">
                  {canCollect
                    ? isOnspot
                      ? "Confirm physical collection of cash for this on-spot table order."
                      : isPickup
                        ? "Confirm physical collection of cash once the customer picks up the items."
                        : "Confirm physical collection of cash once the driver delivers the items and returns with the cash."
                    : isInStoreOrder
                      ? "Payment collection is disabled until the order is Prepared."
                      : "Payment collection is disabled until the order is Delivered."}
                </p>
                {!readOnly && (
                  <button
                    onClick={() => setShowCODConfirm(true)}
                    disabled={!canCollect}
                    className={`w-full py-3 rounded-2xl text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 ${
                      canCollect
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                        : "bg-gray-300 cursor-not-allowed shadow-none"
                    }`}
                  >
                    {codConfirming ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Confirm Payment Collected
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </Card>

        <ConfirmationModal
          isOpen={showCODConfirm}
          onClose={() => setShowCODConfirm(false)}
          onConfirm={handleConfirmCOD}
          title="Confirm COD Payment"
          description="Are you sure you have collected the payment for this order?"
          confirmText={codConfirming ? "Processing..." : "Yes, Confirm Payment"}
          confirmVariant="primary"
          loading={codConfirming}
          autoClose={false}
        />
      </>
    );
  }

  // =========================================================
  // NO RECEIPT
  // =========================================================
  if (!receipt) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Banknote className="h-5 w-5 text-gray-400" />

          <h4 className="text-sm sm:text-base font-semibold text-gray-800">
            Payment Receipt
          </h4>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-secondary via-secondary-light to-transparent rounded-full"></div>
        <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-2xl">
          <AlertCircle className="h-6 w-6 text-gray-300 mx-auto mb-2" />

          <p className="text-gray-500 text-sm">
            Waiting for customer to upload receipt...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // REVIEW LOGIC
  // =========================================================
  const isAlreadyReviewed =
    receipt.status === "approved" || receipt.status === "rejected";

  const canReview = !readOnly && !isAlreadyReviewed;

  const handleActionClick = (action: "approved" | "rejected") => {
    if (!canReview) return;

    setPendingAction(action);
    setShowConfirm(true);
  };
const handleConfirm = async () => {
  if (!pendingAction) return;

  setShowConfirm(false);
  setSubmitting(true);
setSubmittingAction(pendingAction);

  try {
    await reviewReceipt(receipt.id, {
      status: pendingAction,
      admin_notes: notes || undefined,
    });

    showToast("success", `Receipt ${pendingAction}`);
    setNotes("");
    setPendingAction(null);

    // ✅ Wait for the parent to fully refresh the order data
    await onUpdate();

  } catch (err: any) {
    showToast("error", err.response?.data?.detail || "Review failed");
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="bg-white flex-col rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex w-full flex-row justify-between items-start">
          <div className="flex items-center gap-2 mb-4 pb-3 w-full relative">
            <div className="p-1.5 bg-gradient-to-br from-secondary/20 to-secondary-light/20 rounded-lg shadow-inner">
              <Banknote className="h-4 w-4 text-secondary" />
            </div>

            <h4 className="text-sm font-bold bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent">
              Payment Receipt
            </h4>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-secondary via-secondary-light to-transparent rounded-full"></div>
            {/* <div className="flex flex-row justify-between items-start">
      <div className="flex items-center gap-2 mb-4 pb-3 w-full relative"> */}
            {/* <div className="p-1.5 bg-gradient-to-br from-secondary/20 to-secondary-light/20 rounded-lg shadow-inner">
          <Icon className="h-4 w-4 text-secondary" />
        </div> */}

            {/* <h4 className="text-sm font-bold bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent">
          {title}
        </h4> */}
            {/* Decorative gradient line under header */}
            {/* <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-secondary via-secondary-light to-transparent rounded-full"></div>
              </div> */}
          </div>
          <div>
            <span
              className={`text-xs px-2 py-1 rounded-full border ${getStatusBadge(
                receipt.status,
              )}`}
            >
              {receipt.status}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* IMAGE */}
        {receipt.receipt_image && (
          <div>
            {/* <p className="text-xs text-gray-500 mb-2">Receipt Image</p> */}

            <div
              onClick={() => setPreviewImage(receipt.receipt_image)}
              className="relative w-full h-28 sm:h-28 rounded-xl overflow-hidden border cursor-zoom-in group"
            >
              <img
                src={receipt.receipt_image}
                alt="Receipt"
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition" />
              </div>
            </div>
          </div>
        )}
        {/* BANK */}
        <div className="bg-gradient-to-r from-purple-50/50 to-indigo-50/50 p-4 rounded-xl border border-purple-100">
          <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-1">
            Bank Details
          </p>

          <p className="font-semibold text-sm text-gray-900">
            {receipt.bank_name || "Not Specified"}
          </p>
        </div>

        {/* REVIEW ACTIONS */}
        {canReview && (
          <div className="pt-2 space-y-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add review notes..."
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-secondary transition resize-none"
            />

            <div className="flex gap-2">
  <button
    onClick={() => handleActionClick("approved")}
    disabled={submitting}
    className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
  >
    {submittingAction === "approved" ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        Approving...
      </>
    ) : (
      "Approve"
    )}
  </button>

  <button
    onClick={() => handleActionClick("rejected")}
    disabled={submitting}
    className="flex-1 bg-gradient-to-r from-rose-500 to-red-600 text-white
      py-2.5 rounded-xl text-sm font-bold
      shadow-md shadow-rose-200
      hover:from-rose-600 hover:to-red-700
      active:scale-[0.98]
      transition-all duration-200
      disabled:opacity-50 disabled:cursor-not-allowed
      flex items-center justify-center gap-2"
  >
    {submittingAction === "rejected" ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        Rejecting...
      </>
    ) : (
      "Reject"
    )}
  </button>
</div>
          </div>
        )}

        {/* REVIEWED STATE */}
        {/* {isAlreadyReviewed && (
          <div
            className={`p-4 rounded-xl flex items-start gap-3 ${receipt.status === "approved"
              ? "bg-emerald-50 border border-emerald-200"
              : "bg-rose-50 border border-rose-200"
              }`}
          >
            {receipt.status === "approved" ? (
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            ) : (
              <X className="h-5 w-5 text-rose-600" />
            )}

            <div>
              <p className="text-sm font-semibold text-green-600">
                Verification {receipt.status}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                {receipt.status === "approved"
                  ? "Order is ready for preparation."
                  : "Customer must upload another receipt."}
              </p>
            </div>
          </div>
        {/* RECEIPT HISTORY */}
        {displayHistory.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">
              Receipt History ({displayHistory.length})
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {displayHistory.map((h: any) => {
                return (
                  <div
                    key={h.id}
                    className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-gray-700">
                          {h.bank_name || "Unknown Bank"}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full border font-bold uppercase ${
                            h.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : h.status === "rejected"
                                ? "bg-rose-50 text-rose-700 border-rose-100"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {h.status}
                        </span>
                      </div>
                      {/* <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                        Amount: {Number(h.amount).toLocaleString()} ETB
                      </p> */}
                      {h.admin_notes && (
                        <p className="text-[9px] text-rose-600 bg-rose-50/50 px-2 py-0.5 rounded border border-rose-100 mt-1 italic">
                          <span className="text-amber-600 font-semibold">
                            Remark:
                          </span>{" "}
                          "{h.admin_notes}"
                        </p>
                      )}
                    </div>
                    {h.receipt_image && (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(h.receipt_image)}
                        className="w-10 h-10 rounded-lg overflow-hidden border shrink-0 hover:opacity-80 transition cursor-zoom-in"
                      >
                        <img
                          src={h.receipt_image}
                          alt="Prior Receipt"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* KEEP SECOND IMAGE VIEWER */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 border border-blac"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full p-2 shadow"
            >
              <X className="h-5 w-5 text-gray-700" />
            </button>

            <img
              src={previewImage}
              alt="Receipt Full"
              className="w-full max-h-[90vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* REVIEW CONFIRMATION */}
      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          setPendingAction(null);
        }}
        onConfirm={handleConfirm}
        title={
          pendingAction === "approved" ? "Approve Receipt" : "Reject Receipt"
        }
        description="This action will notify the customer and update the order workflow. Are you sure?"
        confirmText={submitting ? "Processing..." : "Confirm Action"}
        confirmVariant={pendingAction === "approved" ? "primary" : "danger"}
        loading={false} // loading is handled on the card buttons, not the modal
        autoClose={false}
      />
    </div>
  );
};

// ---------- PREPARATION CARD ----------
const PreparationCard = ({ order, onUpdate, readOnly }: any) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const { showToast } = useToast();

  const status = order.status?.toLowerCase();

  const handlePrepare = async () => {
    setShowConfirm(false);
    setPreparing(true);
    try {
      await prepareVendorOrder(order.company.slug, order.id);
      // 👇 Await the parent's refresh – this keeps the spinner visible
      await onUpdate();
      showToast("success", "Order marked as Prepared!");
    } catch (err: any) {
      showToast(
        "error",
        err.response?.data?.detail || "Failed to prepare order",
      );
    } finally {
      setPreparing(false);
    }
  };

  const isCOD = order.payment_method === "cod";

  if (
    status !== "confirmed" &&
    status !== "processing" &&
    !(isCOD && status === "pending")
  ) {
    return null;
  }

  return (
    <>
      <Card
        title="Order Preparation"
        icon={Package}
        status={status}
        className={
          status === "confirmed" || (isCOD && status === "pending")
            ? "ring-2 ring-purple-100 border-purple-200"
            : ""
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          {/* <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mb-4 shadow-inner">
            <Package className="h-8 w-8 text-purple-600" />
          </div> */}

          {(status === "confirmed" || (isCOD && status === "pending")) && (
            <>
              {/* <p className="text-sm font-black text-gray-800 uppercase tracking-wide">
                Ready for Preparation
              </p> */}
              {/* <p className="text-xs text-gray-500 mt-3 max-w-xs leading-relaxed">
                The payment/order is confirmed. Please prepare the items so they are ready for delivery assignment.
              </p> */}
              {!readOnly && (
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={preparing}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-secondary to-secondary text-white text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {preparing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Marking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Mark as Prepared
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </Card>

      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handlePrepare}
        title="Mark Order as Prepared"
        description="Are you sure you want to mark this order as prepared and ready for dispatch?"
        confirmText={preparing ? "Marking..." : "Yes, Prepared"}
        confirmVariant="primary"
        loading={false} // loading is shown on the main button, not inside the modal
        autoClose={false}
      />
    </>
  );
};

// ════════════════════════════════════════
// MAIN MODAL COMPONENT
// ════════════════════════════════════════

export function VendorOrderDetailModal({
  order,
  receipt,
  onClose,
  onUpdate,
  readOnly = false,
  onOpenLiveTracking,
  allOrders = [],
  onSelectOrder,
}: any) {
  if (!order) return null;
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await onUpdate();
    } finally {
      setRefreshing(false);
    }
  };
  // ─── Customer Order History (same company only) ──────────
  const customerOrders = useMemo(() => {
    if (!order || !allOrders.length) return [];
    const customerPhone = order.shipping_phone;
    const companyId = order.company?.id;
    if (!customerPhone || !companyId) return [];

    return allOrders
      .filter(
        (o: any) =>
          o.shipping_phone === customerPhone &&
          o.company?.id === companyId &&
          o.id !== order.id // exclude current order
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 10); // show up to 10 most recent
  }, [order, allOrders]);
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="relative bg-gradient-to-br from-white via-white to-gray-50/50 w-full max-w-[95%] sm:max-w-7xl max-h-[90vh] sm:max-h-[92vh] rounded-2xl sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-white/20 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header */}
          <div className="bg-secondary/20 backdrop-blur-md border-b border-secondary/15 px-3 sm:px-6 md:px-8 py-2 sm:py-4 md:py-5 sticky top-0 z-20 shadow-sm">
            {/* Top row: Icon on left, Buttons on right */}
            <div className="flex flex-row justify-between items-start gap-2">
              {/* Left side - Package Icon */}
              {/* <div className="h-8 w-8 sm:h-12 sm:w-12 bg-gradient-to-br from-secondary to-secondary-light rounded-lg sm:rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 ring-1 ring-white/20 flex-shrink-0">
                <Package className="text-white h-4 w-4 sm:h-6 sm:w-6 drop-shadow-sm" />
              </div> */}
              {/* Bottom row: Order details */}
              <div className="mt-1.5  ">
                <div className="flex flex-wrap items-center gap-1 sm:gap-3 mb-0.5 sm:mb-1">
                  <h2 className="text-base sm:text-2xl font-black bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent tracking-tight break-words">
                    Order #{order.id}-{order.master_order_id}
                  </h2>
                  <StatusBadge
                    status={order.status}
                    customLabels={{
                      pending: "Pending",
                    }}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1 sm:gap-4 text-[9px] sm:text-xs font-bold">
                  <span className="flex items-center gap-1 sm:gap-2 bg-secondary/10 px-1.5 sm:px-4 py-0.5 sm:py-1.5 rounded-full border border-secondary/20 shadow-sm">
                    <Calendar className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-secondary" />
                    <span className="font-mono text-[8px] sm:text-[12px] font-semibold text-gray-700 tracking-tight">
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      <span className="text-secondary mx-0.5">•</span>{" "}
                      {new Date(order.created_at).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 sm:gap-1.5 text-gray-600">
                    <Building2 className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-secondary" />{" "}
                    <span className="font-medium text-[9px] sm:text-sm">
                      {order.company?.name}
                    </span>
                  </span>
                </div>
              </div>
              {/* Right side - Buttons */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* REFRESH */}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="group flex items-center gap-0.5 sm:gap-2 px-1.5 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 bg-white
                 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100
                 active:scale-95 transition-all duration-200
                 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                >
                  {refreshing ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 text-secondary animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 group-hover:text-secondary transition-colors" />
                  )}

                  {/* <span className="text-[8px] sm:text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-secondary">
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </span> */}
                </button>

                {/* CLOSE */}
                <button
                  onClick={onClose}
                  className="group p-1.5 sm:p-3 rounded-lg sm:rounded-xl bg-white border border-gray-200 shadow-sm
                 hover:bg-rose-50 hover:border-rose-200
                 active:scale-95 transition-all duration-200"
                >
                  <X className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-gray-400 group-hover:text-rose-500 transition-colors" />
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Content Grid */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 custom-scrollbar scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-gray-100">
            <div className="grid grid-cols-12 gap-4 sm:gap-6 md:gap-8 items-start">
              {/* Left Side: Order Composition & Shipping (8 cols) */}
              <div className="col-span-12 lg:col-span-8 space-y-4 sm:space-y-6 md:space-y-8 lg:sticky lg:top-0">
                {/* 1. Customer Summary Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <Card title="Customer Profile" icon={User}>
                    <div className="flex items-center gap-4">
                      {order.recipient_image ? (
                        <img
                          src={order.recipient_image}
                          alt="Recipient"
                          className="w-10 md:w-14 h-10 object-contain md:h-14 rounded-full ring-2 ring-purple-200"
                        />
                      ) : (
                        <div className="w-10 md:w-14 h-10 md:h-14 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-white shadow-sm flex items-center justify-center text-secondary font-black text-xl">
                          {getInitials(order.recipient_name)}
                        </div>
                      )}
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm md:text-base font-black bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent">
                            {order.recipient_name}
                          </p>
                          {order.fulfillment_type === "pickup" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              Self Pickup
                            </span>
                          )}
                          {order.fulfillment_type === "onspot" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-orange-50 text-orange-700 border border-orange-200 shadow-sm">
                              {/* <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                              </svg> */}
                              On Spot at Table -{" "}
                              {order.table_number
                                ? `${order.table_number}`
                                : ""}
                            </span>
                          )}
                        </div>
                        {order.shipping_phone && (
                          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50/50 px-2 md:px-3 py-0.5 md:px-3 md:py-1.5 rounded-lg w-fit border border-blue-200 shadow-sm">
                            <PhoneCall className="h-2.5 md:h-3.5 w-2.5 md:w-3.5 text-green-600" />
                            <span className="text-xs font-mono font-bold text-green-700 tracking-tight">
                              {order.shipping_phone}
                            </span>
                            <CopyButton text={order.shipping_phone} />
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>

                  {order.shipping_address_text && (
                    <Card title="Shipping Destination" icon={MapPin}>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-purple-50/30 border-l-4 border-secondary">
                          <span className="text-xs font-bold text-gray-500 min-w-[110px]">
                            Recipient Name:
                          </span>
                          <span className="text-sm font-bold text-secondary">
                            {order.recipient_name ||
                              "No recipient name provided."}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50/30 border-l-4 border-green-500">
                          <span className="text-xs font-bold text-gray-500 min-w-[110px]">
                            Recipient Phone:
                          </span>
                          <div className="flex items-center gap-2">
                            <PhoneCall className="h-3.5 w-3.5 text-green-600" />
                            <span className="text-sm font-mono font-bold text-green-700 tracking-tight">
                              {order.shipping_phone ||
                                "No Phone Number provided."}
                            </span>
                            <CopyButton text={order.shipping_phone} />
                          </div>
                        </div>
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-purple-50/30 border-l-4 border-secondary">
                          <span className="text-xs font-bold text-gray-500 min-w-[110px]">
                            Shipping Address:
                          </span>
                          <span className="text-sm font-bold text-secondary">
                            {formatAddress(order.shipping_address_text) ||
                              "No address provided."}
                          </span>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>

                {/* 2. Main Order Table */}
                <motion.div
                  variants={itemVariants}
                  className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm"
                >
                  <div className="px-4 md:px-6 py-2 md:py-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                      Item List
                    </h4>
                    <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-semibold text-purple-600 shadow-sm">
                      {order.items.length}{" "}
                      {order.items.length > 1 ? "ITEMS" : "ITEM"}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                          <th className="px-4 md:px-6 py-2 md:py-4 text-left">
                            Description
                          </th>
                          <th className="px-4 md:px-6 py-2 md:py-4 text-center">
                            Qty
                          </th>
                          <th className="px-4 md:px-6 py-2 md:py-4 text-right">
                            Unit Price
                          </th>
                          <th className="px-4 md:px-6 py-2 md:py-4 text-right">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(() => {
                          const itemsByRound = order.items.reduce(
                            (acc: any, item: any) => {
                              const r = item.round || 1;
                              if (!acc[r]) acc[r] = [];
                              acc[r].push(item);
                              return acc;
                            },
                            {},
                          );

                          return Object.keys(itemsByRound)
                            .sort((a, b) => Number(a) - Number(b))
                            .map((roundKey) => {
                              const roundItems = itemsByRound[roundKey];
                              const roundNum = Number(roundKey);
                              const roundTime = roundItems[0]?.created_at
                                ? new Date(
                                    roundItems[0].created_at,
                                  ).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })
                                : "";

                              return (
                                <React.Fragment key={roundKey}>
                                  <tr className="bg-purple-50/20">
                                    <td
                                      colSpan={4}
                                      className="px-4 py-2 text-left"
                                    >
                                      <span className="text-[10px] font-black uppercase tracking-wider text-[#6750A4]">
                                        Round {roundNum}{" "}
                                        {roundTime ? `(${roundTime})` : ""}
                                      </span>
                                    </td>
                                  </tr>
                                  {roundItems.map((item: any) => (
                                    <tr
                                      key={item.id}
                                      className="group hover:bg-gray-50/80 transition-all"
                                    >
                                      <td className="px-4 md:px-6 py-2 md:py-4">
                                        <div className="flex items-center gap-4">
                                          <div className="h-10 w-10 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-50">
                                            {item.product_image ? (
                                              <img
                                                src={item.product_image}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <ImageIcon className="h-5 w-5 text-gray-300" />
                                            )}
                                          </div>
                                          <div>
                                            <p className="text-sm font-black text-gray-800 line-clamp-1">
                                              {item.title}
                                            </p>
                                            <p className="text-[10px] font-bold text-gray-400 font-mono uppercase tracking-tighter">
                                              SKU: {item.sku || "N/A"}
                                            </p>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                        <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-black text-gray-600">
                                          x{item.qty}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 text-right text-xs font-bold text-gray-500">
                                        {Number(
                                          item.unit_price,
                                        ).toLocaleString()}
                                      </td>
                                      <td className="px-6 py-4 text-right font-black text-gray-900 text-sm">
                                        {Number(
                                          item.line_total,
                                        ).toLocaleString()}{" "}
                                        <span className="text-[9px] text-gray-400">
                                          ETB
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              );
                            });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
                                {/* ─── Order Timeline / Activity Log ─── */}
                <motion.div
                  variants={itemVariants}
                  className="bg-white rounded-3xl border border-gray-100 p-4 md:p-6 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                    <div className="p-1.5 bg-gradient-to-br from-secondary/20 to-secondary-light/20 rounded-lg shadow-inner">
                      <Clock className="h-4 w-4 text-secondary" />
                    </div>
                    <h4 className="text-sm font-bold bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent">
                      Order Timeline
                    </h4>
                    <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {buildOrderTimeline(order).length} steps
                    </span>
                  </div>

                  <div className="relative pl-6 space-y-4">
                    {/* Vertical line */}
                    <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />

                    {buildOrderTimeline(order).map((event: any, idx: number) => (
                      <div key={event.id} className="relative flex items-start gap-4">
                        {/* Dot */}
                        <div
                          className={`absolute left-[-20px] top-1 w-4 h-4 rounded-full border-2 ${
                            event.status === "completed"
                              ? "bg-emerald-500 border-emerald-500"
                              : "bg-amber-500 border-amber-500 animate-pulse"
                          }`}
                        >
                          <div
                            className={`absolute inset-0 rounded-full ${
                              event.status === "completed"
                                ? "bg-emerald-400/30 animate-pulse"
                                : "bg-amber-400/30 animate-pulse"
                            }`}
                            style={{ width: "200%", height: "200%", left: "-50%", top: "-50%" }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">
                              {event.icon} {event.label}
                            </span>
                            {event.status === "pending" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Pending
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-0.5">
                            <span className="text-xs text-gray-400 font-mono">
                              {new Date(event.time).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}{" "}
                              •{" "}
                              {new Date(event.time).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {event.actor && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {event.actor}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
                                {/* ─── Customer Order History ─── */}
                {customerOrders.length > 0 && (
                  <motion.div
                    variants={itemVariants}
                    className="bg-white rounded-3xl border border-gray-100 p-4 md:p-6 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                      <div className="p-1.5 bg-gradient-to-br from-secondary/20 to-secondary-light/20 rounded-lg shadow-inner">
                        <History className="h-4 w-4 text-secondary" />
                      </div>
                      <h4 className="text-sm font-bold bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent">
                        Customer Order History
                      </h4>
                      <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {customerOrders.length} orders
                      </span>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                      {customerOrders.map((ord: any) => (
                        <div
                          key={ord.id}
                          onClick={() => onSelectOrder && onSelectOrder(ord)}
                          className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-secondary/30 transition-all cursor-pointer group"
                        >
<div className="flex flex-col min-w-0">
  <span className="text-sm font-bold text-secondary group-hover:text-secondary-dark">
    #{ord.id}
  </span>
  {ord.company?.name && (
    <span className="text-[10px] text-gray-500 truncate max-w-[120px]">
      {ord.company.name}
    </span>
  )}
  <span className="text-[10px] text-gray-400 font-mono">
    {new Date(ord.created_at).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    )}
  </span>
</div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-800">
                              {Number(ord.amount).toLocaleString()}{" "}
                              <span className="text-[9px] text-gray-400">
                                ETB
                              </span>
                            </span>
                            <StatusBadge status={ord.status} type="order" />
                            <span className="text-xs text-secondary opacity-0 group-hover:opacity-100 transition">
                              View →
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Right Side: Finances & Workflow (4 cols) */}
              <div className="col-span-12 lg:col-span-4 space-y-3 sm:space-y-4">
                {/* 3. Financial Summary Card */}
                <motion.div
                  variants={itemVariants}
                  className="bg-gradient-to-br from-secondary to-secondary-light rounded-[32px] p-4 text-white shadow-2xl shadow-purple-200 relative overflow-hidden group"
                >
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-white/5 rounded-full blur-2xl" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2 md:mb-5">
                      <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                          Total Amount
                        </p>
                        <h3 className="text-xl md:text-3xl font-black">
                          {Number(order.amount).toLocaleString()}{" "}
                          <span className="text-sm opacity-60">ETB</span>
                        </h3>
                      </div>
                    </div>
                    <div className="space-y-3 pt-2 border-t border-white/10">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="opacity-60">Subtotal</span>
                        <span>
                          {Number(order.subtotal).toLocaleString()} ETB
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="opacity-60">VAT</span>
                        <span>
                          {Number(order.tax_amount).toLocaleString()} ETB
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="opacity-60">Delivery Fee</span>
                        <span>
                          {Number(order.delivery_fee || 0).toLocaleString()} ETB
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="opacity-60">Discount Fee</span>
                        <span>0 ETB</span>
                      </div>
                      {/* {order.tax_invoice?.invoice_number && (
                        <div className="flex justify-between text-xs font-bold p-2 bg-black/10 rounded-lg">
                          <span className="opacity-60">Invoice #</span>
                          <span className="font-mono">{order.tax_invoice.invoice_number}</span>
                        </div>
                      )} */}
                    </div>
                  </div>
                </motion.div>

                {/* 4. Payment Receipt Review Card */}
                <ReceiptReviewCard
                  receipt={receipt}
                  paymentMethod={order.payment_method}
                  onUpdate={onUpdate}
                  readOnly={readOnly}
                  status={order.payment_status}
                  orderId={order.id}
                  companySlug={order.company?.slug}
                  orderStatus={order.status}
                  receiptHistory={order.receipt_history}
                  fulfillmentType={
                    order.fulfillment_type ||
                    (order.shipping_address_text ? "delivery" : "pickup")
                  }
                />

                {/* Preparation Card */}
                {(order.status === "confirmed" ||
                  (order.payment_method === "cod" &&
                    order.status === "pending")) && (
                  <PreparationCard
                    order={order}
                    onUpdate={onUpdate}
                    readOnly={readOnly}
                  />
                )}

                {/* 5. Delivery person Assignment Card */}
                {order.fulfillment_type === "delivery" &&
                  order.shipping_address_text && (
                    <DeliveryCard
                      order={order}
                      onUpdate={onUpdate}
                      readOnly={readOnly}
                      onOpenLiveTracking={onOpenLiveTracking}
                    />
                  )}

                {/* 6. Simple Timeline Sidebar */}
                {/* <Card title="Activity Log" icon={Clock}>
                   <div className="space-y-5 px-1">
                      <div className="flex gap-4 relative">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 ring-4 ring-purple-50 mt-1.5" />
                        <div className="absolute left-[2.5px] top-4 w-[1px] h-8 bg-gray-100" />
                        <div className="text-[11px] leading-tight">
                          <p className="font-black text-gray-800">Order Received</p>
                          <p className="text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200 mt-1.5" />
                        <div className="text-[11px] leading-tight">
                          <p className="font-black text-gray-400 italic">Processing Verification...</p>
                        </div>
                      </div>
                   </div>
                </Card> */}
              </div>
            </div>
          </div>

          {/* Static Bottom Bar */}
          {/* <div className="bg-white px-8 py-5 border-t border-gray-100 flex justify-between items-center">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]"></p>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-2xl text-xs font-black shadow-lg shadow-gray-200 hover:bg-black transition-all">
                <Download className="h-3.5 w-3.5" /> Download Invoice
              </button>
            </div>
          </div> */}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
