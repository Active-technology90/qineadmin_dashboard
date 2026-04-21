import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useProductDetail } from "@/hooks/useProductDetail";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Share } from "react-native";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import * as Linking from "expo-linking";

const FALLBACK_IMAGE = "https://picsum.photos/400/400";

type ModalConfig = {
  visible: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'primary' | 'secondary' | 'outline' | 'ghost';
  onConfirm: () => void;
  onCancel?: () => void;
};

export const useProductDetailLogic = () => {
  const router = useRouter();
  const { id, company_slug } = useLocalSearchParams<{ id: string; company_slug?: string }>();
  const { product, loading, error } = useProductDetail(company_slug, id);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    visible: false,
    title: '',
    description: '',
    confirmText: 'OK',
    onConfirm: () => {},
  });

  const isFavorite = product ? isInWishlist(String(product.id)) : false;
  const isOutOfStock = (product?.stock ?? 1) <= 0;

  const increaseQty = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuantity((prev) => prev + 1);
  }, []);

  const decreaseQty = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  }, []);

  const showModal = (config: Omit<ModalConfig, 'visible'>) => {
    setModalConfig({
      visible: true,
      ...config,
    });
  };

  const hideModal = () => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
  };

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    if (isOutOfStock) {
      Toast.show({
        type: 'error',
        text1: 'Out of Stock',
        text2: 'This product is currently out of stock.',
      });
      return;
    }
    addToCart({
      id: product.id,
      company_product_id: product.id,
      title: product.title,
      price: parseFloat(product.price),
      image: product.primary_image?.image || FALLBACK_IMAGE,
      company_name: product.company.name,
      company_slug: product.company.slug,
      qty: quantity,
      stock: product.stock,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    showModal({
      title: "Added to Cart",
      description: `${product.title} added to your cart.`,
      confirmText: "View Cart",
      cancelText: "Continue Shopping",
      variant: "primary",
      onConfirm: () => {
        hideModal();
        router.push("/cart");
      },
      onCancel: () => {
        hideModal();
        router.push(`/products`);
      },
    });
  }, [product, addToCart, quantity, isOutOfStock, router]);

  const handleBuyNow = useCallback(async () => {
    if (!product) return;
    if (isOutOfStock) {
      Toast.show({
        type: 'error',
        text1: 'Out of Stock',
        text2: 'This product is currently out of stock.',
      });
      return;
    }
    try {
      await addToCart({
        id: product.id,
        company_product_id: product.id,
        title: product.title,
        price: parseFloat(product.price),
        image: product.primary_image?.image || FALLBACK_IMAGE,
        company_name: product.company.name,
        company_slug: product.company.slug,
        qty: quantity,
        stock: product.stock,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push("/checkout");
    } catch (error) {
      console.error("Buy now error:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to process. Please try again.',
      });
    }
  }, [product, addToCart, quantity, isOutOfStock, router]);

  const handleShare = useCallback(async () => {
    if (!product) return;
    try {
      // Create a deep link specifically for this product
      const productUrl = Linking.createURL(`product/${product.id}`, {
        queryParams: { company_slug: product.company.slug }
      });

      await Share.share({
        title: product.title,
        message: `Check out ${product.title} for ${product.price} Birr!\n\n${productUrl}`,
        url: productUrl, // iOS uses this field explicitly to make links clickable
      });
    } catch (error) {
      console.warn("Share failed", error);
    }
  }, [product]);

  const handleToggleWishlist = useCallback(async () => {
    if (!product) return;
    try {
      await toggleWishlist({
        id: String(product.id),
        name: product.title,
        price: parseFloat(product.price),
        image: product.primary_image?.image || FALLBACK_IMAGE,
        rating: "0",
        description: product.description || "",
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("Wishlist error:", error);
      Toast.show({
        type: 'error',
        text1: 'Wishlist Error',
        text2: 'Failed to update wishlist.',
      });
    }
  }, [product, toggleWishlist]);

  const galleryImages = product?.images?.length
    ? product.images.map((img: any) => img.image)
    : product?.primary_image?.image
      ? [product.primary_image.image]
      : [FALLBACK_IMAGE];

  const handleImagePress = (index: number) => {
    setSelectedImageIdx(index);
    setZoomVisible(true);
  };

  const updateQty = useCallback((newQty: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuantity(newQty);
  }, []);

  return {
    product,
    loading,
    error,
    quantity,
    isFavorite,
    isOutOfStock,
    selectedImageIdx,
    zoomVisible,
    galleryImages,
    increaseQty,
    decreaseQty,
    updateQty,
    handleAddToCart,
    handleBuyNow,
    handleShare,
    handleToggleWishlist,
    handleImagePress,
    setZoomVisible,
    router,
    modalConfig,
    hideModal,
  };
};