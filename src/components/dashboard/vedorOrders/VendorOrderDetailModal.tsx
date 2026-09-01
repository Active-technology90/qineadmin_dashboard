// VendorOrderDetailModal.tsx - Complete rewrite with View on Map
import React, { useEffect, useState, useMemo, useCallback } from "react";
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
  Users,
  Search,
} from "lucide-react";
import {
  getAvailableDeliveryDrivers,
  reviewReceipt,
  assignDelivery,
  updateDeliveryPerson,
  prepareVendorOrder,
  confirmCODPayment,
} from "../../../services/api";
import { useToast } from "../../../hooks/useToast";
import { ConfirmationModal } from "../../ui/confimationModal";
import { CustomSelect } from "../../ui/CustomSelect";
import { db } from "../../../services/firebase";
import { ref, onValue, off } from "firebase/database";
import DeliveryTrackingMap from "./DeliveryTrackingMap";

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

  const approvedReceipt = order.receipt_history?.find(
    (h: any) => h.status === "approved",
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
  } else if (
    order.payment_method === "chapa" &&
    order.payment_status === "paid"
  ) {
    events.push({
      id: "payment",
      label: "Payment Confirmed",
      icon: "💳",
      time: order.created_at,
      actor: "Chapa",
      status: "completed",
    });
  }

  if (
    order.status?.toLowerCase() === "processing" ||
    order.status?.toLowerCase() === "fulfilled"
  ) {
    events.push({
      id: "prepared",
      label: "Order Prepared",
      icon: "✅",
      time: order.updated_at || order.created_at,
      actor: "Admin",
      status: "completed",
    });
  }

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

  events.sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );

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
    ...customLabels,
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

