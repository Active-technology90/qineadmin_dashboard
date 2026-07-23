// DeliveryTrackingMap.tsx – production‑grade live logistics dashboard
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import {
  X,
  Navigation,
  Loader2,
  RefreshCw,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
} from "lucide-react";
import {
  getAdminVendorOrders,
  getCompanyVendorOrders,
} from "../../../services/api";
import { useAuth } from "../../../hooks/useAuth";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useReadOnly } from "../AdminDashboard";
import { useQuery } from "@tanstack/react-query";
import { db } from "../../../services/firebase";
import { ref, onValue, off } from "firebase/database";
import type { VendorOrder } from "../../../types";

// ── types ──────────────────────────────────────────────────────────
interface DeliveryWithLocation extends VendorOrder {
  delivery: NonNullable<VendorOrder["delivery"]> & {
    current_lat?: number;
    current_lng?: number;
    speed?: number;
    heading?: number;
    delivery_person_name: string;
    delivery_person_phone?: string;
    status: string;
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
}

// ── OSRM routing cache & debounce types ────────────────────────────
type RouteCacheKey = string; // `${lat},${lng}_${lat},${lng}`
interface RouteCacheEntry {
  coordinates: [number, number][];
  timestamp: number;
}

// ── helpers ────────────────────────────────────────────────────────
const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const haversine = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Consistent driver colours
const DRIVER_COLORS = [
  "#E53935",
  "#8E24AA",
  "#3949AB",
  "#1E88E5",
  "#00897B",
  "#43A047",
  "#7CB342",
  "#FDD835",
  "#FB8C00",
  "#F4511E",
  "#6D4C41",
  "#546E7A",
  "#D81B60",
  "#5E35B1",
  "#039BE5",
  "#00ACC1",
  "#00897B",
  "#C0CA33",
  "#FFB300",
  "#8D6E63",
];

const getDriverColor = (index: number) =>
  DRIVER_COLORS[index % DRIVER_COLORS.length];

// ── UI atoms (refined styling for dashboard consistency) ───────────
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

// ── Popup generators (per‑order distance included) ─────────────────
const createCustomerPopup = (orders: DeliveryWithLocation[]): string => {
  const listItems = orders
    .map(
      (o) =>
        `<li style="margin-bottom:6px;"><b>#${o.id}-${o.master_order_id || "N/A"}</b> – ${escapeHtml(o.recipient_name || "N/A")}</li>`,
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
        → ${escapeHtml(o.recipient_name || "N/A")}${distStr}
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

// ── Marker icon helpers (unchanged) ────────────────────────────────
const makeCustomerIcon = (count: number): L.DivIcon => {
  const L = (window as any).L;
  return L.divIcon({
    className: "customer-marker-grouped",
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;">
        <div style="
          background:white;
          border-radius:50%;
          width:42px;
          height:42px;
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 4px 12px rgba(0,0,0,0.25);
          border:2px solid #F59E0B;
          font-size:20px;
        ">📍</div>
        ${
          count > 1
            ? `<span style="
                position:absolute;
                top:-6px;
                right:-6px;
                background:#F59E0B;
                color:white;
                border-radius:50%;
                width:20px;
                height:20px;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:11px;
                font-weight:bold;
                box-shadow:0 2px 6px rgba(0,0,0,0.2);
              ">${count}</span>`
            : ""
        }
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
      ">Customer</div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
};

const makeDriverIcon = (
  driverName: string,
  count: number,
  color: string,
): L.DivIcon => {
  const L = (window as any).L;
  return L.divIcon({
    className: "driver-marker-grouped",
    html: `
      <div style="position:relative;display:flex;align-items:center;gap:6px;padding:4px 10px 4px 4px;border-radius:999px; rgba(0,0,0,0.2);white-space:nowrap;font-family:Inter,system-ui,sans-serif;cursor:pointer;">
        <div style="
          width:44px;
          height:44px;
          border-radius:50%;
          background:${color}20;
          border:2px solid ${color};
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:26px;
        ">🚚</div>
        <div style="display:flex;flex-direction:column;gap:2px;">
          <span style="font-size:14px;font-weight:700;color:#6750A4;max-width:120px;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(driverName)}</span>
          <span style="font-size:11px;font-weight:600;color:${color};display:flex;align-items:center;gap:4px;">🟢 Live · ${count} order${count > 1 ? "s" : ""}</span>
        </div>
        ${
          count > 1
            ? `<span style="
                position:absolute;
                top:-8px;
                right:-8px;
                background:${color};
                color:white;
                border-radius:50%;
                width:22px;
                height:22px;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:12px;
                font-weight:bold;
                box-shadow:0 2px 6px rgba(0,0,0,0.3);
              ">${count}</span>`
            : ""
        }
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

// ── Main component ──────────────────────────────────────────────────
export default function DeliveryTrackingMap({
  onClose,
}: {
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { company } = useCurrentCompany();
  const readOnly = useReadOnly();

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
  const toggleSidebar = useCallback(() => setIsSidebarOpen((p) => !p), []);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [followDriver, setFollowDriver] = useState<boolean>(false);

  // Data state
  const [firebaseData, setFirebaseData] = useState<
    Record<number, FirebaseDriverData>
  >({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Refs
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const driverMarkers = useRef<Map<string, L.Marker>>(new Map());
  const customerMarkers = useRef<Map<string, L.Marker>>(new Map());
  const routeLines = useRef<Map<number, L.Polyline>>(new Map());
  const clusterGroup = useRef<L.MarkerClusterGroup | null>(null);
  const subscribedIds = useRef<Set<string>>(new Set());
  const initialFitDone = useRef(false);

  // ── OSRM routing refs ────────────────────────────────────────────
  const routeCache = useRef<Map<RouteCacheKey, RouteCacheEntry>>(new Map());
  const pendingRequests = useRef<Map<RouteCacheKey, Promise<[number, number][] | null>>>(new Map());
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ── React Query – fetch all orders (paginated) ─────────────────────
  const queryKey = useMemo(
    () => ["delivery-tracking-orders", shouldFetchAll ? "all" : effectiveSlug],
    [shouldFetchAll, effectiveSlug],
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
    ? ((queryError as any)?.response?.data?.detail ??
      queryError.message ??
      "Failed to load")
    : null;

  // ── Merge API + Firebase data ──────────────────────────────────────
  const combinedOrders: DeliveryWithLocation[] = useMemo(() => {
    return allOrders.map((order) => {
      const fb = firebaseData[order.id];
      return {
        ...order,
        delivery: {
          ...order.delivery,
          current_lat: fb?.lat ?? order.delivery?.current_lat ?? undefined,
          current_lng: fb?.lon ?? order.delivery?.current_lng ?? undefined,
          speed: fb?.speed,
          heading: fb?.heading,
          delivery_person_name:
            fb?.driver_name ??
            order.delivery?.delivery_person_name ??
            "Unassigned",
          delivery_person_phone:
            fb?.driver_phone ?? order.delivery?.delivery_person_phone ?? "",
          status:
            fb?.status ??
            order.delivery?.status ??
            order.delivery_status ??
            "pending",
        },
      } as DeliveryWithLocation;
    });
  }, [allOrders, firebaseData]);

  // ── Filter only out_for_delivery ──────────────────────────────────
  const liveDeliveries = useMemo(() => {
    return combinedOrders.filter(
      (order) =>
        order.delivery?.status === "out_for_delivery" &&
        order.delivery?.customer_lat != null &&
        order.delivery?.customer_lon != null &&
        order.delivery.delivery_person_name !== "Unassigned",
    );
  }, [combinedOrders]);

  // ── Groupings ──────────────────────────────────────────────────────
  const customerGroups = useMemo(() => {
    const map = new Map<string, DeliveryWithLocation[]>();
    liveDeliveries.forEach((order) => {
      const key = `${order.delivery.customer_lat},${order.delivery.customer_lon}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(order);
    });
    return map;
  }, [liveDeliveries]);

  const driverGroups = useMemo(() => {
    const map = new Map<string, DeliveryWithLocation[]>();
    liveDeliveries.forEach((order) => {
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

  // ── Stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const deliveriesToday = liveDeliveries.filter(
      (o) => new Date(o.created_at).toDateString() === today,
    ).length;
    return {
      liveVehicles: driverGroups.size,
      deliveriesToday,
      onTimeDelivery: 100, // placeholder
    };
  }, [liveDeliveries, driverGroups]);

  // ── Load Leaflet + MarkerCluster ──────────────────────────────────
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

    addCSS(
      "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
      "leaflet-css-dt",
    );
    addCSS(
      "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css",
      "mc-css-dt",
    );
    addCSS(
      "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css",
      "mc-default-css-dt",
    );

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const mcScript = document.createElement("script");
      mcScript.src =
        "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js";
      mcScript.onload = () => setLeafletLoaded(true);
      document.head.appendChild(mcScript);
    };
    document.head.appendChild(script);
  }, []);

  // ── Firebase dynamic subscriptions ────────────────────────────────
  useEffect(() => {
    if (!liveDeliveries.length) return;

    const currentTrackingIds = new Set(
      liveDeliveries
        .map((o) => o.delivery?.tracking_id)
        .filter(Boolean) as string[],
    );

    // Unsubscribe from stale IDs
    subscribedIds.current.forEach((id) => {
      if (!currentTrackingIds.has(id)) {
        off(ref(db, `deliveries/${id}`));
        subscribedIds.current.delete(id);
      }
    });

    // Subscribe to new IDs
    currentTrackingIds.forEach((id) => {
      if (!subscribedIds.current.has(id)) {
        const trackingRef = ref(db, `deliveries/${id}`);
        const listener = onValue(trackingRef, (snapshot) => {
          const val = snapshot.val();
          if (!val) return;
          liveDeliveries.forEach((o) => {
            if (o.delivery?.tracking_id === id) {
              setFirebaseData((prev) => ({
                ...prev,
                [o.id]: {
                  lat: val.latitude ?? val.lat,
                  lon: val.longitude ?? val.lon,
                  speed: val.speed,
                  heading: val.heading,
                  status: val.status,
                  driver_name: val.driver_name,
                  driver_phone: val.driver_phone,
                },
              }));
            }
          });
        });
        subscribedIds.current.add(id);
      }
    });
  }, [liveDeliveries]);

  // Full Firebase cleanup on unmount
  useEffect(() => {
    return () => {
      subscribedIds.current.forEach((id) => off(ref(db, `deliveries/${id}`)));
      subscribedIds.current.clear();
    };
  }, []);

  // ── Map initialisation (once) ──────────────────────────────────────
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

  // ── OSRM route fetcher (cached, deduplicated) ─────────────────────
  const fetchOSRMRoute = useCallback(
    async (
      fromLat: number,
      fromLng: number,
      toLat: number,
      toLng: number,
    ): Promise<[number, number][] | null> => {
      const cacheKey: RouteCacheKey = `${fromLat},${fromLng}_${toLat},${toLng}`;
      const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

      // 1. Check cache
      const cached = routeCache.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.coordinates;
      }

      // 2. Deduplicate in‑flight requests
      const existing = pendingRequests.current.get(cacheKey);
      if (existing) return existing;

      // 3. Make API request
      const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;

      const requestPromise = fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data.code !== "Ok" || !data.routes?.length) return null;
          // GeoJSON coordinates are [lng, lat] – convert to [lat, lng]
          const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]],
          );
          routeCache.current.set(cacheKey, { coordinates: coords, timestamp: Date.now() });
          return coords;
        })
        .catch(() => null)
        .finally(() => {
          pendingRequests.current.delete(cacheKey);
        });

      pendingRequests.current.set(cacheKey, requestPromise);
      return requestPromise;
    },
    [],
  );

  // ── Incremental marker & route updates ────────────────────────────
  useEffect(() => {
    const L = (window as any).L;
    if (!mapRef.current || !clusterGroup.current || !L) return;

    const cluster = clusterGroup.current;
    const currentCustomerKeys = new Set<string>();
    const currentDriverKeys = new Set<string>();
    const orderIdsWithLines = new Set<number>();

    // ── Customer markers ───────────────────────────────────────────
    customerGroups.forEach((orders, key) => {
      const [latStr, lngStr] = key.split(",");
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      currentCustomerKeys.add(key);

      let marker = customerMarkers.current.get(key);
      if (!marker) {
        const count = orders.length;
        const icon = makeCustomerIcon(count);
        marker = L.marker([lat, lng], { icon }).bindPopup(
          createCustomerPopup(orders),
          { maxWidth: 320 },
        );
        marker.on("click", () => setActiveOrderId(orders[0].id));
        cluster.addLayer(marker);
        customerMarkers.current.set(key, marker);
      } else {
        marker.setIcon(makeCustomerIcon(orders.length));
        marker.setLatLng([lat, lng]);
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

    // ── Driver markers & route lines ────────────────────────────────
    driverGroups.forEach((orders, driverName) => {
      currentDriverKeys.add(driverName);
      const color = driverColorMap.get(driverName)!;
      const firstWithCoords = orders.find(
        (o) => o.delivery.current_lat != null && o.delivery.current_lng != null,
      );
      const driverLat = firstWithCoords?.delivery.current_lat;
      const driverLng = firstWithCoords?.delivery.current_lng;

      // Driver marker (only if GPS available)
      if (driverLat != null && driverLng != null) {
        let marker = driverMarkers.current.get(driverName);
        if (!marker) {
          const count = orders.length;
          const phone = orders[0]?.delivery.delivery_person_phone;
          const icon = makeDriverIcon(driverName, count, color);
          marker = L.marker([driverLat, driverLng], { icon }).bindPopup(
            createDriverPopup(driverName, orders, color, phone),
            { maxWidth: 320 },
          );
          marker.on("click", () => setActiveOrderId(orders[0].id));
          cluster.addLayer(marker);
          driverMarkers.current.set(driverName, marker);
        } else {
          marker.setLatLng([driverLat, driverLng]);
          const count = orders.length;
          const phone = orders[0]?.delivery.delivery_person_phone;
          marker.setIcon(makeDriverIcon(driverName, count, color));
          marker.setPopupContent(
            createDriverPopup(driverName, orders, color, phone),
          );
        }

        // ---- Route lines (debounced OSRM) ----
        orders.forEach((order) => {
          const custLat = order.delivery.customer_lat!;
          const custLng = order.delivery.customer_lon!;
          const orderId = order.id;
          orderIdsWithLines.add(orderId);

          const debounceKey = `route_${orderId}`;
          if (debounceTimers.current.has(debounceKey)) {
            clearTimeout(debounceTimers.current.get(debounceKey));
          }

          debounceTimers.current.set(
            debounceKey,
            setTimeout(async () => {
              // Try real road route
              const realCoords = await fetchOSRMRoute(driverLat, driverLng, custLat, custLng);
              let line = routeLines.current.get(orderId);

              if (realCoords && realCoords.length > 0) {
                if (!line) {
                  line = L.polyline(realCoords, {
                    color,
                    weight: 3,
                    opacity: 0.8,
                  }).addTo(mapRef.current!);
                  routeLines.current.set(orderId, line);
                } else {
                  line.setLatLngs(realCoords);
                  line.setStyle({ color, weight: 3, opacity: 0.8, dashArray: undefined });
                }
              } else {
                // Fallback: straight line
                if (!line) {
                  line = L.polyline(
                    [
                      [driverLat, driverLng],
                      [custLat, custLng],
                    ],
                    { color, weight: 2, opacity: 0.7, dashArray: "8 6" },
                  ).addTo(mapRef.current!);
                  routeLines.current.set(orderId, line);
                } else {
                  line.setLatLngs([
                    [driverLat, driverLng],
                    [custLat, custLng],
                  ]);
                  line.setStyle({ color, weight: 2, opacity: 0.7, dashArray: "8 6" });
                }
              }
              debounceTimers.current.delete(debounceKey);
            }, 3000),
          );
        });
      } else {
        // Driver without GPS – remove marker and associated lines
        const existingMarker = driverMarkers.current.get(driverName);
        if (existingMarker) {
          cluster.removeLayer(existingMarker);
          driverMarkers.current.delete(driverName);
          orders.forEach((order) => {
            const line = routeLines.current.get(order.id);
            if (line) {
              line.remove();
              routeLines.current.delete(order.id);
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
            const line = routeLines.current.get(order.id);
            if (line) {
              line.remove();
              routeLines.current.delete(order.id);
            }
          });
        }
      }
    });

    // Remove orphaned route lines (orders no longer present)
    routeLines.current.forEach((line, orderId) => {
      if (!orderIdsWithLines.has(orderId)) {
        line.remove();
        routeLines.current.delete(orderId);
      }
    });

    // Fit bounds on first load
    if (!initialFitDone.current) {
      setTimeout(() => {
        const bounds = L.latLngBounds([]);
        customerMarkers.current.forEach((m) => bounds.extend(m.getLatLng()));
        driverMarkers.current.forEach((m) => bounds.extend(m.getLatLng()));
        if (bounds.isValid() && mapRef.current) {
          mapRef.current.fitBounds(bounds, {
            padding: [60, 60],
            maxZoom: 15,
            animate: false,
          });
        }
        initialFitDone.current = true;
      }, 500); // slightly longer to allow routes to load
    }

    // Auto‑follow driver if enabled
    if (followDriver && activeOrderId) {
      const order = liveDeliveries.find((o) => o.id === activeOrderId);
      if (order?.delivery.current_lat && order.delivery.current_lng) {
        mapRef.current?.panTo(
          [order.delivery.current_lat, order.delivery.current_lng],
          { animate: true },
        );
      }
    }
  }, [
    customerGroups,
    driverGroups,
    driverColorMap,
    liveDeliveries,
    followDriver,
    activeOrderId,
    fetchOSRMRoute,
  ]);

  // ── Fly to active order on click ──────────────────────────────────
  useEffect(() => {
    if (!activeOrderId || !mapRef.current) return;
    const order = liveDeliveries.find((o) => o.id === activeOrderId);
    if (!order) return;
    const targetLat = order.delivery.current_lat ?? order.delivery.customer_lat;
    const targetLng = order.delivery.current_lng ?? order.delivery.customer_lon;
    if (targetLat && targetLng) {
      mapRef.current.flyTo([targetLat, targetLng], 15, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [activeOrderId, liveDeliveries]);

  // ── Resize map on sidebar toggle ──────────────────────────────────
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => mapRef.current?.invalidateSize(), 350);
    }
  }, [isSidebarOpen]);

  // ── Manual fit all markers ────────────────────────────────────────
  const fitAllMarkers = useCallback(() => {
    if (!mapRef.current) return;
    const L = (window as any).L;
    const bounds = L.latLngBounds([]);
    customerMarkers.current.forEach((m) => bounds.extend(m.getLatLng()));
    driverMarkers.current.forEach((m) => bounds.extend(m.getLatLng()));
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 15,
        animate: true,
      });
    }
  }, []);

  // ── Toggle auto‑follow driver ─────────────────────────────────────
  const toggleFollow = useCallback(() => {
    setFollowDriver((prev) => !prev);
  }, []);

  // ── Keyboard / Escape handlers ────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isSidebarOpen && window.innerWidth < 1024) {
          toggleSidebar();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isSidebarOpen, toggleSidebar, onClose]);

  // ── Sidebar (drivers grouped) – with distance range per driver ────
  const renderSidebar = useCallback(
    () => (
      <>
        <div className="p-4 lg:p-5 border-b border-gray-200/20 shrink-0 bg-secondary flex items-center justify-between gap-2">
          <h3 className="font-bold text-white/90 text-xs sm:text-sm uppercase tracking-wider">
            Live Delivery Personnel
          </h3>
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
          {Array.from(driverGroups.entries()).map(
            ([driverName, orders], idx) => {
              const isActive = orders.some((o) => o.id === activeOrderId);
              const color = driverColorMap.get(driverName);
              const count = orders.length;
              const speed = orders[0]?.delivery.speed;

              // Calculate distance range for this driver
              let distanceDisplay: string | null = null;
              const driverLat = orders[0]?.delivery.current_lat;
              const driverLng = orders[0]?.delivery.current_lng;
              if (driverLat != null && driverLng != null) {
                const distances = orders.map((o) =>
                  haversine(
                    driverLat,
                    driverLng,
                    o.delivery.customer_lat!,
                    o.delivery.customer_lon!,
                  ),
                );
                const min = Math.min(...distances).toFixed(1);
                const max = Math.max(...distances).toFixed(1);
                distanceDisplay = min === max ? `${min} km` : `${min}–${max} km`;
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
                        {count > 1 && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: color }}
                          >
                            {count}
                          </span>
                        )}
                        <Truck className="h-8 w-8" style={{ color }} />
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <StatusBadge status="out_for_delivery" />
                      {speed && (
                        <span className="text-[10px] sm:text-xs text-gray-100">
                          {speed} km/h
                        </span>
                      )}
                      {distanceDisplay && (
                        <span className="text-[10px] sm:text-xs text-gray-100">
                          · {distanceDisplay}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-200 truncate mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      {orders.length} destination
                      {orders.length > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              );
            },
          )}
        </div>
      </>
    ),
    [loading, driverGroups, activeOrderId, driverColorMap],
  );

  // ── Cleanup debounce timers on unmount ─────────────────────────────
  useEffect(() => {
    return () => {
      debounceTimers.current.forEach((timer) => clearTimeout(timer));
      debounceTimers.current.clear();
      pendingRequests.current.clear();
    };
  }, []);

  // ── Portal Render ──────────────────────────────────────────────────
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
            {isSidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </button>
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 tracking-tight truncate min-w-0">
            Live Vehicle Tracking
          </h2>
          <span className="hidden sm:flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />{" "}
            Live
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="hidden xl:inline text-xs text-gray-400">
            Last updated:{" "}
            {lastUpdated ? lastUpdated.toLocaleTimeString() : "Just now"}
          </span>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 rounded-full hover:bg-gray-100 transition text-gray-500"
            aria-label="Refresh data"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={fitAllMarkers}
            className="p-1.5 rounded-full hover:bg-gray-100 transition text-gray-500"
            aria-label="Fit all markers"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            onClick={toggleFollow}
            className={`p-1.5 rounded-full hover:bg-gray-100 transition ${followDriver ? "bg-purple-100 text-purple-600" : "text-gray-500"}`}
            aria-label={
              followDriver ? "Stop following driver" : "Follow active driver"
            }
          >
            <Navigation className="h-4 w-4" />
          </button>
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
          className={`lg:hidden fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 ${
            isSidebarOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={toggleSidebar}
          role="button"
          aria-label="Close sidebar backdrop"
        />

        {/* Mobile drawer */}
        <div
          className={`fixed top-0 left-0 z-40 w-[65%] max-w-[320px] h-full bg-secondary transform transition-transform duration-300 rounded-r-2xl shadow-2xl flex flex-col overflow-hidden lg:hidden ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {renderSidebar()}
        </div>

        {/* Desktop sidebar */}
        <div
          className={`hidden lg:flex flex-col shrink-0 bg-secondary transition-all duration-300 overflow-hidden ${
            isSidebarOpen ? "w-[260px]" : "w-0 border-r-0"
          }`}
        >
          {renderSidebar()}
        </div>

        {/* Map */}
        <div className="flex-1 relative bg-gray-100 h-full w-full min-h-[400px] sm:min-h-[500px]">
          {loading && !lastUpdated && !driverGroups.size && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-10">
              <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
              <p className="ml-4 text-sm text-gray-500">
                Fetching live deliveries…
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
          {!loading && !error && !driverGroups.size && (
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
          {/* Bottom stats */}
          {!loading && !error && driverGroups.size > 0 && (
            <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 lg:bottom-6 lg:left-6 lg:right-6 z-20">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2 sm:p-4">
                <div className="grid grid-cols-3 md:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
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
    document.body,
  );
}