"use client";

import { useState, useEffect, useCallback } from "react";
import { apiUrl } from "./api-config";
import type { CatalogProduct } from "./catalog";

const GUEST_WISHLIST_KEY = "san_guest_wishlist";
const WISHLIST_EVENT_NAME = "san_wishlist_updated";

export function useWishlist() {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Sync wishlist from localStorage and optional logged in customer
  const loadWishlist = useCallback(() => {
    try {
      if (typeof window === "undefined") return;
      const stored = localStorage.getItem(GUEST_WISHLIST_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) {
        setWishlistIds(parsed);
      }
    } catch (err) {
      console.warn("Failed to read wishlist from localStorage:", err);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    loadWishlist();

    const handleCustomEvent = () => {
      loadWishlist();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === GUEST_WISHLIST_KEY) {
        loadWishlist();
      }
    };

    window.addEventListener(WISHLIST_EVENT_NAME, handleCustomEvent);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(WISHLIST_EVENT_NAME, handleCustomEvent);
      window.removeEventListener("storage", handleStorage);
    };
  }, [loadWishlist]);

  const isWishlisted = useCallback(
    (productId: string) => {
      return wishlistIds.includes(productId);
    },
    [wishlistIds]
  );

  const toggleWishlist = useCallback(
    async (product: CatalogProduct): Promise<{ added: boolean }> => {
      if (typeof window === "undefined") return { added: false };

      const currentlySaved = wishlistIds.includes(product.id);
      let updated: string[];

      if (currentlySaved) {
        updated = wishlistIds.filter((id) => id !== product.id);
      } else {
        updated = [...wishlistIds, product.id];
      }

      setWishlistIds(updated);
      try {
        localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event(WISHLIST_EVENT_NAME));
      } catch (e) {
        console.error("Failed to save wishlist in storage:", e);
      }

      // Opportunistic API sync if customer session exists
      try {
        const sessionUser = localStorage.getItem("san_customer_user");
        if (sessionUser) {
          const user = JSON.parse(sessionUser);
          if (user?.email) {
            if (currentlySaved) {
              await fetch(
                apiUrl(`/api/customer/wishlist/${product.id}?email=${encodeURIComponent(user.email)}`),
                { method: "DELETE" }
              ).catch(() => {});
            } else {
              await fetch(apiUrl("/api/customer/wishlist"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  productId: product.id,
                  customerEmail: user.email,
                }),
              }).catch(() => {});
            }
          }
        }
      } catch {
        // Silently tolerate backend sync failure in guest mode
      }

      return { added: !currentlySaved };
    },
    [wishlistIds]
  );

  return {
    wishlistIds,
    wishlistCount: wishlistIds.length,
    isWishlisted,
    toggleWishlist,
    isReady,
  };
}
