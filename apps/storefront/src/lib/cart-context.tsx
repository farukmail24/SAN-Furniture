"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { type CatalogProduct } from "./catalog";
import { calculateNetAndVat, type VATBreakdown } from "@san-furniture/types";

export interface CartItem {
  id: string; // unique item id (productId + selectedOption hash)
  product: CatalogProduct;
  quantity: number;
  selectedFabric?: string;
  selectedFinish?: string;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: CatalogProduct, quantity?: number, options?: { fabric?: string; finish?: string }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalCount: number;
  subtotalPennies: number;
  vatBreakdown: VATBreakdown;
  freeDeliveryThresholdPennies: number;
  freeDeliveryRemainingPennies: number;
  freeDeliveryProgressPercent: number;
  hasFreeDelivery: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "san_furniture_cart_v1";
const FREE_DELIVERY_THRESHOLD_PENNIES = 50000; // £500.00

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Restore cart from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Normalize and defensively filter corrupt or legacy cart items
          const safeItems: CartItem[] = parsed
            .filter((item) => item && (item.product || (item as any).title || (item as any).id))
            .map((item) => {
              const product = item.product || {
                id: (item as any).productId || item.id || "san_prod",
                title: (item as any).title || "Handcrafted Furniture Item",
                handle: (item as any).handle || "furniture",
                pricePennies: Number((item as any).pricePennies) || 0,
                thumbnailUrl: (item as any).thumbnailUrl || "/images/placeholder.svg",
                category: (item as any).category || "living_room",
                specs: {
                  color: (item as any).selectedFinish || "Standard Finish",
                  material: (item as any).selectedFabric || "Premium Timber",
                },
              };
              return {
                id: item.id || `item_${product.id}`,
                product,
                quantity: Math.max(1, Number(item.quantity) || 1),
                selectedFabric: item.selectedFabric,
                selectedFinish: item.selectedFinish,
              };
            });
          setItems(safeItems);
        }
      }
    } catch {
      // LocalStorage access might fail in strict private browsing
    } finally {
      setHasHydrated(true);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (hasHydrated) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch {
        // Handle storage quota issues gracefully
      }
    }
  }, [items, hasHydrated]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen((prev) => !prev);

  const addItem = (
    product: CatalogProduct,
    quantity = 1,
    options?: { fabric?: string; finish?: string }
  ) => {
    const fabric = options?.fabric ?? product?.specs?.material ?? "Standard Timber";
    const finish = options?.finish ?? product?.specs?.color ?? "Standard Finish";
    const itemId = `${product.id}-${fabric}-${finish}`.replace(/\s+/g, "_").toLowerCase();

    setItems((prevItems) => {
      const existing = prevItems.find((item) => item.id === itemId);
      if (existing) {
        return prevItems.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prevItems,
        {
          id: itemId,
          product,
          quantity,
          selectedFabric: fabric,
          selectedFinish: finish,
        },
      ];
    });

    setIsOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0);
  }, [items]);

  const subtotalPennies = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = Number(item?.product?.pricePennies) || 0;
      const qty = Math.max(1, Number(item?.quantity) || 1);
      return sum + price * qty;
    }, 0);
  }, [items]);

  const vatBreakdown = useMemo(() => {
    return calculateNetAndVat(subtotalPennies);
  }, [subtotalPennies]);

  const freeDeliveryRemainingPennies = 0;
  const freeDeliveryProgressPercent = 100;
  const hasFreeDelivery = true; // Free UK Mainland Delivery on all orders!

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCount,
        subtotalPennies,
        vatBreakdown,
        freeDeliveryThresholdPennies: FREE_DELIVERY_THRESHOLD_PENNIES,
        freeDeliveryRemainingPennies,
        freeDeliveryProgressPercent,
        hasFreeDelivery,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
