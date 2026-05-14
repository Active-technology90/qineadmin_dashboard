import { useEffect, useState } from "react";
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
} from "lucide-react";
import {
  getCompanyStaffByRole,
  reviewReceipt,
  assignDelivery,
  updateDeliveryPerson,
} from "../../../services/api";
import { useToast } from "../../../hooks/useToast";
import { ConfirmationModal } from "../../ui/confimationModal";

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
    "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border shadow-sm ";

  if (s === "completed" || s === "delivered" || s === "approved")
    return base + "bg-emerald-50 text-emerald-700 border-emerald-200";

  if (s === "paid" || s === "out_for_delivery")
    return base + "bg-violet-50 text-violet-700 border-violet-200";

  if (s === "pending")
    return base + "bg-amber-50 text-amber-700 border-amber-200";

  if (s === "rejected" || s === "cancelled")
    return base + "bg-rose-50 text-rose-700 border-rose-200";

  return base + "bg-gray-50 text-gray-600 border-gray-200";
};

// ---------- Sub-Components ----------

const Card = ({ children, title, icon: Icon, status, className = "" }: any) => (
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
        {/* Decorative gradient line under header */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#6750A4] via-[#8B6BB5] to-transparent rounded-full"></div>
      </div>
      {status && (
        <div className="flex justify-start">
          <span className={getStatusBadge(status)}>
            {getDisplayStatus(status)}
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
  };

  const displayStatus = getDisplayStatus(status, customLabels);

  return (
    <span
      className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border shadow-sm ${
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
      className="text-gray-400 hover:text-[#6750A4] transition-colors"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
};

// ---------- REFINED DELIVERY CARD ----------
const DeliveryCard = ({ order, onUpdate, readOnly }: any) => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [assigning, setAssigning] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);

  const [usernameMap, setUsernameMap] = useState<Map<string, string>>(
    new Map(),
  );
  const { showToast } = useToast();
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);

  const delivery = order.delivery;
  const canManage = !readOnly && order.status?.toLowerCase() === "confirmed";

  const cod = order.payment_method === "cod";
  const deliveryStatus = delivery?.status?.toLowerCase() === "picked_up";
  console.log(deliveryStatus);
  // DEBUG: Log the delivery object to see what fields are available
  console.log("Delivery object:", delivery);
  if (delivery?.delivery_person_name) {
    console.log("Delivery person name:", delivery.delivery_person_name);
    console.log("All delivery keys:", Object.keys(delivery));
  }

  useEffect(() => {
    if (!order.company?.slug || !showAssignForm) return;
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
        }));
        setStaffList(mapped);

        // Create a map of phone number -> username for lookups
        const map = new Map();
        mapped.forEach((staff: any) => {
          if (staff.phone && staff.username) {
            map.set(staff.phone, staff.username);
          }
        });
        setUsernameMap(map);
      } finally {
      }
    };
    fetchStaff();
  }, [showAssignForm, order.company?.slug]);

  const handleAssign = async () => {
    if (!selectedUserId) return;
    setAssigning(true);
    try {
      console.log("delivery",delivery)
      if (delivery) {
       await updateDeliveryPerson(
  delivery.tracking_id,
  selectedUserId,
);
      } else {
        await assignDelivery({
          vendor_order: order.id,
          delivery_person: selectedUserId,
        });
      }
      showToast("success", "Delivery person assigned successfully");
      setShowAssignForm(false);
      onUpdate();
    } catch (err: any) {
      showToast("error", "Failed to assign Delivery person");
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
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-transparent group-hover:ring-purple-400 group-hover:shadow-lg transition-all duration-300"
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
                    ((canManage || cod) && (
                      <button
                        onClick={() => setShowAssignForm(true)}
                        className="w-full py-2 bg-[#6750A4] text-white rounded-xl text-xs font-bold hover:bg-[#59409A] shadow-md transition-all"
                      >
                        Assign Delivery person
                      </button>
                    ))}
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
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(Number(e.target.value))}
                className="w-full text-sm rounded-xl border-gray-200 focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Choose from the list...</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.phone || "No Phone"})
                  </option>
                ))}
              </select>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAssign}
                  disabled={assigning || !selectedUserId}
                  className="flex-1 bg-[#6750A4] text-white py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {assigning ? (
                    <Loader2 className="h-3 w-3 animate-spin mx-auto" />
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
const ReceiptReviewCard = ({
  receipt,
  paymentMethod,
  onUpdate,
  readOnly,
  status,
  orderId,
}: any) => {
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "approved" | "rejected" | null
  >(null);
  const [showCODConfirm, setShowCODConfirm] = useState(false);
  const [codConfirming, setCodConfirming] = useState(false);
  const { showToast } = useToast();
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });

  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 5));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 1));

  const resetView = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    if (e.deltaY < 0) {
      setZoom((z) => Math.min(z + 0.2, 5));
    } else {
      setZoom((z) => Math.max(z - 0.2, 1));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;

    setDragging(true);
    setStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;

    setPosition({
      x: e.clientX - start.x,
      y: e.clientY - start.y,
    });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  // COD confirmation handler (replace with your actual API endpoint)
  const handleConfirmCOD = async () => {
    setCodConfirming(true);
    try {
      // TODO: Replace with your actual API call
      // Example: await axios.post(`/api/v1/orders/${orderId}/confirm-cod/`);
      // Or if you have a service function: await confirmCODPayment(orderId);
      console.log(`Confirming COD payment for order ${orderId}`);

      // Simulate API call (remove this when you add real API)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      showToast("success", "COD payment confirmed successfully");
      onUpdate(); // Refresh parent component to update order status
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to confirm COD payment";
      showToast("error", errorMsg);
    } finally {
      setCodConfirming(false);
      setShowCODConfirm(false);
    }
  };

  // Chapa payment (automatic)
  if (paymentMethod === "chapa") {
    return (
      <Card
        title="Payment Info"
        icon={CreditCard}
        status={status}
        className="bg-indigo-50/30 border-indigo-100"
      >
        <div className="flex flex-col items-center py-2">
          <ShieldCheck className="h-8 w-8 text-indigo-500 mb-2" />
          <div className="flex justify-center items-start">
            <p className="text-sm mt-1 font-bold text-gray-800">Verified by </p>
            <img
              src="/chapa.png"
              alt="Chapa"
              className="h-8 w-20 text-indigo-500 mb-2"
            />
          </div>
        </div>
      </Card>
    );
  }

  // Cash on Delivery – show confirm button
  if (paymentMethod === "cod") {
    return (
      <Card
        title="Payment Method"
        icon={Banknote}
        status={paymentMethod}
        className="bg-amber-50/30 border-amber-100"
      >
        <div className="flex flex-col items-center py-4 text-center">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-3">
            <Truck className="h-6 w-6 text-amber-600" />
          </div>
          <p className="text-sm font-black text-gray-800 uppercase tracking-tight">
            Cash on Delivery
          </p>
          <p className="text-[11px] text-gray-500 mt-1 max-w-[250px]">
            Payment collection is handled by the delivery person upon physical
            delivery.
          </p>
          <div className="mt-4 px-3 py-1 bg-white border border-amber-200 rounded-lg shadow-sm">
            <span className="text-[10px] font-black text-amber-700 uppercase">
              Awaiting Collection
            </span>
          </div>

          {/* Confirm payment button (only if not read-only) */}
          {!readOnly && (
            <button
              onClick={() => setShowCODConfirm(true)}
              className="mt-5 w-full py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Confirm Payment Collected
            </button>
          )}
        </div>

        {/* Confirmation Modal for COD */}
        <ConfirmationModal
          isOpen={showCODConfirm}
          onClose={() => setShowCODConfirm(false)}
          onConfirm={handleConfirmCOD}
          title="Confirm COD Payment"
          description="Are you sure you have collected the payment for this order? This action will mark the order as paid and cannot be undone."
          confirmText={codConfirming ? "Processing..." : "Yes, Confirm Payment"}
          confirmVariant="primary"
        />
      </Card>
    );
  }

  // No receipt uploaded yet
  if (!receipt) {
    return (
      <Card title="Payment Receipt" icon={Banknote}>
        <div className="text-center py-4 border-2 border-dashed border-gray-100 rounded-2xl">
          <AlertCircle className="h-6 w-6 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-500">
            Waiting for customer to upload receipt...
          </p>
        </div>
      </Card>
    );
  }

  // Receipt review logic (approved/rejected)
  const isAlreadyReviewed =
    receipt.status === "approved" || receipt.status === "rejected";
  const canReview = !readOnly && !isAlreadyReviewed;

  const handleConfirm = async () => {
    if (!pendingAction) return;
    setSubmitting(true);
    try {
      await reviewReceipt(receipt.id, {
        status: pendingAction,
        admin_notes: notes || undefined,
      });
      showToast("success", `Receipt ${pendingAction}`);
      setShowConfirm(false);
      onUpdate();
    } catch (err: any) {
      showToast("error", "Review failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title="Review Receipt" icon={Banknote}>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className={getStatusBadge(receipt.status)}>
            {receipt.status}
          </span>
          <p className="text-sm font-black text-gray-900">
            {Number(receipt.amount).toLocaleString()} ETB
          </p>
        </div>

        {receipt.receipt_image && (
          <div
            onClick={() => setShowImage(true)}
            className="group relative h-28 rounded-2xl overflow-hidden border border-gray-100 cursor-zoom-in shadow-inner bg-gray-50"
          >
            <img
              src={receipt.receipt_image}
              alt="Receipt"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Eye className="text-white h-6 w-6" />
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-purple-50/50 to-indigo-50/50 p-3 rounded-xl space-y-1 border border-purple-100">
          <p className="text-[10px] text-[#6750A4] font-bold uppercase tracking-widest">
            Bank Details
          </p>
          <p className="text-xs font-bold bg-gradient-to-r from-gray-700 to-[#6750A4] bg-clip-text text-transparent">
            {receipt.bank_name || "Not Specified"}
          </p>
        </div>

        {canReview && (
          <div className="space-y-2 pt-1">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add review notes..."
              className="w-full text-[11px] rounded-xl border-gray-200 focus:ring-purple-500 resize-none p-3"
              rows={1}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPendingAction("approved");
                  setShowConfirm(true);
                }}
                className="flex-1 bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-100"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  setPendingAction("rejected");
                  setShowConfirm(true);
                }}
                className="flex-1 bg-rose-500 text-white py-2 rounded-xl text-xs font-bold shadow-lg shadow-rose-100"
              >
                Reject
              </button>
            </div>
          </div>
        )}

        {isAlreadyReviewed && (
          <div
            className={`p-3 rounded-xl flex items-start gap-3 ${receipt.status === "approved" ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"}`}
          >
            {receipt.status === "approved" ? (
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            ) : (
              <X className="h-5 w-5 text-rose-600" />
            )}
            <div>
              <p className="text-xs font-bold bg-gradient-to-r from-emerald-700 to-emerald-600 bg-clip-text text-transparent">
                Verification {receipt.status}
              </p>
              <p className="text-[10px] text-gray-600">
                {receipt.status === "approved"
                  ? "Order is ready for dispatch."
                  : "Customer must re-upload."}
              </p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-xl flex items-center justify-center overflow-hidden"
            onClick={() => {
              setShowImage(false);
              resetView();
            }}
          >
            {/* Top Controls */}
            <div className="absolute top-5 right-5 z-50 flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  zoomOut();
                }}
                className="h-11 w-11 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 flex items-center justify-center transition-all"
              >
                −
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  zoomIn();
                }}
                className="h-11 w-11 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 flex items-center justify-center transition-all"
              >
                +
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetView();
                }}
                className="px-4 h-11 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold backdrop-blur-md border border-white/10 transition-all"
              >
                Reset
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImage(false);
                  resetView();
                }}
                className="h-11 w-11 rounded-2xl bg-rose-500/90 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Bottom Hint */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white/80 text-xs border border-white/10">
              Scroll to zoom • Drag to move
            </div>

            {/* Image Container */}
            <div
              className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
              onWheel={handleWheel}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <motion.img
                src={receipt.receipt_image}
                alt="Receipt"
                drag={zoom > 1}
                dragMomentum={false}
                onMouseDown={handleMouseDown}
                animate={{
                  scale: zoom,
                  x: position.x,
                  y: position.y,
                }}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 30,
                }}
                className="max-w-[92vw] max-h-[92vh] object-contain rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.55)] select-none"
                style={{
                  userSelect: "none",
                  pointerEvents: "auto",
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        title={`${pendingAction === "approved" ? "Approve" : "Reject"} Payment`}
        description="This action will notify the customer and update the order workflow. Are you sure?"
        confirmText={submitting ? "Processing..." : "Confirm Action"}
        confirmVariant={pendingAction === "approved" ? "primary" : "danger"}
      />
    </Card>
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
}: any) {
  if (!order) return null;

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
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="relative bg-gradient-to-br from-white via-white to-gray-50/50 w-full max-w-7xl max-h-[92vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-white/20 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header */}
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
                  <StatusBadge
                    status={order.status}
                    customLabels={{
                      pending: "Pending",
                    }}
                  />
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="flex items-center gap-2 bg-[#6750A4]/10 px-4 py-1.5 rounded-full border border-[#6750A4]/20 shadow-sm">
                    <Calendar className="h-3.5 w-3.5 text-[#6750A4]" />
                    <span className="font-mono text-[12px] font-semibold text-gray-700 tracking-tight">
                      {" "}
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
                    <User className="h-3.5 w-3.5 text-gray-400" />{" "}
                    <span className="font-medium">{order.company?.name}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onUpdate}
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-xl transition-all font-bold text-xs text-gray-500 uppercase tracking-widest"
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
              <button
                onClick={onClose}
                className="p-3 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all text-gray-400"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Scrollable Content Grid */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-gray-100">
            <div className="grid grid-cols-12 gap-8">
              {/* Left Side: Order Composition & Shipping (8 cols) */}
              <div className="col-span-12 lg:col-span-8 space-y-8">
                {/* 1. Customer Summary Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card title="Customer Profile" icon={User}>
                    <div className="flex items-center gap-4">
                      {order.recipient_image ? (
                        <img
                          src={order.recipient_image}
                          alt="Recipient"
                          className="w-14 h-14 rounded-full ring-2 ring-purple-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-white shadow-sm flex items-center justify-center text-[#6750A4] font-black text-xl">
                          {getInitials(order.recipient_name)}
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="font-black bg-gradient-to-r from-[#6750A4] to-[#8B6BB5] bg-clip-text text-transparent">
                          {order.recipient_name}
                        </p>
                        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50/50 px-3 py-1.5 rounded-lg w-fit border border-blue-200 shadow-sm">
                          <PhoneCall className="h-3.5 w-3.5 text-blue-600" />
                          <span className="text-xs font-mono font-bold text-blue-700 tracking-tight">
                            {order.shipping_phone}
                          </span>
                          <CopyButton text={order.shipping_phone} />
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card title="Shipping Destination" icon={MapPin}>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-purple-50/30 border-l-4 border-[#6750A4]">
                        <span className="text-xs font-bold text-gray-500 min-w-[110px]">
                          Recipient Name:
                        </span>
                        <span className="text-sm font-bold text-[#6750A4]">
                          {order.recipient_name ||
                            "No recipient name provided."}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50/30 border-l-4 border-blue-500">
                        <span className="text-xs font-bold text-gray-500 min-w-[110px]">
                          Recipient Phone:
                        </span>
                        <div className="flex items-center gap-2">
                          <PhoneCall className="h-3.5 w-3.5 text-blue-600" />
                          <span className="text-sm font-mono font-bold text-blue-700 tracking-tight">
                            {order.shipping_phone ||
                              "No Phone Number provided."}
                          </span>
                          <CopyButton text={order.shipping_phone} />
                        </div>
                      </div>
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-purple-50/30 border-l-4 border-[#6750A4]">
                        <span className="text-xs font-bold text-gray-500 min-w-[110px]">
                          Shipping Address:
                        </span>
                        <span className="text-sm font-bold text-[#6750A4]">
                          {order.shipping_address_text ||
                            "No address provided."}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* 2. Main Order Table */}
                <motion.div
                  variants={itemVariants}
                  className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm"
                >
                  <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
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
                          <th className="px-6 py-4 text-left">Description</th>
                          <th className="px-6 py-4 text-center">Qty</th>
                          <th className="px-6 py-4 text-right">Unit Price</th>
                          <th className="px-6 py-4 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {order.items.map((item: any) => (
                          <tr
                            key={item.id}
                            className="group hover:bg-gray-50/80 transition-all"
                          >
                            <td className="px-6 py-4">
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
                              {Number(item.unit_price).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right font-black text-gray-900 text-sm">
                              {Number(item.line_total).toLocaleString()}{" "}
                              <span className="text-[9px] text-gray-400">
                                ETB
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </div>

              {/* Right Side: Finances & Workflow (4 cols) */}
              <div className="col-span-12 lg:col-span-4 space-y-4">
                {/* 3. Financial Summary Card */}
                <motion.div
                  variants={itemVariants}
                  className="bg-gradient-to-br from-[#6750A4] via-[#7B5CB5] to-[#9370DB] rounded-[32px] p-4 text-white shadow-2xl shadow-purple-200 relative overflow-hidden group"
                >
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-white/5 rounded-full blur-2xl" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-5">
                      <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                          Total Amount
                        </p>
                        <h3 className="text-3xl font-black">
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
                  orderId={order.id} // ← ADD THIS LINE
                />

                {/* 5. Delivery person Assignment Card */}
                <DeliveryCard
                  order={order}
                  onUpdate={onUpdate}
                  readOnly={readOnly}
                />

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