// ─── DELIVERY CARD WITH VIEW ON MAP ──────────────────────────────
const DeliveryCard = ({
  order,
  onUpdate,
  readOnly,
  onOpenLiveTracking,
  liveDriverLocations = {},
  onViewOnMap, // New prop
}: any) => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [assigning, setAssigning] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "in_house" | "third_party">("all");
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [usernameMap, setUsernameMap] = useState<Map<string, string>>(
    new Map(),
  );
  const { showToast } = useToast();
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [ratingMap, setRatingMap] = useState<
    Map<string, { average_rating: string; total_reviews: number }>
  >(new Map());
  const [driverLocations, setDriverLocations] = useState<
    Record<
      number,
      { latitude: number; longitude: number; is_online?: boolean; updated_at?: number }
    >
  >({});
  const delivery = order.delivery;
  const canManage = !readOnly && order.status?.toLowerCase() === "processing";
  const cod = order.payment_method === "cod";
  const deliveryStatus = delivery?.status?.toLowerCase() === "picked_up";

  // Helper function to calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const isValidCoordinate = (lat: number, lon: number): boolean => {
    return (
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180
    );
  };

  const getCustomerLocation = () => {
    const lat = delivery?.customer_lat || order?.customer_lat || order?.delivery_address?.lat;
    const lon = delivery?.customer_lon || order?.customer_lon || order?.delivery_address?.lon;
    if (lat != null && lon != null) {
      const parsedLat = parseFloat(lat);
      const parsedLon = parseFloat(lon);
      if (isValidCoordinate(parsedLat, parsedLon)) {
        return { lat: parsedLat, lon: parsedLon };
      }
    }
    return null;
  };

  const mockDrivers = [
    {
      id: 12,
      name: "goliad bekila",
      username: "goliad",
      phone: "0942199009",
      profile_image: null,
      average_rating: "0.00",
      total_reviews: 0,
      vehicle_type: "motorcycle",
      company_id: 10,
      company_name: "Elfiya Flour Factory",
      company_slug: "elfiya-flour-factory",
      is_in_house: true,
      distance_km: 2.5,
      last_lat: 8.9806,
      last_lon: 38.7578,
      current_lat: 9.0107,
      current_lng: 38.7613,
    },
    {
      id: 13,
      name: "bemo tes",
      username: "bemo",
      phone: "0989876765",
      profile_image: null,
      average_rating: "4.00",
      total_reviews: 1,
      vehicle_type: "motorcycle",
      company_id: 10,
      company_name: "Elfiya Flour Factory",
      company_slug: "elfiya-flour-factory",
      is_in_house: true,
      distance_km: 1.8,
      last_lat: 9.0107,
      last_lon: 38.7613,
      current_lat: 9.0107,
      current_lng: 38.7613,
    },
    {
      id: 18,
      name: "Chala Bekele",
      username: "yango_rider_1",
      phone: "+251911223344",
      profile_image: null,
      average_rating: "0.00",
      total_reviews: 0,
      vehicle_type: "motorcycle",
      company_id: 48,
      company_name: "Yango Logistics",
      company_slug: "yango-logistics",
      is_in_house: false,
      distance_km: 3.2,
      last_lat: 9.0321,
      last_lon: 38.7519,
      current_lat: 9.0321,
      current_lng: 38.7519,
    },
    {
      id: 19,
      name: "Abebe Kebede",
      username: "ride_ethiopia_1",
      phone: "+251944556677",
      profile_image: null,
      average_rating: "3.50",
      total_reviews: 2,
      vehicle_type: "car",
      company_id: 55,
      company_name: "Ride Ethiopia",
      company_slug: "ride-ethiopia",
      is_in_house: false,
      distance_km: 1.5,
      last_lat: 9.0056,
      last_lon: 38.7634,
      current_lat: 9.0056,
      current_lng: 38.7634,
    },
    {
      id: 20,
      name: "Hana Tesfaye",
      username: "hana_driver",
      phone: "+251955667788",
      profile_image: null,
      average_rating: "4.50",
      total_reviews: 3,
      vehicle_type: "car",
      company_id: 10,
      company_name: "Elfiya Flour Factory",
      company_slug: "elfiya-flour-factory",
      is_in_house: true,
      distance_km: 0.8,
      last_lat: 9.0012,
      last_lon: 38.7598,
      current_lat: 9.0012,
      current_lng: 38.7598,
    },
    {
      id: 21,
      name: "Dawit Bekele",
      username: "dawit_rider",
      phone: "+251966889900",
      profile_image: null,
      average_rating: "0.00",
      total_reviews: 0,
      vehicle_type: "motorcycle",
      company_id: 10,
      company_name: "Elfiya Flour Factory",
      company_slug: "elfiya-flour-factory",
      is_in_house: true,
      distance_km: null,
      last_lat: null,
      last_lon: null,
      current_lat: null,
      current_lng: null,
    },
  ];

  const getVehicleIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "motorcycle":
        return "🏍️";
      case "car":
        return "🚗";
      case "bicycle":
        return "🚲";
      case "van":
        return "🚐";
      case "foot":
        return "🚶";
      default:
        return "🛵";
    }
  };

  const getVehicleName = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "motorcycle":
        return "Motorcycle";
      case "car":
        return "Car";
      case "bicycle":
        return "Bicycle";
      case "van":
        return "Van";
      case "foot":
        return "On Foot";
      default:
        return "Vehicle";
    }
  };

  const renderRating = (avg?: string, reviews?: number) => {
    if (!avg || avg === "0.00" || !reviews || reviews === 0)
      return "No reviews";
    const rating = parseFloat(avg).toFixed(1);
    return `⭐ ${rating} (${reviews})`;
  };

  // Subscribe to real-time live GPS for eligible drivers via Firebase drivers/{driverId}
  useEffect(() => {
    if (!showAssignForm || staffList.length === 0) return;
    const cleanups: Array<() => void> = [];

    staffList.forEach((driver) => {
      const driverRef = ref(db, `drivers/${driver.id}`);
      const callback = (snapshot: any) => {
        const data = snapshot.val();
        if (data && data.latitude != null && data.longitude != null) {
          setDriverLocations((prev) => ({
            ...prev,
            [driver.id]: data,
          }));
        }
      };
      onValue(driverRef, callback);
      cleanups.push(() => off(driverRef, "value", callback));
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [showAssignForm, staffList]);

  const getDriverLiveLocation = (driverId: number) => {
    const localLoc = driverLocations[driverId];
    if (localLoc && localLoc.latitude != null && localLoc.longitude != null) {
      return {
        lat: Number(localLoc.latitude),
        lon: Number(localLoc.longitude),
        is_online: localLoc.is_online !== false,
      };
    }

    if (liveDriverLocations && typeof liveDriverLocations === "object") {
      const entries = Object.values(liveDriverLocations);
      for (const entry of entries as any[]) {
        if (entry && typeof entry === "object") {
          if (entry.driver_id === driverId || entry.id === driverId) {
            return {
              lat: Number(entry.lat ?? entry.latitude),
              lon: Number(entry.lon ?? entry.longitude ?? entry.lng),
              is_online: entry.is_online !== false,
            };
          }
        }
      }
      const directMatch =
        (liveDriverLocations as any)[driverId] ||
        (liveDriverLocations as any)[String(driverId)];
      if (directMatch) {
        return {
          lat: Number(directMatch.lat ?? directMatch.latitude),
          lon: Number(directMatch.lon ?? directMatch.longitude ?? directMatch.lng),
          is_online: directMatch.is_online !== false,
        };
      }
    }
    return null;
  };

  const getReferenceLocation = () => {
    const storeLat = order.company?.latitude ? parseFloat(order.company.latitude) : null;
    const storeLon = order.company?.longitude ? parseFloat(order.company.longitude) : null;
    if (storeLat != null && storeLon != null && isValidCoordinate(storeLat, storeLon)) {
      return { lat: storeLat, lon: storeLon, type: "store" };
    }
    const custLoc = getCustomerLocation();
    if (custLoc) {
      return { ...custLoc, type: "customer" };
    }
    return null;
  };

  const staffWithDistance = useMemo(() => {
    const refLoc = getReferenceLocation();
    return staffList.map((s) => {
      const liveLoc = getDriverLiveLocation(s.id);
      if (liveLoc && isValidCoordinate(liveLoc.lat, liveLoc.lon)) {
        const distance = refLoc
          ? calculateDistance(refLoc.lat, refLoc.lon, liveLoc.lat, liveLoc.lon)
          : null;
        return {
          ...s,
          calculated_distance: distance != null ? Math.round(distance * 10) / 10 : null,
          location_source: "live",
          isLive: true,
          isOnline: liveLoc.is_online !== false,
        };
      }
      if (s.current_lat != null && s.current_lng != null) {
        const currentLat = parseFloat(s.current_lat);
        const currentLng = parseFloat(s.current_lng);
        if (isValidCoordinate(currentLat, currentLng)) {
          const distance = refLoc
            ? calculateDistance(refLoc.lat, refLoc.lon, currentLat, currentLng)
            : null;
          return {
            ...s,
            calculated_distance: distance != null ? Math.round(distance * 10) / 10 : null,
            location_source: "current",
            isLive: false,
            isOnline: true,
          };
        }
      }
      if (s.last_lat != null && s.last_lon != null) {
        const lastLat = parseFloat(s.last_lat);
        const lastLon = parseFloat(s.last_lon);
        if (isValidCoordinate(lastLat, lastLon)) {
          const distance = refLoc
            ? calculateDistance(refLoc.lat, refLoc.lon, lastLat, lastLon)
            : null;
          return {
            ...s,
            calculated_distance: distance != null ? Math.round(distance * 10) / 10 : null,
            location_source: "last_known",
            isLive: false,
            isOnline: true,
          };
        }
      }
      if (s.distance_km != null && !isNaN(parseFloat(s.distance_km))) {
        return {
          ...s,
          calculated_distance: Math.round(parseFloat(s.distance_km) * 10) / 10,
          location_source: "api",
          isLive: false,
          isOnline: true,
        };
      }
      return {
        ...s,
        calculated_distance: null,
        location_source: null,
        isLive: false,
        isOnline: true,
      };
    });
  }, [
    staffList,
    driverLocations,
    liveDriverLocations,
    order.company?.latitude,
    order.company?.longitude,
    delivery?.customer_lat,
    delivery?.customer_lon,
    order?.customer_lat,
    order?.customer_lon,
    order?.delivery_address?.lat,
    order?.delivery_address?.lon,
  ]);

  const filteredStaffList = useMemo(() => {
    let filtered = [...staffWithDistance];
    if (filterType === "in_house") {
      filtered = filtered.filter((s) => s.is_in_house === true);
    } else if (filterType === "third_party") {
      filtered = filtered.filter((s) => s.is_in_house === false);
    }
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name?.toLowerCase().includes(search) ||
          s.phone?.toLowerCase().includes(search) ||
          s.username?.toLowerCase().includes(search) ||
          s.company_name?.toLowerCase().includes(search)
      );
    }
    return filtered.sort((a, b) => {
      const distA = a.calculated_distance != null ? a.calculated_distance : 999999;
      const distB = b.calculated_distance != null ? b.calculated_distance : 999999;
      if (distA !== distB) return distA - distB;
      const rankA = a.is_in_house ? 0 : 1;
      const rankB = b.is_in_house ? 0 : 1;
      return rankA - rankB;
    });
  }, [staffWithDistance, filterType, searchTerm]);

  const getOrderFailureReason = () => {
    if (delivery?.failure_reason) return delivery.failure_reason;
    if (delivery?.cancellation_reason) return delivery.cancellation_reason;
    if (delivery?.cancelled_reason) return delivery.cancelled_reason;
    if (delivery?.reason) return delivery.reason;
    if (delivery?.status_reason) return delivery.status_reason;
    if (order?.vendor_order_detail?.failure_reason)
      return order.vendor_order_detail.failure_reason;
    if (order?.vendor_order_detail?.cancellation_reason)
      return order.vendor_order_detail.cancellation_reason;
    if (order?.vendor_order_detail?.cancelled_reason)
      return order.vendor_order_detail.cancelled_reason;
    if (order?.vendor_order_detail?.reason)
      return order.vendor_order_detail.reason;
    if (order?.failure_reason) return order.failure_reason;
    if (order?.cancellation_reason) return order.cancellation_reason;
    if (order?.cancelled_reason) return order.cancelled_reason;
    if (order?.reason) return order.reason;
    if (order?.status_reason) return order.status_reason;
    if (order?.cancel_reason) return order.cancel_reason;
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

  const fetchStaff = async (filter: "all" | "in_house" | "third_party") => {
    if (!order.company?.slug) return;
    setLoadingStaff(true);
    try {
      let allDrivers: any[] = [];
      try {
        const res = await getAvailableDeliveryDrivers(order.company.slug, {
          vendor_order_id: order.id,
          driver_type: filter === "all" ? "all" : filter === "in_house" ? "in_house" : "3pl",
        });
        allDrivers = res.data || [];
      } catch (apiError) {
        console.warn("API fetch failed, using mock data", apiError);
        allDrivers =
          filter === "all"
            ? mockDrivers
            : filter === "in_house"
            ? mockDrivers.filter((d) => d.is_in_house)
            : mockDrivers.filter((d) => !d.is_in_house);
      }

      const mapped = allDrivers.map((s: any) => ({
        id: s.id,
        name: `${s.name || s.username || ""}`.trim(),
        phone: s.phone,
        username: s.username,
        average_rating: s.average_rating,
        total_reviews: s.total_reviews,
        vehicle_type: s.vehicle_type,
        company_name: s.company_name,
        is_in_house: s.is_in_house,
        distance_km: s.distance_km,
        last_lat: s.last_lat,
        last_lon: s.last_lon,
        current_lat: s.current_lat,
        current_lng: s.current_lng,
      }));
      setStaffList(mapped);

      const ratingMap = new Map();
      mapped.forEach((staff: any) => {
        if (staff.phone) {
          ratingMap.set(staff.phone, {
            average_rating: staff.average_rating,
            total_reviews: staff.total_reviews,
          });
        }
      });
      setRatingMap(ratingMap);

      const map = new Map();
      mapped.forEach((staff: any) => {
        if (staff.phone && staff.username) {
          map.set(staff.phone, staff.username);
        }
      });
      setUsernameMap(map);
    } catch (err) {
      console.error("Failed to fetch available delivery drivers", err);
      showToast("error", "Failed to load delivery drivers");
    } finally {
      setLoadingStaff(false);
    }
  };
    } catch (err) {
      console.error("Failed to fetch available delivery drivers", err);
      showToast("error", "Failed to load delivery drivers");
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    if (showAssignForm) {
      fetchStaff(filterType);
      setSearchTerm("");
      setSelectedUserId("");
    }
  }, [showAssignForm, filterType, order.company?.slug]);

  const handleAssign = async () => {
    setAssigning(true);
    try {
      if (delivery) {
        await updateDeliveryPerson(
          delivery.id.toString(),
          Number(selectedUserId),
        );
      } else {
        await assignDelivery({
          vendor_order: order.id,
          delivery_person: Number(selectedUserId),
        });
      }
      await onUpdate();
      showToast("success", "Delivery person assigned successfully");
      setShowAssignForm(false);
    } catch (err: any) {
      showToast("error", "Failed to assign delivery person");
    } finally {
      setAssigning(false);
    }
  };

  const formatDistance = (distance: number | null | undefined) => {
    if (distance == null) return "Distance unavailable";
    if (distance < 1) return `${(distance * 1000).toFixed(0)} m`;
    return `${distance.toFixed(1)} km`;
  };

  // ─── Handle View on Map click ────────────────────────────────────
  const handleViewOnMap = () => {
    if (onViewOnMap && order.id) {
      onViewOnMap(order.id);
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
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm">
                        {usernameMap.get(delivery.delivery_person_phone) ||
                          delivery.delivery_person_name}
                      </p>
                      {delivery.logistics_company_name ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {delivery.logistics_company_name} (3PL)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          In-House
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50/50 px-2 py-1 rounded-lg w-fit border border-blue-200 mt-1">
                      <PhoneCall className="h-3 w-3 text-blue-600" />
                      <span className="text-[11px] font-mono font-bold text-blue-700 tracking-tight">
                        {delivery.delivery_person_phone}
                      </span>
                      <CopyButton text={delivery.delivery_person_phone} />
                    </div>

                    {delivery?.status === "declined" && (
                      <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 shadow-sm">
                        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                            Driver Declined Delivery
                          </p>
                          <p className="text-xs text-amber-700 font-medium leading-relaxed">
                            {delivery.decline_reason
                              ? `Reason: ${delivery.decline_reason}`
                              : "The assigned driver declined this order. Please reassign to another driver."}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {delivery?.status === "out_for_delivery" &&
                        onOpenLiveTracking && (
                          <button
                            onClick={onOpenLiveTracking}
                            className="inline-flex items-center justify-center gap-2
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
                      
                      {/* View on Map button - shown for all delivery orders */}
                      {order.fulfillment_type === "delivery" && (
                        <button
                          onClick={handleViewOnMap}
                          className="inline-flex items-center justify-center gap-1.5
                            rounded-xl border border-purple-200
                            bg-purple-50 text-secondary
                            px-3 py-1.5
                            text-xs font-semibold
                            shadow-sm transition-all duration-200
                            hover:bg-purple-100 hover:shadow-md
                            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          <span>View on Map</span>
                        </button>
                      )}
                    </div>

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
                    {/* ── DISPATCH ATTEMPTS HISTORY ── */}
                    {delivery?.attempts && delivery.attempts.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-gray-100">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <History className="h-3 w-3 text-gray-400" /> Dispatch History ({delivery.attempts.length})
                        </p>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                          {delivery.attempts.map((att: any) => {
                            const isDeclined = att.status === "declined";
                            const isAccepted = att.status === "accepted";
                            const isReassigned = att.status === "reassigned";
                            return (
                              <div
                                key={att.id}
                                className={`text-[11px] p-2 rounded-lg flex items-start justify-between gap-2 border ${
                                  isDeclined
                                    ? "bg-rose-50/70 border-rose-200 text-rose-800"
                                    : isAccepted
                                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                                    : isReassigned
                                    ? "bg-gray-50 border-gray-200 text-gray-600"
                                    : "bg-blue-50/70 border-blue-200 text-blue-800"
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap font-semibold">
                                    <span>{att.driver_name || `Driver #${att.driver}`}</span>
                                    {att.logistics_company_name && (
                                      <span className="text-[9px] font-medium px-1.5 py-0.2 bg-white rounded border border-current">
                                        {att.logistics_company_name}
                                      </span>
                                    )}
                                  </div>
                                  {att.decline_reason && (
                                    <p className="text-[10px] italic mt-0.5 opacity-90 truncate">
                                      "{att.decline_reason}"
                                    </p>
                                  )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                                    isDeclined
                                      ? "bg-rose-200 text-rose-900"
                                      : isAccepted
                                      ? "bg-emerald-200 text-emerald-900"
                                      : isReassigned
                                      ? "bg-gray-200 text-gray-800"
                                      : "bg-blue-200 text-blue-900"
                                  }`}>
                                    {att.status}
                                  </span>
                                  {att.assigned_at && (
                                    <p className="text-[9px] text-gray-400 mt-0.5">
                                      {new Date(att.assigned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
                  <div className="flex flex-col sm:flex-row gap-2">
                    {deliveryStatus ||
                      (canManage && (
                        <button
                          onClick={() => setShowAssignForm(true)}
                          className="flex-1 py-2 bg-secondary text-white rounded-xl text-xs font-bold hover:bg-[#59409A] shadow-md transition-all"
                        >
                          Assign Delivery person
                        </button>
                      ))}
                    
                    {/* View on Map button - shown for all delivery orders */}
                    {order.fulfillment_type === "delivery" && (
                      <button
                        onClick={handleViewOnMap}
                        className="flex-1 py-2 bg-purple-50 text-secondary rounded-xl text-xs font-bold border border-purple-200 hover:bg-purple-100 shadow-sm transition-all flex items-center justify-center gap-2"
                      >
                        <MapPin className="h-4 w-4" />
                        View on Map
                      </button>
                    )}
                  </div>
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
              className="space-y-4"
            >
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Filter Drivers
                </label>
                <div className="flex gap-2 mt-1.5">
                  <button
                    onClick={() => {
                      setFilterType("all");
                      setSelectedUserId("");
                    }}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      filterType === "all"
                        ? "bg-secondary text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => {
                      setFilterType("in_house");
                      setSelectedUserId("");
                    }}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      filterType === "in_house"
                        ? "bg-secondary text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    In-House
                  </button>
                  <button
                    onClick={() => {
                      setFilterType("third_party");
                      setSelectedUserId("");
                    }}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      filterType === "third_party"
                        ? "bg-secondary text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    3PL
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search delivery person..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Available Delivery Persons ({filteredStaffList.length})
              </label>
              
              {loadingStaff ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-100 rounded-xl"></div>
                    </div>
                  ))}
                </div>
              ) : filteredStaffList.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-600 mb-1">
                    No available delivery persons
                  </p>
                  <p className="text-xs text-gray-500">
                    {searchTerm || filterType !== "all"
                      ? "Try adjusting your search or filters"
                      : "There are currently no delivery persons available for this delivery."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {filteredStaffList.map((staff, index) => {
                    const isSelected = selectedUserId === staff.id;
                    const isNearest = index === 0 && staff.calculated_distance != null;
                    const hasLocation = staff.calculated_distance != null;
                    
                    return (
                      <div
                        key={staff.id}
                        onClick={() => setSelectedUserId(staff.id)}
                        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "border-secondary bg-purple-50 shadow-md"
                            : "border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm"
                        }`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setSelectedUserId(staff.id);
                          }
                        }}
                      >
                        {isNearest && (
                          <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full shadow-sm">
                            ⭐ NEAREST
                          </span>
                        )}
                        
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {getInitials(staff.name)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="font-bold text-gray-900 text-sm truncate">
                                  {staff.name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  {staff.is_in_house ? (
                                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      In-House
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                      {staff.company_name || "3PL"}
                                    </span>
                                  )}
                                  {staff.vehicle_type && (
                                    <span className="text-[10px] text-gray-500">
                                      {getVehicleIcon(staff.vehicle_type)} {getVehicleName(staff.vehicle_type)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end gap-1">
                                {hasLocation ? (
                                  <>
                                    <span className={`text-xs font-bold ${
                                      staff.calculated_distance < 1
                                        ? "text-emerald-600"
                                        : staff.calculated_distance < 3
                                        ? "text-blue-600"
                                        : "text-gray-600"
                                    }`}>
                                      📍 {formatDistance(staff.calculated_distance)}
                                    </span>
                                    {staff.location_source === 'live' && (
                                      <span className="text-[9px] text-green-600 flex items-center gap-0.5">
                                        <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                                        Live
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-400">
                                    Distance unavailable
                                  </span>
                                )}
                                
                                {isSelected && (
                                  <span className="text-[10px] font-bold text-secondary">
                                    ✓ Selected
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="flex items-center gap-1">
                                  <PhoneCall className="h-3 w-3" />
                                  {staff.phone || "No Phone"}
                                </span>
                                {staff.average_rating && staff.average_rating !== "0.00" && (
                                  <span>{renderRating(staff.average_rating, staff.total_reviews)}</span>
                                )}
                              </div>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUserId(staff.id);
                                }}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                  isSelected
                                    ? "bg-secondary text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                              >
                                {isSelected ? "Selected" : "Select"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2 text-[10px] text-gray-500">
                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                  {staffWithDistance.filter(s => s.is_in_house).length} In-House
                </span>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                  {staffWithDistance.filter(s => !s.is_in_house).length} 3PL
                </span>
                {staffWithDistance.filter(s => s.calculated_distance != null).length > 0 && (
                  <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full">
                    📍 {staffWithDistance.filter(s => s.calculated_distance != null).length} with location
                  </span>
                )}
              </div>

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
                    "Assign Driver"
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

// ─── RECEIPT REVIEW CARD ──────────────────────────────────────────
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState<
    "approved" | "rejected" | null
  >(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "approved" | "rejected" | null
  >(null);
  const [showCODConfirm, setShowCODConfirm] = useState(false);
  const [codConfirming, setCodConfirming] = useState(false);
  const { showToast } = useToast();

  const displayHistory = receiptHistory
    ? receiptHistory.filter((h: any) => {
        if (h.id === receipt?.id && receipt?.status === "pending") {
          return false;
        }
        return true;
      })
    : [];

  const handleConfirmCOD = async () => {
    if (!companySlug || !orderId) return;
    setCodConfirming(true);
    try {
      await confirmCODPayment(companySlug, Number(orderId));
      showToast("success", "COD payment confirmed successfully");
      setShowCODConfirm(false);
      await onUpdate();
    } catch (err: any) {
      showToast(
        "error",
        err.response?.data?.detail ||
          err.message ||
          "Failed to confirm COD payment",
      );
    } finally {
      setCodConfirming(false);
    }
  };

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
        {receipt.receipt_image && (
          <div>
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
        <div className="bg-gradient-to-r from-purple-50/50 to-indigo-50/50 p-4 rounded-xl border border-purple-100">
          <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-1">
            Bank Details
          </p>
          <p className="font-semibold text-sm text-gray-900">
            {receipt.bank_name || "Not Specified"}
          </p>
        </div>

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

      {previewImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 border border-black"
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
        loading={false}
        autoClose={false}
      />
    </div>
  );
};

// ─── PREPARATION CARD ──────────────────────────────────────────────
const PreparationCard = ({ order, onUpdate, readOnly }: any) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const { showToast } = useToast();
  const status = order.status?.toLowerCase();
  const isCOD = order.payment_method === "cod";

  const handlePrepare = async () => {
    setShowConfirm(false);
    setPreparing(true);
    try {
      await prepareVendorOrder(order.company.slug, order.id);
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
          {(status === "confirmed" || (isCOD && status === "pending")) && (
            <>
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
        loading={false}
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
  onViewOnMap, // New prop
}: any) {
  if (!order) return null;
  const [refreshing, setRefreshing] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapMode, setMapMode] = useState<"tracking" | "driver_selection">("tracking");
  const [selectedOrderId, setSelectedOrderId] = useState<number | undefined>();

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await onUpdate();
    } finally {
      setRefreshing(false);
    }
  };

  // ─── Handle View on Map from DeliveryCard ──────────────────────
  const handleViewOnMap = useCallback((orderId: number) => {
    setSelectedOrderId(orderId);
    setMapMode("driver_selection");
    setIsMapOpen(true);
  }, []);

  // ─── Handle driver selection from map ──────────────────────────
  const handleDriverSelect = useCallback(async (driverId: number) => {
    try {
      if (order.delivery) {
        await updateDeliveryPerson(
          order.delivery.id.toString(),
          driverId
        );
      } else {
        await assignDelivery({
          vendor_order: order.id,
          delivery_person: driverId,
        });
      }
      // Refresh the order data
      await onUpdate();
    } catch (err) {
      throw err;
    }
  }, [order, onUpdate]);

  // ─── Handle assignment complete ────────────────────────────────
  const handleAssignmentComplete = useCallback(() => {
    // The onUpdate has already been called in handleDriverSelect
    // Just close the map after a brief delay
    setTimeout(() => {
      setIsMapOpen(false);
      setSelectedOrderId(undefined);
    }, 500);
  }, []);

  // ─── Close map ──────────────────────────────────────────────────
  const handleCloseMap = useCallback(() => {
    setIsMapOpen(false);
    setSelectedOrderId(undefined);
  }, []);

  // ─── Customer Order History ────────────────────────────────────
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
          o.id !== order.id,
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 10);
  }, [order, allOrders]);

  return (
    <>
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
              <div className="flex flex-row justify-between items-start gap-2">
                <div className="mt-1.5">
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
                <div className="flex items-center gap-1 sm:gap-2">
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
                  </button>
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
                  {/* Customer Summary Section */}
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

                  {/* Main Order Table */}
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
                                        <span className="text-[10px] font-black uppercase tracking-wider text-secondary">
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

                  {/* Order Timeline */}
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
                      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />

                      {buildOrderTimeline(order).map((event: any) => (
                        <div
                          key={event.id}
                          className="relative flex items-start gap-4"
                        >
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
                              style={{
                                width: "200%",
                                height: "200%",
                                left: "-50%",
                                top: "-50%",
                              }}
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
                                {new Date(event.time).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}{" "}
                                •{" "}
                                {new Date(event.time).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
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

                  {/* Customer Order History */}
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
                                  },
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
                              <StatusBadge status={ord.status} />
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
                  {/* Financial Summary Card */}
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
                      </div>
                    </div>
                  </motion.div>

                  {/* Payment Receipt Review Card */}
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

                  {/* Delivery person Assignment Card */}
                  {order.fulfillment_type === "delivery" &&
                    order.shipping_address_text && (
                      <DeliveryCard
                        order={order}
                        onUpdate={onUpdate}
                        readOnly={readOnly}
                        onOpenLiveTracking={onOpenLiveTracking}
                        onViewOnMap={handleViewOnMap}
                      />
                    )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Map Modal */}
      {isMapOpen && (
        <DeliveryTrackingMap
          onClose={handleCloseMap}
          mode={mapMode}
          selectedOrderId={selectedOrderId}
          onDriverSelect={handleDriverSelect}
          onAssignmentComplete={handleAssignmentComplete}
        />
      )}
    </>
  );
}