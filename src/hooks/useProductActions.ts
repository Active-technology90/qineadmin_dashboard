import { useState, useCallback } from "react";
import Toast from "react-native-toast-message";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { mapProductToCartItem, mapProductToWishlistItem } from "@/utils/mappers";

export const useProductActions = (product: any) => {
  const [isLoading, setIsLoading] = useState(false);
  const { addToCart, removeFromCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const productId = product?.id;
  const inCart = productId ? isInCart(productId) : false;
  const inWishlist = productId ? isInWishlist(productId) : false;

  const handleCartPress = useCallback(async () => {
    if (!product || isLoading) return;
    setIsLoading(true);

    try {
      if (inCart) {
        await removeFromCart(productId);
        Toast.show({
          type: "info",
          text1: "Removed from Cart",
          text2: `${product.title} removed from your cart.`,
          position: "top",
          visibilityTime: 2000,
        });
      } else {
        if (product.stock !== undefined && product.stock <= 0) {
          Toast.show({
            type: "error",
            text1: "Out of Stock",
            text2: "This item is currently unavailable.",
            position: "top",
            visibilityTime: 2000,
          });
          setIsLoading(false);
          return;
        }

        const cartItem = mapProductToCartItem(product);
        await addToCart(cartItem);
        Toast.show({
          type: "success",
          text1: "Added to Cart",
          text2: `${product.title} added to your cart.`,
          position: "top",
          visibilityTime: 2000,
        });
      }
    } catch (error) {
      console.error("Cart error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update cart. Please try again.",
        position: "top",
        visibilityTime: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [product, productId, inCart, isLoading, addToCart, removeFromCart]);

  const handleWishlistPress = useCallback(async () => {
    if (!product || isLoading) return;
    setIsLoading(true);

    try {
      const wishlistItem = mapProductToWishlistItem(product);
      await toggleWishlist(wishlistItem);
      const nowInWishlist = !inWishlist; // toggleWishlist flips it
      Toast.show({
        type: nowInWishlist ? "success" : "info",
        text1: nowInWishlist ? "Added to Wishlist" : "Removed from Wishlist",
        text2: `${product.title} ${nowInWishlist ? "added to" : "removed from"} your wishlist.`,
        position: "top",
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error("Wishlist error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update wishlist. Please try again.",
        position: "top",
        visibilityTime: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [product, inWishlist, isLoading, toggleWishlist]);

  return {
    handleCartPress,
    handleWishlistPress,
    isLoading,
    inCart,
    inWishlist,
    isOutOfStock: product?.stock !== undefined && product?.stock <= 0
  };
};
