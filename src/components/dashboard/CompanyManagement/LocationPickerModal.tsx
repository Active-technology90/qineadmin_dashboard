// src/components/dashboard/CompanyManagement/LocationPickerModal.tsx
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, MapPin, Search, Navigation, Check, Loader2 } from "lucide-react";

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lat: string, lon: string) => void;
  initialLat?: string;
  initialLon?: string;
}

export default function LocationPickerModal({
  isOpen,
  onClose,
  onSelect,
  initialLat,
  initialLon,
}: LocationPickerModalProps) {
  const [lat, setLat] = useState<string>(initialLat || "9.03");
  const [lon, setLon] = useState<string>(initialLon || "38.74");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapContainerId = "leaflet-location-picker-map";

  // Load Leaflet dynamically to prevent build and package dependency issues
  useEffect(() => {
    if (!isOpen) return;

    // Check if Leaflet is already loaded
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    // Add Leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.id = "leaflet-css";
    if (!document.getElementById("leaflet-css")) {
      document.head.appendChild(link);
    }

    // Add Leaflet JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.id = "leaflet-js";
    script.onload = () => {
      setLeafletLoaded(true);
    };
    if (!document.getElementById("leaflet-js")) {
      document.head.appendChild(script);
    } else {
      setLeafletLoaded(true);
    }
  }, [isOpen]);

  // Initialize and update Map
  useEffect(() => {
    if (!isOpen || !leafletLoaded) return;

    const L = (window as any).L;
    if (!L) return;

    const startLat = parseFloat(lat) || 9.03;
    const startLon = parseFloat(lon) || 38.74;

    // Cleanup previous map instance if it exists
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Initialize Map
    const map = L.map(mapContainerId, {
      zoomControl: false,
    }).setView([startLat, startLon], 13);
    mapRef.current = map;

    // Add Zoom Control at bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Add Tile Layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // Create custom red Pin Icon
    const redIcon = L.icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    // Create Draggable Marker
    const marker = L.marker([startLat, startLon], {
      draggable: true,
      icon: redIcon,
    }).addTo(map);
    markerRef.current = marker;

    // Handle marker drag
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setLat(pos.lat.toFixed(6));
      setLon(pos.lng.toFixed(6));
    });

    // Handle map click to place marker
    map.on("click", (e: any) => {
      marker.setLatLng(e.latlng);
      setLat(e.latlng.lat.toFixed(6));
      setLon(e.latlng.lng.toFixed(6));
    });

    // Invalidate map size when container size changes (e.g., sidebar opens/resizes)
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    });
    const mapContainer = document.getElementById(mapContainerId);
    if (mapContainer) {
      resizeObserver.observe(mapContainer);
    }

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOpen, leafletLoaded]);

  // Handle address search using free Nominatim API
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapRef.current) return;

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery,
        )}&limit=1`,
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const firstResult = data[0];
        const searchLat = parseFloat(firstResult.lat);
        const searchLon = parseFloat(firstResult.lon);

        // Update Map view
        mapRef.current.setView([searchLat, searchLon], 15);

        // Update Marker position
        if (markerRef.current) {
          markerRef.current.setLatLng([searchLat, searchLon]);
        }

        // Update state
        setLat(searchLat.toFixed(6));
        setLon(searchLon.toFixed(6));
      } else {
        alert("Location not found. Please try a different search term.");
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setSearching(false);
    }
  };

  // Get User's Current GPS Location
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const curLat = position.coords.latitude;
        const curLon = position.coords.longitude;

        if (mapRef.current) {
          mapRef.current.setView([curLat, curLon], 16);
        }

        if (markerRef.current) {
          markerRef.current.setLatLng([curLat, curLon]);
        }

        setLat(curLat.toFixed(6));
        setLon(curLon.toFixed(6));
        setDetecting(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(
          "Unable to detect current location. Please grant location permissions.",
        );
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const handleSave = () => {
    onSelect(lat, lon);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full h-[100dvh] max-h-[100dvh] rounded-none sm:rounded-2xl md:rounded-3xl md:max-w-4xl md:h-[85vh] md:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 via-white to-indigo-50/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2.5 bg-gradient-to-br from-[#6750A4]/15 to-[#8B6BB5]/15 rounded-2xl shadow-inner shrink-0">
              <MapPin className="h-5 w-5 text-[#6750A4]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight truncate">
                Select Company Location
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-0.5 line-clamp-2">
                Search, drag the pin, or click anywhere on the map to pinpoint
                coordinates.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-full transition-all duration-200 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Map Area */}
          <div
            className="
    bg-white
    w-full
    h-[100dvh]
    max-h-[100dvh]

```
xs:h-[95dvh]
xs:max-h-[95dvh]
sm:h-[95dvh]
sm:max-h-[95dvh]

