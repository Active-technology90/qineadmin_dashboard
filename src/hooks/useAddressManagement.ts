import { useState } from "react";
import * as Location from "expo-location";

interface AddressManagementProps {
  setSelectedAddress: (addr: any) => void;
  setRecipientName: (val: string) => void;
  setRecipientPhone: (val: string) => void;
  setCity: (val: string) => void;
  setSubCity: (val: string) => void;
  setWoreda: (val: string) => void;
  setHouseNumber: (val: string) => void;
  setMarkerCoords: (coords: [number, number]) => void;
  setCameraCoords: (coords: [number, number]) => void;
  setIsManualMode: (val: boolean) => void;
  isManualMode: boolean; // add this
  addresses: any[];
  selectedAddress: any | null;
}

export function useAddressManagement({
  setSelectedAddress,
  setRecipientName,
  setRecipientPhone,
  setCity,
  setSubCity,
  setWoreda,
  setHouseNumber,
  setMarkerCoords,
  setCameraCoords,
  setIsManualMode,
  isManualMode, // receive it
  addresses,
  selectedAddress,
}: AddressManagementProps) {
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);

  const handleSelectAddress = (addr: any) => {
    setIsManualMode(false);
    setSelectedAddress(addr);
    setRecipientName(addr.recipient_name);
    setRecipientPhone(addr.phone_number);
    setCity(addr.city || "Addis Ababa");
    setSubCity(addr.sub_city || "");
    setWoreda(addr.woreda || "");
    setHouseNumber(addr.house_number || "");
    if (addr.latitude && addr.longitude) {
      const coords: [number, number] = [Number(addr.longitude), Number(addr.latitude)];
      setMarkerCoords(coords);
      setCameraCoords(coords);
    }
    setIsAddressModalVisible(false);
  };

  const handleSwitchToManual = async () => {
    setIsManualMode(true);
    setSelectedAddress(null);
    // Optionally center on current location
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        const coords: [number, number] = [location.coords.longitude, location.coords.latitude];
        setMarkerCoords(coords);
        setCameraCoords(coords);
      }
    } catch (e) {
      console.log("Error getting location", e);
    }
    setIsAddressModalVisible(false);
  };

/**
 * Handles a map press event.
 * If the map is in manual mode, the press event is ignored.
 * If the map is not in manual mode, the coordinates of the press event are extracted and set as the marker coordinates.
 * @param {Object} e - The event object passed to the event handler.
 */
// const handleMapPress = (e: any) => {
//   if (!isManualMode) return;
//   // Press event usually gives geometry coordinates directly
//   const coords = e.geometry?.coordinates;
//   if (coords) {
//     setMarkerCoords(coords);
//   }

// Inside useAddressManagement.ts
const handleCameraChange = (coords: [number, number]) => {
  if (!isManualMode) return;
  console.log("Map center changed to:", coords);
  setMarkerCoords(coords);
  setCameraCoords(coords);
};

const handleMapPress = (coords: [number, number]) => {
  if (!isManualMode) return;
  console.log("Map tapped at:", coords);
  setMarkerCoords(coords);
  setCameraCoords(coords);
};
  return {
    isAddressModalVisible,
    setIsAddressModalVisible,
    handleSelectAddress,
    handleSwitchToManual,
    handleMapPress,
    handleCameraChange,
  };
}