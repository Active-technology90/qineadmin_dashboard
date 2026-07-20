import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Navigation,
  Loader2,
  RefreshCw,
  Truck,
  MapPin,
  Clock,
  Route,
  CheckCircle,
  PanelLeftClose,
  PanelLeftOpen,
  // LayoutDashboard,
  // Box,
  // Users,
  // FileText,
  // Settings as SettingsIcon,
  // Bell,
} from "lucide-react";
import {
  getAdminVendorOrders,
  getCompanyVendorOrders,
} from "../../../services/api";
import { useAuth } from "../../../hooks/useAuth";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useReadOnly } from "../AdminDashboard";
import type { VendorOrder } from "../../../types";

// React Query Import
import { useQuery } from "@tanstack/react-query";

// Firebase imports (Using your external service file)
import { db } from "../../../services/firebase";
import { ref, onValue, off } from "firebase/database";

interface DeliveryTrackingMapProps {
  onClose: () => void;
}

// -------------------------------
// 1. Helper: Status Badge
// -------------------------------
const StatusBadge = ({ status }: { status?: string }) => {
  const isLive = status === "out_for_delivery" || status === "shipped";
  return (
    <span
      className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-medium ${
        isLive ? "text-green-600" : "text-gray-400"
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
};

// -------------------------------
// 2. Helper: Stats Card (Perfectly matches bottom UI)
// -------------------------------
const StatsCard = ({
  icon,
  title,
  value,
  iconBgColor,
  iconColor,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  iconBgColor: string;
  iconColor: string;
}) => (
  <div className="bg-white rounded-lg sm:rounded-xl shadow-sm px-3 py-2 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-3 border border-gray-200 flex-1 min-w-[80px]">
    <div className={`${iconBgColor} w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0`}>
      <div className={`${iconColor} scale-75 sm:scale-100`}>{icon}</div>
    </div>
    <div className="min-w-0">
      <div className="text-base sm:text-xl font-extrabold text-secondary truncate">{value}</div>
      <div className="text-[8px] sm:text-xs text-gray-500 font-medium truncate">{title}</div>
    </div>
  </div>
);

// -------------------------------
// 3. Main Component
// -------------------------------
export default function DeliveryTrackingMap({
  onClose,
}: DeliveryTrackingMapProps) {
  const { user } = useAuth();
  const { company } = useCurrentCompany();
  const readOnly = useReadOnly();

  const isSuperAdmin = !user?.memberships?.length;
  const shouldFetchAll = isSuperAdmin || readOnly;
  const companySlug = company?.slug ?? null;

  // ✅ Safely compute effectiveSlug using useMemo
  const effectiveSlug = useMemo(() => {
    if (shouldFetchAll) return null;
    if (user?.memberships?.length) {
      return companySlug || user.memberships[0]?.company_slug || null;
    }
    return null;
  }, [shouldFetchAll, companySlug, user]);

  // State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const [firebaseData, setFirebaseData] = useState<Record<string, any>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Refs
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerId = "delivery-tracking-map";

  // -------------------------------
  // 4. React Query for REST API fetching
  // -------------------------------
  const queryKey = useMemo(
    () => ["delivery-tracking-orders", shouldFetchAll ? "all" : effectiveSlug],
    [shouldFetchAll, effectiveSlug]
  );

  const {
    data: activeDeliveries = [],
    isLoading,
    isFetching,
    error: queryError,
    refetch,
    dataUpdatedAt,
  } = useQuery<VendorOrder[]>({
    queryKey,
    queryFn: async () => {
      if (!shouldFetchAll && !effectiveSlug) {
        return [];
      }

      let page = 1;
      let hasNext = true;
      const allDeliveries: VendorOrder[] = [];

      while (hasNext) {
        const params = {
          page,
          page_size: 500,
          ordering: "-created_at",
        };

        const response = shouldFetchAll
          ? await getAdminVendorOrders(params)
          : await getCompanyVendorOrders(effectiveSlug!, params);

        allDeliveries.push(...(response.data.results ?? []));

        hasNext = response.data.next !== null;
        page++;
      }

      return allDeliveries;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: shouldFetchAll || !!effectiveSlug,
  });

  // Map the last updated timestamp from React Query's internal cache time
  useEffect(() => {
    if (dataUpdatedAt) {
      setLastUpdated(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  // Map loading/error states
  const loading = isLoading;
  const error = queryError
    ? (queryError as any)?.response?.data?.detail ||
      queryError.message ||
      "Failed to load deliveries"
    : null;

  // -------------------------------
  // Subscribe to Firebase (Real-time)
  // -------------------------------
  useEffect(() => {
    if (!activeDeliveries.length) return;

    const unsubscribers: Array<() => void> = [];

    activeDeliveries.forEach((order) => {
      const tId = order.delivery?.tracking_id;
      if (!tId) return;

      const trackingRef = ref(db, `deliveries/${tId}`);

      const unsubscribe = onValue(trackingRef, (snapshot) => {
        const val = snapshot.val();
        if (!val) return;

        setFirebaseData((prev) => ({
          ...prev,
          [order.id]: {
            lat: val.latitude || val.lat,
            lon: val.longitude || val.lon,
            heading: val.heading,
            speed: val.speed,
            status: val.status,
            driver_name: val.driver_name,
            driver_phone: val.driver_phone,
          },
        }));
      });

      unsubscribers.push(() => off(trackingRef, "value", unsubscribe));
    });

    return () => unsubscribers.forEach((fn) => fn());
  }, [activeDeliveries]);

  // -------------------------------
  // Merge API Data with Firebase Data
  // -------------------------------
  const combinedDeliveries = useMemo(() => {
    return activeDeliveries.map((order) => {
      const fbData = firebaseData[order.id];
      return {
        ...order,
        delivery: {
          ...order.delivery,
          current_lat:
            fbData?.lat ||
            order.delivery?.current_lat ||
            order.delivery?.customer_lat,
          current_lng:
            fbData?.lon ||
            order.delivery?.current_lng ||
            order.delivery?.customer_lon,
          speed: fbData?.speed,
          delivery_person_name:
            fbData?.driver_name ||
            order.delivery?.delivery_person_name ||
            "Unassigned",
          delivery_person_phone:
            fbData?.driver_phone || order.delivery?.delivery_person_phone || "",
          status: fbData?.status || order.delivery?.status || order.delivery_status || "pending",
        },
      };
    });
  }, [activeDeliveries, firebaseData]);

  // -------------------------------
  // Filter only out for delivery assigned drivers
  // -------------------------------
  const activeDriversDeliveries = useMemo(() => {
    return combinedDeliveries.filter(
      (order) =>
        order.delivery?.status === "out_for_delivery" &&
        order.delivery?.delivery_person_name &&
        order.delivery.delivery_person_name !== "Unassigned"
    );
  }, [combinedDeliveries]);

  // -------------------------------
  // Dynamic Stats Calculation
  // -------------------------------
  const stats = useMemo(() => {
    const liveVehicles = activeDriversDeliveries.length;

    const today = new Date().toDateString();
    const deliveriesToday = activeDriversDeliveries.filter(
      (o) => new Date(o.created_at).toDateString() === today,
    ).length;

    const totalDeliverable = activeDriversDeliveries.filter(
      (o) =>
        o.delivery_status === "delivered" || o.delivery_status === "fulfilled",
    ).length;

    const total = activeDriversDeliveries.length;
    const onTimeDelivery =
      total > 0 ? Math.round((totalDeliverable / total) * 100) : 100;

    const totalDistance = 268;

    return { liveVehicles, deliveriesToday, onTimeDelivery, totalDistance };
  }, [activeDriversDeliveries]);

  // ✅ RESIZE MAP ON SIDEBAR TOGGLE: Avoids map recreation and flickering
  useEffect(() => {
    if (mapRef.current) {
      // Slight delay to ensure the DOM transition has completed
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 350); // 50ms buffer after the 300ms transition
    }
  }, [isSidebarOpen]);

  // -------------------------------
  // Leaflet Map Initialization
  // -------------------------------
  useEffect(() => {
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.id = "leaflet-css-dt";
    if (!document.getElementById("leaflet-css-dt"))
      document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.id = "leaflet-js-dt";
    script.onload = () => setLeafletLoaded(true);
    if (!document.getElementById("leaflet-js-dt"))
      document.head.appendChild(script);
    else setLeafletLoaded(true);
  }, []);

  // Renders the actual Map
  useEffect(() => {
    if (!leafletLoaded) return;

    const L = (window as any).L;
    if (!L) return;

    const container = containerRef.current;
    if (!container) return;

    const mappableDeliveries = activeDriversDeliveries.filter(
      (o) => o.delivery?.current_lat != null && o.delivery?.current_lng != null,
    );

    if (mappableDeliveries.length === 0) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const center: [number, number] =
      mappableDeliveries[0]?.delivery?.current_lat != null
        ? [
            mappableDeliveries[0].delivery.current_lat!,
            mappableDeliveries[0].delivery.current_lng!,
          ]
        : [9.03, 38.74];

    const map = L.map(container, { zoomControl: false }).setView(center, 13);
    mapRef.current = map;

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // Add Custom Markers (White Bubble like the Image)
    mappableDeliveries.forEach((order) => {
      const lat = order.delivery!.current_lat!;
      const lng = order.delivery!.current_lng!;
      const driverName = order.delivery?.delivery_person_name || "Unassigned";
      const isLive = order.delivery?.status === "out_for_delivery";
      const speed = order.delivery?.speed;

      const customIcon = L.divIcon({
        className: "delivery-marker",
        html: `
          <div
            style="
              display:flex;
              align-items:center;
              gap:8px;
              padding:6px 12px 6px 6px;
              border-radius:999px;
              box-shadow:0 4px 14px rgba(0,0,0,0.18);
              white-space:nowrap;
              position:relative;
              font-family:Inter,system-ui,sans-serif;
            "
          >
            <div
              style="
                width:48px;
                height:48px;
                border-radius:50%;
                background:${isLive ? "#DCFCE7" : "#F3F4F6"};
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:28px;
                flex-shrink:0;
                box-shadow:0 2px 6px rgba(0,0,0,0.12);
                ${isLive ? "animation:pulse 2s infinite;" : ""}
              "
            >
              🚚
            </div>
            <div style="display:flex;flex-direction:column;gap:2px;">
              <span
                style="
                  font-size:14px;
                  font-weight:700;
                  color:#6750A4;
                  max-width:130px;
                  overflow:hidden;
                  text-overflow:ellipsis;
                  line-height:16px;
                "
              >
                ${driverName}
              </span>
              <span
                style="
                  font-size:11px;
                  font-weight:600;
                  color:${isLive ? "#16A34A" : "#9CA3AF"};
                  display:flex;
                  align-items:center;
                  gap:4px;
                "
              >
                ${isLive ? "🟢 Live" : "⚪ Assigned"}
                ${speed ? ` • ${speed} km/h` : ""}
              </span>
            </div>
           
          </div>
          <style>
            @keyframes pulse {
              0% { box-shadow:0 0 0 0 rgba(22,163,74,0.35); }
              70% { box-shadow:0 0 0 10px rgba(22,163,74,0); }
              100% { box-shadow:0 0 0 0 rgba(22,163,74,0); }
            }
          </style>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      const popupHtml = `
        <div style="width:300px;font-family:Inter,system-ui,sans-serif;">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
            <div style="width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#6750A4,#8B5CF6);color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;">🚚</div>
            <div>
              <div style="font-size:17px;font-weight:700;color:#111827;">${driverName}</div>
              <div style="font-size:13px;color:#6B7280;">Order #${order.id}</div>
            </div>
          </div>
          <div style="border:1px solid #E5E7EB;border-radius:12px;padding:12px;margin-bottom:14px;">
            <div style="display:flex;gap:8px;margin-bottom:10px;">📍 <span>${order.shipping_address_text || "Address not provided"}</span></div>
            <div style="display:flex;gap:8px;margin-bottom:10px;">👤 <span>${order.recipient_name || "Customer"}</span></div>
            <div style="display:flex;gap:8px;">
              <span>${isLive ? "🟢 <b style='color:#16A34A'>Live Delivery</b>" : "🟡 <b style='color:#CA8A04'>Assigned</b>"}</span>
            </div>
          </div>
          ${order.delivery?.delivery_person_phone ? `<a href="tel:${order.delivery.delivery_person_phone}" style="display:block;background:#6750A4;color:#fff;text-align:center;padding:12px;border-radius:10px;text-decoration:none;font-weight:700;">📞 Call Delivery Person</a>` : ""}
        </div>
      `;
      marker.bindPopup(popupHtml);
    });

    const bounds = L.latLngBounds(
      mappableDeliveries.map((o) => [
        o.delivery!.current_lat!,
        o.delivery!.current_lng!,
      ]),
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [leafletLoaded, activeDriversDeliveries]);

  // ✅ Accessibility: Close drawer with Escape key on mobile/tablet
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSidebarOpen && window.innerWidth < 1024) {
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen, toggleSidebar]);

  // -------------------------------
  // Shared Sidebar Content to prevent duplication
  // -------------------------------
  const renderSidebarContent = () => (
    <>
      <div className="p-4 lg:p-5 border-b border-gray-100 bg-gray-50/30 shrink-0">
        <h3 className="font-bold text-secondary text-xs sm:text-sm">Delivery Personnel</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 bg-gray-50/20">
        {loading && activeDeliveries.length === 0 && (
          <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 text-secondary animate-spin" /></div>
        )}
        {!loading && activeDriversDeliveries.length === 0 && (
          <div className="text-center py-10 text-xs sm:text-sm text-gray-500">No drivers currently out for delivery.</div>
        )}
        {activeDriversDeliveries.map((order, idx) => {
          const iconColors = [
            { bg: "bg-blue-500", truck: "text-blue-500", border: "border-blue-100" },
            { bg: "bg-green-500", truck: "text-green-500", border: "border-green-100" },
            { bg: "bg-purple-500", truck: "text-purple-500", border: "border-purple-100" },
            { bg: "bg-orange-500", truck: "text-orange-500", border: "border-orange-100" },
          ];
          const color = iconColors[idx % iconColors.length];
          const driverName = order.delivery?.delivery_person_name || "Unassigned";
          const liveStatus = order.delivery?.status || "pending";
          const isLive = liveStatus === "out_for_delivery";
          const speed = order.delivery?.speed;

          return (
            <div key={order.id} className="bg-white p-3 lg:p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 transition hover:shadow-md">
              <div className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white ${color.bg}`}>
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <div className="font-semibold text-xs sm:text-sm text-gray-800 truncate">{driverName}</div>
                  <div className={`${color.truck} bg-gray-50 p-1 rounded-md shrink-0`}>
                    <Truck className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                </div>
                <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                  <StatusBadge status={liveStatus} />
                  {isLive && speed && <span className="text-[10px] sm:text-xs font-medium text-gray-500">{speed} km/h</span>}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-400 truncate mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  {order.shipping_address_text || "No address"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  // -------------------------------
  // UI RENDER - Full Responsive Overhaul
  // -------------------------------
  return createPortal(
    <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col overflow-hidden">
      
      {/* Top Header - Responsive design */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-20 shadow-sm shrink-0 gap-2 sticky top-0">
        
        {/* Header Left: Toggle, Title, Badge */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {/* Desktop Sidebar Toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-1.5 rounded-full hover:bg-gray-100 transition text-gray-500 shrink-0"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </button>

          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-secondary tracking-tight truncate min-w-0">
            Live Vehicle Tracking
          </h2>
          <span className="hidden sm:flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
          </span>
        </div>

        {/* Header Right: Last Updated, Refresh, Close */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Hide Last Updated on Tablets and Mobile */}
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
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition text-gray-500" aria-label="Close tracking">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* 1. Mobile/Tablet Backdrop (Visible only when drawer is open) */}
        <div
          className={`lg:hidden fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 ease-in-out ${
            isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={toggleSidebar}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar backdrop"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') toggleSidebar();
          }}
        />

        {/* 2. Mobile/Tablet Sidebar Drawer */}
        <div
          className={`fixed top-0 left-0 z-40 w-[65%] max-w-[320px] h-full bg-white transform transition-all duration-300 ease-in-out rounded-r-2xl shadow-2xl flex flex-col overflow-hidden lg:hidden ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {renderSidebarContent()}
        </div>

        {/* 3. Desktop Sidebar */}
        <div
          className={`hidden lg:flex flex-col shrink-0 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out overflow-hidden ${
            isSidebarOpen ? "w-[240px]" : "w-0 border-r-0"
          }`}
        >
          {renderSidebarContent()}
        </div>

        {/* 4. Map Right Panel */}
        <div className="flex-1 relative bg-gray-100 h-full w-full min-h-[400px] sm:min-h-[500px]">
          {loading && !lastUpdated && activeDeliveries.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 text-secondary animate-spin" />
                <p className="text-xs text-gray-500 font-medium">Fetching active deliveries…</p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 p-4">
              <p className="text-red-500 text-sm font-medium text-center">{error}</p>
              <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-secondary/90 transition shadow-sm">Retry</button>
            </div>
          )}

          {!loading && !error && activeDriversDeliveries.filter((o) => o.delivery?.current_lat).length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 p-6">
              <div className="max-w-sm text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5 border border-amber-100">
                  <Navigation className="h-8 w-8 sm:h-10 sm:w-10 text-amber-400" />
                </div>
                <h3 className="font-bold text-secondary text-base sm:text-lg mb-2">Coordinates not yet available</h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">Active deliveries are reporting no GPS position.</p>
              </div>
            </div>
          )}

          {!loading && !error && activeDriversDeliveries.filter((o) => o.delivery?.current_lat).length > 0 && (
            <>
              {!leafletLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                  <Loader2 className="h-8 w-8 text-secondary animate-spin" />
                </div>
              )}
              <div ref={containerRef} id={mapContainerId} className="w-full h-full z-0" />
            </>
          )}

          {/* Bottom Floating Stats - 2x2 grid for Mobile, 3 cols for Tablet, 4 cols for Desktop */}
          {!loading && !error && activeDriversDeliveries.length > 0 && (
            <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 lg:bottom-6 lg:left-6 lg:right-6 z-20">
              <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-2 sm:p-4">
                <div className="grid grid-cols-2 md:grid-cols-3  gap-2 sm:gap-3 lg:gap-4">
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
                  {/* <StatsCard
                    icon={<Route className="h-5 w-5" />}
                    title="Total Distance Covered"
                    value={`${stats.totalDistance} km`}
                    iconBgColor="bg-orange-50"
                    iconColor="text-orange-600"
                  /> */}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile/Tablet Floating Action Button (FAB) for Sidebar Toggle */}
      <button
        onClick={toggleSidebar}
        className="fixed bottom-6 left-6 z-40 flex lg:hidden items-center justify-center p-3 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200"
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isSidebarOpen ? (
          <PanelLeftClose className="h-6 w-6 text-secondary" />
        ) : (
          <PanelLeftOpen className="h-6 w-6 text-secondary" />
        )}
      </button>

    </div>,
    document.body,
  );
}