md:h-[85vh]
md:max-h-[85vh]
md:max-w-4xl

rounded-none
sm:rounded-2xl
md:rounded-3xl

flex
flex-col

overflow-hidden
shadow-2xl
border
border-gray-100
```

"
          >
            {!leafletLoaded ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 gap-3">
                <Loader2 className="h-8 w-8 text-[#6750A4] animate-spin" />
                <p className="text-xs text-gray-500 font-medium">
                  Initializing Map Engine...
                </p>
              </div>
            ) : null}

            {/* Actual Map Div */}
            <div id={mapContainerId} className="w-full h-full z-0" />

            {/* Geolocation Button Overlaid on Map */}
            {leafletLoaded && (
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detecting}
                className="absolute top-4 left-4 z-10 bg-white hover:bg-gray-50 text-gray-800 p-3 rounded-2xl shadow-lg border border-gray-100 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 font-bold text-xs max-w-[calc(100%-32px)]"
              >
                {detecting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#6750A4]" />
                ) : (
                  <Navigation className="h-4 w-4 text-[#6750A4]" />
                )}
                <span className="truncate">
                  {detecting ? "Locating..." : "Use My GPS Location"}
                </span>
              </button>
            )}
          </div>

          {/* Sidebar / Coordinates Info */}
          <div className="flex-1 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col bg-gradient-to-b from-white to-gray-50/50 md:w-80 md:flex-none">
            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Geocoding Search Form */}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search address or area..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6750A4]/20 focus:border-[#6750A4] transition-all bg-white shadow-sm"
                />
                <Search className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-gray-400" />
                <button
                  type="submit"
                  disabled={searching}
                  className="absolute right-2.5 top-2 p-1.5 bg-gray-100 hover:bg-[#6750A4] text-gray-500 hover:text-white rounded-lg transition-all"
                >
                  {searching ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                </button>
              </form>

              {/* Coordinates Card */}
              <div className="bg-gradient-to-br from-purple-50/60 to-indigo-50/60 p-4 rounded-2xl border border-purple-100/50 space-y-3 shadow-inner">
                <h4 className="text-[10px] sm:text-xs text-[#6750A4] font-bold uppercase tracking-wider">
                  Target Coordinates
                </h4>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-gray-400 uppercase">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      className="w-full mt-1 bg-white border border-gray-200 rounded-lg p-2 text-xs sm:text-sm font-mono font-bold text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-gray-400 uppercase">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={lon}
                      onChange={(e) => setLon(e.target.value)}
                      className="w-full mt-1 bg-white border border-gray-200 rounded-lg p-2 text-xs sm:text-sm font-mono font-bold text-gray-800"
                    />
                  </div>
                </div>
              </div>

              {/* Instruction Note */}
              <div className="p-3.5 bg-amber-50/60 border border-amber-100 rounded-xl">
                <p className="text-[10px] sm:text-xs text-amber-700 leading-relaxed font-medium break-words">
                  💡 Accurate coordinates are vital! Qine leverages these
                  coordinates to compute precise delivery routes, delivery fees,
                  and order dispatch sequences.
                </p>
              </div>
            </div>

            {/* Confirm Actions (sticky at bottom on desktop) */}
            <div className="p-4 sm:p-5 border-t border-gray-100 flex flex-col sm:flex-row gap-3 shrink-0 bg-white/80 backdrop-blur-sm">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-3 bg-[#6750A4] hover:bg-[#5b4694] text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-purple-100 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                Apply Location
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
