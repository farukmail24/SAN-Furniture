"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Filter, X, ChevronDown, Truck, ShieldCheck, Sparkles, SlidersHorizontal, Layers } from "lucide-react";
import { type CatalogProduct, type ProductCategory } from "@/lib/catalog";
import {
  type FurnitureSubType,
  resolveSubType,
  productMatchesSubType,
  getSubTypesWithCounts
} from "@/lib/furniture-subtypes";
import { formatGBP } from "@san-furniture/types";
import { StaggerContainer, StaggerItem, ScrollReveal } from "@/components/motion/MotionWrapper";

interface CategoryViewProps {
  category?: ProductCategory;
  initialProducts: CatalogProduct[];
  allCategories?: ProductCategory[];
  initialSearchParams?: Record<string, string | string[] | undefined>;
  hideHeaderBanner?: boolean;
}

export function CategoryView({
  category,
  initialProducts,
  allCategories,
  initialSearchParams,
  hideHeaderBanner = false,
}: CategoryViewProps) {
  // Extract initial sub-type from URL search params (e.g. ?type=wardrobes)
  const initialTypeParam =
    typeof initialSearchParams?.type === "string"
      ? initialSearchParams.type
      : Array.isArray(initialSearchParams?.type)
      ? initialSearchParams.type[0]
      : undefined;

  const [selectedSubTypeId, setSelectedSubTypeId] = useState<string | null>(() => {
    if (!category || !initialTypeParam) return null;
    const resolved = resolveSubType(category.id, initialTypeParam);
    return resolved ? resolved.id : null;
  });

  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedDeliveryTiers, setSelectedDeliveryTiers] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc">("featured");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Available sub-types for the current category with live item counts
  const availableSubTypes = useMemo(() => {
    if (!category) return [];
    return getSubTypesWithCounts(category.id, initialProducts);
  }, [category, initialProducts]);

  const activeSubType = useMemo(() => {
    if (!category || !selectedSubTypeId) return null;
    return resolveSubType(category.id, selectedSubTypeId);
  }, [category, selectedSubTypeId]);

  // Available filter options based on products
  const materials = useMemo(() => {
    const set = new Set<string>();
    initialProducts.forEach((p) => {
      if (p.specs.material !== "none") set.add(p.specs.material);
    });
    return Array.from(set);
  }, [initialProducts]);

  const deliveryTiers = useMemo(() => {
    const set = new Set<string>();
    initialProducts.forEach((p) => set.add(p.specs.delivery_tier));
    return Array.from(set);
  }, [initialProducts]);

  // Synchronize URL search params smoothly on sub-type select
  const handleSelectSubType = (subTypeId: string | null) => {
    setSelectedSubTypeId(subTypeId);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (subTypeId) {
        url.searchParams.set("type", subTypeId);
      } else {
        url.searchParams.delete("type");
      }
      window.history.replaceState(null, "", url.toString());
    }
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((p) => {
        // Sub-type facet filter
        if (activeSubType && !productMatchesSubType(p, activeSubType)) {
          return false;
        }
        // Material filter
        if (selectedMaterials.length > 0 && !selectedMaterials.includes(p.specs.material)) {
          return false;
        }
        // Delivery tier filter
        if (selectedDeliveryTiers.length > 0 && !selectedDeliveryTiers.includes(p.specs.delivery_tier)) {
          return false;
        }
        // Price range filter
        if (priceRange === "under_500" && p.pricePennies >= 50000) return false;
        if (priceRange === "500_1000" && (p.pricePennies < 50000 || p.pricePennies > 100000)) return false;
        if (priceRange === "1000_2000" && (p.pricePennies < 100000 || p.pricePennies > 200000)) return false;
        if (priceRange === "over_2000" && p.pricePennies <= 200000) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return a.pricePennies - b.pricePennies;
        if (sortBy === "price_desc") return b.pricePennies - a.pricePennies;
        return 0; // default featured order
      });
  }, [initialProducts, activeSubType, selectedMaterials, selectedDeliveryTiers, priceRange, sortBy]);

  const toggleMaterial = (mat: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(mat) ? prev.filter((m) => m !== mat) : [...prev, mat]
    );
  };

  const toggleDeliveryTier = (tier: string) => {
    setSelectedDeliveryTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  const clearAllFilters = () => {
    setSelectedSubTypeId(null);
    setSelectedMaterials([]);
    setSelectedDeliveryTiers([]);
    setPriceRange("all");
    setSortBy("featured");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("type");
      window.history.replaceState(null, "", url.toString());
    }
  };

  const activeFilterCount =
    (selectedSubTypeId ? 1 : 0) +
    selectedMaterials.length +
    selectedDeliveryTiers.length +
    (priceRange !== "all" ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="w-full px-0">
      {/* Category Header Banner (shown only when not suppressed by parent page) */}
      {!hideHeaderBanner && (
        <div className="mb-8 pb-6 border-b border-sand-200">
          <div className="flex items-center gap-2 text-xs text-navy-500 mb-3">
            <Link href="/" className="hover:text-navy-950">Home</Link>
            <span>/</span>
            <Link href="/catalog" className="hover:text-navy-950">Collections</Link>
            {category && (
              <>
                <span>/</span>
                <span className="text-navy-900 font-medium">{category.name}</span>
              </>
            )}
            {activeSubType && (
              <>
                <span>/</span>
                <span className="text-brass-700 font-semibold">{activeSubType.label}</span>
              </>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-navy-950">
            {activeSubType
              ? `${category?.name || "Collection"} — ${activeSubType.label}`
              : category
              ? category.name
              : "The Complete Furniture Collection"}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-navy-700 max-w-2xl leading-relaxed">
            {category
              ? category.description
              : "Handcrafted British furniture designed with architectural proportions, premium fabrics, and white glove delivery."}
          </p>
        </div>
      )}

      {/* Quick Room Category Tabs */}
      {allCategories && allCategories.length > 0 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
          <Link
            href="/catalog"
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              !category ? "bg-navy-950 text-sand-50" : "bg-sand-100 text-navy-800 hover:bg-sand-200"
            }`}
          >
            All Items ({initialProducts.length})
          </Link>
          {allCategories.map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.handle}`}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                category?.id === c.id
                  ? "bg-navy-950 text-sand-50 shadow-sm"
                  : "bg-sand-100 text-navy-800 hover:bg-sand-200 border border-sand-200/80"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {/* Granular Furniture Sub-Type Filter Pills (Wardrobes, Bedside, Desks, etc.) */}
      {availableSubTypes.length > 0 && (
        <div className="mb-8 pt-4 pb-4 border-t border-b border-sand-200/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-navy-600 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brass-600" />
                Furniture Sub-Categories:
              </span>
              {selectedSubTypeId && (
                <button
                  type="button"
                  onClick={() => handleSelectSubType(null)}
                  className="text-xs font-medium text-brass-700 hover:text-navy-950 underline transition-colors"
                >
                  View All {category ? category.name : "Pieces"} ({initialProducts.length})
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                type="button"
                onClick={() => handleSelectSubType(null)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-xs ${
                  !selectedSubTypeId
                    ? "bg-navy-950 text-sand-50 shadow-sm ring-1 ring-navy-950"
                    : "bg-sand-100 text-navy-800 hover:bg-sand-200 border border-sand-200"
                }`}
              >
                All Pieces ({initialProducts.length})
              </button>
              {availableSubTypes.map(({ subType, count }) => {
                const isSelected = selectedSubTypeId === subType.id;
                return (
                  <button
                    key={subType.id}
                    type="button"
                    onClick={() => handleSelectSubType(isSelected ? null : subType.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-xs ${
                      isSelected
                        ? "bg-navy-950 text-sand-50 shadow-sm ring-1 ring-navy-950"
                        : "bg-sand-100 text-navy-800 hover:bg-sand-200 border border-sand-200"
                    }`}
                  >
                    <span>{subType.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isSelected
                          ? "bg-sand-50/20 text-sand-50"
                          : "bg-sand-200 text-navy-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      {/* Main Content: Sidebar + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Mobile Filter Toggle Button */}
        <div className="lg:hidden col-span-1 flex items-center justify-between gap-4 p-3 bg-sand-100 rounded-lg border border-sand-200">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="flex items-center gap-2 text-sm font-semibold text-navy-900"
          >
            <SlidersHorizontal className="w-4 h-4 text-brass-600" />
            Filters {hasActiveFilters && `(${activeFilterCount})`}
          </button>
          <span className="text-xs text-navy-600 font-medium">{filteredProducts.length} Pieces</span>
        </div>

        {/* Faceted Filter Sidebar */}
        <aside className={`lg:col-span-1 space-y-6 ${isMobileFilterOpen ? "block" : "hidden lg:block"}`}>
          <div className="flex items-center justify-between pb-4 border-b border-sand-200">
            <h3 className="font-display font-semibold text-navy-950 text-base flex items-center gap-2">
              <Filter className="w-4 h-4 text-brass-600" />
              Faceted Filter
            </h3>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-medium text-brass-700 hover:underline"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Furniture Sub-Type Filter in Sidebar */}
          {availableSubTypes.length > 0 && (
            <div className="space-y-3 pb-6 border-b border-sand-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-navy-900">
                  Furniture Category
                </h4>
                {selectedSubTypeId && (
                  <button
                    type="button"
                    onClick={() => handleSelectSubType(null)}
                    className="text-[11px] text-brass-700 hover:underline"
                  >
                    All
                  </button>
                )}
              </div>
              <div className="space-y-2 text-xs text-navy-800">
                <label className="flex items-center justify-between gap-2.5 cursor-pointer">
                  <span className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="furniture_subtype"
                      checked={!selectedSubTypeId}
                      onChange={() => handleSelectSubType(null)}
                      className="rounded-full text-navy-950 focus:ring-brass-500"
                    />
                    <span>All Types</span>
                  </span>
                  <span className="text-[10px] text-navy-400 font-medium">{initialProducts.length}</span>
                </label>
                {availableSubTypes.map(({ subType, count }) => (
                  <label key={subType.id} className="flex items-center justify-between gap-2.5 cursor-pointer">
                    <span className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="furniture_subtype"
                        checked={selectedSubTypeId === subType.id}
                        onChange={() => handleSelectSubType(subType.id)}
                        className="rounded-full text-navy-950 focus:ring-brass-500"
                      />
                      <span>{subType.label}</span>
                    </span>
                    <span className="text-[10px] text-navy-400 font-medium">{count}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Price Range Filter */}
          <div className="space-y-3 pb-6 border-b border-sand-200">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-navy-900">Price Range (UK VAT Incl.)</h4>
            <div className="space-y-2 text-xs text-navy-800">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="price_range"
                  checked={priceRange === "all"}
                  onChange={() => setPriceRange("all")}
                  className="rounded-full text-navy-950 focus:ring-brass-500"
                />
                <span>All Prices</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="price_range"
                  checked={priceRange === "under_500"}
                  onChange={() => setPriceRange("under_500")}
                  className="rounded-full text-navy-950 focus:ring-brass-500"
                />
                <span>Under £500</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="price_range"
                  checked={priceRange === "500_1000"}
                  onChange={() => setPriceRange("500_1000")}
                  className="rounded-full text-navy-950 focus:ring-brass-500"
                />
                <span>£500 – £1,000</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="price_range"
                  checked={priceRange === "1000_2000"}
                  onChange={() => setPriceRange("1000_2000")}
                  className="rounded-full text-navy-950 focus:ring-brass-500"
                />
                <span>£1,000 – £2,000</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="price_range"
                  checked={priceRange === "over_2000"}
                  onChange={() => setPriceRange("over_2000")}
                  className="rounded-full text-navy-950 focus:ring-brass-500"
                />
                <span>Over £2,000</span>
              </label>
            </div>
          </div>

          {/* Material Filter */}
          {materials.length > 0 && (
            <div className="space-y-3 pb-6 border-b border-sand-200">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-navy-900">Upholstery & Fabric</h4>
              <div className="space-y-2 text-xs text-navy-800 capitalize">
                {materials.map((mat) => (
                  <label key={mat} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMaterials.includes(mat)}
                      onChange={() => toggleMaterial(mat)}
                      className="rounded border-sand-300 text-navy-950 focus:ring-brass-500"
                    />
                    <span>{mat.replace("_", " ")}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Logistics Tier Filter */}
          <div className="space-y-3 pb-6 border-b border-sand-200">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-navy-900">UK Delivery Tier</h4>
            <div className="space-y-2 text-xs text-navy-800">
              {deliveryTiers.map((tier) => (
                <label key={tier} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDeliveryTiers.includes(tier)}
                    onChange={() => toggleDeliveryTier(tier)}
                    className="rounded border-sand-300 text-navy-950 focus:ring-brass-500"
                  />
                  <span>
                    {tier === "two_man_white_glove" && "White Glove (Room of Choice)"}
                    {tier === "pallet" && "Pallet Freight (Kerbside)"}
                    {tier === "standard_parcel" && "Standard Parcel Courier"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Quality Checked Furniture Banner */}
          <div className="p-4 rounded-xl bg-sand-100 border border-sand-200 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-sage-700 font-semibold">
              <ShieldCheck className="w-4 h-4 text-brass-600" />
              <span>UK Quality Checked</span>
            </div>
            <p className="text-navy-600 text-[11px] leading-relaxed">
              Rigorous structural durability, robust joinery, and protective packaging on every order.
            </p>
          </div>
        </aside>

        {/* Product Grid Area */}
        <section className="lg:col-span-3">
          {/* Top Sort & Count Bar */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-sand-200">
            <span className="text-xs sm:text-sm text-navy-600 font-medium">
              Showing <span className="text-navy-950 font-bold">{filteredProducts.length}</span> pieces
              {activeSubType && <span className="text-brass-700 font-semibold"> in {activeSubType.label}</span>}
            </span>

            {/* Sort selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-navy-500 hidden sm:inline">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "featured" | "price_asc" | "price_desc")}
                className="bg-sand-50 border border-sand-300 text-navy-950 py-1.5 px-3 rounded-md focus:ring-1 focus:ring-brass-500 outline-none"
              >
                <option value="featured">Curated & Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {activeSubType && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-navy-950 text-sand-50 rounded-full text-xs font-semibold shadow-xs">
                  <span>Category: {activeSubType.label}</span>
                  <button
                    type="button"
                    onClick={() => handleSelectSubType(null)}
                    aria-label="Remove sub-type filter"
                    className="hover:text-brass-300"
                  >
                    <X className="w-3 h-3 text-sand-300 hover:text-sand-50" />
                  </button>
                </span>
              )}
              {selectedMaterials.map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-sand-100 border border-sand-300 rounded-full text-xs text-navy-800 capitalize"
                >
                  {m.replace("_", " ")}
                  <button type="button" onClick={() => toggleMaterial(m)} aria-label="Remove filter">
                    <X className="w-3 h-3 text-navy-500 hover:text-navy-950" />
                  </button>
                </span>
              ))}
              {selectedDeliveryTiers.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-sand-100 border border-sand-300 rounded-full text-xs text-navy-800"
                >
                  {t === "two_man_white_glove" ? "White Glove Delivery" : t}
                  <button type="button" onClick={() => toggleDeliveryTier(t)} aria-label="Remove filter">
                    <X className="w-3 h-3 text-navy-500 hover:text-navy-950" />
                  </button>
                </span>
              ))}
              {priceRange !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sand-100 border border-sand-300 rounded-full text-xs text-navy-800">
                  {priceRange.replace("_", " ").toUpperCase()}
                  <button type="button" onClick={() => setPriceRange("all")} aria-label="Remove price filter">
                    <X className="w-3 h-3 text-navy-500 hover:text-navy-950" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Zero Results State */}
          {initialProducts.length === 0 ? (
            <div className="py-20 text-center bg-sand-100 rounded-2xl border border-sand-200">
              <h3 className="font-display font-bold text-xl text-navy-950">Collection Arriving Soon</h3>
              <p className="mt-2 text-xs sm:text-sm text-navy-600 max-w-md mx-auto">
                Our {category?.name || "curated"} range is currently being updated with new UK showroom arrivals. Explore our complete furniture catalog to view all available pieces ready for UK dispatch.
              </p>
              <Link
                href="/catalog"
                className="mt-6 inline-block px-5 py-2.5 bg-navy-950 text-sand-50 rounded-md text-xs font-semibold hover:bg-navy-900 transition-colors shadow-sm"
              >
                Browse Complete Catalog
              </Link>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center bg-sand-100 rounded-2xl border border-sand-200">
              <h3 className="font-display font-bold text-xl text-navy-950">No Matching Furniture Pieces</h3>
              <p className="mt-2 text-xs sm:text-sm text-navy-600 max-w-sm mx-auto">
                No items match your active filters. Try clearing one or more facets to view our available UK collections.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-6 px-5 py-2.5 bg-navy-950 text-sand-50 rounded-md text-xs font-semibold hover:bg-navy-900 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            /* Product Cards Grid */
            <StaggerContainer
              key={`${selectedSubTypeId ?? "all"}-${sortBy}-${priceRange}-${selectedMaterials.join("-")}-${selectedDeliveryTiers.join("-")}`}
              className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6"
            >
              {filteredProducts.map((product) => {
                return (
                  <StaggerItem key={product.id}>
                    <article
                      className="group flex flex-col rounded-2xl overflow-hidden bg-sand-100/80 border border-sand-200/90 hover:border-sand-300 transition-[box-shadow,border-color] duration-300 shadow-sm hover:shadow-card active:scale-[0.99] h-full"
                    >
                    {/* Product Image */}
                    <Link
                      href={`/products/${product.handle}`}
                      prefetch={false}
                      className="relative block aspect-[4/3] bg-sand-200 overflow-hidden"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.thumbnailUrl}
                        alt={product.title}
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                      />
                      {/* Delivery Badge */}
                      <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold rounded bg-navy-950/90 backdrop-blur-sm text-sand-50 flex items-center gap-1 shadow-ambient">
                        <Truck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-brass-400" />
                        <span className="truncate max-w-[85px] sm:max-w-none">
                          {product.specs.delivery_tier === "two_man_white_glove" ? "Free White Glove" : "Free UK Delivery"}
                        </span>
                      </span>
                    </Link>

                    {/* Content */}
                    <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-navy-500 mb-1">
                          <span className="capitalize truncate max-w-[80px] sm:max-w-none">{product.specs?.material ? product.specs.material.replace("_", " ") : "Hardwood"}</span>
                          <span className="shrink-0">{product.specs?.width_cm ?? 120}cm W</span>
                        </div>

                        <h3 className="font-display font-bold text-xs sm:text-base text-navy-950 group-hover:text-brass-600 transition-colors line-clamp-1">
                          <Link
                            href={`/products/${product.handle}`}
                            prefetch={false}
                          >
                            {product.title}
                          </Link>
                        </h3>

                        <p className="text-[11px] sm:text-xs text-navy-600 mt-1 line-clamp-2 hidden sm:block">
                          {product.subtitle}
                        </p>
                      </div>

                      {/* Pricing and Klarna */}
                      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-sand-200/80 space-y-1.5 sm:space-y-2">
                        <div className="flex items-baseline justify-between gap-1 flex-wrap">
                          <span className="font-display font-bold text-sm sm:text-lg text-navy-950">
                            {formatGBP(product.pricePennies)}
                          </span>
                          {product.compareAtPricePennies && (
                            <span className="text-[10px] sm:text-xs line-through text-navy-400 font-medium">
                              {formatGBP(product.compareAtPricePennies)}
                            </span>
                          )}
                        </div>

                        {/* Quality & VAT reassurance badge */}
                        <div className="text-[9px] sm:text-[11px] text-forest-800 bg-forest-50/70 p-1 sm:p-1.5 rounded border border-forest-200/80 flex items-center justify-between">
                          <span className="truncate font-medium">UK Quality Assured</span>
                          <span className="font-semibold text-[9px] sm:text-[10px] shrink-0 ml-1">20% VAT Incl.</span>
                        </div>

                        {/* CTA Link */}
                        <Link
                          href={`/products/${product.handle}`}
                          prefetch={false}
                          className="mt-2 block w-full text-center py-1.5 sm:py-2 rounded-lg bg-navy-950 hover:bg-navy-900 active:scale-95 text-sand-50 text-[11px] sm:text-xs font-semibold transition-all shadow-sm"
                        >
                          View Piece
                        </Link>
                      </div>
                    </div>
                  </article>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
        </section>

      </div>
    </div>
  );
}
