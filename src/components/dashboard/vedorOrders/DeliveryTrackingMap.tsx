// DeliveryTrackingMap.tsx - Production Dispatch & Live Tracking UI
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import {
  X, Navigation, Loader2, RefreshCw, Truck, MapPin, Clock,
  CheckCircle, PanelLeftClose, PanelLeftOpen, Maximize2, Building2,
  Users, Search, Check, Phone, Package, Navigation2, Home, Star,
  Route as RouteIcon, AlertTriangle, Store, User, ArrowRight, Award,
  Factory, Box, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  getAdminVendorOrders,
  getCompanyVendorOrders,
  getAvailableDeliveryDrivers,
} from "../../../services/api";
import { useAuth } from "../../../hooks/useAuth";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useReadOnly } from "../AdminDashboard";
import { useQuery } from "@tanstack/react-query";
import type * as Leaflet from "leaflet";
import { db } from "../../../services/firebase";
import { ref, onValue, off } from "firebase/database";
import type { VendorOrder } from "../../../types";
import { useToast } from "../../../hooks/useToast";

// ── Types ──────────────────────────────────────────────────────────
interface Coordinates {
  lat: number;
  lon: number;
}

interface OrderDestination {
  address: string;
  lat: number | null;
  lon: number | null;
  source: "shipping" | "delivery" | "nested" | "geocoded" | "coordinates" | "unknown";
}

interface DispatchOrder {
  id: number;
  status: string;
  fulfillmentType: string;
  customerName: string;
  customerPhone: string;
  address: string;
  customerLat: number | null;
  customerLon: number | null;
  pickupName: string;
  pickupLat: number | null;
  pickupLon: number | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  items: any[];
  canAssign: boolean;
  assignmentBlockedReason?: string;
  companyLat?: number | null;
  companyLon?: number | null;
  companyAddress?: string;
}

interface DeliveryWithLocation extends VendorOrder {
  delivery: NonNullable<VendorOrder["delivery"]> & {
    current_lat?: number;
    current_lng?: number;
    speed?: number;
    heading?: number;
    delivery_person_name: string;
    delivery_person_phone?: string;
    status: string;
    logistics_company_name?: string;
    is_in_house?: boolean;
    customer_address?: string;
    delivery_person_image?: string;
  };
}

interface FirebaseDriverData {
  lat?: number;
  lon?: number;
  speed?: number;
  heading?: number;
  status?: string;
  driver_name?: string;
  driver_phone?: string;
  customer_address?: string;
}

interface AvailableDriver {
  id: number;
  name: string;
  username: string;
  phone: string;
  vehicle_type?: string;
  is_in_house: boolean;
  company_name?: string;
  current_lat?: number | null;
  current_lng?: number | null;
  last_lat?: number | null;
  last_lon?: number | null;
  distance_km?: number | null;
  average_rating?: string;
  total_reviews?: number;
  profile_image?: string | null;
  location_source?: "live" | "current" | "last_known" | "api" | "unknown";
  isLive?: boolean;
  distance_to_pickup?: number | null;
  distance_to_customer?: number | null;
  total_route_distance?: number | null;
  pickup_eta_minutes?: number | null;
  total_eta_minutes?: number | null;
  road_distance_to_customer?: number | null;
  road_eta_to_customer?: number | null;
  is_nearest?: boolean;
}

interface RouteSummary {
  coordinates: [number, number][];
  distanceKm: number;
  durationMinutes: number;
}

interface DeliveryTrackingMapProps {
  onClose: () => void;
  mode?: "tracking" | "driver_selection";
  selectedOrderId?: number;
  onDriverSelect?: (driverId: number) => Promise<void>;
  onAssignmentComplete?: () => void;
}

type RouteCacheKey = string;
interface RouteCacheEntry {
  coordinates: [number, number][];
  timestamp: number;
  distanceKm: number;
  durationMinutes: number;
}

type SortOption = "recommended" | "nearest_pickup" | "fastest_eta" | "highest_rated";

// ── Helpers ────────────────────────────────────────────────────────
const escapeHtml = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const isValidCoordinate = (lat: number | null | undefined, lon: number | null | undefined): boolean => {
  if (lat == null || lon == null) return false;
  const numLat = Number(lat);
  const numLon = Number(lon);
  return (
    Number.isFinite(numLat) && Number.isFinite(numLon) &&
    numLat >= -90 && numLat <= 90 &&
    numLon >= -180 && numLon <= 180
  );
};

const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (distance: number | null | undefined): string => {
  if (distance == null) return "Distance unavailable";
  if (distance < 1) return `${(distance * 1000).toFixed(0)} m`;
  return `${distance.toFixed(1)} km`;
};

const formatDuration = (minutes: number | null | undefined): string => {
  if (minutes == null) return "ETA unavailable";
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `~${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `~${hours}h ${mins}m`;
};

const getInitials = (name: string): string => {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]?.toUpperCase() || "").slice(0, 2).join("");
};

const getVehicleIcon = (type?: string): string => {
  switch (type?.toLowerCase()) {
    case "motorcycle": return "🏍️";
    case "car": return "🚗";
    case "bicycle": return "🚲";
    case "van": return "🚐";
    case "foot": return "🚶";
    default: return "🛵";
  }
};

const getVehicleName = (type?: string): string => {
  switch (type?.toLowerCase()) {
    case "motorcycle": return "Motorcycle";
    case "car": return "Car";
    case "bicycle": return "Bicycle";
    case "van": return "Van";
    case "foot": return "On Foot";
    default: return "Vehicle";
  }
};

const DRIVER_COLORS = [
  "#E53935", "#8E24AA", "#3949AB", "#1E88E5", "#00897B",
  "#43A047", "#7CB342", "#FDD835", "#FB8C00", "#F4511E",
  "#6D4C41", "#546E7A", "#D81B60", "#5E35B1", "#039BE5",
  "#00ACC1", "#C0CA33", "#FFB300", "#8D6E63",
];

const getDriverColor = (index: number) => DRIVER_COLORS[index % DRIVER_COLORS.length];

// ── Canonical Order Destination Helper ─────────────────────
const getOrderDestination = (order: any): OrderDestination => {
  if (!order) {
    return { address: "Address not available", lat: null, lon: null, source: "unknown" };
  }

  let lat: number | null = null;
  let lon: number | null = null;
  let source: OrderDestination["source"] = "unknown";

  if (isValidCoordinate(order.shipping_lat, order.shipping_lon)) {
    lat = Number(order.shipping_lat);
    lon = Number(order.shipping_lon);
    source = "shipping";
  }
  else if (order.vendor_orders?.[0] && isValidCoordinate(order.vendor_orders[0].shipping_lat, order.vendor_orders[0].shipping_lon)) {
    lat = Number(order.vendor_orders[0].shipping_lat);
    lon = Number(order.vendor_orders[0].shipping_lon);
    source = "nested";
  }
  else if (isValidCoordinate(order.delivery?.customer_lat, order.delivery?.customer_lon)) {
    lat = Number(order.delivery.customer_lat);
    lon = Number(order.delivery.customer_lon);
    source = "delivery";
  }
  else if (order.vendor_orders?.[0]?.delivery && isValidCoordinate(order.vendor_orders[0].delivery.customer_lat, order.vendor_orders[0].delivery.customer_lon)) {
    lat = Number(order.vendor_orders[0].delivery.customer_lat);
    lon = Number(order.vendor_orders[0].delivery.customer_lon);
    source = "nested";
  }
  else if (isValidCoordinate(order.customer_lat, order.customer_lon)) {
    lat = Number(order.customer_lat);
    lon = Number(order.customer_lon);
    source = "coordinates";
  }

  let address = "";
  
  if (order.shipping_address_text) {
    address = order.shipping_address_text;
  }
  else if (order.vendor_orders?.[0]?.shipping_address_text) {
    address = order.vendor_orders[0].shipping_address_text;
  }
  else if (order.delivery?.customer_address) {
    address = order.delivery.customer_address;
  }
  else if (order.vendor_orders?.[0]?.delivery?.customer_address) {
    address = order.vendor_orders[0].delivery.customer_address;
  }
  else {
    const addressFields = [
      order.delivery_address,
      order.customer_address,
      order.address,
      order.street_address,
      order.shipping_address_ref?.address,
      order.shipping_address_ref?.street,
      order.shipping_address_ref?.text,
      order.shipping_address_ref?.full_address,
    ].filter(Boolean);
    
    if (addressFields.length > 0) {
      address = addressFields[0];
    }
  }

  if (!address && lat != null && lon != null) {
    address = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    source = "coordinates";
  }

  if (!address) {
    address = "Address not available";
  }

  return { address, lat, lon, source };
};

// ── Assignment Eligibility Helper ─────────────────────────────────
const canAssignDriver = (order: any): { canAssign: boolean; reason?: string } => {
  if (!order) return { canAssign: false, reason: "Order not found" };

  const masterStatus = order.status?.toLowerCase();
  const deliveryStatus = order.delivery?.status?.toLowerCase();
  const vendorOrders = order.vendor_orders || [];
  
  const blockedStatuses = ['delivered', 'cancelled', 'rejected', 'refunded', 'completed'];
  if (blockedStatuses.includes(masterStatus)) {
    return { canAssign: false, reason: `Order status is ${masterStatus}. Driver assignment is unavailable.` };
  }
  
  if (deliveryStatus && blockedStatuses.includes(deliveryStatus)) {
    return { canAssign: false, reason: `Delivery status is ${deliveryStatus}. Driver assignment is unavailable.` };
  }

  for (const vo of vendorOrders) {
    const voStatus = vo.status?.toLowerCase();
    const voDeliveryStatus = vo.delivery_status?.toLowerCase() || vo.delivery?.status?.toLowerCase();
    
    if (['cancelled', 'rejected', 'refunded'].includes(voStatus) || 
        (voDeliveryStatus && ['cancelled', 'rejected', 'refunded'].includes(voDeliveryStatus))) {
      return { canAssign: false, reason: "One or more vendor deliveries are cancelled or rejected." };
    }
  }

  return { canAssign: true };
};

// ── Normalize Order Data ──────────────────────────────────
const normalizeOrder = (order: any): DispatchOrder => {
  const destination = getOrderDestination(order);
  const assignmentCheck = canAssignDriver(order);
  
  const vendorOrder = order.vendor_orders?.[0];
  const company = vendorOrder?.company || order.company;
  
  const pickupLat = company?.latitude != null ? Number(company.latitude) : null;
  const pickupLon = company?.longitude != null ? Number(company.longitude) : null;
  
  const items = vendorOrder?.items || order.items || order.order_items || [];
  
  return {
    id: order.id,
    status: order.status || "unknown",
    fulfillmentType: order.fulfillment_type || vendorOrder?.fulfillment_type || "delivery",
    customerName: order.recipient_name || order.customer_name || vendorOrder?.recipient_name || "Recipient",
    customerPhone: order.shipping_phone || order.customer_phone || vendorOrder?.shipping_phone || "",
    address: destination.address,
    customerLat: destination.lat,
    customerLon: destination.lon,
    pickupName: company?.name || "Pickup Location",
    pickupLat: isValidCoordinate(pickupLat, pickupLon) ? pickupLat : null,
    pickupLon: isValidCoordinate(pickupLat, pickupLon) ? pickupLon : null,
    subtotal: Number(order.subtotal || vendorOrder?.subtotal || 0),
    deliveryFee: Number(order.delivery_fee || vendorOrder?.delivery_fee || 0),
    total: Number(order.total_amount || vendorOrder?.amount || 0),
    currency: order.currency || "ETB",
    paymentMethod: order.payment_method || vendorOrder?.payment_method || "",
    paymentStatus: order.payment_status || vendorOrder?.payment_status || "",
    items,
    canAssign: assignmentCheck.canAssign,
    assignmentBlockedReason: assignmentCheck.reason,
    companyLat: pickupLat,
    companyLon: pickupLon,
    companyAddress: company?.address || company?.address_am || "",
  };
};

// ── UI atoms ───────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status?: string }> = React.memo(({ status }) => {
  const isLive = status === "out_for_delivery" || status === "shipped";
  return (
    <span
      className={`flex items-center gap-1.5 text-[12px] sm:text-xs font-medium ${
        isLive ? "text-green-400" : "text-gray-400"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isLive ? "bg-green-500 animate-pulse" : "bg-gray-300"
        }`}
      />
      {isLive ? "Live" : status || "Pending"}
    </span>
  );
});

const StatsCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string | number;
  iconBgColor: string;
  iconColor: string;
}> = React.memo(({ icon, title, value, iconBgColor, iconColor }) => (
  <div className="bg-white rounded-xl shadow-sm px-4 py-3 flex items-center gap-3 border border-gray-200 flex-1 min-w-[80px]">
    <div
      className={`${iconBgColor} w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0`}
    >
      <div className={`${iconColor}`}>{icon}</div>
    </div>
    <div className="min-w-0">
      <div className="text-lg font-extrabold text-gray-800 truncate">
        {value}
      </div>
      <div className="text-[10px] sm:text-xs text-gray-500 font-medium truncate">
        {title}
      </div>
    </div>
  </div>
));

// ── Popup generators ───────────────────────────────────────────
const createCompanyPopup = (order: DispatchOrder): string => {
  return `
    <div style="font-family:Inter,system-ui,sans-serif;min-width:240px;max-width:300px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
        <div style="background:#E8F5E9;border-radius:12px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;">🏢</div>
        <div>
          <div style="font-size:16px;font-weight:700;color:#111827;">Company Location</div>
          <div style="font-size:13px;color:#6B7280;">${escapeHtml(order.pickupName)}</div>
        </div>
      </div>
      ${order.companyAddress ? `
        <div style="background:#F9FAFB;border-radius:12px;padding:12px;margin-bottom:8px;">
          <div style="font-size:12px;color:#374151;">📍 ${escapeHtml(order.companyAddress)}</div>
        </div>
      ` : ''}
      ${order.companyLat != null && order.companyLon != null ? `
        <div style="font-size:11px;color:#6B7280;font-family:monospace;">
          ${order.companyLat.toFixed(6)}, ${order.companyLon.toFixed(6)}
        </div>
      ` : ''}
    </div>
  `;
};

const createCustomerPopup = (orders: DeliveryWithLocation[]): string => {
  const listItems = orders
    .map(
      (o) =>
        `<li style="margin-bottom:6px;"><b>#${o.id}-${o.master_order_id || "N/A"}</b> – ${escapeHtml(o.recipient_name || o.customer_name || "Recipient")}</li>`,
    )
    .join("");
  return `
    <div style="font-family:Inter,system-ui,sans-serif;min-width:220px;max-width:300px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
        <div style="background:#FEF3C7;border-radius:12px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;">📍</div>
        <div>
          <div style="font-size:16px;font-weight:700;color:#111827;">Customer Location</div>
          <div style="font-size:13px;color:#6B7280;">${orders.length} order${orders.length > 1 ? "s" : ""}</div>
        </div>
      </div>
      <ul style="background:#F9FAFB;border-radius:12px;padding:12px;list-style:none;margin:0;">${listItems}</ul>
    </div>
  `;
};

