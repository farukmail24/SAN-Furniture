"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api-config";
import {
  ShoppingBag,
  Heart,
  Check,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
} from "lucide-react";
import { type CatalogProduct } from "@/lib/catalog";
import { useCart } from "@/lib/cart-context";
import { formatGBP } from "@san-furniture/types";

interface ProductActionsProps {
  product: CatalogProduct;
  valueBadges?: Array<{
    icon?: string;
    title: string;
    description: string;
  }>;
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

export function ProductActions({ product, valueBadges }: ProductActionsProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const [selectedVariant, setSelectedVariant] = useState(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );

  // Check if product is upholstered (boucle, velvet, linen, leather)
  const isUpholstered = Boolean(
    product.specs?.material && ["boucle", "velvet", "linen", "leather"].includes(product.specs.material)
  );

  // Pick fabric swatches only if upholstered
  const swatches = isUpholstered
    ? (FABRIC_SWATCHES[product.specs.material] || FABRIC_SWATCHES.boucle)
    : [];
  const [selectedSwatch, setSelectedSwatch] = useState<{ name: string; hex: string; desc: string } | null>(
    swatches.length > 0 ? swatches[0] : null
  );

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

  // Wishlist state & persistence
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [wishlistToast, setWishlistToast] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("san_customer_user");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user?.email) {
          fetch(apiUrl(`/api/customer/wishlist?email=${encodeURIComponent(user.email)}`))
            .then((r) => r.json())
            .then((data) => {
              if (data?.wishlist && Array.isArray(data.wishlist)) {
                setIsWishlisted(data.wishlist.some((w: any) => w.productId === product.id));
              }
            })
            .catch(() => {});
          return;
        }
      } catch {}
    }
    try {
      const guestList = JSON.parse(localStorage.getItem("san_guest_wishlist") || "[]");
      setIsWishlisted(guestList.includes(product.id));
    } catch {}
  }, [product.id]);

  const handleToggleWishlist = async () => {
    setIsWishlistLoading(true);
    const stored = localStorage.getItem("san_customer_user");
    let userEmail: string | null = null;
    if (stored) {
      try {
        const user = JSON.parse(stored);
        userEmail = user?.email || null;
      } catch {}
    }

    try {
      if (isWishlisted) {
        if (userEmail) {
          await fetch(apiUrl(`/api/customer/wishlist?id=${product.id}&email=${encodeURIComponent(userEmail)}`), {
            method: "DELETE",
          });
        } else {
          const guestList = JSON.parse(localStorage.getItem("san_guest_wishlist") || "[]");
          localStorage.setItem("san_guest_wishlist", JSON.stringify(guestList.filter((id: string) => id !== product.id)));
        }
        setIsWishlisted(false);
        setWishlistToast("Removed from your client wishlist.");
      } else {
        if (userEmail) {
          await fetch(apiUrl("/api/customer/wishlist"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: userEmail, productId: product.id }),
          });
        } else {
          const guestList = JSON.parse(localStorage.getItem("san_guest_wishlist") || "[]");
          if (!guestList.includes(product.id)) {
            guestList.push(product.id);
            localStorage.setItem("san_guest_wishlist", JSON.stringify(guestList));
          }
        }
        setIsWishlisted(true);
        setWishlistToast("Saved to your client wishlist.");
      }
    } catch {
      setWishlistToast("Wishlist update failed.");
    } finally {
      setIsWishlistLoading(false);
      setTimeout(() => setWishlistToast(null), 3000);
    }
  };

  const effectivePricePennies = selectedVariant
    ? (selectedVariant.price_pennies ?? (product.pricePennies + (selectedVariant.price_modifier_pennies || 0)))
    : product.pricePennies;

  const handleAddToCart = () => {
    addItem(product, quantity, {
      fabric: product.specs?.material,
      finish: selectedVariant
        ? selectedVariant.title
        : selectedSwatch
        ? selectedSwatch.name
        : product.specs?.color || "Standard Finish",
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Price & Assurance Header */}
      <div>
        <div className="flex items-baseline gap-2.5 mb-2 flex-wrap">
          <span className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
            {formatGBP(effectivePricePennies)}
          </span>
          {product.compareAtPricePennies && (
            <span className="text-base sm:text-lg text-navy-400 line-through">
              {formatGBP(product.compareAtPricePennies + (selectedVariant?.price_modifier_pennies || 0))}
            </span>
          )}
          <span className="text-xs font-semibold text-sand-50 bg-forest-800 px-2.5 py-0.5 rounded-full">
            Zero Hidden Fees
          </span>
          <span className="text-xs font-semibold text-forest-800 bg-forest-50 border border-forest-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-forest-700" />
            Free UK Mainland Delivery
          </span>
        </div>

        {/* Secure UK Checkout & Payment Assurance Banner */}
        <div className="p-3 rounded-xl bg-sand-100/70 border border-sand-200/90 flex items-center justify-between text-xs text-navy-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-forest-700 shrink-0" />
            <span>
              <strong>Secure Checkout:</strong> Visa, Mastercard, Maestro & American Express via Stripe
            </span>
          </div>
          <span className="text-[11px] font-semibold text-forest-800 bg-forest-50 border border-forest-200 px-2 py-0.5 rounded shrink-0">
            256-Bit SSL Encrypted
          </span>
        </div>
      </div>

      {/* Product Variations / Sizes Selector */}
      {product.variants && product.variants.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-navy-950 uppercase tracking-wide">
              Option / Size: <span className="font-medium text-navy-700">{selectedVariant?.title}</span>
            </span>
            {selectedVariant?.sku && (
              <span className="text-[11px] font-mono text-navy-500">SKU: {selectedVariant.sku}</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {product.variants.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              const vPrice = v.price_pennies ?? (product.pricePennies + (v.price_modifier_pennies || 0));
              const mod = v.price_modifier_pennies || 0;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariant(v)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition-all ${
                    isSelected
                      ? "border-navy-950 bg-sand-200/80 ring-2 ring-brass-500/50 shadow-xs"
                      : "border-sand-300 hover:border-sand-400 bg-sand-50"
                  }`}
                >
                  <div className="pr-2">
                    <p className={`font-semibold ${isSelected ? "text-navy-950 font-bold" : "text-navy-800"}`}>
                      {v.title}
                    </p>
                    <p className="text-[10px] text-navy-500">
                      {v.stock_quantity > 0 ? "In Stock (Dispatch 2-5 Days)" : "Pre-order"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-bold text-navy-950">{formatGBP(vPrice)}</span>
                    {mod !== 0 && (
                      <span className="block text-[10px] text-brass-700 font-medium">
                        {mod > 0 ? `+${formatGBP(mod)}` : `-${formatGBP(Math.abs(mod))}`}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Fabric / Finish Swatches Selector - Only for upholstered furniture */}
      {(!product.variants || product.variants.length === 0) && isUpholstered && selectedSwatch && (
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
      )}

      {/* Casegoods / Non-upholstered Finish Display */}
      {(!product.variants || product.variants.length === 0) && !isUpholstered && product.specs?.color && (
        <div className="flex items-center gap-2 text-xs py-1">
          <span className="font-bold text-navy-950 uppercase tracking-wide">Finish / Style:</span>
          <span className="px-3 py-1 bg-sand-100 rounded-md font-semibold text-navy-900 border border-sand-300 shadow-2xs">
            {product.specs.color}
          </span>
        </div>
      )}

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
              <span>Add to Basket • {formatGBP(effectivePricePennies * quantity)}</span>
            </>
          )}
        </button>

        {/* Save to Wishlist Button */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          disabled={isWishlistLoading}
          aria-label={isWishlisted ? "Remove from Sanctuary Wishlist" : "Save to Sanctuary Wishlist"}
          className={`px-4 py-3.5 sm:py-0 rounded-lg border flex items-center justify-center transition-all ${
            isWishlisted
              ? "bg-red-50 border-red-300 text-red-600 shadow-sm"
              : "bg-sand-100/60 border-sand-300 text-navy-800 hover:border-sand-400 hover:text-navy-950"
          }`}
          title={isWishlisted ? "Saved in Wishlist" : "Save to Wishlist"}
        >
          <Heart className={`w-5 h-5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
        </button>
      </div>

      {/* Wishlist Toast Notification */}
      {wishlistToast && (
        <div className="p-3 rounded-xl bg-navy-950 text-sand-50 text-xs font-semibold flex items-center justify-between shadow-lg animate-fade-in border border-sand-700">
          <span>{wishlistToast}</span>
          <Link href="/account?tab=wishlist" className="underline text-brass-400 font-bold hover:text-brass-300">
            View Wishlist
          </Link>
        </div>
      )}

      {/* Guarantees & British Assurance Suite (Strictly 2 authentic cards: Free Mainland Delivery & UK Quality Checked) */}
      {(() => {
        const SAFE_BADGES = [
          { icon: "Truck", title: "Free Mainland Delivery", description: "Direct to your door within 15 days" },
          { icon: "ShieldCheck", title: "UK Quality Checked", description: "Rigorous structural durability" },
        ];

        // Filter out any 12-Month Guarantee, warranty, or returns claim
        const rawList = Array.isArray(valueBadges) && valueBadges.length > 0 ? valueBadges : SAFE_BADGES;
        const filteredList = rawList.filter((b: any) => {
          const t = `${b.title || ""} ${b.description || ""} ${b.subtitle || ""}`.toLowerCase();
          return (
            !t.includes("warranty") &&
            !t.includes("guarantee") &&
            !t.includes("12-month") &&
            !t.includes("statutory") &&
            !t.includes("return")
          );
        });

        const badgesToRender = (filteredList.length > 0 ? filteredList : SAFE_BADGES).map((b: any, idx: number) => {
          const t = String(b.title || "").toLowerCase();
          if (t.includes("tracked") || t.includes("dispatch") || t.includes("delivery")) {
            return { icon: "Truck", title: "Free Mainland Delivery", description: "Direct to your door within 15 days" };
          }
          return {
            icon: b.icon || (idx === 0 ? "Truck" : "ShieldCheck"),
            title: b.title || SAFE_BADGES[idx]?.title || "UK Quality Checked",
            description: b.description || b.subtitle || SAFE_BADGES[idx]?.description || "Rigorous structural durability",
          };
        });

        const finalBadges = badgesToRender.slice(0, 2);
        while (finalBadges.length < 2) {
          finalBadges.push(SAFE_BADGES[finalBadges.length]);
        }

        const renderIcon = (iconName?: string) => {
          if (iconName === "Truck") return <Truck className="w-4 h-4 text-brass-600 flex-shrink-0 mt-0.5" />;
          return <ShieldCheck className="w-4 h-4 text-forest-700 flex-shrink-0 mt-0.5" />;
        };

        return (
          <div className="pt-4 border-t border-sand-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-navy-700">
            {finalBadges.map((b, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-sand-100/40 border border-sand-200 flex items-start gap-2.5">
                {renderIcon(b.icon)}
                <div>
                  <span className="font-bold text-navy-950 block">{b.title}</span>
                  <span className="text-[11px] text-navy-600">{b.description}</span>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Sticky Mobile Floating Island CTA Bar (Positioned above MobileAppDock) */}
      {showStickyBar && (
        <div className="fixed bottom-[68px] inset-x-3 z-30 bg-sand-50/95 backdrop-blur-xl border border-sand-300/90 p-2.5 rounded-2xl sm:hidden shadow-[0_8px_30px_rgb(0,0,0,0.14)] animate-slide-up flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-md overflow-hidden bg-sand-200 flex-shrink-0 border border-sand-300">
              <img
                src={product.thumbnailUrl}
                alt={product.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-navy-950 block truncate">
                {product.title}
              </span>
              <span className="text-xs font-display font-bold text-brass-600">
                {formatGBP(effectivePricePennies)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={handleToggleWishlist}
              aria-label="Save to Wishlist"
              className={`p-2.5 rounded-lg border transition-all ${
                isWishlisted
                  ? "bg-red-50 border-red-300 text-red-600"
                  : "bg-sand-100 border-sand-300 text-navy-800"
              }`}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
            </button>
            <button
              type="button"
              onClick={handleAddToCart}
              className="py-2.5 px-4 rounded-lg bg-brass-500 text-navy-950 font-bold text-xs tracking-wide flex items-center gap-1.5 hover:bg-brass-400 active:scale-95 shadow"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Basket</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
