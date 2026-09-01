// DeliveryTrackingMap.tsx - Enhanced with driver selection mode
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
  Building2,
  Users,
  Search,
  UserCheck,
  UserX,
  Check,
  ChevronDown,
  ChevronUp,
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
    logistics_company_name?: string;
    is_in_house?: boolean;
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
}

interface DeliveryTrackingMapProps {
  onClose: () => void;
  mode?: "tracking" | "driver_selection";
  selectedOrderId?: number;
  onDriverSelect?: (driverId: number) => Promise<void>;
  onAssignmentComplete?: () => void;
}

// ── OSRM routing cache & debounce types ────────────────────────────
type RouteCacheKey = string;
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

const getInitials = (name: string): string => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((word) => word[0]?.toUpperCase() || "")
    .slice(0, 2)
    .join("");
};

const formatDistance = (distance: number | null | undefined): string => {
  if (distance == null) return "Distance unavailable";
  if (distance < 1) return `${(distance * 1000).toFixed(0)} m`;
  return `${distance.toFixed(1)} km`;
};

const getVehicleIcon = (type?: string): string => {
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

const getVehicleName = (type?: string): string => {
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

// ── UI atoms ──────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status?: string; isLive?: boolean }> = React.memo(
  ({ status, isLive }) => {
    const live = isLive || status === "out_for_delivery" || status === "shipped";
    return (
      <span
        className={`flex items-center gap-1.5 text-[12px] sm:text-xs font-medium ${
          live ? "text-green-400" : "text-gray-400"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            live ? "bg-green-500 animate-pulse" : "bg-gray-300"
          }`}
        />
        {live ? "Live" : status || "Pending"}
      </span>
    );
  }
);

// ── Main component ──────────────────────────────────────────────────
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
  const toggleSidebar = useCallback(() => setIsSidebarOpen((p) => !p), []);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(
    selectedOrderId || null
  );
  const [followDriver, setFollowDriver] = useState<boolean>(false);
  const [driverFilter, setDriverFilter] = useState<"all" | "in_house" | "third_party">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingDriverId, setPendingDriverId] = useState<number | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showConfirmPanel, setShowConfirmPanel] = useState(false);

  // Data state
  const [firebaseData, setFirebaseData] = useState<
    Record<number, FirebaseDriverData>
  >({});
  const [driverLocations, setDriverLocations] = useState<
    Record<
      number,
      { latitude: number; longitude: number; heading?: number; is_online?: boolean; updated_at?: number }
    >
  >({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  // Refs
  const mapRef = useRef<Leaflet.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const driverMarkers = useRef<Map<string, Leaflet.Marker>>(new Map());
  const customerMarkers = useRef<Map<string, Leaflet.Marker>>(new Map());
  const routeLines = useRef<Map<number, Leaflet.Polyline>>(new Map());
  const clusterGroup = useRef<Leaflet.LayerGroup | null>(null);
  const subscribedIds = useRef<Set<string>>(new Set());
  const initialFitDone = useRef(false);
  const selectedMarkerRef = useRef<Leaflet.Marker | null>(null);

  // ── OSRM routing refs ────────────────────────────────────────────
  const routeCache = useRef<Map<RouteCacheKey, RouteCacheEntry>>(new Map());
  const pendingRequests = useRef<Map<RouteCacheKey, Promise<[number, number][] | null>>>(new Map());
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ── React Query – fetch all orders ──────────────────────────────
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
          logistics_company_name: order.delivery?.logistics_company_name,
          is_in_house: !order.delivery?.logistics_company_name || 
                       order.delivery?.logistics_company_name === "" ||
                       order.delivery?.logistics_company_name === order.company?.name,
        },
      } as DeliveryWithLocation;
    });
  }, [allOrders, firebaseData]);

  // ── Get selected order ────────────────────────────────────────────
  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return combinedOrders.find((o) => o.id === selectedOrderId);
  }, [combinedOrders, selectedOrderId]);

  // ── Filter orders based on mode ──────────────────────────────────
  const liveDeliveries = useMemo(() => {
    let filtered = combinedOrders.filter(
      (order) =>
        order.delivery?.status === "out_for_delivery" &&
        order.delivery?.customer_lat != null &&
        order.delivery?.customer_lon != null &&
        order.delivery.delivery_person_name !== "Unassigned"
    );

    // In selection mode, only show the selected order
    if (mode === "driver_selection" && selectedOrderId) {
      filtered = filtered.filter((o) => o.id === selectedOrderId);
    }

    // Apply driver type filter
    if (driverFilter === "in_house") {
      filtered = filtered.filter(order => order.delivery.is_in_house === true);
    } else if (driverFilter === "third_party") {
      filtered = filtered.filter(order => order.delivery.is_in_house === false);
    }

    return filtered;
  }, [combinedOrders, driverFilter, mode, selectedOrderId]);

  // ── Fetch available drivers for selection mode ────────────────────
  useEffect(() => {
    if (mode === "driver_selection" && selectedOrder && selectedOrder.company?.slug) {
      const fetchDrivers = async () => {
        setLoadingDrivers(true);
        try {
          const res = await getAvailableDeliveryDrivers(selectedOrder.company.slug!, {
            vendor_order_id: selectedOrder.id,
          });
          const allDrivers = res.data || [];
          setAvailableDrivers(allDrivers);
        } catch (err) {
          console.error("Failed to fetch available drivers", err);
          showToast("error", "Failed to load available drivers");
        } finally {
          setLoadingDrivers(false);
        }
      };
      
      fetchDrivers();
    }
  }, [mode, selectedOrder?.id, selectedOrder?.company?.slug]);

  // ── Firebase candidate drivers dynamic subscriptions ────────────────
  useEffect(() => {
    if (mode !== "driver_selection" || !availableDrivers.length) return;
    const cleanups: Array<() => void> = [];

    availableDrivers.forEach((driver) => {
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
      cleanups.forEach((c) => c());
    };
  }, [mode, availableDrivers]);

  // Helper to get driver location from Firebase (presence or tracking)
  const getDriverLiveLocationFromFirebase = useCallback(
    (driverId: number) => {
      // 1. Direct candidate driver presence from Firebase `drivers/{driverId}`
      const directLoc = driverLocations[driverId];
      if (directLoc && directLoc.latitude != null && directLoc.longitude != null) {
        return {
          lat: Number(directLoc.latitude),
          lon: Number(directLoc.longitude),
          heading: directLoc.heading,
          is_online: directLoc.is_online !== false,
        };
      }

      // 2. Active order tracking from Firebase `deliveries/{tracking_id}`
      for (const [orderId, data] of Object.entries(firebaseData)) {
        const order = combinedOrders.find((o) => o.id === parseInt(orderId));
        if (order?.delivery?.delivery_person_id === driverId) {
          if (data.lat != null && data.lon != null) {
            return {
              lat: Number(data.lat),
              lon: Number(data.lon),
              heading: data.heading,
              is_online: true,
            };
          }
        }
      }
      return null;
    },
    [driverLocations, firebaseData, combinedOrders]
  );

  // Get customer location
  const getCustomerLocation = (order: any) => {
    const delivery = order?.delivery;
    const lat =
      delivery?.customer_lat ||
      order?.customer_lat ||
      order?.shipping_address_ref?.latitude ||
      order?.shipping_lat ||
      order?.delivery_address?.lat ||
      order?.vendor_order_detail?.customer_lat;
    const lon =
      delivery?.customer_lon ||
      order?.customer_lon ||
      order?.shipping_address_ref?.longitude ||
      order?.shipping_lon ||
      order?.delivery_address?.lon ||
      order?.vendor_order_detail?.customer_lon;
    if (lat != null && lon != null) {
      const parsedLat = parseFloat(lat);
      const parsedLon = parseFloat(lon);
      if (isValidCoordinate(parsedLat, parsedLon)) {
        return { lat: parsedLat, lon: parsedLon };
      }
    }
    return null;
  };

  const getStoreLocation = (order: any) => {
    const lat = order?.company?.latitude;
    const lon = order?.company?.longitude;
    if (lat != null && lon != null) {
      const parsedLat = parseFloat(lat);
      const parsedLon = parseFloat(lon);
      if (isValidCoordinate(parsedLat, parsedLon)) {
        return { lat: parsedLat, lon: parsedLon };
      }
    }
    return null;
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

  // ── Compute enhanced drivers with real-time Firebase distance ──────
  const enhancedDrivers = useMemo(() => {
    const storeLat = selectedOrder?.company?.latitude
      ? parseFloat(selectedOrder.company.latitude)
      : null;
    const storeLon = selectedOrder?.company?.longitude
      ? parseFloat(selectedOrder.company.longitude)
      : null;
    const custLoc = getCustomerLocation(selectedOrder);
    const refLoc =
      storeLat != null && storeLon != null && isValidCoordinate(storeLat, storeLon)
        ? { lat: storeLat, lon: storeLon }
        : custLoc;

    const mapped = availableDrivers.map((d: any) => {
      let distance = null;
      let locationSource = null;
      let isLive = false;
      let currentLat = d.current_lat != null ? parseFloat(d.current_lat) : null;
      let currentLng = d.current_lng != null ? parseFloat(d.current_lng) : null;

      const liveLoc = getDriverLiveLocationFromFirebase(d.id);
      if (liveLoc && isValidCoordinate(liveLoc.lat, liveLoc.lon)) {
        currentLat = liveLoc.lat;
        currentLng = liveLoc.lon;
        isLive = true;
        locationSource = "live";
        if (refLoc) {
          distance = haversine(refLoc.lat, refLoc.lon, liveLoc.lat, liveLoc.lon);
        }
      } else if (currentLat != null && currentLng != null && isValidCoordinate(currentLat, currentLng)) {
        if (refLoc) distance = haversine(refLoc.lat, refLoc.lon, currentLat, currentLng);
        locationSource = "current";
      } else if (d.last_lat != null && d.last_lon != null) {
        const lastLat = parseFloat(d.last_lat);
        const lastLon = parseFloat(d.last_lon);
        if (isValidCoordinate(lastLat, lastLon)) {
          if (refLoc) distance = haversine(refLoc.lat, refLoc.lon, lastLat, lastLon);
          locationSource = "last_known";
        }
      } else if (d.distance_km != null) {
        distance = parseFloat(d.distance_km);
        locationSource = "api";
      }

      return {
        ...d,
        current_lat: currentLat,
        current_lng: currentLng,
        distance_km: distance != null ? Math.round(distance * 10) / 10 : null,
        location_source: locationSource,
        isLive,
      };
    });

    mapped.sort((a: any, b: any) => {
      const distA = a.distance_km != null ? a.distance_km : 999999;
      const distB = b.distance_km != null ? b.distance_km : 999999;
      if (distA !== distB) return distA - distB;
      const rankA = a.is_in_house ? 0 : 1;
      const rankB = b.is_in_house ? 0 : 1;
      return rankA - rankB;
    });

    return mapped;
  }, [availableDrivers, driverLocations, firebaseData, selectedOrder, getDriverLiveLocationFromFirebase]);

  // ── Filter available drivers ──────────────────────────────────────
  const filteredAvailableDrivers = useMemo(() => {
    let filtered = [...enhancedDrivers];
    
    if (driverFilter === "in_house") {
      filtered = filtered.filter((d) => d.is_in_house === true);
    } else if (driverFilter === "third_party") {
      filtered = filtered.filter((d) => d.is_in_house === false);
    }
    
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((d) =>
        d.name?.toLowerCase().includes(search) ||
        d.phone?.toLowerCase().includes(search) ||
        d.username?.toLowerCase().includes(search) ||
        d.company_name?.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [enhancedDrivers, driverFilter, searchTerm]);

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
      (o) => new Date(o.created_at).toDateString() === today
    ).length;
    return {
      liveVehicles: driverGroups.size,
      deliveriesToday,
      onTimeDelivery: 100,
      inHouseCount: liveDeliveries.filter(o => o.delivery.is_in_house).length,
      thirdPartyCount: liveDeliveries.filter(o => !o.delivery.is_in_house).length,
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
      "leaflet-css-dt"
    );
    addCSS(
      "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css",
      "mc-css-dt"
    );
    addCSS(
      "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css",
      "mc-default-css-dt"
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
        .filter(Boolean) as string[]
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
        onValue(trackingRef, (snapshot) => {
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

  // Reset fit flag when filter changes
  useEffect(() => {
    if (liveDeliveries.length > 0) {
      initialFitDone.current = false;
    }
  }, [liveDeliveries.length, driverFilter]);

  // ── OSRM route fetcher ─────────────────────────────────────────────
  const fetchOSRMRoute = useCallback(
    async (
      fromLat: number,
      fromLng: number,
      toLat: number,
      toLng: number
    ): Promise<[number, number][] | null> => {
      const cacheKey: RouteCacheKey = `${fromLat},${fromLng}_${toLat},${toLng}`;
      const CACHE_TTL = 5 * 60 * 1000;

      const cached = routeCache.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.coordinates;
      }

      const existing = pendingRequests.current.get(cacheKey);
      if (existing) return existing;

      const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;

      const requestPromise = fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data.code !== "Ok" || !data.routes?.length) return null;
          const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]]
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
    []
  );

  // ── Marker creation helpers for selection mode ────────────────────
  const createSelectionCustomerIcon = (): Leaflet.DivIcon => {
    const L = (window as any).L;
    return L.divIcon({
      className: "customer-marker-selection",
      html: `
        <div style="position:relative;display:flex;align-items:center;justify-content:center;">
          <div style="
            background:white;
            border-radius:50%;
            width:48px;
            height:48px;
            display:flex;
            align-items:center;
            justify-content:center;
            box-shadow:0 4px 16px rgba(245,158,11,0.4);
            border:3px solid #F59E0B;
            font-size:24px;
          ">📍</div>
          <div style="
            position:absolute;
            bottom:-24px;
            left:50%;
            transform:translateX(-50%);
            white-space:nowrap;
            font-size:11px;
            font-weight:700;
            color:#374151;
            background:white;
            padding:4px 10px;
            border-radius:8px;
            box-shadow:0 2px 8px rgba(0,0,0,0.12);
            border:1px solid #F59E0B;
          ">
            ${escapeHtml(selectedOrder?.recipient_name || "Customer")}
            #${selectedOrder?.id || "N/A"}
          </div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });
  };

  const createSelectionDriverIcon = (
    driver: AvailableDriver,
    isPending: boolean,
    isSelected: boolean,
    color: string
  ): Leaflet.DivIcon => {
    const L = (window as any).L;
    const hasLocation = driver.distance_km != null;
    const typeLabel = driver.is_in_house ? "In-House" : "3PL";
    const statusText = isSelected ? "✓ Selected" : isPending ? "↻ Pending" : "";
    
    return L.divIcon({
      className: "driver-marker-selection",
      html: `
        <div style="
          position:relative;
          display:flex;
          align-items:center;
          gap:8px;
          padding:6px 12px 6px 6px;
          border-radius:999px;
          background:white;
          box-shadow:0 4px 16px ${isPending ? 'rgba(139,92,246,0.4)' : 'rgba(0,0,0,0.15)'};
          border:3px solid ${isPending ? '#8B5CF6' : isSelected ? '#10B981' : color};
          white-space:nowrap;
          font-family:Inter,system-ui,sans-serif;
          cursor:pointer;
          transition:all 0.2s;
        ">
          <div style="
            width:36px;
            height:36px;
            border-radius:50%;
            background:${color}20;
            border:2px solid ${color};
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:20px;
          ">🚚</div>
          <div style="display:flex;flex-direction:column;gap:1px;">
            <span style="font-size:13px;font-weight:700;color:#1F2937;max-width:100px;overflow:hidden;text-overflow:ellipsis;">
              ${escapeHtml(driver.name)}
            </span>
            <span style="font-size:10px;font-weight:600;color:${color};display:flex;align-items:center;gap:4px;">
              ${hasLocation ? '🟢' : '⚪'} ${typeLabel} · ${getVehicleName(driver.vehicle_type)}
              ${statusText ? ` · <span style="color:${isSelected ? '#10B981' : '#8B5CF6'}">${statusText}</span>` : ''}
            </span>
          </div>
          ${hasLocation ? `
            <span style="
              font-size:11px;
              font-weight:700;
              color:#374151;
              background:#F3F4F6;
              padding:2px 8px;
              border-radius:12px;
            ">
              ${formatDistance(driver.distance_km)}
            </span>
          ` : ''}
          ${isPending ? `
            <span style="
              position:absolute;
              top:-6px;
              right:-6px;
              width:16px;
              height:16px;
              background:#8B5CF6;
              border-radius:50%;
              border:2px solid white;
            "></span>
          ` : ''}
          ${isSelected ? `
            <span style="
              position:absolute;
              top:-6px;
              right:-6px;
              width:16px;
              height:16px;
              background:#10B981;
              border-radius:50%;
              border:2px solid white;
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:9px;
              color:white;
            ">✓</span>
          ` : ''}
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  };

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
        const icon = mode === "driver_selection" && selectedOrderId
          ? createSelectionCustomerIcon()
          : makeCustomerIcon(count);
        const newMarker = L.marker([lat, lng], { icon }).bindPopup(
          createCustomerPopup(orders),
          { maxWidth: 320 }
        );
        newMarker.on("click", () => setActiveOrderId(orders[0].id));
        cluster.addLayer(newMarker);
        customerMarkers.current.set(key, newMarker);
      } else {
        if (mode === "driver_selection" && selectedOrderId) {
          marker.setIcon(createSelectionCustomerIcon());
        } else {
          marker.setIcon(makeCustomerIcon(orders.length));
        }
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

    // ── Selection mode: Show available drivers ──────────────────────
    if (mode === "driver_selection" && selectedOrder) {
      const customerLoc = getCustomerLocation(selectedOrder);
      
      // Clear existing driver markers from tracking
      driverMarkers.current.forEach((marker) => {
        cluster.removeLayer(marker);
      });
      driverMarkers.current.clear();
      
      // Add available drivers as markers
      filteredAvailableDrivers.forEach((driver, index) => {
        const color = getDriverColor(index);
        const isPending = pendingDriverId === driver.id;
        const isSelected = selectedDriverId === driver.id;
        
        // Get driver location
        let driverLat = null;
        let driverLng = null;
        
        // Check live location first
        const liveLoc = getDriverLiveLocationFromFirebase(driver.id);
        if (liveLoc && isValidCoordinate(liveLoc.lat, liveLoc.lon)) {
          driverLat = liveLoc.lat;
          driverLng = liveLoc.lon;
        } else if (driver.current_lat != null && driver.current_lng != null) {
          driverLat = parseFloat(String(driver.current_lat));
          driverLng = parseFloat(String(driver.current_lng));
        } else if (driver.last_lat != null && driver.last_lon != null) {
          driverLat = parseFloat(String(driver.last_lat));
          driverLng = parseFloat(String(driver.last_lon));
        }
        
        if (driverLat != null && driverLng != null && isValidCoordinate(driverLat, driverLng)) {
          const icon = createSelectionDriverIcon(driver, isPending, isSelected, color);
          const marker = L.marker([driverLat, driverLng], { icon })
            .bindPopup(createSelectionDriverPopup(driver, color), { maxWidth: 320 });
          
          marker.on("click", () => {
            handleDriverMarkerClick(driver.id);
          });
          
          cluster.addLayer(marker);
          driverMarkers.current.set(`selection_${driver.id}`, marker);
          
          // Highlight selected
          if (isSelected) {
            selectedMarkerRef.current = marker;
          }
        }
      });
    } else {
      // ── Tracking mode: Driver markers ────────────────────────────────
      driverGroups.forEach((orders, driverName) => {
        currentDriverKeys.add(driverName);
        const color = driverColorMap.get(driverName)!;
        const isInHouse = orders[0]?.delivery.is_in_house;
        const firstWithCoords = orders.find(
          (o) => o.delivery.current_lat != null && o.delivery.current_lng != null
        );
        const driverLat = firstWithCoords?.delivery.current_lat;
        const driverLng = firstWithCoords?.delivery.current_lng;

        if (driverLat != null && driverLng != null) {
          let marker = driverMarkers.current.get(driverName);
          if (!marker) {
            const count = orders.length;
            const phone = orders[0]?.delivery.delivery_person_phone;
            const icon = makeDriverIcon(driverName, count, color, isInHouse);
            const newMarker = L.marker([driverLat, driverLng], { icon }).bindPopup(
              createDriverPopup(driverName, orders, color, phone, isInHouse),
              { maxWidth: 320 }
            );
            newMarker.on("click", () => setActiveOrderId(orders[0].id));
            cluster.addLayer(newMarker);
            driverMarkers.current.set(driverName, newMarker);
          } else {
            marker.setLatLng([driverLat, driverLng]);
            const count = orders.length;
            const phone = orders[0]?.delivery.delivery_person_phone;
            marker.setIcon(makeDriverIcon(driverName, count, color, isInHouse));
            marker.setPopupContent(
              createDriverPopup(driverName, orders, color, phone, isInHouse)
            );
          }

          // Route lines
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
                const realCoords = await fetchOSRMRoute(driverLat, driverLng, custLat, custLng);
                let line = routeLines.current.get(orderId);

                if (realCoords && realCoords.length > 0) {
                  if (!line) {
                    const newLine = L.polyline(realCoords, {
                      color,
                      weight: 3,
                      opacity: 0.8,
                    });
                    newLine.addTo(mapRef.current!);
                    routeLines.current.set(orderId, newLine);
                  } else {
                    line.setLatLngs(realCoords);
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
                    routeLines.current.set(orderId, newLine);
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

      // Remove orphaned route lines
      routeLines.current.forEach((line, orderId) => {
        if (!orderIdsWithLines.has(orderId)) {
          line.remove();
          routeLines.current.delete(orderId);
        }
      });
    }

    // Fit bounds on first load or filter change
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
        } else if (mapRef.current) {
          const storeLoc = getStoreLocation(selectedOrder);
          if (storeLoc) {
            mapRef.current.setView([storeLoc.lat, storeLoc.lon], 14);
          } else {
            mapRef.current.setView([9.014046, 38.7871437], 13);
          }
        }
        initialFitDone.current = true;
      }, 500);
    }

    // Auto‑follow driver if enabled
    if (followDriver && activeOrderId) {
      const order = liveDeliveries.find((o) => o.id === activeOrderId);
      if (order?.delivery.current_lat && order.delivery.current_lng) {
        mapRef.current?.panTo(
          [order.delivery.current_lat, order.delivery.current_lng],
          { animate: true }
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
    driverFilter,
    mode,
    selectedOrderId,
    selectedOrder,
    filteredAvailableDrivers,
    driverLocations,
    pendingDriverId,
    selectedDriverId,
  ]);

  // ── Handle driver marker click ────────────────────────────────────
  const handleDriverMarkerClick = (driverId: number) => {
    setPendingDriverId(driverId);
    setShowConfirmPanel(true);
    
    // Center map on the selected driver
    const driver = enhancedDrivers.find(d => d.id === driverId);
    if (driver && mapRef.current) {
      let lat = null;
      let lng = null;
      
      const liveLoc = getDriverLiveLocationFromFirebase(driver.id);
      if (liveLoc && isValidCoordinate(liveLoc.lat, liveLoc.lon)) {
        lat = liveLoc.lat;
        lng = liveLoc.lon;
      } else if (driver.current_lat != null && driver.current_lng != null) {
        lat = parseFloat(String(driver.current_lat));
        lng = parseFloat(String(driver.current_lng));
      } else if (driver.last_lat != null && driver.last_lon != null) {
        lat = parseFloat(String(driver.last_lat));
        lng = parseFloat(String(driver.last_lon));
      }
      
      if (lat != null && lng != null) {
        mapRef.current.flyTo([lat, lng], 16, {
          animate: true,
          duration: 1,
        });
      }
    }
  };

  // ── Confirm driver assignment ─────────────────────────────────────
  const handleConfirmAssignment = async () => {
    if (!pendingDriverId || !onDriverSelect) return;
    
    setIsAssigning(true);
    try {
      await onDriverSelect(pendingDriverId);
      setSelectedDriverId(pendingDriverId);
      setShowConfirmPanel(false);
      setPendingDriverId(null);
      showToast("success", "Delivery person assigned successfully");
      
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }
      
      // Close the map after successful assignment
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      showToast("error", "Failed to assign delivery person");
    } finally {
      setIsAssigning(false);
    }
  };

  // ── Cancel selection ─────────────────────────────────────────────
  const handleCancelSelection = () => {
    setPendingDriverId(null);
    setShowConfirmPanel(false);
  };

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

  // ── Render sidebar ────────────────────────────────────────────────
  const renderSidebar = useCallback(() => {
    if (mode === "driver_selection") {
      // Driver selection sidebar
      return (
        <>
          <div className="p-4 lg:p-5 border-b border-gray-200/20 shrink-0 bg-secondary">
            <h3 className="font-bold text-white/90 text-xs sm:text-sm uppercase tracking-wider mb-1">
              Available Drivers
            </h3>
            <p className="text-white/60 text-xs mb-3">
              {filteredAvailableDrivers.length} drivers available
            </p>
            
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search drivers..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/10 text-white placeholder:text-white/40 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            {/* Filter buttons */}
            <div className="flex gap-1.5">
              <button
                onClick={() => setDriverFilter("all")}
                className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                  driverFilter === "all"
                    ? "bg-white text-secondary shadow-md"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setDriverFilter("in_house")}
                className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                  driverFilter === "in_house"
                    ? "bg-white text-secondary shadow-md"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                In-House
              </button>
              <button
                onClick={() => setDriverFilter("third_party")}
                className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                  driverFilter === "third_party"
                    ? "bg-white text-secondary shadow-md"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                3PL
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 bg-secondary">
            {loadingDrivers && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                <span className="ml-3 text-sm text-gray-400">Loading drivers...</span>
              </div>
            )}
            
            {!loadingDrivers && filteredAvailableDrivers.length === 0 && (
              <div className="text-center py-10 text-xs sm:text-sm text-gray-400">
                {searchTerm || driverFilter !== "all"
                  ? "No drivers match your search"
                  : "No available drivers found"}
              </div>
            )}
            
            {filteredAvailableDrivers.map((driver, index) => {
              const isPending = pendingDriverId === driver.id;
              const isSelected = selectedDriverId === driver.id;
              const hasLocation = driver.distance_km != null;
              const color = getDriverColor(index);
              
              return (
                <div
                  key={driver.id}
                  onClick={() => handleDriverMarkerClick(driver.id)}
                  className={`p-3 lg:p-4 rounded-xl border shadow-md flex items-center gap-3 transition cursor-pointer hover:shadow-lg ${
                    isPending
                      ? "bg-white/20 border-purple-400 ring-2 ring-purple-400/50"
                      : isSelected
                      ? "bg-white/15 border-emerald-400 ring-2 ring-emerald-400/50"
                      : "bg-white/10 border-white/10 hover:bg-white/15"
                  }`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Driver ${driver.name}`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-sm text-white truncate">
                        {driver.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {driver.is_in_house ? (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                            In-House
                          </span>
                        ) : (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                            3PL
                          </span>
                        )}
                        {hasLocation && (
                          <span className="text-[10px] font-bold text-white/80">
                            {formatDistance(driver.distance_km)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="text-xs text-white/70">
                        {getVehicleIcon(driver.vehicle_type)} {getVehicleName(driver.vehicle_type)}
                      </span>
                      {hasLocation && driver.location_source === 'live' && (
                        <span className="text-[9px] text-green-400 flex items-center gap-0.5">
                          <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></span>
                          Live
                        </span>
                      )}
                      {!hasLocation && (
                        <span className="text-[9px] text-gray-400">⚪ Location unavailable</span>
                      )}
                    </div>
                    
                    <div className="text-[10px] text-white/50 mt-0.5">
                      📞 {driver.phone || "No phone"}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {isPending ? (
                      <span className="text-[10px] font-bold text-purple-400">Pending</span>
                    ) : isSelected ? (
                      <span className="text-[10px] font-bold text-emerald-400">✓ Selected</span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDriverMarkerClick(driver.id);
                        }}
                        className="px-3 py-1 rounded-lg text-[10px] font-bold bg-purple-500 hover:bg-purple-600 text-white transition-colors"
                      >
                        Select
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Driver stats */}
            <div className="flex gap-2 text-[10px] text-white/50 pt-2 border-t border-white/10">
              <span>
                📍 {availableDrivers.filter(d => d.distance_km != null).length} with location
              </span>
              <span>
                🏠 {availableDrivers.filter(d => d.is_in_house).length} In-House
              </span>
              <span>
                🤝 {availableDrivers.filter(d => !d.is_in_house).length} 3PL
              </span>
            </div>
          </div>
        </>
      );
    }
    
    // Tracking mode sidebar (existing)
    return (
      <>
        <div className="p-4 lg:p-5 border-b border-gray-200/20 shrink-0 bg-secondary">
          <h3 className="font-bold text-white/90 text-xs sm:text-sm uppercase tracking-wider mb-3">
            Live Delivery Personnel
          </h3>
          
          <div className="flex gap-1.5">
            <button
              onClick={() => setDriverFilter("all")}
              className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                driverFilter === "all"
                  ? "bg-white text-secondary shadow-md"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDriverFilter("in_house")}
              className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                driverFilter === "in_house"
                  ? "bg-white text-secondary shadow-md"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              In-House
            </button>
            <button
              onClick={() => setDriverFilter("third_party")}
              className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                driverFilter === "third_party"
                  ? "bg-white text-secondary shadow-md"
                  : "bg-white/20 text-white hover:bg-white/30"
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
          {Array.from(driverGroups.entries()).map(
            ([driverName, orders], idx) => {
              const isActive = orders.some((o) => o.id === activeOrderId);
              const color = driverColorMap.get(driverName);
              const count = orders.length;
              const speed = orders[0]?.delivery.speed;
              const isInHouse = orders[0]?.delivery.is_in_house;

              let distanceDisplay: string | null = null;
              const driverLat = orders[0]?.delivery.current_lat;
              const driverLng = orders[0]?.delivery.current_lng;
              if (driverLat != null && driverLng != null) {
                const distances = orders.map((o) =>
                  haversine(
                    driverLat,
                    driverLng,
                    o.delivery.customer_lat!,
                    o.delivery.customer_lon!
                  )
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
                        {isInHouse ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                            In-House
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                            3PL
                          </span>
                        )}
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
                      {orders.length} destination{orders.length > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </>
    );
  }, [
    mode,
    loadingDrivers,
    filteredAvailableDrivers,
    searchTerm,
    driverFilter,
    pendingDriverId,
    selectedDriverId,
    availableDrivers,
    driverGroups,
    activeOrderId,
    driverColorMap,
    loading,
  ]);

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
            {mode === "driver_selection" ? "Select Delivery Driver" : "Live Vehicle Tracking"}
          </h2>
          {mode === "driver_selection" && selectedOrder && (
            <span className="text-xs text-gray-500 truncate">
              #{selectedOrder.id} · {selectedOrder.recipient_name || "Customer"}
            </span>
          )}
          <span className="hidden sm:flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full shrink-0">
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
              aria-label={followDriver ? "Stop following driver" : "Follow active driver"}
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

      {/* Mobile filter buttons - only in tracking mode */}
      {mode === "tracking" && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2 flex gap-2">
          <button
            onClick={() => setDriverFilter("all")}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              driverFilter === "all" ? "bg-secondary text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setDriverFilter("in_house")}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              driverFilter === "in_house" ? "bg-secondary text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            In-House
          </button>
          <button
            onClick={() => setDriverFilter("third_party")}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              driverFilter === "third_party" ? "bg-secondary text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            3PL
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile backdrop */}
        <div
          className={`lg:hidden fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
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
            isSidebarOpen ? "w-[320px]" : "w-0 border-r-0"
          }`}
        >
          {renderSidebar()}
        </div>

        {/* Map */}
        <div className="flex-1 relative bg-gray-100 h-full w-full min-h-[400px] sm:min-h-[500px]">
          {loading && !lastUpdated && !driverGroups.size && !availableDrivers.length && (
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
          {!loading && !error && mode === "driver_selection" && !selectedOrder && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 p-6">
              <MapPin className="h-16 w-16 text-amber-400 mb-4" />
              <h3 className="font-bold text-gray-800 text-lg mb-2">Order not found</h3>
              <p className="text-sm text-gray-500">The selected delivery could not be found.</p>
            </div>
          )}
          {!loading && !error && mode === "driver_selection" && selectedOrder && !getCustomerLocation(selectedOrder) && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-amber-500/95 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg text-xs font-semibold flex items-center gap-2 border border-white/20 pointer-events-none">
              <MapPin className="h-3.5 w-3.5" />
              <span>Customer GPS coordinates not set · Showing available drivers near store</span>
            </div>
          )}
          <div ref={containerRef} className="w-full h-full z-0" />
          
          {/* Confirm assignment panel */}
          {showConfirmPanel && pendingDriverId && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 animate-in slide-in-from-bottom-4 duration-300">
              {(() => {
                const driver = enhancedDrivers.find(d => d.id === pendingDriverId) || availableDrivers.find(d => d.id === pendingDriverId);
                if (!driver) return null;
                const color = getDriverColor(enhancedDrivers.indexOf(driver));
                const hasLocation = driver.distance_km != null;
                
                return (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {getInitials(driver.name)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          {driver.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {driver.is_in_house ? "In-House" : "3PL"} · {getVehicleName(driver.vehicle_type)}
                          {hasLocation && ` · ${formatDistance(driver.distance_km)} away`}
                          {!hasLocation && " · Location unavailable"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleConfirmAssignment}
                        disabled={isAssigning}
                        className="flex-1 bg-secondary text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isAssigning ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            Confirm Assignment
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleCancelSelection}
                        className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          
          {/* Bottom stats - only in tracking mode */}
          {mode === "tracking" && !loading && !error && driverGroups.size > 0 && (
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
                <div className="mt-2 pt-2 border-t border-gray-100 flex gap-3 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-emerald-600" />
                    {stats.inHouseCount} In-House
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-blue-600" />
                    {stats.thirdPartyCount} 3PL
                  </span>
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

// ── StatsCard component ────────────────────────────────────────────
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
      <div className="text-lg font-extrabold text-gray-800 truncate">{value}</div>
      <div className="text-[10px] sm:text-xs text-gray-500 font-medium truncate">{title}</div>
    </div>
  </div>
));

// ── Popup generators ─────────────────────────────────────────────────
const createCustomerPopup = (orders: DeliveryWithLocation[]): string => {
  const listItems = orders
    .map(
      (o) =>
        `<li style="margin-bottom:6px;"><b>#${o.id}-${o.master_order_id || "N/A"}</b> – ${escapeHtml(o.recipient_name || "N/A")}</li>`
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
  isInHouse?: boolean
): string => {
  const safeName = escapeHtml(driverName);
  const safePhone = phone ? escapeHtml(phone) : "";
  const driverLat = orders[0]?.delivery.current_lat;
  const driverLng = orders[0]?.delivery.current_lng;
  const image = orders[0]?.delivery.delivery_person_image;
  const driverType = isInHouse ? "In-House" : "3PL Partner";

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
            🟢 Live · ${driverType} · ${orders.length} order${orders.length > 1 ? "s" : ""}
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

// ── Selection driver popup ──────────────────────────────────────────
const createSelectionDriverPopup = (driver: AvailableDriver, color: string): string => {
  const safeName = escapeHtml(driver.name);
  const safePhone = driver.phone ? escapeHtml(driver.phone) : "";
  const hasLocation = driver.distance_km != null;
  const driverType = driver.is_in_house ? "In-House" : "3PL Partner";
  const locationSource = driver.location_source || "unknown";
  
  const locationLabel = locationSource === 'live' ? '🟢 Live location' :
                        locationSource === 'current' ? '📡 Current location' :
                        locationSource === 'last_known' ? '🕒 Last known' :
                        locationSource === 'api' ? '📊 Distance estimate' :
                        '⚪ Location unavailable';

  return `
    <div style="font-family:Inter,system-ui,sans-serif;min-width:240px;max-width:320px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <div style="
          background:${color}20;
          border-radius:50%;
          width:48px;
          height:48px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:28px;
          border:2px solid ${color};
        ">
          🚚
        </div>
        <div>
          <div style="font-size:17px;font-weight:700;color:#111827;">
            ${safeName}
          </div>
          <div style="font-size:12px;color:${color};display:flex;align-items:center;gap:4px;">
            ${driverType} · ${getVehicleName(driver.vehicle_type)}
          </div>
        </div>
      </div>

      <div style="background:#F9FAFB;border-radius:12px;padding:12px;margin-bottom:12px;">
        ${hasLocation ? `
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13px;color:#374151;">Distance from customer</span>
            <span style="font-size:15px;font-weight:700;color:#1F2937;">${formatDistance(driver.distance_km)}</span>
          </div>
          <div style="margin-top:6px;font-size:11px;color:#6B7280;">
            ${locationLabel}
          </div>
        ` : `
          <div style="font-size:13px;color:#6B7280;text-align:center;">
            ⚪ Distance unavailable
          </div>
          <div style="font-size:11px;color:#6B7280;text-align:center;margin-top:4px;">
            No GPS coordinates available
          </div>
        `}
      </div>

      ${safePhone ? `
        <a
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
            margin-top:8px;
          "
        >
          📞 Call ${safeName}
        </a>
      ` : ''}
      
      <button
        style="
          display:block;
          width:100%;
          background:#8B5CF6;
          color:white;
          text-align:center;
          padding:10px;
          border-radius:10px;
          border:none;
          font-weight:700;
          font-size:14px;
          margin-top:8px;
          cursor:pointer;
        "
        onclick="document.dispatchEvent(new CustomEvent('selectDriver', { detail: { driverId: ${driver.id} } }))"
      >
        Select Driver
      </button>
    </div>
  `;
};

// ── Marker icon helpers ────────────────────────────────────────────────
const makeCustomerIcon = (count: number): Leaflet.DivIcon => {
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
  isInHouse?: boolean
): Leaflet.DivIcon => {
  const L = (window as any).L;
  const typeLabel = isInHouse ? "In-House" : "3PL";
  return L.divIcon({
    className: "driver-marker-grouped",
    html: `
      <div style="position:relative;display:flex;align-items:center;gap:6px;padding:4px 10px 4px 4px;border-radius:999px;rgba(0,0,0,0.2);white-space:nowrap;font-family:Inter,system-ui,sans-serif;cursor:pointer;">
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
          <span style="font-size:11px;font-weight:600;color:${color};display:flex;align-items:center;gap:4px;">🟢 Live · ${typeLabel} · ${count} order${count > 1 ? "s" : ""}</span>
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

// Custom event listener for driver selection from popup
if (typeof window !== 'undefined') {
  document.addEventListener('selectDriver', ((e: CustomEvent) => {
    const { driverId } = e.detail;
    // This will be handled by the component via ref
    // The component will need to expose a method or use a global state
  }) as EventListener);
}