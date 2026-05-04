import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Package,
  Truck,
  Receipt,
  Calendar,
  MapPin,
  Download,
  Copy,
  Check,
  User,
  Hash,
  ImageIcon,
  Banknote,
  Loader2,
  Phone,
} from "lucide-react";
import type { VendorOrder } from "../../../types";
import {
  getCompanyStaffByRole,
  reviewReceipt,
  assignDelivery,
  updateDeliveryPerson,
} from "../../../services/api";

import { useToast } from "../../../hooks/useToast";
import { ConfirmationModal } from "../../ui/confimationModal";

// ---------- Helpers ----------
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
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";

  if (s === "paid" || s === "out_for_delivery")
    return "bg-violet-50 text-violet-700 border border-violet-200";

  if (s === "pending")
    return "bg-amber-50 text-amber-700 border border-amber-200";

  if (s === "processing" || s === "shipped")
    return "bg-sky-50 text-sky-700 border border-sky-200";

  if (s === "approved" || s === "accepted")
    return "bg-green-50 text-green-700 border border-green-200";

  if (s === "rejected" || s === "cancelled")
    return "bg-rose-50 text-rose-700 border border-rose-200";

  return "bg-gray-50 text-gray-600 border border-gray-200";
};
interface OrderReceipt {
  id: number;
  status: string;
  receipt_image: string;
  bank_name: string;
  amount: string;
  uploaded_at: string;
}
// ---------- Types ----------
// interface PaymentReceipt {
//   id: number;
//   master_order: number;
//   customer_name: string;
//   order_total: number;
//   bank_info: string | null;
//   bank_name: string;
//   receipt_image: string;
//   amount: string;
//   status: string;
//   admin_notes: string;
//   uploaded_at: string;
// }

interface StaffMember {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  role: string;
}

// ---------- Sub‑components ----------

// 1. Customer Card (with copyable fields)
const CustomerCard = ({ order }: { order: VendorOrder }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
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
        {/* {order.email && (
          <div className="flex items-center gap-2 text-gray-500">
            <Mail className="h-3.5 w-3.5" />
            <span>{order.email}</span>
            <CopyButton text={order.email} />
          </div>
        )} */}
      </div>
    </div>
  </div>
);

// 2. Shipping Card
const ShippingCard = ({ order }: { order: VendorOrder }) => (
  <div className="bg-white rounded-xl border border-blue-100 p-6 shadow-sm">
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
          {order.shipping_address_text?.replace(/, /g, "\n") || "N/A"}
        </p>
      </div>
    </div>
  </div>
);

// 3. Delivery Card (enhanced with avatar, tracking, assignment)
// Inside VendorOrderDetailModal.tsx – replacement for DeliveryCard with update support
// Inside VendorOrderDetailModal.tsx – replace the DeliveryCard component