const createCustomerPopupForOrder = (order: DispatchOrder): string => {
  return `
    <div style="font-family:Inter,system-ui,sans-serif;min-width:260px;max-width:320px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
        <div style="background:#FEF3C7;border-radius:12px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;">📍</div>
        <div>
          <div style="font-size:16px;font-weight:700;color:#111827;">Customer Location</div>
          <div style="font-size:13px;color:#6B7280;">${escapeHtml(order.customerName)}</div>
        </div>
      </div>
      <div style="background:#F9FAFB;border-radius:12px;padding:12px;margin-bottom:8px;">
        <div style="font-size:12px;color:#374151;margin-bottom:6px;">
          <strong>📍 Address:</strong> ${escapeHtml(order.address)}
        </div>
        ${order.customerPhone ? `
          <div style="font-size:12px;color:#374151;margin-bottom:6px;">
            <strong>📞 Phone:</strong> ${escapeHtml(order.customerPhone)}
          </div>
        ` : ''}
        ${order.customerLat != null && order.customerLon != null ? `
          <div style="font-size:12px;color:#374151;">
            <strong>🌍 Coordinates:</strong> ${order.customerLat.toFixed(6)}, ${order.customerLon.toFixed(6)}
          </div>
        ` : ''}
      </div>
      <div style="font-size:11px;color:#6B7280;font-family:monospace;">
        Order #${order.id}
      </div>
    </div>
  `;
};

const createDriverPopup = (
  driverName: string,
  orders: DeliveryWithLocation[],
  color: string,
  phone?: string,
): string => {
  const safeName = escapeHtml(driverName);
  const safePhone = phone ? escapeHtml(phone) : "";
  const driverLat = orders[0]?.delivery.current_lat;
  const driverLng = orders[0]?.delivery.current_lng;
  const image = orders[0]?.delivery.delivery_person_image;

  const orderList = orders
    .map((o) => {
      const custLat = o.delivery.customer_lat!;
      const custLng = o.delivery.customer_lon!;
      let distStr = "";

      if (driverLat != null && driverLng != null) {
        const km = haversine(driverLat, driverLng, custLat, custLng).toFixed(1);
        distStr = ` (${km} km)`;
      }

      return `<li style="margin-bottom:4px;">
        <b>#${o.id}-${o.master_order_id || "N/A"}</b>
        → ${escapeHtml(o.recipient_name || o.customer_name || "Recipient")}${distStr}
      </li>`;
    })
    .join("");

  const imageHtml = image
    ? `<img
          src="${escapeHtml(image)}"
          alt="${safeName}"
          style="
            width:44px;
            height:44px;
            border-radius:50%;
            object-fit:cover;
            border:2px solid ${color};
          "
       />`
    : `<div
          style="
            background:${color}20;
            border-radius:50%;
            width:44px;
            height:44px;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:24px;
            border:2px solid ${color};
          "
       >
          🚚
       </div>`;

  return `
    <div style="font-family:Inter,system-ui,sans-serif;min-width:230px;max-width:300px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
        ${imageHtml}
        <div>
          <div style="font-size:16px;font-weight:700;color:#111827;">
            ${safeName}
          </div>
          <div style="font-size:13px;color:${color};display:flex;align-items:center;gap:4px;">
            🟢 Live · ${orders.length} order${orders.length > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <ul style="background:#F9FAFB;border-radius:12px;padding:12px;list-style:none;margin-bottom:12px;">
        ${orderList}
      </ul>

      ${
        safePhone
          ? `<a
                href="tel:${safePhone}"
                style="
                  display:block;
                  background:${color};
                  color:white;
                  text-align:center;
                  padding:10px;
                  border-radius:10px;
                  text-decoration:none;
                  font-weight:600;
                "
              >
                📞 Call ${safeName}
              </a>`
          : ""
      }
    </div>
  `;
};

const createPickupPopup = (order: DispatchOrder): string => {
  return `
    <div style="font-family:Inter,system-ui,sans-serif;min-width:240px;max-width:300px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
        <div style="background:#6750A4;border-radius:12px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;">🏪</div>
        <div>
          <div style="font-size:16px;font-weight:700;color:#111827;">Pickup Location</div>
          <div style="font-size:13px;color:#6B7280;">${escapeHtml(order.pickupName)}</div>
        </div>
      </div>
      ${order.companyAddress ? `
        <div style="background:#F9FAFB;border-radius:12px;padding:12px;margin-bottom:8px;">
          <div style="font-size:12px;color:#374151;">📍 ${escapeHtml(order.companyAddress)}</div>
        </div>
      ` : ''}
      ${order.pickupLat != null && order.pickupLon != null ? `
        <div style="font-size:11px;color:#6B7280;font-family:monospace;">
          ${order.pickupLat.toFixed(6)}, ${order.pickupLon.toFixed(6)}
        </div>
      ` : ''}
    </div>
  `;
};

const createDriverPopupForSelection = (
  driver: AvailableDriver,
  order: DispatchOrder,
  color: string,
  isNearest: boolean = false
): string => {
  const safeName = escapeHtml(driver.name);
  const hasLocation = driver.current_lat != null && driver.current_lng != null;
  const locationLabel = driver.isLive ? "🟢 Live" : 
                        driver.location_source === "last_known" ? "🕒 Last known" : 
                        "📡 Available";
  
  return `
    <div style="font-family:Inter,system-ui,sans-serif;min-width:240px;max-width:320px;">
      ${isNearest ? `
        <div style="background:#F0FDF4;border:1px solid #22C55E;border-radius:8px;padding:6px 10px;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
          <span style="font-size:14px;">⭐</span>
          <span style="font-size:12px;font-weight:700;color:#166534;">BEST MATCH</span>
        </div>
      ` : ''}
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        ${driver.profile_image ? `
          <img src="${escapeHtml(driver.profile_image)}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid ${color};" />
        ` : `
          <div style="background:${color}20;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:24px;border:2px solid ${color};">🚚</div>
        `}
        <div>
          <div style="font-size:15px;font-weight:700;color:#111827;">${safeName}</div>
          <div style="font-size:11px;color:${color};">${locationLabel} · ${getVehicleName(driver.vehicle_type)}</div>
        </div>
      </div>
      
      ${hasLocation ? `
        <div style="background:#F9FAFB;border-radius:12px;padding:12px;margin-bottom:8px;">
          ${driver.distance_to_customer != null ? `
            <div style="display:flex;justify-content:space-between;font-size:12px;color:#374151;margin-bottom:4px;">
              <span>📍 To Recipient</span>
              <span style="font-weight:700;">${formatDistance(driver.distance_to_customer)}</span>
            </div>
          ` : ''}
          ${driver.road_distance_to_customer != null ? `
            <div style="display:flex;justify-content:space-between;font-size:12px;color:#374151;margin-bottom:4px;">
              <span>🛣 Road Distance</span>
              <span style="font-weight:700;">${formatDistance(driver.road_distance_to_customer)}</span>
            </div>
          ` : ''}
          ${driver.road_eta_to_customer != null ? `
            <div style="display:flex;justify-content:space-between;font-size:12px;color:#374151;">
              <span>⏱ ETA</span>
              <span style="font-weight:700;">${formatDuration(driver.road_eta_to_customer)}</span>
            </div>
          ` : ''}
        </div>
      ` : `
        <div style="background:#F9FAFB;border-radius:12px;padding:12px;margin-bottom:8px;text-align:center;">
          <span style="font-size:12px;color:#6B7280;">⚪ Location unavailable</span>
        </div>
      `}
      
      ${driver.phone ? `
        <a href="tel:${escapeHtml(driver.phone)}" style="
          display:block;background:${color};color:white;text-align:center;
          padding:10px;border-radius:10px;text-decoration:none;font-weight:600;font-size:13px;
        ">
          📞 Call ${safeName}
        </a>
      ` : ''}
    </div>
  `;
};

