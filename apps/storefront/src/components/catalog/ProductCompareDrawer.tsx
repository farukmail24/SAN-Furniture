"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Layers,
  ArrowRight,
  Check,
  ShoppingBag,
  Trash2,
  Maximize2,
  Truck,
  ShieldCheck,
  Ruler,
} from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog";
import { formatGBP } from "@san-furniture/types";
import { useCart } from "@/lib/cart-context";

interface ProductCompareDrawerProps {
  comparedProducts: CatalogProduct[];
  onRemoveProduct: (productId: string) => void;
  onClearAll: () => void;
  maxCompareCount?: number;
}

export function ProductCompareDrawer({
  comparedProducts,
  onRemoveProduct,
  onClearAll,
  maxCompareCount = 4,
}: ProductCompareDrawerProps) {
  const { addItem, openCart } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  if (comparedProducts.length === 0) return null;

  const handleQuickAdd = (product: CatalogProduct) => {
    setAddingId(product.id);
    addItem(product, 1);
    setTimeout(() => {
      setAddingId(null);
      openCart();
    }, 400);
  };

  return (
    <>
      {/* Persistent Floating Bottom Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl bg-navy-950/95 text-sand-50 backdrop-blur-md rounded-2xl shadow-2xl border border-navy-800 p-3 sm:p-4 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300">
        <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-navy-800">
            <Layers className="w-4 h-4 text-brass-400" />
            <span className="text-xs font-bold whitespace-nowrap">
              Compare ({comparedProducts.length}/{maxCompareCount})
            </span>
          </div>

          {/* Mini Thumbnails */}
          <div className="flex items-center gap-2 shrink-0">
            {comparedProducts.map((p) => (
              <div
                key={p.id}
                className="relative group w-10 h-10 rounded-lg overflow-hidden border border-sand-300/30 bg-sand-900 shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.thumbnailUrl}
                  alt={p.title}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemoveProduct(p.id)}
                  aria-label={`Remove ${p.title} from compare`}
                  className="absolute inset-0 bg-navy-950/80 text-sand-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] text-sand-400 hover:text-sand-50 transition-colors px-2 py-1"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brass-600 hover:bg-brass-500 text-navy-950 font-bold text-xs transition-transform active:scale-95 shadow-md"
          >
            <span>Compare Now</span>
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Full Comparison Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-navy-950/80 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-sand-50 rounded-2xl shadow-2xl border border-sand-200 text-navy-900 scrollbar-none animate-in zoom-in-95 duration-200 p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-sand-200 mb-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-brass-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-brass-600" />
                  Side-By-Side Comparison Matrix
                </span>
                <h2 className="font-display font-bold text-2xl text-navy-950 mt-1">
                  Comparing {comparedProducts.length} Luxury Pieces
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClearAll}
                  className="text-xs font-semibold text-rose-700 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Comparison
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close Comparison"
                  className="p-2 rounded-full bg-sand-100 text-navy-700 hover:bg-sand-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Matrix Comparison Table */}
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-sand-200">
                    <th className="p-3 text-xs font-bold uppercase tracking-wider text-navy-500 w-40 shrink-0">
                      Product Overview
                    </th>
                    {comparedProducts.map((p) => (
                      <th key={p.id} className="p-3 align-top min-w-[200px]">
                        <div className="relative group space-y-2">
                          <button
                            type="button"
                            onClick={() => onRemoveProduct(p.id)}
                            aria-label="Remove item"
                            className="absolute top-1 right-1 z-10 p-1 rounded-full bg-sand-100/90 text-navy-600 hover:text-rose-700 hover:bg-rose-50 transition-colors shadow-xs"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-sand-200 border border-sand-300">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.thumbnailUrl}
                              alt={p.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Link
                            href={`/products/${p.handle}`}
                            onClick={() => setIsModalOpen(false)}
                            className="block font-display font-bold text-sm text-navy-950 hover:text-brass-700 line-clamp-2 transition-colors"
                          >
                            {p.title}
                          </Link>
                          <div className="font-display font-bold text-base text-navy-950">
                            {formatGBP(p.pricePennies)}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleQuickAdd(p)}
                            disabled={addingId === p.id}
                            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-navy-950 hover:bg-navy-900 active:scale-95 text-sand-50 text-xs font-semibold transition-all shadow-xs"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-brass-400" />
                            <span>{addingId === p.id ? "Adding..." : "Add to Bag"}</span>
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200 text-xs text-navy-800">
                  {/* Row: Dimensions */}
                  <tr>
                    <td className="p-3 font-semibold text-navy-600 bg-sand-100/50">
                      Dimensions (W × H × D)
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="p-3 font-medium">
                        {p.specs?.width_cm ?? 120}cm × {p.specs?.height_cm ?? 85}cm × {p.specs?.depth_cm ?? 60}cm
                      </td>
                    ))}
                  </tr>

                  {/* Row: Weight */}
                  <tr>
                    <td className="p-3 font-semibold text-navy-600 bg-sand-100/50">
                      Total Weight
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="p-3">
                        {p.specs?.weight_kg ?? 35} kg
                      </td>
                    ))}
                  </tr>

                  {/* Row: Material & Upholstery */}
                  <tr>
                    <td className="p-3 font-semibold text-navy-600 bg-sand-100/50">
                      Material / Fabric
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="p-3 capitalize">
                        {p.specs?.material ? p.specs.material.replace("_", " ") : "Engineered Hardwood"}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Frame Construction */}
                  <tr>
                    <td className="p-3 font-semibold text-navy-600 bg-sand-100/50">
                      Frame Construction
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="p-3 capitalize">
                        {p.specs?.frame_material ? p.specs.frame_material.replace("_", " ") : "Hardwood & Steel"}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Delivery Logistics */}
                  <tr>
                    <td className="p-3 font-semibold text-navy-600 bg-sand-100/50">
                      UK Delivery Tier
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="p-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-navy-900">
                          <Truck className="w-3.5 h-3.5 text-brass-600" />
                          {p.specs?.delivery_tier === "two_man_white_glove"
                            ? "White Glove (Room of Choice)"
                            : "Free UK Mainland Freight"}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Row: Assembly */}
                  <tr>
                    <td className="p-3 font-semibold text-navy-600 bg-sand-100/50">
                      Assembly
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="p-3">
                        {p.specs?.assembly_required ? "Assembly Required" : "Pre-Assembled (Ready to Enjoy)"}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Fire Safety Compliance */}
                  <tr>
                    <td className="p-3 font-semibold text-navy-600 bg-sand-100/50">
                      UK Fire Compliance
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="p-3">
                        <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          BS 5852 Certified
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Row: Klarna Finance */}
                  <tr>
                    <td className="p-3 font-semibold text-navy-600 bg-sand-100/50">
                      Klarna Pay in 3
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="p-3 font-medium text-navy-900">
                        3x {formatGBP(Math.round(p.pricePennies / 3))} (0% APR)
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
