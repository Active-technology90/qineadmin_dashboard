import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Package, Truck, Receipt, Calendar, MapPin, 
  Download, Copy, Check, User, Hash, ImageIcon, 
  Banknote, Loader2, Phone, RefreshCw, ChevronRight,
  ExternalLink, CreditCard, Clock
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

// ---------- Animation Constants ----------
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.4, 
      staggerChildren: 0.05 
    } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
};

// ---------- Refined Helper Components ----------

const StatusBadge = ({ status }: { status: string }) => {
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

  return (
    <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border shadow-sm ${styles[s] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
};

const Card = ({ children, title, icon: Icon, className = "" }: any) => (
  <motion.div 
    variants={itemVariants}
    className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
  >
    <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
      <div className="p-1.5 bg-[#674FA3]/10 rounded-lg">
        <Icon className="h-4 w-4 text-[#674FA3]" />
      </div>
      <h4 className="text-sm font-bold text-gray-800">{title}</h4>
    </div>
    {children}
  </motion.div>
);

// ---------- Updated Delivery Card with cleaner space management ----------
const DeliveryCard = ({ order, onUpdate, readOnly }: any) => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const { showToast } = useToast();

  const delivery = order.delivery;
  const canManage = !readOnly && order.status?.toLowerCase() === "confirmed";

  useEffect(() => {
    if (!order.company?.slug || !showAssignForm) return;
    const fetchStaff = async () => {
      setLoadingStaff(true);
      try {
        const res = await getCompanyStaffByRole(order.company.slug!, "delivery");
        const mapped = (res.data.results || res.data).map((s: any) => ({
          id: s.user.id,
          name: `${s.user.first_name} ${s.user.last_name}`,
          phone: s.user.phone_number,
        }));
        setStaffList(mapped);
      } finally { setLoadingStaff(false); }
    };
    fetchStaff();
  }, [showAssignForm, order.company?.slug]);

  const handleAssign = async () => {
    if (!selectedUserId) return;
    setAssigning(true);
    try {
      if (delivery) {
        await updateDeliveryPerson(Number(delivery.tracking_id), selectedUserId);
      } else {
        await assignDelivery({ vendor_order: order.id, delivery_person: selectedUserId });
      }
      showToast("success", "Courier updated");
      setShowAssignForm(false);
      onUpdate();
    } catch (err: any) {
      showToast("error", "Operation failed");
    } finally { setAssigning(false); }
  };

  return (
    <Card title="Courier Assignment" icon={Truck} className={!delivery ? "bg-purple-50/30 border-purple-100" : ""}>
      <AnimatePresence mode="wait">
        {!showAssignForm ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-between"
          >
            {delivery ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  {delivery.delivery_person_name?.[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{delivery.delivery_person_name}</p>
                  <p className="text-xs text-gray-500">ID: {delivery.tracking_id?.split("-")[0]}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No courier assigned</p>
            )}
            
            {canManage && (
              <button 
                onClick={() => setShowAssignForm(true)}
                className="text-xs font-semibold text-[#674FA3] hover:underline flex items-center gap-1"
              >
                {delivery ? "Change" : "Assign Now"} <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            className="space-y-3 overflow-hidden"
          >
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
              className="w-full text-sm rounded-xl border-gray-200 focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select Staff...</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="flex gap-2">
              <button 
                onClick={handleAssign}
                disabled={assigning || !selectedUserId}
                className="flex-1 bg-[#674FA3] text-white text-xs py-2 rounded-lg font-bold disabled:opacity-50"
              >
                {assigning ? <Loader2 className="h-3 w-3 animate-spin m-auto" /> : "Confirm"}
              </button>
              <button 
                onClick={() => setShowAssignForm(false)}
                className="flex-1 bg-gray-100 text-gray-600 text-xs py-2 rounded-lg font-bold"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

// ---------- Main Refined Modal ----------
export function VendorOrderDetailModal({ order, receipt, onClose, onUpdate, readOnly = false }: any) {
  if (!order) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" 
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          layoutId={`order-${order.id}`}
          variants={containerVariants}
          initial="hidden" animate="visible" exit="hidden"
          className="relative bg-[#F8F9FD] w-full max-w-6xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Top Glass Header */}
          <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex justify-between items-center z-10">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-2 rounded-2xl">
                <Package className="h-6 w-6 text-purple-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-gray-900">Order #{order.id}</h2>
                  <StatusBadge status={order.status} />
                </div>
                <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Placed on {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={onUpdate} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <RefreshCw className="h-5 w-5 text-gray-500" />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-rose-50 hover:text-rose-500 rounded-full transition-colors text-gray-400">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Body - Clean Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="grid grid-cols-12 gap-6">
              
              {/* Left Column - Main Details (8 cols) */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                
                {/* 1. Customer & Shipping Summary (Combined row) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card title="Customer" icon={User}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">
                        {order.recipient_name?.[0] || "?"}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{order.recipient_name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {order.shipping_phone}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card title="Shipping Address" icon={MapPin}>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                      {order.shipping_address_text}
                    </p>
                  </Card>
                </div>

                {/* 2. Items Table */}
                <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
                    <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <Package className="h-4 w-4 text-purple-600" /> Items List
                    </h4>
                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full font-bold text-gray-500">
                      {order.items.length} PRODUCTS
                    </span>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50/50 text-[10px] text-gray-400 uppercase font-black">
                      <tr>
                        <th className="px-5 py-3 text-left">Product</th>
                        <th className="px-5 py-3 text-center">Qty</th>
                        <th className="px-5 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {order.items.map((item: any) => (
                        <tr key={item.id} className="group hover:bg-purple-50/30 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-gray-100 flex-shrink-0" />
                              <span className="font-semibold text-gray-700">{item.title}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-center font-medium text-gray-500">x{item.qty}</td>
                          <td className="px-5 py-3 text-right font-bold text-gray-900">
                            {Number(item.line_total).toLocaleString()} <span className="text-[10px] text-gray-400">ETB</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              </div>

              {/* Right Column - Actions & Finances (4 cols) */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                
                {/* Financial Summary */}
                <motion.div variants={itemVariants} className="bg-[#674FA3] rounded-[24px] p-6 text-white shadow-xl shadow-purple-200 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                  <h4 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-4">Total Payable</h4>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-black">{Number(order.amount).toLocaleString()}</span>
                    <span className="text-sm font-bold opacity-70">ETB</span>
                  </div>
                  <div className="space-y-3 border-t border-white/10 pt-4">
                    <div className="flex justify-between text-xs opacity-80">
                      <span>Subtotal</span>
                      <span>{Number(order.subtotal).toLocaleString()} ETB</span>
                    </div>
                    <div className="flex justify-between text-xs opacity-80">
                      <span>Tax</span>
                      <span>{Number(order.tax_amount).toLocaleString()} ETB</span>
                    </div>
                  </div>
                </motion.div>

                {/* Courier Actions */}
                <DeliveryCard order={order} onUpdate={onUpdate} readOnly={readOnly} />

                {/* Tiny Timeline */}
                <Card title="Timeline" icon={Clock}>
                  <div className="space-y-4">
                    <div className="flex gap-3 relative">
                      <div className="w-2 h-2 rounded-full bg-purple-500 mt-1 z-10" />
                      <div className="absolute left-[3px] top-2 w-[1px] h-6 bg-gray-100" />
                      <div className="text-[11px]">
                        <p className="font-bold text-gray-800">Order Placed</p>
                        <p className="text-gray-400">{new Date(order.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-gray-200 mt-1" />
                      <div className="text-[11px]">
                        <p className="font-bold text-gray-400 italic">Processing...</p>
                      </div>
                    </div>
                  </div>
                </Card>

              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50/50 px-8 py-4 border-t border-gray-100 flex justify-between items-center">
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
               Vendor Portal v2.0
             </p>
             <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                  <Download className="h-3.5 w-3.5" /> Invoice PDF
                </button>
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}