// ── Marker icon helpers ────────────────────────────────────────────
const makeCompanyIcon = (): Leaflet.DivIcon => {
  const L = (window as any).L;
  return L.divIcon({
    className: "company-marker",
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;">
        <div style="
          background:#4CAF50;border-radius:50%;width:42px;height:42px;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 12px rgba(76,175,80,0.4);border:3px solid white;font-size:20px;
        ">🏢</div>
      </div>
      <div style="
        position:absolute;
        bottom:-20px;
        left:50%;
        transform:translateX(-50%);
        white-space:nowrap;
        font-size:10px;
        font-weight:600;
        color:#374151;
        background:white;
        padding:2px 6px;
        border-radius:4px;
        box-shadow:0 1px 3px rgba(0,0,0,0.1);
      ">Company</div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
};

const makeCustomerIcon = (orders: DeliveryWithLocation[]): Leaflet.DivIcon => {
  const L = (window as any).L;
  const customerName = orders[0]?.recipient_name || orders[0]?.customer_name || "Recipient";
  
  return L.divIcon({
    className: "customer-marker-grouped",
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;">
        <div style="
          background:white;border-radius:50%;width:42px;height:42px;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 12px rgba(0,0,0,0.25);border:3px solid #F59E0B;font-size:20px;
        ">📍</div>
        ${orders.length > 1 ? `<span style="
          position:absolute;top:-6px;right:-6px;background:#F59E0B;color:white;
          border-radius:50%;width:20px;height:20px;display:flex;align-items:center;
          justify-content:center;font-size:11px;font-weight:bold;
        ">${orders.length}</span>` : ""}
      </div>
      <div style="
        position:absolute;
        bottom:-20px;
        left:50%;
        transform:translateX(-50%);
        white-space:nowrap;
        font-size:10px;
        font-weight:600;
        color:#374151;
        background:white;
        padding:2px 6px;
        border-radius:4px;
        box-shadow:0 1px 3px rgba(0,0,0,0.1);
        max-width:120px;
        overflow:hidden;
        text-overflow:ellipsis;
      ">${escapeHtml(customerName)}</div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
};

const makeDeliveryLocationIcon = (customerName: string): Leaflet.DivIcon => {
  const L = (window as any).L;
  return L.divIcon({
    className: "delivery-location-marker",
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;">
        <div style="
          background:#2196F3;border-radius:50%;width:38px;height:38px;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 12px rgba(33,150,243,0.4);border:3px solid white;font-size:18px;
        ">📦</div>
      </div>
      <div style="
        position:absolute;
        bottom:-20px;
        left:50%;
        transform:translateX(-50%);
        white-space:nowrap;
        font-size:10px;
        font-weight:600;
        color:#374151;
        background:white;
        padding:2px 6px;
        border-radius:4px;
        box-shadow:0 1px 3px rgba(0,0,0,0.1);
        max-width:120px;
        overflow:hidden;
        text-overflow:ellipsis;
      ">${escapeHtml(customerName)}</div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
};

const makePickupIcon = (): Leaflet.DivIcon => {
  const L = (window as any).L;
  return L.divIcon({
    className: "pickup-marker",
    html: `
      <div style="
        background:#6750A4;border-radius:50%;width:36px;height:36px;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 4px 12px rgba(103,80,164,0.4);border:3px solid white;font-size:18px;
      ">🏪</div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const makeDriverIcon = (
  driverName: string,
  count: number,
  color: string,
  isInHouse?: boolean,
  isNearest?: boolean
): Leaflet.DivIcon => {
  const L = (window as any).L;
  const typeLabel = isInHouse ? "In-House" : "3PL";
  const highlightBorder = isNearest ? "border:3px solid #22C55E;" : `border:2px solid ${color};`;
  const starBadge = isNearest ? `<span style="
    position:absolute;top:-10px;left:-10px;font-size:20px;
  ">⭐</span>` : "";
  
  return L.divIcon({
    className: "driver-marker-grouped",
    html: `
      <div style="position:relative;display:flex;align-items:center;gap:6px;padding:4px 10px 4px 4px;box-shadow:0 4px 16px rgba(0,0,0,0.2);white-space:nowrap;font-family:Inter,system-ui,sans-serif;cursor:pointer;${isNearest ? 'box-shadow:0 6px 24px rgba(34,197,94,0.4);' : ''}">
        ${starBadge}
        <div style="
          width:44px;height:44px;border-radius:50%;background:${color}20;
          ${highlightBorder}display:flex;align-items:center;justify-content:center;font-size:26px;
        ">🚚</div>
        <div style="display:flex;flex-direction:column;gap:2px;">
          <span style="font-size:14px;font-weight:700;color:#6750A4;max-width:120px;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(driverName)}</span>
          <span style="font-size:11px;font-weight:600;color:${color};display:flex;align-items:center;gap:4px;">🟢 Live · ${typeLabel} · ${count} order${count > 1 ? "s" : ""}</span>
        </div>
        ${count > 1 ? `<span style="
          position:absolute;top:-8px;right:-8px;background:${color};color:white;
          border-radius:50%;width:22px;height:22px;display:flex;align-items:center;
          justify-content:center;font-size:12px;font-weight:bold;
        ">${count}</span>` : ""}
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

// ── Main Component ────────────────────────────────────────────────
export default function DeliveryTrackingMap({
  onClose,
  mode = "tracking",
  selectedOrderId,
  onDriverSelect,
  onAssignmentComplete,
}: DeliveryTrackingMapProps) {
  const { user } = useAuth();
  const { company } = useCurrentCompany();
  const readOnly = useReadOnly();
  const { showToast } = useToast();

  const isSuperAdmin = !user?.memberships?.length;
  const shouldFetchAll = isSuperAdmin || readOnly;
  const companySlug = company?.slug ?? null;

  const effectiveSlug = useMemo(() => {
    if (shouldFetchAll) return null;
    if (user?.memberships?.length) {
      return (companySlug || user.memberships[0]?.company_slug) ?? null;
    }
    return null;
  }, [shouldFetchAll, companySlug, user]);

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = useCallback(() => setIsSidebarOpen(p => !p), []);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(selectedOrderId || null);
  const [followDriver, setFollowDriver] = useState<boolean>(false);
  const [driverFilter, setDriverFilter] = useState<"all" | "in_house" | "third_party">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("recommended");
  const [pendingDriverId, setPendingDriverId] = useState<number | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showConfirmPanel, setShowConfirmPanel] = useState(false);
  const [showCompanyMarker, setShowCompanyMarker] = useState(true);
  const [showCustomerMarker, setShowCustomerMarker] = useState(true);
  const [showDeliveryMarker, setShowDeliveryMarker] = useState(true);
  const [isOrderSummaryExpanded, setIsOrderSummaryExpanded] = useState(false);

  // Data state
  const [firebaseData, setFirebaseData] = useState<Record<number, FirebaseDriverData>>({});
  const [driverLocations, setDriverLocations] = useState<Record<number, {
    latitude: number; longitude: number; heading?: number; is_online?: boolean; updated_at?: number;
  }>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [routeDataByDriver, setRouteDataByDriver] = useState<Record<number, RouteSummary | null>>({});

  // Refs
  const mapRef = useRef<Leaflet.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const driverMarkers = useRef<Map<string, Leaflet.Marker>>(new Map());
  const customerMarkers = useRef<Map<string, Leaflet.Marker>>(new Map());
  const pickupMarkerRef = useRef<Leaflet.Marker | null>(null);
  const companyMarkerRef = useRef<Leaflet.Marker | null>(null);
  const deliveryMarkerRef = useRef<Leaflet.Marker | null>(null);
  const routeLines = useRef<Map<string, Leaflet.Polyline>>(new Map());
  const clusterGroup = useRef<Leaflet.LayerGroup | null>(null);
  const subscribedIds = useRef<Set<string>>(new Set());
  const initialFitDone = useRef(false);
  
  // OSRM routing refs
  const routeCache = useRef<Map<RouteCacheKey, RouteCacheEntry>>(new Map());
  const pendingRequests = useRef<Map<RouteCacheKey, Promise<RouteSummary | null>>>(new Map());
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // React Query
  const queryKey = useMemo(
    () => ["delivery-tracking-orders", shouldFetchAll ? "all" : effectiveSlug],
    [shouldFetchAll, effectiveSlug]
  );

  const {
    data: allOrders = [],
    isLoading,
    isFetching,
    error: queryError,
    refetch,
    dataUpdatedAt,
  } = useQuery<VendorOrder[]>({
    queryKey,
    queryFn: async () => {
      if (!shouldFetchAll && !effectiveSlug) return [];
      let page = 1;
      let hasNext = true;
      const fetched: VendorOrder[] = [];
      while (hasNext) {
        const params = { page, page_size: 500, ordering: "-created_at" };
        const response = shouldFetchAll
          ? await getAdminVendorOrders(params)
          : await getCompanyVendorOrders(effectiveSlug!, params);
        fetched.push(...(response.data.results ?? []));
        hasNext = response.data.next !== null;
        page++;
      }
      return fetched;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: shouldFetchAll || !!effectiveSlug,
  });

  useEffect(() => {
    if (dataUpdatedAt) setLastUpdated(new Date(dataUpdatedAt));
  }, [dataUpdatedAt]);

  const loading = isLoading;
  const error = queryError
    ? ((queryError as any)?.response?.data?.detail ?? queryError.message ?? "Failed to load")
    : null;

  // Merge API + Firebase data
  const combinedOrders: DeliveryWithLocation[] = useMemo(() => {
    return allOrders.map((order) => {
      const fb = firebaseData[order.id];
      const destination = getOrderDestination(order);
      const vendorOrder = order.vendor_orders?.[0];
      const deliveryData = vendorOrder?.delivery || order.delivery;
      
      return {
        ...order,
        delivery: {
          ...deliveryData,
          current_lat: fb?.lat ?? deliveryData?.current_lat ?? undefined,
          current_lng: fb?.lon ?? deliveryData?.current_lng ?? undefined,
          speed: fb?.speed,
          heading: fb?.heading,
          delivery_person_name: fb?.driver_name ?? deliveryData?.delivery_person_name ?? "Unassigned",
          delivery_person_phone: fb?.driver_phone ?? deliveryData?.delivery_person_phone ?? "",
          status: fb?.status ?? deliveryData?.status ?? order.delivery_status ?? vendorOrder?.delivery_status ?? "pending",
          logistics_company_name: deliveryData?.logistics_company_name,
          is_in_house: !deliveryData?.logistics_company_name || 
                       deliveryData?.logistics_company_name === "" ||
                       deliveryData?.logistics_company_name === vendorOrder?.company?.name,
          customer_address: destination.address,
          customer_lat: destination.lat ?? deliveryData?.customer_lat ?? order.shipping_lat,
          customer_lon: destination.lon ?? deliveryData?.customer_lon ?? order.shipping_lon,
          delivery_person_image: deliveryData?.delivery_person_image,
        },
      } as DeliveryWithLocation;
    });
  }, [allOrders, firebaseData]);

  // Normalize selected order
  const normalizedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    const order = combinedOrders.find(o => o.id === selectedOrderId) || allOrders.find(o => o.id === selectedOrderId);
    if (order) {
      return normalizeOrder(order);
    }
    return null;
  }, [combinedOrders, allOrders, selectedOrderId]);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return combinedOrders.find(o => o.id === selectedOrderId);
  }, [combinedOrders, selectedOrderId]);

  // Live deliveries filter
  const liveDeliveries = useMemo(() => {
    let filtered = combinedOrders.filter(order => {
      const dest = getOrderDestination(order);
      return order.delivery?.status === "out_for_delivery" &&
             dest.lat != null && dest.lon != null &&
             order.delivery.delivery_person_name !== "Unassigned";
    });

    if (mode === "driver_selection" && selectedOrderId) {
      filtered = filtered.filter(o => o.id === selectedOrderId);
    }

    if (driverFilter === "in_house") {
      filtered = filtered.filter(order => order.delivery.is_in_house === true);
    } else if (driverFilter === "third_party") {
      filtered = filtered.filter(order => order.delivery.is_in_house === false);
    }

    return filtered;
  }, [combinedOrders, driverFilter, mode, selectedOrderId]);

  // Fetch available drivers for selection mode
  useEffect(() => {
    if (mode === "driver_selection" && normalizedOrder && normalizedOrder.canAssign) {
      const fetchDrivers = async () => {
        setLoadingDrivers(true);
        try {
          const companySlug = selectedOrder?.vendor_orders?.[0]?.company?.slug || 
                             selectedOrder?.company?.slug;
          if (!companySlug) {
            showToast("error", "Company information not found");
            setLoadingDrivers(false);
            return;
          }
          
          const res = await getAvailableDeliveryDrivers(companySlug, {
            vendor_order_id: selectedOrderId,
          });
          setAvailableDrivers(res.data || []);
        } catch (err) {
          console.error("Failed to fetch available drivers", err);
          showToast("error", "Failed to load available drivers");
        } finally {
          setLoadingDrivers(false);
        }
      };
      fetchDrivers();
    }
  }, [mode, normalizedOrder?.id, selectedOrderId, selectedOrder?.company?.slug, selectedOrder?.vendor_orders, showToast]);

  // Firebase subscriptions for drivers
  useEffect(() => {
    if (mode !== "driver_selection" || !availableDrivers.length) return;
    const cleanups: Array<() => void> = [];

    availableDrivers.forEach((driver) => {
      const driverRef = ref(db, `drivers/${driver.id}`);
      const callback = (snapshot: any) => {
        const data = snapshot.val();
        if (data && data.latitude != null && data.longitude != null) {
          setDriverLocations(prev => ({
            ...prev,
            [driver.id]: data,
          }));
        }
      };
      onValue(driverRef, callback);
      cleanups.push(() => off(driverRef, "value", callback));
    });

    return () => {
      cleanups.forEach(c => c());
    };
  }, [mode, availableDrivers]);

  // Get driver live location
  const getDriverLiveLocation = useCallback((driverId: number): Coordinates | null => {
    const directLoc = driverLocations[driverId];
    if (directLoc && isValidCoordinate(directLoc.latitude, directLoc.longitude)) {
      return { lat: Number(directLoc.latitude), lon: Number(directLoc.longitude) };
    }
    return null;
  }, [driverLocations]);

  // OSRM route fetcher
  const fetchOSRMRoute = useCallback(async (
    from: Coordinates,
    to: Coordinates
  ): Promise<RouteSummary | null> => {
    const cacheKey: RouteCacheKey = `${from.lat.toFixed(5)},${from.lon.toFixed(5)}_${to.lat.toFixed(5)},${to.lon.toFixed(5)}`;
    const CACHE_TTL = 5 * 60 * 1000;

    const cached = routeCache.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return {
        coordinates: cached.coordinates,
        distanceKm: cached.distanceKm,
        durationMinutes: cached.durationMinutes,
      };
    }

    const existing = pendingRequests.current.get(cacheKey);
    if (existing) return existing;

    const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson&steps=true`;

    const requestPromise = fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.code !== "Ok" || !data.routes?.length) return null;
        const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );
        const distanceKm = data.routes[0].distance / 1000;
        const durationMinutes = data.routes[0].duration / 60;
        routeCache.current.set(cacheKey, {
          coordinates: coords,
          timestamp: Date.now(),
          distanceKm,
          durationMinutes,
        });
        return { coordinates: coords, distanceKm, durationMinutes };
      })
      .catch(() => null)
      .finally(() => {
        pendingRequests.current.delete(cacheKey);
      });

    pendingRequests.current.set(cacheKey, requestPromise);
    return requestPromise;
  }, []);

  // Enhanced drivers with route calculations
  const enhancedDrivers = useMemo(() => {
    if (!normalizedOrder) return [];

    const pickup: Coordinates | null = normalizedOrder.pickupLat != null && normalizedOrder.pickupLon != null
      ? { lat: normalizedOrder.pickupLat, lon: normalizedOrder.pickupLon }
      : null;
    const customer: Coordinates | null = normalizedOrder.customerLat != null && normalizedOrder.customerLon != null
      ? { lat: normalizedOrder.customerLat, lon: normalizedOrder.customerLon }
      : null;

    const mapped = availableDrivers.map((d: any) => {
      let driverLoc: Coordinates | null = null;
      let locationSource: AvailableDriver["location_source"] = "unknown";
      let isLive = false;

      const liveLoc = getDriverLiveLocation(d.id);
      if (liveLoc) {
        driverLoc = liveLoc;
        locationSource = "live";
        isLive = true;
      } else if (isValidCoordinate(d.current_lat, d.current_lng)) {
        driverLoc = { lat: Number(d.current_lat), lon: Number(d.current_lng) };
        locationSource = "current";
      } else if (isValidCoordinate(d.last_lat, d.last_lon)) {
        driverLoc = { lat: Number(d.last_lat), lon: Number(d.last_lon) };
        locationSource = "last_known";
      }

      let distance_to_pickup: number | null = null;
      let distance_to_customer: number | null = null;

      if (driverLoc) {
        if (pickup) {
          distance_to_pickup = haversine(driverLoc.lat, driverLoc.lon, pickup.lat, pickup.lon);
        }
        if (customer) {
          distance_to_customer = haversine(driverLoc.lat, driverLoc.lon, customer.lat, customer.lon);
        }
      }

      const routeData = routeDataByDriver[d.id] || null;

      return {
        ...d,
        current_lat: driverLoc?.lat ?? null,
        current_lng: driverLoc?.lon ?? null,
        location_source: locationSource,
        isLive,
        distance_to_pickup,
        distance_to_customer,
        total_route_distance: distance_to_pickup != null && distance_to_customer != null
          ? distance_to_pickup + distance_to_customer
          : null,
        road_distance_to_customer: routeData?.distanceKm ?? null,
        road_eta_to_customer: routeData?.durationMinutes ?? null,
      };
    });

    const driversWithDistance = mapped.filter(d => d.distance_to_customer != null);
    if (driversWithDistance.length > 0) {
      const nearest = driversWithDistance.reduce((min, d) => 
        (d.distance_to_customer! < min.distance_to_customer!) ? d : min
      );
      nearest.is_nearest = true;
    }

    mapped.sort((a: any, b: any) => {
      switch (sortOption) {
        case "nearest_pickup":
          return (a.distance_to_pickup ?? 999999) - (b.distance_to_pickup ?? 999999);
        case "highest_rated":
          return (Number(b.average_rating) || 0) - (Number(a.average_rating) || 0);
        case "fastest_eta":
          return (a.road_eta_to_customer ?? a.total_route_distance ?? 999999) - 
                 (b.road_eta_to_customer ?? b.total_route_distance ?? 999999);
        case "recommended":
        default:
          if ((a.is_nearest ?? false) !== (b.is_nearest ?? false)) return (a.is_nearest ?? false) ? -1 : 1;
          if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
          if ((a.distance_to_customer == null) !== (b.distance_to_customer == null)) {
            return a.distance_to_customer != null ? -1 : 1;
          }
          if (a.distance_to_customer !== b.distance_to_customer) {
            return (a.distance_to_customer ?? 999999) - (b.distance_to_customer ?? 999999);
          }
          return (Number(b.average_rating) || 0) - (Number(a.average_rating) || 0);
      }
    });

    return mapped;
  }, [availableDrivers, normalizedOrder, getDriverLiveLocation, sortOption, routeDataByDriver]);

  // Calculate routes for all drivers in selection mode
  useEffect(() => {
    if (mode !== "driver_selection" || !normalizedOrder || !enhancedDrivers.length) return;

    const customer: Coordinates | null = normalizedOrder.customerLat != null && normalizedOrder.customerLon != null
      ? { lat: normalizedOrder.customerLat, lon: normalizedOrder.customerLon }
      : null;

    if (!customer) return;

    enhancedDrivers.forEach((driver: AvailableDriver) => {
      if (driver.isLive && driver.current_lat != null && driver.current_lng != null && 
          isValidCoordinate(driver.current_lat, driver.current_lng)) {
        const from: Coordinates = { lat: driver.current_lat, lon: driver.current_lng };
        const to: Coordinates = customer;
        
        const debounceKey = `driver_route_${driver.id}`;
        if (debounceTimers.current.has(debounceKey)) {
          clearTimeout(debounceTimers.current.get(debounceKey));
        }

        debounceTimers.current.set(
          debounceKey,
          setTimeout(async () => {
            const routeSummary = await fetchOSRMRoute(from, to);
            setRouteDataByDriver(prev => ({
              ...prev,
              [driver.id]: routeSummary,
            }));
            debounceTimers.current.delete(debounceKey);
          }, 2000)
        );
      }
    });
  }, [mode, normalizedOrder, enhancedDrivers, fetchOSRMRoute]);

  // Filter available drivers
  const filteredAvailableDrivers = useMemo(() => {
    let filtered = [...enhancedDrivers];
    
    if (driverFilter === "in_house") {
      filtered = filtered.filter(d => d.is_in_house === true);
    } else if (driverFilter === "third_party") {
      filtered = filtered.filter(d => d.is_in_house === false);
    }
    
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        d.name?.toLowerCase().includes(search) ||
        d.phone?.toLowerCase().includes(search) ||
        d.username?.toLowerCase().includes(search) ||
        d.company_name?.toLowerCase().includes(search) ||
        d.vehicle_type?.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [enhancedDrivers, driverFilter, searchTerm]);

  // Groupings for tracking mode
  const customerGroups = useMemo(() => {
    const map = new Map<string, DeliveryWithLocation[]>();
    liveDeliveries.forEach(order => {
      const dest = getOrderDestination(order);
      if (dest.lat != null && dest.lon != null) {
        const key = `${dest.lat},${dest.lon}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(order);
      }
    });
    return map;
  }, [liveDeliveries]);

  const driverGroups = useMemo(() => {
    const map = new Map<string, DeliveryWithLocation[]>();
    liveDeliveries.forEach(order => {
      const driver = order.delivery.delivery_person_name;
      if (!map.has(driver)) map.set(driver, []);
      map.get(driver)!.push(order);
    });
    return map;
  }, [liveDeliveries]);

  const driverColorMap = useMemo(() => {
    const drivers = Array.from(driverGroups.keys()).sort();
    const colorMap = new Map<string, string>();
    drivers.forEach((driver, idx) => colorMap.set(driver, getDriverColor(idx)));
    return colorMap;
  }, [driverGroups]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const deliveriesToday = liveDeliveries.filter(
      o => new Date(o.created_at).toDateString() === today
    ).length;
    return {
      liveVehicles: driverGroups.size,
      deliveriesToday,
      onTimeDelivery: 100,
      inHouseCount: liveDeliveries.filter(o => o.delivery.is_in_house).length,
      thirdPartyCount: liveDeliveries.filter(o => !o.delivery.is_in_house).length,
    };
  }, [liveDeliveries, driverGroups]);

  // Load Leaflet
  useEffect(() => {
    if ((window as any).L && (window as any).L.markerClusterGroup) {
      setLeafletLoaded(true);
      return;
    }

    const addCSS = (href: string, id: string) => {
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.id = id;
        document.head.appendChild(link);
      }
    };

    addCSS("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", "leaflet-css-dt");
    addCSS("https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css", "mc-css-dt");
    addCSS("https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css", "mc-default-css-dt");

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const mcScript = document.createElement("script");
      mcScript.src = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js";
      mcScript.onload = () => setLeafletLoaded(true);
      document.head.appendChild(mcScript);
    };
    document.head.appendChild(script);
  }, []);

  // Firebase subscriptions for live deliveries
  useEffect(() => {
    if (!liveDeliveries.length) return;

    const currentTrackingIds = new Set(
      liveDeliveries.map(o => o.delivery?.tracking_id).filter(Boolean) as string[]
    );

    subscribedIds.current.forEach(id => {
      if (!currentTrackingIds.has(id)) {
        off(ref(db, `deliveries/${id}`));
        subscribedIds.current.delete(id);
      }
    });

    currentTrackingIds.forEach(id => {
      if (!subscribedIds.current.has(id)) {
        const trackingRef = ref(db, `deliveries/${id}`);
        onValue(trackingRef, snapshot => {
          const val = snapshot.val();
          if (!val) return;
          liveDeliveries.forEach(o => {
            if (o.delivery?.tracking_id === id) {
              setFirebaseData(prev => ({
                ...prev,
                [o.id]: {
                  lat: val.latitude ?? val.lat,
                  lon: val.longitude ?? val.lon,
                  speed: val.speed,
                  heading: val.heading,
                  status: val.status,
                  driver_name: val.driver_name,
                  driver_phone: val.driver_phone,
                  customer_address: val.customer_address,
                },
              }));
            }
          });
        });
        subscribedIds.current.add(id);
      }
    });
  }, [liveDeliveries]);

  // Firebase cleanup
  useEffect(() => {
    return () => {
      subscribedIds.current.forEach(id => off(ref(db, `deliveries/${id}`)));
      subscribedIds.current.clear();
    };
  }, []);

  // Map initialization
  useEffect(() => {
    if (!leafletLoaded) return;
    const L = (window as any).L;
    if (!L || !L.markerClusterGroup || mapRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, {
      zoomControl: false,
      keyboard: true,
      keyboardPanDelta: 80,
    }).setView([9.03, 38.74], 12);
    mapRef.current = map;

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { 
      attribution: "© OpenStreetMap contributors", 
    }).addTo(map); 
 
    const cluster = L.markerClusterGroup({ 
      maxClusterRadius: 60, 
      spiderfyOnMaxZoom: true, 
      showCoverageOnHover: false, 
    }); 
    map.addLayer(cluster); 
    clusterGroup.current = cluster; 
 
    return () => { 
      map.remove(); 
      mapRef.current = null; 
      clusterGroup.current = null; 
    }; 
  }, [leafletLoaded]); 
 
  // Reset fit flag when new deliveries appear after being empty 
  useEffect(() => { 
    if (liveDeliveries.length > 0) { 
      initialFitDone.current = false; 
    } 
  }, [liveDeliveries.length]); 
 
  // Update markers and routes
  useEffect(() => { 
    const L = (window as any).L; 
    if (!mapRef.current || !clusterGroup.current || !L) return; 
 
    const cluster = clusterGroup.current; 
    const currentCustomerKeys = new Set<string>(); 
    const currentDriverKeys = new Set<string>(); 
 
    // Customer markers 
    customerGroups.forEach((orders, key) => { 
      const [latStr, lngStr] = key.split(","); 
      const lat = parseFloat(latStr); 
      const lng = parseFloat(lngStr); 
      
      if (!isValidCoordinate(lat, lng)) {
        console.warn(`Invalid customer coordinates: ${lat}, ${lng}`);
        return;
      }
      
      currentCustomerKeys.add(key); 
 
      let marker = customerMarkers.current.get(key); 
      if (!marker) { 
        const icon = makeCustomerIcon(orders); 
        const newMarker = L.marker([lat, lng], { icon }).bindPopup( 
          createCustomerPopup(orders), 
          { maxWidth: 320 } 
        ); 
        newMarker.on("click", () => setActiveOrderId(orders[0].id)); 
        cluster.addLayer(newMarker); 
        customerMarkers.current.set(key, newMarker); 
      } else { 
        marker.setLatLng([lat, lng]); 
        marker.setIcon(makeCustomerIcon(orders)); 
        marker.setPopupContent(createCustomerPopup(orders)); 
      } 
    }); 
 
    // Remove stale customer markers 
    customerMarkers.current.forEach((marker, key) => { 
      if (!currentCustomerKeys.has(key)) { 
        cluster.removeLayer(marker); 
        customerMarkers.current.delete(key); 
      } 
    }); 
 
    // Driver selection mode 
    if (mode === "driver_selection" && normalizedOrder) { 
      const pickup = normalizedOrder.pickupLat != null && normalizedOrder.pickupLon != null 
        ? { lat: normalizedOrder.pickupLat, lon: normalizedOrder.pickupLon } 
        : null; 
      const customer = normalizedOrder.customerLat != null && normalizedOrder.customerLon != null 
        ? { lat: normalizedOrder.customerLat, lon: normalizedOrder.customerLon } 
        : null; 
 
      // Clear existing driver markers and route lines 
      driverMarkers.current.forEach(marker => cluster.removeLayer(marker)); 
      driverMarkers.current.clear(); 
      routeLines.current.forEach(line => line.remove()); 
      routeLines.current.clear(); 
 
      // Add company marker (pickup location) 
      if (pickup && showCompanyMarker) { 
        if (!companyMarkerRef.current) { 
          companyMarkerRef.current = L.marker([pickup.lat, pickup.lon], { icon: makeCompanyIcon() }) 
            .bindPopup(createCompanyPopup(normalizedOrder)) 
            .addTo(mapRef.current); 
        } else { 
          companyMarkerRef.current.setLatLng([pickup.lat, pickup.lon]); 
          companyMarkerRef.current.setPopupContent(createCompanyPopup(normalizedOrder)); 
        } 
      } else { 
        if (companyMarkerRef.current) { 
          companyMarkerRef.current.remove(); 
          companyMarkerRef.current = null; 
        } 
      } 
 
      // Add delivery/customer marker with full address
      if (customer && showDeliveryMarker) { 
        if (!deliveryMarkerRef.current) { 
          deliveryMarkerRef.current = L.marker([customer.lat, customer.lon], { 
            icon: makeDeliveryLocationIcon(normalizedOrder.customerName) 
          }) 
            .bindPopup(createCustomerPopupForOrder(normalizedOrder)) 
            .addTo(mapRef.current); 
        } else { 
          deliveryMarkerRef.current.setLatLng([customer.lat, customer.lon]); 
          deliveryMarkerRef.current.setIcon(makeDeliveryLocationIcon(normalizedOrder.customerName)); 
          deliveryMarkerRef.current.setPopupContent(createCustomerPopupForOrder(normalizedOrder)); 
        } 
      } else { 
        if (deliveryMarkerRef.current) { 
          deliveryMarkerRef.current.remove(); 
          deliveryMarkerRef.current = null; 
        } 
      } 
 
      // Add driver markers and route lines 
      filteredAvailableDrivers.forEach((driver, index) => { 
        const color = getDriverColor(index); 
        const isPending = pendingDriverId === driver.id; 
        const isSelected = selectedDriverId === driver.id; 
        const isNearest = driver.is_nearest === true; 
         
        if (driver.current_lat != null && driver.current_lng != null &&  
            isValidCoordinate(driver.current_lat, driver.current_lng)) { 
          const icon = makeDriverIcon(driver.name, 1, color, driver.is_in_house, isNearest); 
          const marker = L.marker([driver.current_lat, driver.current_lng], { icon }) 
            .bindPopup(createDriverPopupForSelection(driver, normalizedOrder, color, isNearest)); 
           
          marker.on("click", () => handleDriverMarkerClick(driver.id)); 
          cluster.addLayer(marker); 
          driverMarkers.current.set(`selection_${driver.id}`, marker); 
 
          // Add route line for this driver to customer 
          if (customer && driver.isLive) { 
            const routeData = routeDataByDriver[driver.id]; 
            const lineKey = `selection_route_${driver.id}`; 
            let line = routeLines.current.get(lineKey); 
 
            if (routeData && routeData.coordinates.length > 0) { 
              const weight = isNearest ? 6 : 3; 
              const opacity = isNearest ? 1 : 0.65; 
              if (!line) { 
                const newLine = L.polyline(routeData.coordinates, { 
                  color, 
                  weight, 
                  opacity, 
                }); 
                newLine.addTo(mapRef.current!); 
                routeLines.current.set(lineKey, newLine); 
              } else { 
                line.setLatLngs(routeData.coordinates); 
                line.setStyle({ color, weight, opacity, dashArray: undefined }); 
              } 
            } else if (customer) { 
              const weight = isNearest ? 4 : 2; 
              const opacity = isNearest ? 0.9 : 0.5; 
              if (!line) { 
                const newLine = L.polyline( 
                  [ 
                    [driver.current_lat, driver.current_lng], 
                    [customer.lat, customer.lon], 
                  ], 
                  { color, weight, opacity, dashArray: "8 6" } 
                ); 
                newLine.addTo(mapRef.current!); 
                routeLines.current.set(lineKey, newLine); 
              } else { 
                line.setLatLngs([ 
                  [driver.current_lat, driver.current_lng], 
                  [customer.lat, customer.lon], 
                ]); 
                line.setStyle({ color, weight, opacity, dashArray: "8 6" }); 
              } 
            } 
          } 
        } 
      }); 
 
      // Fit bounds if needed 
      if (!initialFitDone.current && (pickup || customer)) { 
        setTimeout(() => { 
          const bounds = L.latLngBounds([]); 
          if (pickup && showCompanyMarker) bounds.extend([pickup.lat, pickup.lon]); 
          if (customer && showDeliveryMarker) bounds.extend([customer.lat, customer.lon]); 
          driverMarkers.current.forEach(m => bounds.extend(m.getLatLng())); 
          if (bounds.isValid() && mapRef.current) { 
            mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: false }); 
          } 
          initialFitDone.current = true; 
        }, 500); 
      } 
    } else { 
      // Tracking mode 
      driverGroups.forEach((orders, driverName) => { 
        currentDriverKeys.add(driverName); 
        const color = driverColorMap.get(driverName)!; 
        const isInHouse = orders[0]?.delivery.is_in_house; 
        const firstWithCoords = orders.find( 
          o => o.delivery.current_lat != null && o.delivery.current_lng != null 
        ); 
        const driverLat = firstWithCoords?.delivery.current_lat; 
        const driverLng = firstWithCoords?.delivery.current_lng; 
 
        if (driverLat != null && driverLng != null && isValidCoordinate(driverLat, driverLng)) { 
          let marker = driverMarkers.current.get(driverName); 
          if (!marker) { 
            const icon = makeDriverIcon(driverName, orders.length, color, isInHouse); 
            marker = L.marker([driverLat, driverLng], { icon }).bindPopup( 
              createDriverPopup(driverName, orders, color, orders[0]?.delivery.delivery_person_phone), 
              { maxWidth: 320 } 
            ); 
            marker.on("click", () => setActiveOrderId(orders[0].id)); 
            cluster.addLayer(marker); 
            driverMarkers.current.set(driverName, marker); 
          } else { 
            marker.setLatLng([driverLat, driverLng]); 
            marker.setIcon(makeDriverIcon(driverName, orders.length, color, isInHouse)); 
            marker.setPopupContent( 
              createDriverPopup(driverName, orders, color, orders[0]?.delivery.delivery_person_phone) 
            ); 
          } 
 
          // Route lines (debounced OSRM) 
          orders.forEach((order) => { 
            const dest = getOrderDestination(order);
            if (dest.lat == null || dest.lon == null) return;
            
            const custLat = dest.lat; 
            const custLng = dest.lon; 
            const orderId = order.id; 
 
            const debounceKey = `route_${orderId}`; 
            if (debounceTimers.current.has(debounceKey)) { 
              clearTimeout(debounceTimers.current.get(debounceKey)); 
            } 
 
            debounceTimers.current.set( 
              debounceKey, 
              setTimeout(async () => { 
                const routeSummary = await fetchOSRMRoute( 
                  { lat: driverLat, lon: driverLng }, 
                  { lat: custLat, lon: custLng } 
                ); 
                let line = routeLines.current.get(`${orderId}`); 
 
                if (routeSummary && routeSummary.coordinates.length > 0) { 
                  if (!line) { 
                    const newLine = L.polyline(routeSummary.coordinates, { 
                      color, 
                      weight: 3, 
                      opacity: 0.8, 
                    }); 
                    newLine.addTo(mapRef.current!); 
                    routeLines.current.set(`${orderId}`, newLine); 
                  } else { 
                    line.setLatLngs(routeSummary.coordinates); 
                    line.setStyle({ color, weight: 3, opacity: 0.8, dashArray: undefined }); 
                  } 
                } else { 
                  if (!line) { 
                    const newLine = L.polyline( 
                      [ 
                        [driverLat, driverLng], 
                        [custLat, custLng], 
                      ], 
                      { color, weight: 2, opacity: 0.7, dashArray: "8 6" } 
                    ); 
                    newLine.addTo(mapRef.current!); 
                    routeLines.current.set(`${orderId}`, newLine); 
                  } else { 
                    line.setLatLngs([ 
                      [driverLat, driverLng], 
                      [custLat, custLng], 
                    ]); 
                    line.setStyle({ color, weight: 2, opacity: 0.7, dashArray: "8 6" }); 
                  } 
                } 
                debounceTimers.current.delete(debounceKey); 
              }, 3000) 
            ); 
          }); 
        } else { 
          const existingMarker = driverMarkers.current.get(driverName); 
          if (existingMarker) { 
            cluster.removeLayer(existingMarker); 
            driverMarkers.current.delete(driverName); 
            orders.forEach((order) => { 
              const line = routeLines.current.get(`${order.id}`); 
              if (line) { 
                line.remove(); 
                routeLines.current.delete(`${order.id}`); 
              } 
            }); 
          } 
        } 
      }); 
 
      // Remove stale driver markers & lines 
      driverMarkers.current.forEach((marker, driverName) => { 
        if (!currentDriverKeys.has(driverName)) { 
          cluster.removeLayer(marker); 
          driverMarkers.current.delete(driverName); 
          const orders = driverGroups.get(driverName); 
          if (orders) { 
            orders.forEach((order) => { 
              const line = routeLines.current.get(`${order.id}`); 
              if (line) { 
                line.remove(); 
                routeLines.current.delete(`${order.id}`); 
              } 
            }); 
          } 
        } 
      }); 
    } 
 
    // Fit bounds on first load 
    if (!initialFitDone.current) { 
      setTimeout(() => { 
        const bounds = L.latLngBounds([]); 
        customerMarkers.current.forEach(m => bounds.extend(m.getLatLng())); 
        driverMarkers.current.forEach(m => bounds.extend(m.getLatLng())); 
        if (companyMarkerRef.current) bounds.extend(companyMarkerRef.current.getLatLng()); 
        if (deliveryMarkerRef.current) bounds.extend(deliveryMarkerRef.current.getLatLng()); 
        if (pickupMarkerRef.current) bounds.extend(pickupMarkerRef.current.getLatLng()); 
        if (bounds.isValid() && mapRef.current) { 
          mapRef.current.fitBounds(bounds, { 
            padding: [60, 60], 
            maxZoom: 15, 
            animate: false, 
          }); 
        } 
        initialFitDone.current = true; 
      }, 500); 
    } 
 
    // Auto-follow 
    if (followDriver && activeOrderId) { 
      const order = liveDeliveries.find(o => o.id === activeOrderId); 
      if (order?.delivery.current_lat && order.delivery.current_lng) { 
        mapRef.current?.panTo( 
          [order.delivery.current_lat, order.delivery.current_lng], 
          { animate: true } 
        ); 
      } 
    } 
  }, [ 
    customerGroups, driverGroups, driverColorMap, liveDeliveries, 
    followDriver, activeOrderId, mode, normalizedOrder, 
    filteredAvailableDrivers, pendingDriverId, selectedDriverId, 
    fetchOSRMRoute, routeDataByDriver, showCompanyMarker, showDeliveryMarker, 
  ]); 
 
  // Fly to active order on click 
  useEffect(() => { 
    if (!activeOrderId || !mapRef.current) return; 
    const order = liveDeliveries.find(o => o.id === activeOrderId); 
    if (!order) return;
    
    const dest = getOrderDestination(order);
    const targetLat = order.delivery.current_lat ?? dest.lat; 
    const targetLng = order.delivery.current_lng ?? dest.lon; 
    if (targetLat && targetLng && isValidCoordinate(targetLat, targetLng)) { 
      mapRef.current.flyTo([targetLat, targetLng], 15, { 
        animate: true, 
        duration: 1.2, 
      }); 
    } 
  }, [activeOrderId, liveDeliveries]); 
 
  // Resize map on sidebar toggle 
  useEffect(() => { 
    if (mapRef.current) { 
      setTimeout(() => mapRef.current?.invalidateSize(), 350); 
    } 
  }, [isSidebarOpen]); 
 
  // Fit all markers 
  const fitAllMarkers = useCallback(() => { 
    if (!mapRef.current) return; 
    const L = (window as any).L; 
    const bounds = L.latLngBounds([]); 
    customerMarkers.current.forEach(m => bounds.extend(m.getLatLng())); 
    driverMarkers.current.forEach(m => bounds.extend(m.getLatLng())); 
    if (companyMarkerRef.current) bounds.extend(companyMarkerRef.current.getLatLng()); 
    if (deliveryMarkerRef.current) bounds.extend(deliveryMarkerRef.current.getLatLng()); 
    if (pickupMarkerRef.current) bounds.extend(pickupMarkerRef.current.getLatLng()); 
    if (bounds.isValid()) { 
      mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: true }); 
    } 
  }, []); 
 
  const toggleFollow = useCallback(() => { 
    setFollowDriver(prev => !prev); 
  }, []); 
 
  // Handle driver selection 
  const handleDriverMarkerClick = (driverId: number) => { 
    const driver = enhancedDrivers.find(d => d.id === driverId); 
    if (!driver?.isLive) {
      showToast("error", "This driver is not currently live. Please select a live driver.");
      return;
    }
    
    setPendingDriverId(driverId); 
    setShowConfirmPanel(true); 
     
    if (driver && mapRef.current && driver.current_lat != null && driver.current_lng != null) { 
      mapRef.current.flyTo([driver.current_lat, driver.current_lng], 15, { 
        animate: true, 
        duration: 1, 
      }); 
    } 
  }; 
 
  // Confirm assignment 
  const handleConfirmAssignment = async () => { 
    if (!pendingDriverId || !onDriverSelect || !normalizedOrder) return; 
     
    if (!normalizedOrder.canAssign) { 
      showToast("error", normalizedOrder.assignmentBlockedReason || "Unable to assign driver"); 
      return; 
    } 
     
    const driver = enhancedDrivers.find(d => d.id === pendingDriverId); 
    if (!driver) { 
      showToast("error", "Selected driver not found. Please refresh drivers."); 
      return; 
    } 
     
    if (!driver.isLive) {
      showToast("error", "This driver is not currently live. Please select a live driver.");
      return;
    }
     
    setIsAssigning(true); 
    try { 
      await onDriverSelect(pendingDriverId); 
      setSelectedDriverId(pendingDriverId); 
      setShowConfirmPanel(false); 
      setPendingDriverId(null); 
      showToast("success", "Driver assigned successfully"); 
       
      if (onAssignmentComplete) { 
        onAssignmentComplete(); 
      } 
       
      setTimeout(() => { 
        onClose(); 
      }, 1500); 
    } catch (err) { 
      showToast("error", "Failed to assign driver. They may no longer be available."); 
    } finally { 
      setIsAssigning(false); 
    } 
  }; 
 
  const handleCancelSelection = () => { 
    setPendingDriverId(null); 
    setShowConfirmPanel(false); 
  }; 
 
  // Keyboard handler 
  useEffect(() => { 
    const handler = (e: KeyboardEvent) => { 
      if (e.key === "Escape") { 
        if (showConfirmPanel) { 
          handleCancelSelection(); 
        } else if (isSidebarOpen && window.innerWidth < 1024) { 
          toggleSidebar(); 
        } else { 
          onClose(); 
        } 
      } 
    }; 
    window.addEventListener("keydown", handler); 
    return () => window.removeEventListener("keydown", handler); 
  }, [isSidebarOpen, toggleSidebar, onClose, showConfirmPanel]); 
 
  // Cleanup 
  useEffect(() => { 
    return () => { 
      debounceTimers.current.forEach(timer => clearTimeout(timer)); 
      debounceTimers.current.clear(); 
      pendingRequests.current.clear(); 
      routeCache.current.clear(); 
      if (companyMarkerRef.current) { 
        companyMarkerRef.current.remove(); 
        companyMarkerRef.current = null; 
      } 
      if (deliveryMarkerRef.current) { 
        deliveryMarkerRef.current.remove(); 
        deliveryMarkerRef.current = null; 
      } 
    }; 
  }, []); 
 
  // Render driver selection sidebar 
  const renderDriverSelectionSidebar = () => { 
    if (!normalizedOrder) return null; 
 
    return ( 
      <> 
        <div className="p-4 lg:p-5 border-b border-gray-200/20 shrink-0 bg-secondary"> 
          {/* Collapsible Order Summary Card */} 
          <div className="bg-white/10 rounded-xl mb-3 overflow-hidden"> 
            {/* Collapsed Header */} 
            <button 
              onClick={() => setIsOrderSummaryExpanded(!isOrderSummaryExpanded)} 
              className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors" 
            > 
              <div className="flex items-center gap-2 flex-1 min-w-0"> 
                <h3 className="font-bold text-white text-sm truncate"> 
                  ORDER #{normalizedOrder.id} 
                </h3> 
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${ 
                  normalizedOrder.canAssign  
                    ? "bg-green-500/20 text-green-300" 
                    : "bg-red-500/20 text-red-300" 
                }`}> 
                  {normalizedOrder.canAssign ? "Assignable" : "Blocked"} 
                </span> 
              </div> 
              {isOrderSummaryExpanded ? ( 
                <ChevronUp className="h-4 w-4 text-white/60 flex-shrink-0" /> 
              ) : ( 
                <ChevronDown className="h-4 w-4 text-white/60 flex-shrink-0" /> 
              )} 
            </button> 
             
            {/* Expanded Content */} 
            {isOrderSummaryExpanded && ( 
              <div className="px-3 pb-3"> 
                {!normalizedOrder.canAssign && ( 
                  <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-2 mb-2"> 
                    <p className="text-[11px] text-red-300 flex items-start gap-1"> 
                      <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" /> 
                      {normalizedOrder.assignmentBlockedReason} 
                    </p> 
                  </div> 
                )} 
                 
                <div className="space-y-1.5 text-[11px] text-white/80"> 
                  <div className="flex items-center gap-2"> 
                    <User className="h-3 w-3 text-purple-300" /> 
                    <span className="font-medium">{normalizedOrder.customerName}</span> 
                  </div> 
                  <div className="flex items-center gap-2"> 
                    <Home className="h-3 w-3 text-amber-300" /> 
                    <span>{normalizedOrder.address}</span> 
                  </div> 
                  {normalizedOrder.customerLat != null && normalizedOrder.customerLon != null && ( 
                    <div className="flex items-center gap-2 font-mono text-[10px] text-white/60"> 
                      <Navigation2 className="h-3 w-3 text-green-300" /> 
                      <span>{normalizedOrder.customerLat.toFixed(6)}, {normalizedOrder.customerLon.toFixed(6)}</span> 
                    </div> 
                  )} 
                  {normalizedOrder.customerPhone && ( 
                    <div className="flex items-center gap-2"> 
                      <Phone className="h-3 w-3 text-blue-300" /> 
                      <span>{normalizedOrder.customerPhone}</span> 
                    </div> 
                  )} 
                  <div className="flex items-center gap-2"> 
                    <Store className="h-3 w-3 text-purple-300" /> 
                    <span>{normalizedOrder.pickupName}</span> 
                  </div> 
                  <div className="flex items-center gap-2"> 
                    <span className="text-white/60">Payment:</span> 
                    <span>{normalizedOrder.paymentStatus}</span> 
                  </div> 
                </div> 
              </div> 
            )} 
          </div> 
           
          {/* Map Controls */} 
          <div className="flex gap-1.5 mb-3"> 
            <button 
              onClick={() => setShowCompanyMarker(!showCompanyMarker)} 
              className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${ 
                showCompanyMarker ? "bg-green-500/20 text-green-300 border border-green-400/30" : "bg-white/10 text-white/50 border border-white/10" 
              }`} 
            > 
              🏢 Company 
            </button> 
            <button 
              onClick={() => setShowDeliveryMarker(!showDeliveryMarker)} 
              className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${ 
                showDeliveryMarker ? "bg-blue-500/20 text-blue-300 border border-blue-400/30" : "bg-white/10 text-white/50 border border-white/10" 
              }`} 
            > 
              📦 Delivery 
            </button> 
            <button 
              onClick={() => setShowCustomerMarker(!showCustomerMarker)} 
              className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${ 
                showCustomerMarker ? "bg-amber-500/20 text-amber-300 border border-amber-400/30" : "bg-white/10 text-white/50 border border-white/10" 
              }`} 
            > 
              📍 Recipient 
            </button> 
          </div> 
           
          {/* Search */} 
          <div className="relative mb-3"> 
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50" /> 
            <input 
              type="text" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              placeholder="Search drivers..." 
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/10 text-white placeholder:text-white/40 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
            /> 
          </div> 
           
          {/* Filters */} 
          <div className="flex gap-1.5 mb-2"> 
            <button 
              onClick={() => setDriverFilter("all")} 
              className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${ 
                driverFilter === "all" ? "bg-white text-secondary shadow-md" : "bg-white/20 text-white hover:bg-white/30" 
              }`} 
            > 
              All 
            </button> 
            <button 
              onClick={() => setDriverFilter("in_house")} 
              className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${ 
                driverFilter === "in_house" ? "bg-white text-secondary shadow-md" : "bg-white/20 text-white hover:bg-white/30" 
              }`} 
            > 
              In-House 
            </button> 
            <button 
              onClick={() => setDriverFilter("third_party")} 
              className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${ 
                driverFilter === "third_party" ? "bg-white text-secondary shadow-md" : "bg-white/20 text-white hover:bg-white/30" 
              }`} 
            > 
              3PL 
            </button> 
          </div> 
        </div> 
         
        {/* Driver List */} 
        <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 bg-secondary"> 
          {loadingDrivers && ( 
            <div className="flex items-center justify-center py-10"> 
              <Loader2 className="h-6 w-6 text-gray-400 animate-spin" /> 
              <span className="ml-3 text-sm text-gray-400">Finding available drivers...</span> 
            </div> 
          )} 
           
          {!loadingDrivers && filteredAvailableDrivers.length === 0 && ( 
            <div className="text-center py-10"> 
              <Users className="h-10 w-10 text-gray-500 mx-auto mb-3" /> 
              <p className="text-sm text-gray-400 font-medium">No available drivers</p> 
              <p className="text-xs text-gray-500 mt-1"> 
                {normalizedOrder.canAssign  
                  ? "There are currently no drivers available for this delivery." 
                  : "Driver assignment is blocked for this order."} 
              </p> 
            </div> 
          )} 
           
          {filteredAvailableDrivers.map((driver, index) => { 
            const isPending = pendingDriverId === driver.id; 
            const isSelected = selectedDriverId === driver.id; 
            const isNearest = driver.is_nearest === true; 
            const color = getDriverColor(index); 
            const hasLocation = driver.current_lat != null && driver.current_lng != null; 
            const isLive = driver.isLive === true;
             
            return ( 
              <div 
                key={driver.id} 
                onClick={() => isLive && normalizedOrder.canAssign && handleDriverMarkerClick(driver.id)} 
                className={`p-3 lg:p-4 rounded-xl border shadow-md transition ${isLive ? 'cursor-pointer' : 'cursor-not-allowed'} ${ 
                  isPending 
                    ? "bg-white/20 border-purple-400 ring-2 ring-purple-400/50" 
                    : isSelected 
                    ? "bg-white/15 border-emerald-400 ring-2 ring-emerald-400/50" 
                    : isNearest 
                    ? "bg-green-500/10 border-green-500 ring-2 ring-green-500/50" 
                    : "bg-white/10 border-white/10 hover:bg-white/15" 
                } ${!normalizedOrder.canAssign || !isLive ? "opacity-50" : ""}`} 
              > 
                {isNearest && ( 
                  <div className="flex items-center gap-1 mb-2"> 
                    <Award className="h-4 w-4 text-green-400" /> 
                    <span className="text-[11px] font-bold text-green-300"> 
                      ⭐ BEST MATCH 
                    </span> 
                  </div> 
                )} 
                <div className="flex items-center gap-3"> 
                  {/* Driver avatar/photo */} 
                  <div className="relative flex-shrink-0"> 
                    {driver.profile_image ? ( 
                      <img 
                        src={driver.profile_image} 
                        alt={driver.name} 
                        className="w-10 h-10 rounded-full object-cover border-2" 
                        style={{ borderColor: isNearest ? "#22C55E" : color }} 
                      /> 
                    ) : ( 
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white" 
                        style={{ backgroundColor: isNearest ? "#22C55E" : color }} 
                      > 
                        {getInitials(driver.name)} 
                      </div> 
                    )} 
                    {driver.isLive && ( 
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span> 
                    )} 
                  </div> 
                   
                  <div className="flex-1 min-w-0"> 
                    <div className="flex items-center justify-between gap-1"> 
                      <span className="font-semibold text-sm text-white truncate"> 
                        {driver.name} 
                      </span> 
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white"> 
                        #{index + 1} 
                      </span> 
                    </div> 
                     
                    <div className="flex items-center gap-1.5 mt-0.5"> 
                      <span className="text-[10px] text-white/60"> 
                        {getVehicleIcon(driver.vehicle_type)} {getVehicleName(driver.vehicle_type)} 
                      </span> 
                      <span className="text-[10px] text-white/40">·</span> 
                      {driver.is_in_house ? ( 
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300"> 
                          In-House 
                        </span> 
                      ) : ( 
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300"> 
                          3PL 
                        </span> 
                      )} 
                    </div> 
                     
                    {/* Location info */} 
                    <div className="mt-1.5 space-y-0.5"> 
                      {hasLocation ? ( 
                        <> 
                          {driver.distance_to_customer != null && ( 
                            <div className="text-[10px] text-white/70"> 
                              📍 {formatDistance(driver.distance_to_customer)} to recipient 
                            </div> 
                          )} 
                          {driver.road_distance_to_customer != null && ( 
                            <div className="text-[10px] text-white/70"> 
                              🛣 {formatDistance(driver.road_distance_to_customer)} road distance 
                            </div> 
                          )} 
                          {driver.road_eta_to_customer != null && ( 
                            <div className="text-[10px] text-white/70"> 
                              ⏱ {formatDuration(driver.road_eta_to_customer)} 
                            </div> 
                          )} 
                          <div className="text-[10px] flex items-center gap-1"> 
                            {driver.isLive ? ( 
                              <span className="text-green-400 flex items-center gap-0.5"> 
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> 
                                Live 
                              </span> 
                            ) : driver.location_source === "last_known" ? ( 
                              <span className="text-yellow-400">Last known</span> 
                            ) : ( 
                              <span className="text-blue-400">Available</span> 
                            )} 
                          </div> 
                        </> 
                      ) : ( 
                        <div className="text-[10px] text-gray-400"> 
                          ⚪ Location unavailable 
                        </div> 
                      )} 
                    </div> 
                     
                    {/* Rating */} 
                    {(driver.average_rating || driver.total_reviews) && ( 
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-white/60"> 
                        <Star className="h-3 w-3 text-yellow-400" /> 
                        <span>{driver.average_rating || "N/A"}</span> 
                        {driver.total_reviews && ( 
                          <span>· {driver.total_reviews} reviews</span> 
                        )} 
                      </div> 
                    )} 
                  </div> 
                   
                  {/* Action button */} 
                  <div className="flex-shrink-0"> 
                    {isSelected ? ( 
                      <span className="text-[10px] font-bold text-emerald-400">✓ Selected</span> 
                    ) : isPending ? ( 
                      <span className="text-[10px] font-bold text-purple-400">Pending</span> 
                    ) : ( 
                      <button 
                        onClick={e => { 
                          e.stopPropagation(); 
                          if (isLive && normalizedOrder.canAssign) handleDriverMarkerClick(driver.id); 
                        }} 
                        disabled={!isLive || !normalizedOrder.canAssign} 
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${ 
                          isNearest 
                            ? "bg-green-500 hover:bg-green-600 text-white" 
                            : "bg-purple-500 hover:bg-purple-600 text-white" 
                        }`} 
                      > 
                        {isLive ? "Select" : "Offline"} 
                      </button> 
                    )} 
                  </div> 
                </div> 
              </div> 
            ); 
          })} 
        </div> 
      </> 
    ); 
  }; 
 
  // Render tracking sidebar 
  const renderTrackingSidebar = () => { 
    return ( 
      <> 
        <div className="p-4 lg:p-5 border-b border-gray-200/20 shrink-0 bg-secondary flex items-center justify-between gap-2"> 
          <h3 className="font-bold text-white/90 text-xs sm:text-sm uppercase tracking-wider"> 
            Live Delivery Personnel 
          </h3> 
        </div> 
         
        <div className="p-4 lg:p-5 border-b border-gray-200/20 shrink-0 bg-secondary"> 
          <div className="flex gap-1.5"> 
            <button 
              onClick={() => setDriverFilter("all")} 
              className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${ 
                driverFilter === "all" ? "bg-white text-secondary shadow-md" : "bg-white/20 text-white hover:bg-white/30" 
              }`} 
            > 
              All 
            </button> 
            <button 
              onClick={() => setDriverFilter("in_house")} 
              className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${ 
                driverFilter === "in_house" ? "bg-white text-secondary shadow-md" : "bg-white/20 text-white hover:bg-white/30" 
              }`} 
            > 
              In-House 
            </button> 
            <button 
              onClick={() => setDriverFilter("third_party")} 
              className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${ 
                driverFilter === "third_party" ? "bg-white text-secondary shadow-md" : "bg-white/20 text-white hover:bg-white/30" 
              }`} 
            > 
              3PL 
            </button> 
          </div> 
        </div> 
         
        <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 bg-secondary"> 
          {loading && !driverGroups.size && ( 
            <div className="flex items-center justify-center py-10"> 
              <Loader2 className="h-6 w-6 text-gray-400 animate-spin" /> 
            </div> 
          )} 
          {!loading && !driverGroups.size && ( 
            <div className="text-center py-10 text-xs sm:text-sm text-gray-400"> 
              No drivers currently out for delivery. 
            </div> 
          )} 
          {Array.from(driverGroups.entries()).map(([driverName, orders], idx) => { 
            const isActive = orders.some(o => o.id === activeOrderId); 
            const color = driverColorMap.get(driverName); 
            const count = orders.length; 
            const speed = orders[0]?.delivery.speed; 
            const isInHouse = orders[0]?.delivery.is_in_house; 
 
            // Calculate distance range for this driver 
            let distanceDisplay: string | null = null; 
            const driverLat = orders[0]?.delivery.current_lat; 
            const driverLng = orders[0]?.delivery.current_lng; 
            if (driverLat != null && driverLng != null) { 
              const distances = orders.map((o) => {
                const dest = getOrderDestination(o);
                if (dest.lat == null || dest.lon == null) return null;
                return haversine(driverLat, driverLng, dest.lat, dest.lon);
              }).filter(Boolean) as number[];
              
              if (distances.length > 0) {
                const min = Math.min(...distances).toFixed(1); 
                const max = Math.max(...distances).toFixed(1); 
                distanceDisplay = min === max ? `${min} km` : `${min}–${max} km`;
              }
            } 
 
            return ( 
              <div 
                key={driverName} 
                onClick={() => setActiveOrderId(orders[0].id)} 
                className={`p-3 lg:p-4 rounded-xl border shadow-md flex items-center gap-3 transition cursor-pointer hover:shadow-lg ${ 
                  isActive 
                    ? "bg-white/15 border-purple-400 ring-2 ring-purple-400/50" 
                    : "bg-white/10 border-white/10 hover:bg-white/15" 
                }`} 
                role="button" 
                tabIndex={0} 
                aria-label={`Driver ${driverName}, ${count} orders`} 
                onKeyDown={(e) => { 
                  if (e.key === "Enter" || e.key === " ") 
                    setActiveOrderId(orders[0].id); 
                }} 
              > 
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" 
                  style={{ backgroundColor: color }} 
                > 
                  {idx + 1} 
                </div> 
                <div className="flex-1 min-w-0"> 
                  <div className="flex items-center justify-between gap-1"> 
                    <span className="font-semibold text-sm text-white truncate"> 
                      {driverName} 
                    </span> 
                    <div className="flex items-center gap-2"> 
                      {isInHouse ? ( 
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300"> 
                          In-House 
                        </span> 
                      ) : ( 
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300"> 
                          3PL 
                        </span> 
                      )} 
                      {count > 1 && ( 
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: color }}> 
                          {count} 
                        </span> 
                      )} 
                      <Truck className="h-8 w-8" style={{ color }} /> 
                    </div> 
                  </div> 
                  <div className="mt-1 flex items-center gap-2 flex-wrap text-[10px] sm:text-xs text-gray-200"> 
                    <StatusBadge status="out_for_delivery" /> 
                    {speed && <span>{speed} km/h</span>} 
                    {distanceDisplay && <span>· {distanceDisplay}</span>} 
                    <span>· {orders.length} destination{orders.length > 1 ? "s" : ""}</span> 
                  </div> 
                  <div className="text-[10px] sm:text-xs text-gray-200 truncate mt-1 flex items-center gap-1"> 
                    <MapPin className="h-3 w-3 flex-shrink-0" /> 
                    {orders.length} destination{orders.length > 1 ? "s" : ""} 
                  </div> 
                </div> 
              </div> 
            ); 
          })} 
        </div> 
      </> 
    ); 
  }; 
 
  // Render 
  return createPortal( 
    <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col overflow-hidden"> 
      {/* Header */} 
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-20 shadow-sm shrink-0 gap-2 sticky top-0 backdrop-blur-md"> 
        <div className="flex items-center gap-2 sm:gap-4 min-w-0"> 
          <button 
            onClick={toggleSidebar} 
            className="hidden lg:flex p-1.5 rounded-full hover:bg-gray-100 transition text-gray-500 shrink-0" 
            aria-label="Toggle sidebar" 
          > 
            {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />} 
          </button> 
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 tracking-tight truncate min-w-0"> 
            {mode === "driver_selection" ? "Select Delivery Driver" : "Live Vehicle Tracking"} 
          </h2> 
          {mode === "driver_selection" && normalizedOrder && ( 
            <span className="text-xs text-gray-500 truncate"> 
              #{normalizedOrder.id} · {normalizedOrder.customerName} 
            </span> 
          )} 
          <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full shrink-0"> 
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live 
          </span> 
        </div> 
        <div className="flex items-center gap-2 sm:gap-3 shrink-0"> 
          <span className="hidden xl:inline text-xs text-gray-400"> 
            Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "Just now"} 
          </span> 
          <button 
            onClick={() => refetch()} 
            disabled={isFetching} 
            className="p-1.5 rounded-full hover:bg-gray-100 transition text-gray-500" 
            aria-label="Refresh data" 
          > 
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> 
          </button> 
          <button 
            onClick={fitAllMarkers} 
            className="p-1.5 rounded-full hover:bg-gray-100 transition text-gray-500" 
            aria-label="Fit all markers" 
          > 
            <Maximize2 className="h-4 w-4" /> 
          </button> 
          {mode === "tracking" && ( 
            <button 
              onClick={toggleFollow} 
              className={`p-1.5 rounded-full hover:bg-gray-100 transition ${ 
                followDriver ? "bg-purple-100 text-purple-600" : "text-gray-500" 
              }`} 
              aria-label="Follow driver" 
            > 
              <Navigation className="h-4 w-4" /> 
            </button> 
          )} 
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-gray-100 transition text-gray-500" 
            aria-label="Close" 
          > 
            <X className="h-5 w-5" /> 
          </button> 
        </div> 
      </div> 
 
      {/* Content */} 
      <div className="flex-1 flex overflow-hidden relative"> 
        {/* Mobile backdrop */} 
        <div 
          className={`lg:hidden fixed inset-0 z-30 bg-black/50 transition-opacity ${ 
            isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none" 
          }`} 
          onClick={toggleSidebar} 
        /> 
 
        {/* Mobile drawer */} 
        <div 
          className={`fixed top-0 left-0 z-40 w-[85%] max-w-[360px] h-full bg-secondary transform transition-transform duration-300 rounded-r-2xl shadow-2xl flex flex-col overflow-hidden lg:hidden ${ 
            isSidebarOpen ? "translate-x-0" : "-translate-x-full" 
          }`} 
        > 
          {mode === "driver_selection" ? renderDriverSelectionSidebar() : renderTrackingSidebar()} 
        </div> 
 
        {/* Desktop sidebar */} 
        <div 
          className={`hidden lg:flex flex-col shrink-0 bg-secondary transition-all duration-300 overflow-hidden ${ 
            isSidebarOpen ? "w-[340px]" : "w-0 border-r-0" 
          }`} 
        > 
          {mode === "driver_selection" ? renderDriverSelectionSidebar() : renderTrackingSidebar()} 
        </div> 
 
        {/* Map */} 
        <div className="flex-1 relative bg-gray-100 h-full w-full min-h-[400px] sm:min-h-[500px]"> 
          {loading && !lastUpdated && !driverGroups.size && ( 
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-10"> 
              <Loader2 className="h-10 w-10 text-purple-500 animate-spin" /> 
              <p className="ml-4 text-sm text-gray-500"> 
                {mode === "driver_selection" ? "Loading delivery details…" : "Fetching live deliveries…"} 
              </p> 
            </div> 
          )} 
          {error && !loading && ( 
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 p-4"> 
              <X className="h-10 w-10 text-red-400 mb-4" /> 
              <p className="text-red-500 text-sm mb-4">{error}</p> 
              <button 
                onClick={() => refetch()} 
                className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium" 
              > 
                Retry 
              </button> 
            </div> 
          )} 
          {!loading && !error && mode === "driver_selection" && normalizedOrder && !normalizedOrder.canAssign && ( 
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-red-500/95 text-white px-4 py-2 rounded-full shadow-lg text-xs font-semibold flex items-center gap-2"> 
              <AlertTriangle className="h-3.5 w-3.5" /> 
              <span>{normalizedOrder.assignmentBlockedReason}</span> 
            </div> 
          )} 
          {!loading && !error && mode === "tracking" && !driverGroups.size && ( 
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 p-6"> 
              <Navigation className="h-16 w-16 text-amber-400 mb-4" /> 
              <h3 className="font-bold text-gray-800 text-lg mb-2"> 
                No active deliveries 
              </h3> 
              <p className="text-sm text-gray-500"> 
                No drivers are currently out for delivery. 
              </p> 
            </div> 
          )} 
          <div ref={containerRef} className="w-full h-full z-0" /> 
           
          {/* Confirmation panel */} 
          {showConfirmPanel && pendingDriverId && normalizedOrder && ( 
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 p-5"> 
              {(() => { 
                const driver = enhancedDrivers.find(d => d.id === pendingDriverId); 
                if (!driver) return null; 
                const color = getDriverColor(enhancedDrivers.indexOf(driver)); 
                const isNearest = driver.is_nearest === true; 
                 
                return ( 
                  <div> 
                    <div className="flex items-center gap-3 mb-4"> 
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" 
                        style={{ backgroundColor: isNearest ? "#22C55E" : color }} 
                      > 
                        {isNearest ? "⭐" : getInitials(driver.name)} 
                      </div> 
                      <div> 
                        <p className="font-bold text-gray-900 text-sm"> 
                          {isNearest ? "Assign Nearest Driver" : "Assign Driver"} 
                        </p> 
                        <p className="text-xs text-gray-500"> 
                          {driver.name} · {getVehicleName(driver.vehicle_type)} 
                        </p> 
                      </div> 
                    </div> 
                     
                    <div className="space-y-2 text-xs mb-4"> 
                      <div className="flex items-center gap-2"> 
                        <Package className="h-3.5 w-3.5 text-purple-500" /> 
                        <span>Order #{normalizedOrder.id}</span> 
                      </div> 
                      <div className="flex items-start gap-2"> 
                        <Home className="h-3.5 w-3.5 text-amber-500 mt-0.5" /> 
                        <span>{normalizedOrder.address}</span> 
                      </div> 
                      {normalizedOrder.pickupName && ( 
                        <div className="flex items-center gap-2"> 
                          <Store className="h-3.5 w-3.5 text-purple-500" /> 
                          <span>{normalizedOrder.pickupName}</span> 
                        </div> 
                      )} 
                      {driver.road_distance_to_customer != null ? ( 
                        <div className="flex items-center gap-2"> 
                          <RouteIcon className="h-3.5 w-3.5 text-blue-500" /> 
                          <span>{formatDistance(driver.road_distance_to_customer)} road · {formatDuration(driver.road_eta_to_customer)}</span> 
                        </div> 
                      ) : driver.distance_to_customer != null ? ( 
                        <div className="flex items-center gap-2"> 
                          <RouteIcon className="h-3.5 w-3.5 text-blue-500" /> 
                          <span>{formatDistance(driver.distance_to_customer)} to recipient</span> 
                        </div> 
                      ) : null} 
                    </div> 
                     
                    <div className="flex gap-2"> 
                      <button 
                        onClick={handleConfirmAssignment} 
                        disabled={isAssigning || !normalizedOrder.canAssign || !driver.isLive} 
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 ${ 
                          isNearest 
                            ? "bg-green-500 hover:bg-green-600 text-white" 
                            : "bg-secondary text-white" 
                        }`} 
                      > 
                        {isAssigning ? ( 
                          <> 
                            <Loader2 className="h-4 w-4 animate-spin" /> 
                            Assigning... 
                          </> 
                        ) : ( 
                          <> 
                            <Check className="h-4 w-4" /> 
                            {driver.isLive ? "Assign Driver" : "Driver Offline"} 
                          </> 
                        )} 
                      </button> 
                      <button 
                        onClick={handleCancelSelection} 
                        className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200" 
                      > 
                        Cancel 
                      </button> 
                    </div> 
                  </div> 
                ); 
              })()} 
            </div> 
          )} 
           
          {/* Bottom stats */} 
          {mode === "tracking" && !loading && !error && driverGroups.size > 0 && ( 
            <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 lg:bottom-6 lg:left-6 lg:right-6 z-20"> 
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2 sm:p-4"> 
                <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4"> 
                  <StatsCard 
                    icon={<MapPin className="h-5 w-5" />} 
                    title="Vehicles Live" 
                    value={stats.liveVehicles} 
                    iconBgColor="bg-blue-50" 
                    iconColor="text-blue-600" 
                  /> 
                  <StatsCard 
                    icon={<Clock className="h-5 w-5" />} 
                    title="Deliveries Today" 
                    value={stats.deliveriesToday} 
                    iconBgColor="bg-emerald-50" 
                    iconColor="text-emerald-600" 
                  /> 
                  <StatsCard 
                    icon={<CheckCircle className="h-5 w-5" />} 
                    title="On-Time Delivery" 
                    value={`${stats.onTimeDelivery}%`} 
                    iconBgColor="bg-purple-50" 
                    iconColor="text-purple-600" 
                  /> 
                </div> 
              </div> 
            </div> 
          )} 
        </div> 
      </div> 
 
      {/* Mobile FAB */} 
      <button 
        onClick={toggleSidebar} 
        className="fixed bottom-6 left-6 z-40 flex lg:hidden items-center justify-center p-3 bg-white rounded-full shadow-lg border border-gray-200" 
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"} 
      > 
        {isSidebarOpen ? ( 
          <PanelLeftClose className="h-6 w-6 text-gray-700" /> 
        ) : ( 
          <PanelLeftOpen className="h-6 w-6 text-gray-700" /> 
        )} 
      </button> 
    </div>, 
    document.body 
  ); 
}