"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Truck,
  ShieldCheck,
  Check,
  Heart,
  ShoppingBag,
  ExternalLink,
  Layers,
  Ruler,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog";
import { formatGBP } from "@san-furniture/types";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/useWishlist";

interface ProductQuickViewModalProps {
  product: CatalogProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onCompareToggle?: (product: CatalogProduct) => void;
  isCompared?: boolean;
}

export function ProductQuickViewModal({
  product,
  isOpen,
  onClose,
  onCompareToggle,
  isCompared = false,
}: ProductQuickViewModalProps) {
  const { addItem, openCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Reset state when product changes
  useEffect(() => {
    setActiveImageIndex(0);
    setQuantity(1);
    setAddedSuccess(false);
  }, [product?.id]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const images =
    product.images && product.images.length > 0
      ? product.images
      : [product.thumbnailUrl];

  const handleAddToCart = () => {
    setIsAdding(true);
    addItem(product, quantity);
    setTimeout(() => {
      setIsAdding(false);
      setAddedSuccess(true);
      setTimeout(() => {
        openCart();
        onClose();
      }, 600);
    }, 300);
  };

  const savingsPennies =
    product.compareAtPricePennies && product.compareAtPricePennies > product.pricePennies
      ? product.compareAtPricePennies - product.pricePennies
      : 0;

  const savingsPercent =
    product.compareAtPricePennies && savingsPennies > 0
      ? Math.round((savingsPennies / product.compareAtPricePennies) * 100)
      : 0;

  const klarnaMonthlyPennies = Math.round(product.pricePennies / 3);

  const isSaved = isWishlisted(product.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-navy-950/70 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-sand-50 rounded-2xl shadow-2xl border border-sand-200 text-navy-900 scrollbar-none animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Quick View"
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-sand-100/90 text-navy-700 hover:text-navy-950 hover:bg-sand-200 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-brass-500"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8">
          {/* Left Column: Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-sand-200 border border-sand-300 shadow-inner group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[activeImageIndex] || product.thumbnailUrl}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Delivery Tier Badge */}
              <span className="absolute top-3 left-3 z-10 px-2.5 py-1 text-[10px] font-semibold rounded bg-navy-950/90 backdrop-blur-sm text-sand-50 flex items-center gap-1.5 shadow-sm">
                <Truck className="w-3 h-3 text-brass-400" />
                {product.specs.delivery_tier === "two_man_white_glove"
                  ? "White Glove (Room of Choice)"
                  : "Free UK Mainland Delivery"}
              </span>

              {/* Prev / Next Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex((prev) =>
                        prev === 0 ? images.length - 1 : prev - 1
                      )
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-sand-50/80 text-navy-900 hover:bg-sand-50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex((prev) =>
                        prev === images.length - 1 ? 0 : prev + 1
                      )
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-sand-50/80 text-navy-900 hover:bg-sand-50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Carousel */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                      activeImageIndex === idx
                        ? "border-navy-950 shadow-sm scale-102"
                        : "border-sand-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Trust Assurance Bar */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-navy-700 pt-2">
              <div className="p-2.5 rounded-lg bg-sand-100/90 border border-sand-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>UK Fire Safety Compliant (BS 5852)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-sand-100/90 border border-sand-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brass-700 shrink-0" />
                <span>Direct UK Dispatch & Tracking</span>
              </div>
            </div>
          </div>

          {/* Right Column: Details & Actions */}
          <div className="flex flex-col justify-between space-y-5">
            <div>
              {/* Category Breadcrumb & SKU */}
              <div className="flex items-center justify-between text-xs text-navy-500 mb-1">
                <span className="uppercase tracking-wider font-semibold text-[10px] text-brass-700">
                  {product.specs?.material
                    ? product.specs.material.replace("_", " ")
                    : "Handcrafted Living"}
                </span>
                {product.sku && (
                  <span className="font-mono text-[10px] text-navy-400">
                    SKU: {product.sku}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2
                id="quick-view-title"
                className="font-display font-bold text-xl sm:text-2xl text-navy-950 leading-tight"
              >
                {product.title}
              </h2>

              {/* Subtitle */}
              {product.subtitle && (
                <p className="text-xs sm:text-sm text-navy-600 mt-1.5 leading-relaxed">
                  {product.subtitle}
                </p>
              )}

              {/* Price & Savings */}
              <div className="mt-4 pt-3 border-t border-sand-200">
                <div className="flex items-baseline gap-3">
                  <span className="font-display font-bold text-2xl sm:text-3xl text-navy-950">
                    {formatGBP(product.pricePennies)}
                  </span>
                  {product.compareAtPricePennies && product.compareAtPricePennies > product.pricePennies && (
                    <>
                      <span className="text-sm sm:text-base line-through text-navy-400 font-medium">
                        {formatGBP(product.compareAtPricePennies)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        Save {savingsPercent}% ({formatGBP(savingsPennies)})
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-emerald-800 font-medium mt-1">
                  <span>Price includes 20% UK VAT</span>
                  <span>·</span>
                  <span className="text-navy-600 font-normal">
                    Free shipping threshold applied
                  </span>
                </div>

                {/* Klarna Installment Pill */}
                <div className="mt-2 p-2 rounded-lg bg-sand-100 border border-sand-200/80 text-[11px] text-navy-800 flex items-center justify-between">
                  <span className="font-medium">
                    Or 3 payments of{" "}
                    <strong className="text-navy-950 font-bold">
                      {formatGBP(klarnaMonthlyPennies)}
                    </strong>{" "}
                    with Klarna
                  </span>
                  <span className="text-[10px] uppercase font-bold text-navy-500 tracking-wider">
                    0% APR
                  </span>
                </div>
              </div>

              {/* Architectural Dimensions Grid */}
              <div className="mt-4 p-3 rounded-xl bg-sand-100/70 border border-sand-200/90 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900 uppercase tracking-wider">
                  <Ruler className="w-3.5 h-3.5 text-brass-600" />
                  Dimensions & Construction
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded bg-sand-50 border border-sand-200">
                    <span className="block text-[10px] text-navy-500 uppercase">Width</span>
                    <span className="font-bold text-navy-950">{product.specs?.width_cm ?? 120} cm</span>
                  </div>
                  <div className="p-2 rounded bg-sand-50 border border-sand-200">
                    <span className="block text-[10px] text-navy-500 uppercase">Height</span>
                    <span className="font-bold text-navy-950">{product.specs?.height_cm ?? 85} cm</span>
                  </div>
                  <div className="p-2 rounded bg-sand-50 border border-sand-200">
                    <span className="block text-[10px] text-navy-500 uppercase">Depth</span>
                    <span className="font-bold text-navy-950">{product.specs?.depth_cm ?? 60} cm</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-navy-600 px-1 pt-1">
                  <span>
                    Weight: <strong>{product.specs?.weight_kg ?? 35} kg</strong>
                  </span>
                  <span>
                    Assembly:{" "}
                    <strong>
                      {product.specs?.assembly_required ? "Assembly Required" : "Pre-Assembled"}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Actions: Quantity + Add to Bag + Wishlist + Compare */}
            <div className="space-y-3 pt-3 border-t border-sand-200">
              <div className="flex items-center gap-3">
                {/* Quantity Selector */}
                <div className="flex items-center border border-sand-300 rounded-lg bg-sand-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-2 text-navy-700 hover:bg-sand-200 disabled:opacity-40 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 text-xs font-bold text-navy-950 min-w-[28px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 py-2 text-navy-700 hover:bg-sand-200 transition-colors"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {/* Primary Add to Bag Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-navy-950 hover:bg-navy-900 active:scale-[0.98] text-sand-50 font-semibold text-xs sm:text-sm transition-all shadow-md"
                >
                  {addedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-brass-400" />
                      <span>Add to Bag · {formatGBP(product.pricePennies * quantity)}</span>
                    </>
                  )}
                </button>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  aria-label={isSaved ? "Remove from Wishlist" : "Save to Wishlist"}
                  className={`p-3 rounded-xl border transition-all ${
                    isSaved
                      ? "bg-rose-50 border-rose-300 text-rose-600 shadow-sm"
                      : "bg-sand-100 border-sand-300 text-navy-700 hover:text-navy-950 hover:bg-sand-200"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isSaved ? "fill-rose-600" : ""}`} />
                </button>
              </div>

              {/* Secondary Links: Compare & Full Product Page */}
              <div className="flex items-center justify-between text-xs pt-1">
                {onCompareToggle && (
                  <button
                    type="button"
                    onClick={() => onCompareToggle(product)}
                    className={`inline-flex items-center gap-1.5 font-medium transition-colors ${
                      isCompared
                        ? "text-brass-700 font-bold"
                        : "text-navy-600 hover:text-navy-950"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-brass-600" />
                    <span>{isCompared ? "Compared (Remove)" : "Add to Comparison"}</span>
                  </button>
                )}

                <Link
                  href={`/products/${product.handle}`}
                  onClick={onClose}
                  className="inline-flex items-center gap-1 font-semibold text-brass-700 hover:text-navy-950 hover:underline transition-colors ml-auto"
                >
                  <span>View Full Product Specifications</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
