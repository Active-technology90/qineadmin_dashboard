// app/checkout/hooks/useCheckoutData.ts
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import * as Location from "expo-location";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import {
  addShippingAddress,
  getShippingAddresses,
  checkout,
  getCurrentCart,
} from "@/services/api";

const ADDIS_COORDS: [number, number] = [38.74, 9.03];

export function useCheckoutData() {
  const router = useRouter();
  const { syncCartFromServer } = useCart();
  const { isAuthenticated, user } = useAuth();

  // Core State
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"chapa" | "bank_transfer" | "cod" | "">("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cartId, setCartId] = useState<number | null>(null);
  const [totalAmount, setTotalAmount] = useState<string>("0");
  const [vendorCount, setVendorCount] = useState(0);

  // Address State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any | null>(null);
  const [recipientName, setRecipientName] = useState(user?.username || "");
  const [recipientPhone, setRecipientPhone] = useState(user?.phone_number || "");
  const [city, setCity] = useState("Addis Ababa");
  const [subCity, setSubCity] = useState("");
  const [woreda, setWoreda] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [markerCoords, setMarkerCoords] = useState<[number, number]>(ADDIS_COORDS);
  const [cameraCoords, setCameraCoords] = useState<[number, number]>(ADDIS_COORDS);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Initialize
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace({
        pathname: "/(auth)/signin",
        params: { redirect: "/checkout" },
      });
      return;
    }
    initializeCheckout();
  }, [isAuthenticated]);

  const initializeCheckout = async () => {
    try {
      setLoading(true);
      const cartResponse = await getCurrentCart();
      if (!cartResponse.data.items || cartResponse.data.items.length === 0) {
        router.replace("/(tabs)/products");
        return;
      }
      setCartId(cartResponse.data.id);
      setTotalAmount(cartResponse.data.total);
      setVendorCount(cartResponse.data.vendor_count || 1);

      if ((cartResponse.data.vendor_count || 1) > 1) {
        setPaymentMethod("chapa");
      }

      const addrResponse = await getShippingAddresses();
      setAddresses(addrResponse.data);
      const defaultAddr = addrResponse.data.find((a) => a.is_default) || addrResponse.data[0];
      if (defaultAddr) {
        handleSelectAddress(defaultAddr);
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({});
          const coords: [number, number] = [location.coords.longitude, location.coords.latitude];
          setMarkerCoords(coords);
          setCameraCoords(coords);
        }
      }
    } catch (error) {
      console.error("Checkout init error:", error);
    } finally {
      setLoading(false);
    }
  };

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
  };

  const handleProceedToPay = async (
    router: any,
    cartId: number | null,
    fulfillmentType: string,
    paymentMethod: string,
    selectedAddress: any,
    isManualMode: boolean,
    recipientName: string,
    recipientPhone: string,
    city: string,
    subCity: string,
    woreda: string,
    houseNumber: string,
    markerCoords: [number, number]
  ) => {
    if (!paymentMethod) {
      Alert.alert("Missing Info", "Please select a payment method");
      return;
    }
    if (fulfillmentType === "delivery") {
      if (!recipientName.trim() || !recipientPhone.trim()) {
        Alert.alert("Missing Info", "Please fill in recipient details");
        return;
      }
    }

    try {
      setProcessing(true);
      let finalAddressId = selectedAddress?.id;
      if (fulfillmentType === "delivery") {
        if (isManualMode || !finalAddressId) {
          const newAddrResponse = await addShippingAddress({
            recipient_name: recipientName,
            phone_number: recipientPhone,
            city,
            sub_city: subCity,
            woreda,
            house_number: houseNumber,
            latitude: Number(markerCoords[1].toFixed(7)),
            longitude: Number(markerCoords[0].toFixed(7)),
          });
          finalAddressId = newAddrResponse.data.id;
        }
      }
      if (!cartId) throw new Error("Cart ID not found");

      const checkoutData = {
        cart_id: cartId,
        payment_method: paymentMethod,
        fulfillment_type: fulfillmentType,
        shipping_address_id: finalAddressId,
      };

      const response = await checkout(checkoutData);
      const orderId = response.data.master_order_id;
      await syncCartFromServer();

      if (paymentMethod === "chapa") {
        router.replace({
          pathname: "/payment",
          params: { paymentUrl: response.data.payment_url, orderId: orderId.toString() },
        });
      } else if (paymentMethod === "bank_transfer") {
        router.replace({
          pathname: "/payment/bank",
          params: { orderId: orderId.toString(), total: totalAmount },
        });
      } else {
        router.replace({
          pathname: "/order-success",
          params: { orderId: orderId.toString() },
        });
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        Object.values(error.response?.data || {}).join(", ") ||
        "Failed to process checkout";
      Alert.alert("Checkout Error", errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  // Inside useCheckoutData.ts – return section
return {
  loading,
  cartId,
  totalAmount,
  vendorCount,
  fulfillmentType,
  setFulfillmentType,
  paymentMethod,
  setPaymentMethod,
  addresses,
  selectedAddress,
  setSelectedAddress,       
  recipientName,
  setRecipientName,        
  recipientPhone,
  setRecipientPhone,       
  city,
  setCity,                 
  subCity,
  setSubCity,              
  woreda,
  setWoreda,               
  houseNumber,
  setHouseNumber,          
  markerCoords,
  setMarkerCoords,         
  cameraCoords,
  setCameraCoords,         
    mapLoaded,
  setMapLoaded,
  isManualMode,
  setIsManualMode,
  isEditing,
  setIsEditing,
  handleProceedToPay,
  processing,
  isAuthenticated,
};
}