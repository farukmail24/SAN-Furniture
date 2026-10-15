"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShoppingBag,
  Check,
  ShieldCheck,
  RotateCcw,
  Award,
  Truck,
  Plus,
  Minus,
  Sparkles,
} from "lucide-react";
import { type CatalogProduct } from "@/lib/catalog";
import { useCart } from "@/lib/cart-context";
import { formatGBP } from "@san-furniture/types";

interface ProductActionsProps {
  product: CatalogProduct;
}

// Available curated fabric shades for furniture pieces
const FABRIC_SWATCHES: Record<string, { name: string; hex: string; desc: string }[]> = {
  boucle: [
    { name: "Oat Bouclé", hex: "#EBE5DF", desc: "Textured chalk-warm bouclé" },
    { name: "Charcoal Bouclé", hex: "#3B3D3E", desc: "Deep heather textured weave" },
    { name: "Olive Bouclé", hex: "#4A5240", desc: "Earthy heritage olive" },
  ],
  velvet: [
    { name: "Forest Green Velvet", hex: "#1C352D", desc: "Lustrous emerald short-pile velvet" },
    { name: "Ink Navy Velvet", hex: "#1E2A38", desc: "Deep midnight blue velvet" },
    { name: "Rust Terracotta Velvet", hex: "#87402B", desc: "Warm burnt rust velvet" },
  ],
  linen: [
    { name: "Natural Flax Linen", hex: "#D6CEBF", desc: "Belgian washed natural linen" },
    { name: "Chalk White Linen", hex: "#F5F3EF", desc: "Crisp bleached pure linen" },
  ],
  leather: [
    { name: "Cognac Full-Grain", hex: "#6E3D1D", desc: "Aniline pull-up Italian leather" },
    { name: "Ebony Full-Grain", hex: "#222222", desc: "Supple semi-aniline black leather" },
  ],
  none: [
    { name: "Natural Waxed Oak", hex: "#C8A67B", desc: "Matte protective hard-wax finish" },
    { name: "Smoked Dark Oak", hex: "#5C4A3B", desc: "Deep fumed European oak" },
  ],
};

