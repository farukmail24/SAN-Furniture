"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Trash2, Plus, Minus, Truck, ShieldCheck, ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatGBP } from "@san-furniture/types";

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    totalCount,
    subtotalPennies,
    vatBreakdown,
    freeDeliveryRemainingPennies,
    freeDeliveryProgressPercent,
    hasFreeDelivery,
  } = useCart();

  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeCart]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const klarnaMonthlyPennies = Math.round(subtotalPennies / 3);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Shopping Basket"
          className="w-screen max-w-md bg-sand-50 shadow-2xl flex flex-col border-l border-sand-200"
        >
          {/* Header */}
          <div className="p-5 border-b border-sand-200 bg-sand-100/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-navy-900" />
              <h2 className="font-display text-lg font-bold text-navy-950 tracking-tight">
                Your Basket
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sand-200 text-navy-700">
                {totalCount} {totalCount === 1 ? "item" : "items"}
              </span>
            </div>
            <button
              type="button"
              onClick={closeCart}
              aria-label="Close basket"
              className="p-1.5 rounded-full text-navy-600 hover:text-navy-950 hover:bg-sand-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free 2-Man White Glove Delivery Progress Meter */}
          <div className="px-5 py-3.5 bg-sand-200/60 border-b border-sand-200">
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
              <span className="flex items-center gap-1.5 text-navy-900">
                <Truck className="w-4 h-4 text-brass-600" />
                {hasFreeDelivery ? (
                  <span className="text-forest-700 font-semibold">
                    UK Free 2-Man Delivery unlocked!
                  </span>
                ) : (
                  <span>
                    Add{" "}
                    <strong className="text-navy-950">
                      {formatGBP(freeDeliveryRemainingPennies)}
                    </strong>{" "}
                    for Free White Glove Delivery
                  </span>
                )}
              </span>
              <span className="text-navy-600">{freeDeliveryProgressPercent}%</span>
            </div>
            <div className="w-full bg-sand-300 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  hasFreeDelivery ? "bg-forest-600" : "bg-brass-500"
                }`}
                style={{ width: `${freeDeliveryProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-sand-200">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-sand-200 flex items-center justify-center text-navy-400 mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-display text-lg font-bold text-navy-900 mb-1">
                  Your basket is currently empty
                </h3>
                <p className="text-xs text-navy-600 max-w-xs mb-6">
                  Explore our handcrafted British sofas, dining suites, and accent armchairs.
                </p>
                <Link
                  href="/catalog"
                  onClick={closeCart}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-navy-950 text-sand-50 text-xs font-semibold hover:bg-brass-600 transition-colors"
                >
                  Browse Full Collection
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 rounded-md overflow-hidden bg-sand-100 flex-shrink-0 border border-sand-200">
                    <img
                      src={item.product.thumbnailUrl}
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${item.product.handle}`}
                          onClick={closeCart}
                          className="text-xs font-bold text-navy-950 hover:text-brass-600 transition-colors line-clamp-2"
                        >
                          {item.product.title}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.product.title} from basket`}
                          className="text-navy-400 hover:text-brick-600 p-0.5 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-1 text-[11px] text-navy-600">
                        {item.selectedFabric && (
                          <span className="capitalize">{item.selectedFabric}</span>
                        )}
                        {item.selectedFinish && (
                          <>
                            <span>•</span>
                            <span>{item.selectedFinish}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Stepper & Price */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-sand-300 rounded bg-sand-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="p-1 text-navy-700 hover:bg-sand-200 transition-colors rounded-l"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-semibold text-navy-950">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className="p-1 text-navy-700 hover:bg-sand-200 transition-colors rounded-r"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-navy-950">
                          {formatGBP(item.product.pricePennies * item.quantity)}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-[10px] text-navy-500">
                            {formatGBP(item.product.pricePennies)} each
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Breakdown */}
          {items.length > 0 && (
            <div className="p-5 border-t border-sand-200 bg-sand-100/60 flex flex-col gap-3">
              {/* VAT & Subtotal Breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-navy-600">
                  <span>Net Goods (ex. VAT)</span>
                  <span>{vatBreakdown.formattedNet}</span>
                </div>
                <div className="flex justify-between text-navy-600">
                  <span>UK VAT (20%)</span>
                  <span>{vatBreakdown.formattedVat}</span>
                </div>
                <div className="flex justify-between text-navy-600">
                  <span>Delivery</span>
                  <span>
                    {hasFreeDelivery ? (
                      <span className="text-forest-700 font-semibold">FREE</span>
                    ) : (
                      "Calculated at checkout"
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-sand-300 flex justify-between items-baseline font-bold text-navy-950 text-base">
                  <span>Total (Inc. VAT)</span>
                  <span className="font-display text-xl text-navy-950">
                    {formatGBP(subtotalPennies)}
                  </span>
                </div>
              </div>

              {/* Klarna Badge */}
              <div className="p-2.5 rounded-lg bg-pink-50/80 border border-pink-200 flex items-center justify-between text-[11px] text-pink-950 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="font-bold text-pink-600 tracking-wider">Klarna.</span>
                  <span>Pay in 3 of {formatGBP(klarnaMonthlyPennies)}/mo</span>
                </span>
                <span className="text-[10px] text-pink-700 underline cursor-pointer">
                  Learn more
                </span>
              </div>

              {/* Action Buttons */}
              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full py-3.5 px-4 rounded-lg bg-brass-500 text-navy-950 font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-brass-400 active:scale-[0.99] transition-all shadow-md"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-4 text-[10px] text-navy-600 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
                  BS 5852 Certified
                </span>
                <span>•</span>
                <span>14-Day UK Returns</span>
                <span>•</span>
                <span>10-Yr Frame Guarantee</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