const DeliveryCard = ({
  order,
  onUpdate,
}: {
  order: VendorOrder;
  onUpdate: () => void;
}) => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const { showToast } = useToast();

  const delivery = order.delivery;
  const formatStatus = (status?: string) => {
  if (!status) return "";

  return status
    .replace(/_/g, " ")                 // out_for_delivery → out for delivery
    .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize each word
};

  // ----- New rule: paid + confirmed -----
  // const paymentPaid = order.payment_status?.toLowerCase() === "paid";
  const orderConfirmed = order.status?.toLowerCase() === "confirmed";
  const canManage = orderConfirmed;

  // Highlight when ready to assign but not yet done
  const shouldHighlight = canManage && !order.delivery;   // or !delivery?.delivery_person_name

  const getDisabledReason = (): string => {
    // if (!paymentPaid && !orderConfirmed) {
    //   return "Payment must be completed and the order status must be 'Confirmed' before assigning a delivery person.";
    // }
    // if (!paymentPaid) {
    //   return "Payment is not yet completed. Only paid orders can be assigned.";
    // }
    if (!orderConfirmed) {
      return "Order status must be 'Confirmed' before a delivery person can be assigned.";
    }
    return "";
  };

  useEffect(() => {
    if (!order.company?.slug) return;

    const fetchStaff = async () => {
      setLoadingStaff(true);
      try {
        const res = await getCompanyStaffByRole(order.company.slug!, "delivery");
        const mappedStaff = (res.data.results || res.data).map((staff: any) => ({
          id: staff.user.id,
          name:
            `${staff.user.first_name || ""} ${staff.user.last_name || ""}`.trim() ||
            staff.user.username ||
            staff.user.email,
          phone: staff.user.phone_number,
        }));
        setStaffList(mappedStaff);
      } finally {
        setLoadingStaff(false);
      }
    };

    fetchStaff();
  }, [order.company?.slug]);

  const handleAssign = async () => {
    if (!selectedUserId) return;
    setAssigning(true);
    try {
      if (delivery) {
        const deliveryId = delivery.tracking_id;
        if (!deliveryId) throw new Error("Delivery record has no ID.");
        await updateDeliveryPerson(deliveryId, selectedUserId);
        showToast("success", "Delivery person updated");
      } else {
        await assignDelivery({
          vendor_order: order.id,
          delivery_person: selectedUserId,
        });
        showToast("success", "Delivery person assigned");
      }
      setSelectedUserId("");
      setShowAssignForm(false);
      onUpdate();
    } catch (err: any) {
      showToast(
        "error",
        err.response?.data?.detail || err.message || "Operation failed",
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleOpenForm = () => {
    if (assigning) return;
    if (delivery?.delivery_person) {
      setSelectedUserId(delivery.delivery_person);
    } else {
      setSelectedUserId("");
    }
    setShowAssignForm(true);
  };

  const handleCancel = () => {
    setShowAssignForm(false);
    setSelectedUserId("");
  };

  return (
    <div
      className={`bg-white rounded-xl border p-6 shadow-sm transition-all ${
        shouldHighlight
          ? "border-[#6750A4] ring-2 ring-[#6750A4]/20"
          : "border-purple-100"
      }`}
    >
      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
        <Truck className="h-4 w-4 text-[#6750A4]" /> Delivery Details
        {shouldHighlight && (
          <span className="text-xs text-[#6750A4] font-normal ml-2">
            (next step)
          </span>
        )}
      </h4>

      {delivery && delivery.delivery_person_name ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#6750A4]/10 flex items-center justify-center text-[#6750A4] font-bold text-xl">
              {getInitials(delivery.delivery_person_name || "?")}
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-lg">
                {delivery.delivery_person_name || "N/A"}
              </p>
              {delivery.tracking_id && (
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <Hash className="h-3.5 w-3.5" />
                  <span>{delivery.tracking_id.split("-")[0]}</span>
                  <CopyButton text={delivery.tracking_id.split("-")[0]} />
                </div>
              )}
              {delivery.status && (
                <span
                  className={`inline-block mt-2 px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(delivery.status)}`}
                >
                  {formatStatus(delivery.status)}
                </span>
              )}
            </div>

            {canManage && !showAssignForm && (
              <button
                onClick={handleOpenForm}
                disabled={assigning}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assigning ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                    Processing...
                  </>
                ) : (
                  "Change"
                )}
              </button>
            )}

            {!canManage && !showAssignForm && (
              <button
                disabled
                title={getDisabledReason()}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-100 text-gray-400 bg-gray-50 cursor-not-allowed"
              >
                Change
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-3">
            No delivery person assigned yet
          </p>
          {canManage && !showAssignForm && (
            <button
              onClick={handleOpenForm}
              disabled={assigning}
              className="px-4 py-2 bg-[#6750A4] text-white text-sm font-medium rounded-lg hover:bg-[#59409A] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
                  Assigning...
                </>
              ) : (
                "Assign Delivery Person"
              )}
            </button>
          )}

          {!canManage && (
            <button
              disabled
              title={getDisabledReason()}
              className="px-4 py-2 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed"
            >
              Assignment locked
            </button>
          )}
        </div>
      )}

      {showAssignForm && canManage && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-600 mb-3">
            {delivery ? "Select new delivery person" : "Select delivery person"}
          </p>
          {loadingStaff ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-4">
              <select
                value={selectedUserId}
                onChange={(e) =>
                  setSelectedUserId(parseInt(e.target.value) || "")
                }
                className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-[#6750A4] focus:border-transparent"
              >
                <option value="">-- Select a delivery person --</option>
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} {staff.phone ? `(${staff.phone})` : ""}
                  </option>
                ))}
              </select>
              <div className="flex gap-3">
                <button
                  onClick={handleAssign}
                  disabled={!selectedUserId || assigning}
                  className="flex-1 py-2.5 bg-[#6750A4] text-white text-sm font-semibold rounded-lg hover:bg-[#59409A] disabled:opacity-60 transition flex items-center justify-center gap-2"
                >
                  {assigning && <Loader2 className="h-4 w-4 animate-spin" />}
                  {assigning ? "Assigning..." : delivery ? "Update" : "Assign"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={assigning}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
// 4. Order Items Table (full width)
const OrderItemsCard = ({ order }: { order: VendorOrder }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
      <Package className="h-4 w-4 text-[#6750A4]" /> Order Items (
      {order.items.length})
    </h4>
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead className="text-xs text-gray-500 uppercase border-b border-gray-100">
          <tr>
            <th className="text-left py-3 pr-4">Product</th>
            <th className="text-left py-3 px-2">SKU</th>
            <th className="text-right py-3 px-2">Qty</th>
            <th className="text-right py-3 px-2">Unit Price</th>
            <th className="text-right py-3 pl-2">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {order.items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-gray-400 m-auto" />
                    )}
                  </div>
                  <span className="font-medium text-gray-800 truncate">
                    {item.title}
                  </span>
                </div>
              </td>
              <td className="py-3 px-2 text-gray-500 font-mono text-xs">
                {item.sku || "—"}
              </td>
              <td className="py-3 px-2 text-right text-gray-700">{item.qty}</td>
              <td className="py-3 px-2 text-right text-gray-700">
                {Number(item.unit_price).toLocaleString()} ETB
              </td>
              <td className="py-3 pl-2 text-right font-semibold text-[#6750A4]">
                {Number(item.line_total).toLocaleString()} ETB
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// 5. Order Summary Card (right column)
// const OrderSummaryCard = ({ order }: { order: VendorOrder }) => (
//   <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
//     <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
//       <Receipt className="h-4 w-4 text-[#6750A4]" /> Order Summary
//     </h4>
//     <div className="space-y-4 text-sm">
//       <div className="flex justify-between items-center">
//         <span className="text-gray-500">Order Status</span>
//         <span
//           className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(order.status)}`}
//         >
//           {order.status}
//         </span>
//       </div>
//       <div className="flex justify-between items-center">
//         <span className="text-gray-500">Delivery Status</span>
//         <span
//           className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(order.delivery_status || "pending")}`}
//         >
//           {order.delivery_status || "pending"}
//         </span>
//       </div>
//       {order.tax_invoice?.invoice_number && (
//         <div className="flex justify-between items-center">
//           <span className="text-gray-500">Invoice #</span>
//           <span className="font-mono text-gray-700">
//             {order.tax_invoice.invoice_number}
//           </span>
//         </div>
//       )}
//       <div className="pt-4 border-t border-gray-100">
//         <div className="flex justify-between items-center">
//           <span className="text-gray-500 font-medium">Total Amount</span>
//           <span className="text-xl font-bold text-[#6750A4]">
//             {Number(order.amount).toLocaleString()} ETB
//           </span>
//         </div>
//       </div>
//     </div>
//   </div>
// );

// 6. Financial Card (right column)
const FinancialCard = ({ order }: { order: VendorOrder }) => (
  <div className="bg-[#6750A4] text-white rounded-xl p-6 shadow-sm">
    <h4 className="text-sm font-semibold flex items-center gap-2 mb-4">
      <Receipt className="h-4 w-4" /> Order Summary
    </h4>
    <div className="space-y-3 text-sm">
      <div className="flex justify-between">
        <span className="text-white/70">Subtotal</span>
        <span>{Number(order.subtotal).toLocaleString()} ETB</span>
      </div>
      <div className="flex justify-between">
        <span className="text-white/70">Tax</span>
        <span>{Number(order.tax_amount).toLocaleString()} ETB</span>
      </div>
      {order.tax_invoice?.invoice_number && (
        <div className="flex justify-between items-center">
          <span className="text-white/70">Invoice #</span>
          <span className="font-mono text-white">
            {order.tax_invoice.invoice_number}
          </span>
        </div>
      )}
      <div className="border-t border-white/20 pt-3 flex justify-between text-base font-bold">
        <span>Total Amount</span>
        <span className="text-lg">
          {Number(order.amount).toLocaleString()} ETB
        </span>
      </div>
    </div>
  </div>
);

// 7. Timeline Card (right column)
const TimelineCard = ({ order }: { order: VendorOrder }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
      <Calendar className="h-4 w-4 text-[#6750A4]" /> Timeline
    </h4>
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className="w-2 h-2 rounded-full bg-[#6750A4] mt-1" />
          <div className="w-px h-full bg-gray-200" />
        </div>
        <div className="pb-4">
          <p className="text-xs text-gray-500">Order Created</p>
          <p className="text-sm font-medium text-gray-800">
            {formatDateTime(order.created_at)}
          </p>
        </div>
      </div>
      {order.tax_invoice && (
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-[#6750A4] mt-1" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Invoice Issued</p>
            <p className="text-sm font-medium text-gray-800">
              {formatDateTime(order.tax_invoice.issued_at)}
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
);

// 8. Receipt Review Card (right column, with image preview modal)
// inside VendorOrderDetailModal.tsx

const ReceiptReviewCard = ({
  receipt,
  paymentMethod,
  onUpdate,
}: {
  receipt?: OrderReceipt | null;
  paymentMethod?: string;
  onUpdate: () => void;
}) => {
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "approved" | "rejected" | null
  >(null);
  const { showToast } = useToast();

  // Case 1: Chapa
  if (paymentMethod === "chapa") {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Banknote className="h-5 w-5 text-indigo-600" />
          <h4 className="text-sm sm:text-base font-semibold text-gray-800">
            Payment Information
          </h4>
        </div>
        <div className="text-center py-6">
          <p className="text-gray-700 text-sm">
            Paid via <span className="font-semibold">Chapa</span>
          </p>
          <p className="text-gray-500 text-xs mt-1">
            No receipt required for this payment method.
          </p>
        </div>
      </div>
    );
  }

  // Case 2: Bank transfer but no receipt uploaded yet
  if (!receipt) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Banknote className="h-5 w-5 text-gray-400" />
          <h4 className="text-sm sm:text-base font-semibold text-gray-800">
            Payment Receipt
          </h4>
        </div>
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">
            No receipt uploaded for this order.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Payment method: Bank Transfer
          </p>
        </div>
      </div>
    );
  }

  // Case 3: Bank transfer with receipt
  const isAlreadyReviewed =
    receipt.status === "approved" || receipt.status === "rejected";

  const handleActionClick = (action: "approved" | "rejected") => {
    setPendingAction(action);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!pendingAction) return;
    setSubmitting(true);
    try {
      await reviewReceipt(receipt.id, {
        status: pendingAction,
        admin_notes: notes || undefined,
      });
      showToast("success", `Receipt ${pendingAction}`);
      setNotes("");
      setPendingAction(null);
      onUpdate();
    } catch (err: any) {
      showToast("error", err.response?.data?.detail || "Review failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white flex-col rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-2 mb-4">
        <Banknote className="h-5 w-5 text-indigo-600" />
        <h4 className="text-sm sm:text-base font-semibold text-gray-800">
          Payment Receipt
        </h4>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-500">Status</p>
          <span
            className={`text-xs px-2 py-1 rounded-full border ${getStatusBadge(receipt.status)}`}
          >
            {receipt.status}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-500">Bank</p>
            <p className="font-semibold text-gray-900">{receipt.bank_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-500">Amount</p>
            <p className="text-lg font-bold text-gray-900">
              {Number(receipt.amount).toLocaleString()} ETB
            </p>
          </div>
        </div>

        {receipt.receipt_image && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Receipt Image</p>
            <div
              onClick={() => setShowImage(true)}
              className="relative w-full h-44 sm:h-56 rounded-xl overflow-hidden border cursor-zoom-in group"
            >
              <img
                src={receipt.receipt_image}
                alt="Receipt"
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
            </div>
          </div>
        )}

        {!isAlreadyReviewed && (
          <div className="pt-2 space-y-3">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleActionClick("approved")}
                disabled={submitting}
                className="px-3 py-1.5 text-xs rounded-lg border border-green-200 text-green-600 hover:bg-green-50 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => handleActionClick("rejected")}
                disabled={submitting}
                className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add admin notes (optional)"
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#6750A4] transition"
            />
          </div>
        )}

        {isAlreadyReviewed && (
          <div className="mt-2 space-y-2">
            {receipt.status === "approved" ? (
              <div className="flex items-start gap-2 text-sm">
                <div className="p-1 rounded-full bg-green-100 text-green-700 mt-0.5">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    Payment approved
                  </p>
                  <p className="text-xs text-[#6750A4] mt-0.5">
                    Next step: Assign a delivery person
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-sm">
                <div className="p-1 rounded-full bg-red-100 text-red-700 mt-0.5">
                  <X className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    Payment rejected
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    The customer may upload a new receipt.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image modal */}
      {showImage && receipt.receipt_image && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowImage(false)}
        >
          <div
            className="relative max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowImage(false)}
              className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full p-2 shadow"
            >
              <X className="h-5 w-5 text-gray-700" />
            </button>
            <img
              src={receipt.receipt_image}
              alt="Receipt Full"
              className="w-full max-h-[90vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

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
        description={
          pendingAction === "approved"
            ? "Are you sure you want to approve this payment receipt? This will mark the payment as verified."
            : "Are you sure you want to reject this payment receipt? The customer will be notified and may need to upload another receipt."
        }
        confirmText={pendingAction === "approved" ? "Approve" : "Reject"}
        confirmVariant={pendingAction === "approved" ? "primary" : "danger"}
      />
    </div>
  );
};

// 9. Status Update Section (top bar)
// const StatusUpdateSection = ({
//   orderId,
//   currentStatus,
//   onUpdate,
// }: {
//   orderId: number;
//   currentStatus: string;
//   onUpdate: () => void;
// }) => {
//   const [selected, setSelected] = useState(currentStatus);
//   const [updating, setUpdating] = useState(false);
//   const { showToast } = useToast();

//   useEffect(() => setSelected(currentStatus), [currentStatus]);

//   const handleChange = async (newStatus: string) => {
//     setUpdating(true);
//     try {
//       await api.patch(`/orders/vendor/${orderId}/`, { status: newStatus });
//       showToast("success", `Status updated to ${newStatus.replace(/_/g, " ")}`);
//       onUpdate();
//     } catch (err: any) {
//       showToast("error", err.response?.data?.detail || "Update failed");
//     } finally {
//       setUpdating(false);
//     }
//   };

//   return (
//     <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
//       <span className="text-sm font-semibold text-gray-700">Order Status:</span>
//       <select
//         value={selected}
//         onChange={(e) => handleChange(e.target.value)}
//         disabled={updating}
//         className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#6750A4]"
//       >
//         {["pending", "accepted", "processing", "completed", "cancelled"].map((s) => (
//           <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
//         ))}
//       </select>
//       {updating && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
//     </div>
//   );
// };

// Reusable Copy Button
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

// ════════════════════════════════════════
// MAIN MODAL
// ════════════════════════════════════════

const modalVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export function VendorOrderDetailModal({
  order,
  receipt,
  onClose,
  onUpdate,
}: {
  order: VendorOrder | null;
  receipt?: OrderReceipt | null; // use the simplified type
  onClose: () => void;
  onUpdate?: () => void;
}) {
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    const handleScroll = () => {
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      setShowTopShadow(scrollTop > 8);
      setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 8);
    };
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

  const handleLocalUpdate = () => onUpdate?.();

  return (
    <AnimatePresence>
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-white rounded-3xl w-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl ring-1 ring-black/5 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-8 py-5 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-[#6750A4] to-[#9B7DD4] bg-clip-text text-transparent">
                Vendor Order #{order.id}
              </h2>
              <CopyButton text={String(order.id)} />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                  Order Status
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(order.status)}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {order.status.replace(/_/g, " ")}
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-[#6750A4] p-2 rounded-full hover:bg-gray-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden"
          >
            {showTopShadow && (
              <div className="sticky top-0 h-5 bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />
            )}

            <div className="p-8 space-y-6">
              {/* Status Update Bar */}
              {/* <StatusUpdateSection
                orderId={order.id}
                currentStatus={order.status}
                onUpdate={handleLocalUpdate}
              /> */}

              {/* Two‑column layout */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left column (wider) */}
                <div className="xl:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <CustomerCard order={order} />
                    <ShippingCard order={order} />
                  </div>
                  <DeliveryCard order={order} onUpdate={handleLocalUpdate} />
                  <OrderItemsCard order={order} />
                </div>

                {/* Right column */}
                <div className="space-y-6">
                  <ReceiptReviewCard
                    receipt={receipt}
                    paymentMethod={order.payment_method}
                    onUpdate={handleLocalUpdate}
                  />
                  <TimelineCard order={order} />
                  <FinancialCard order={order} />

                  {/* <OrderSummaryCard order={order} /> */}

                  {/* Tax Invoice quick link */}
                  {order.tax_invoice && (
                    <div className="bg-gray-50 rounded-xl p-5">
                      <p className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                        <Receipt className="h-4 w-4 text-[#6750A4]" /> Tax
                        Invoice
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        {order.tax_invoice.invoice_number}
                      </p>
                      {order.tax_invoice.pdf_url && (
                        <a
                          href={order.tax_invoice.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#6750A4] hover:underline text-sm font-medium"
                        >
                          <Download size={14} /> Download PDF
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Empty fallback */}
              {(!order.items || order.items.length === 0) && (
                <div className="text-center py-16 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No items found in this order</p>
                </div>
              )}
            </div>

            {showBottomShadow && (
              <div className="sticky bottom-0 h-5 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