export function ProductActions({ product }: ProductActionsProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // Pick fabric swatches based on product material or default to none
  const swatches = FABRIC_SWATCHES[product.specs.material] || FABRIC_SWATCHES.boucle;
  const [selectedSwatch, setSelectedSwatch] = useState(swatches[0]);

  // Observer for sticky mobile bottom CTA
  const mainCtaRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When main CTA is NOT intersecting and is above the viewport, show sticky bar
        setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );

    if (mainCtaRef.current) {
      observer.observe(mainCtaRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const handleAddToCart = () => {
    addItem(product, quantity, {
      fabric: product.specs.material,
      finish: selectedSwatch.name,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const klarnaMonthlyPennies = Math.round(product.pricePennies / 3);

  return (
    <div className="space-y-6">
      {/* Price & Klarna Header */}
      <div>
        <div className="flex items-baseline gap-3 mb-2">
          <span className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
            {formatGBP(product.pricePennies)}
          </span>
          {product.compareAtPricePennies && (
            <span className="text-base sm:text-lg text-navy-400 line-through">
              {formatGBP(product.compareAtPricePennies)}
            </span>
          )}
          <span className="text-xs font-semibold text-sand-50 bg-forest-800 px-2.5 py-0.5 rounded-full">
            UK VAT Included
          </span>
        </div>

        {/* Klarna Interactive Banner */}
        <div className="p-3 rounded-lg bg-pink-50/70 border border-pink-200/80 flex items-center justify-between text-xs text-pink-950">
          <div className="flex items-center gap-2">
            <span className="font-bold text-pink-600 tracking-wider">Klarna.</span>
            <span>
              Pay in 3 payments of <strong>{formatGBP(klarnaMonthlyPennies)}</strong>. 0% Interest.
            </span>
          </div>
          <span className="text-[11px] text-pink-700 underline font-medium cursor-pointer">
            Details
          </span>
        </div>
      </div>

      {/* Fabric / Finish Swatches Selector */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-navy-950 uppercase tracking-wide">
            Finish / Shade: <span className="font-medium text-navy-700">{selectedSwatch.name}</span>
          </span>
          <span className="text-[11px] text-navy-500">{selectedSwatch.desc}</span>
        </div>

        <div className="flex items-center gap-3">
          {swatches.map((swatch) => (
            <button
              key={swatch.name}
              type="button"
              onClick={() => setSelectedSwatch(swatch)}
              aria-label={`Select ${swatch.name}`}
              className={`group relative flex items-center gap-2 p-1.5 rounded-lg border transition-all text-xs font-medium ${
                selectedSwatch.name === swatch.name
                  ? "border-navy-950 bg-sand-200/60 ring-2 ring-brass-500/50"
                  : "border-sand-300 hover:border-sand-400 bg-sand-50"
              }`}
            >
              <span
                className="w-6 h-6 rounded-full border border-sand-400 shadow-inner flex-shrink-0"
                style={{ backgroundColor: swatch.hex }}
              />
              <span className="text-navy-900 hidden sm:inline pr-1">
                {swatch.name.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quantity Selector & Primary CTA Button */}
      <div ref={mainCtaRef} className="flex flex-col sm:flex-row items-stretch gap-3 pt-2">
        {/* Quantity Stepper */}
        <div className="flex items-center justify-between sm:justify-center border border-sand-300 rounded-lg bg-sand-100/50 px-3 py-3 sm:py-0 w-full sm:w-32 flex-shrink-0">
          <button
            type="button"
            onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
            aria-label="Decrease quantity"
            className="p-1 text-navy-700 hover:text-navy-950 hover:bg-sand-200 rounded transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="px-4 font-display font-bold text-navy-950 text-sm">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((prev) => prev + 1)}
            aria-label="Increase quantity"
            className="p-1 text-navy-700 hover:text-navy-950 hover:bg-sand-200 rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Add To Basket Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          className={`flex-1 py-4 px-6 rounded-lg font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] ${
            isAdded
              ? "bg-forest-600 text-white"
              : "bg-brass-500 text-navy-950 hover:bg-brass-400"
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-5 h-5" />
              <span>Added to Basket</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-5 h-5" />
              <span>Add to Basket • {formatGBP(product.pricePennies * quantity)}</span>
            </>
          )}
        </button>
      </div>

      {/* Guarantees & British Compliance Suite */}
      <div className="pt-4 border-t border-sand-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-navy-700">
        <div className="p-3 rounded-lg bg-sand-100/40 border border-sand-200 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-forest-700 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-navy-950 block">BS 5852 Certified</span>
            <span className="text-[11px] text-navy-600">
              Ref: {product.specs.fire_safety.certificate_ref}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-sand-100/40 border border-sand-200 flex items-start gap-2.5">
          <RotateCcw className="w-4 h-4 text-brass-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-navy-950 block">14-Day UK Returns</span>
            <span className="text-[11px] text-navy-600">Statutory return guarantee</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-sand-100/40 border border-sand-200 flex items-start gap-2.5">
          <Award className="w-4 h-4 text-navy-800 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-navy-950 block">10-Year Guarantee</span>
            <span className="text-[11px] text-navy-600">Hardwood frame warranty</span>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Bottom CTA Bar */}
      {showStickyBar && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-sand-50/95 backdrop-blur-md border-t border-sand-300 p-3 sm:hidden shadow-2xl animate-fade-in flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-md overflow-hidden bg-sand-200 flex-shrink-0 border border-sand-300">
              <img
                src={product.thumbnailUrl}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-navy-950 block truncate">
                {product.title}
              </span>
              <span className="text-xs font-display font-bold text-brass-600">
                {formatGBP(product.pricePennies)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="py-2.5 px-4 rounded-lg bg-brass-500 text-navy-950 font-bold text-xs tracking-wide flex items-center gap-1.5 flex-shrink-0 hover:bg-brass-400 active:scale-95 shadow"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add to Basket</span>
          </button>
        </div>
      )}
    </div>
  );
}
