"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Filter,
  X,
  ChevronDown,
  Truck,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Layers,
  Search,
  Grid3X3,
  Grid2X2,
  List,
  Eye,
  Heart,
  ShoppingBag,
  Check,
  Share2,
  ArrowUpDown,
  RotateCcw,
  Ruler,
  Percent,
  CheckCircle2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { type CatalogProduct, type ProductCategory } from "@/lib/catalog";
import {
  type FurnitureSubType,
  resolveSubType,
  productMatchesSubType,
  getSubTypesWithCounts,
} from "@/lib/furniture-subtypes";
import { formatGBP } from "@san-furniture/types";
import { StaggerContainer, StaggerItem } from "@/components/motion/MotionWrapper";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/useWishlist";
import { ProductQuickViewModal } from "./ProductQuickViewModal";
import { ProductCompareDrawer } from "./ProductCompareDrawer";

interface CategoryViewProps {
  category?: ProductCategory;
  initialProducts: CatalogProduct[];
  allCategories?: ProductCategory[];
  initialSearchParams?: Record<string, string | string[] | undefined>;
  hideHeaderBanner?: boolean;
}

// Color finish presets mapped to hex swatches for visual filtering
const COLOR_PRESETS = [
  { id: "oak", label: "Oak & Natural Wood", hex: "#C8A67B", keywords: ["oak", "natural", "wood", "artisan", "scandinavian"] },
  { id: "white", label: "Pure White & Gloss", hex: "#FFFFFF", border: true, keywords: ["white", "gloss", "alpine", "matt white"] },
  { id: "walnut", label: "Walnut & Dark Wood", hex: "#5C4A3B", keywords: ["walnut", "dark", "espresso", "smoked"] },
  { id: "cream", label: "Cream & Bouclé", hex: "#EBE5DF", keywords: ["cream", "boucle", "bouclé", "oat", "cashmere"] },
  { id: "grey", label: "Grey & Charcoal", hex: "#4A4E51", keywords: ["grey", "gray", "charcoal", "anthracite", "slate"] },
  { id: "black", label: "Black & Chrome", hex: "#1A1A1A", keywords: ["black", "chrome", "ebony", "iron"] },
];

export function CategoryView({
  category,
  initialProducts,
  allCategories,
  initialSearchParams,
  hideHeaderBanner = false,
}: CategoryViewProps) {
  const { addItem, openCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  // Search input query
  const [searchQuery, setSearchQuery] = useState("");

  // Sub-type filter from URL
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

  // Category filter
  const [selectedCategoryHandle, setSelectedCategoryHandle] = useState<string | null>(
    category?.handle || null
  );

  // Faceted filter states
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedColorTones, setSelectedColorTones] = useState<string[]>([]);
  const [selectedWidthRange, setSelectedWidthRange] = useState<"all" | "compact" | "medium" | "wide">("all");
  const [selectedDeliveryTiers, setSelectedDeliveryTiers] = useState<string[]>([]);
  const [onlyOnSale, setOnlyOnSale] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [priceRange, setPriceRange] = useState<string>("all");

  // Sort & Display states
  const [sortBy, setSortBy] = useState<
    "featured" | "price_asc" | "price_desc" | "savings" | "width_asc" | "title_asc"
  >("featured");
  const [viewMode, setViewMode] = useState<"grid_standard" | "grid_editorial" | "list">("grid_standard");
  const [pageSize, setPageSize] = useState<number | "all">(24);
  const [visibleCount, setVisibleCount] = useState<number>(24);

  // UI Modals & Drawers
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    offers: false,
    room: false,
    colors: false,
    dimensions: false,
    price: false,
    materials: false,
    delivery: false,
  });

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const areAllSectionsCollapsed = useMemo(() => {
    return Object.values(collapsedSections).every(Boolean);
  }, [collapsedSections]);

  const toggleCollapseAll = () => {
    const targetState = !areAllSectionsCollapsed;
    setCollapsedSections({
      offers: targetState,
      room: targetState,
      colors: targetState,
      dimensions: targetState,
      price: targetState,
      materials: targetState,
      delivery: targetState,
    });
  };

  const [quickViewProduct, setQuickViewProduct] = useState<CatalogProduct | null>(null);
  const [comparedProducts, setComparedProducts] = useState<CatalogProduct[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [addingCartId, setAddingCartId] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2800);
  }, []);

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
      if (p.specs?.material && p.specs.material !== "none") {
        set.add(p.specs.material);
      }
    });
    return Array.from(set);
  }, [initialProducts]);

  const deliveryTiers = useMemo(() => {
    const set = new Set<string>();
    initialProducts.forEach((p) => {
      if (p.specs?.delivery_tier) set.add(p.specs.delivery_tier);
    });
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

  // Compare toggles
  const handleToggleCompare = useCallback((product: CatalogProduct) => {
    setComparedProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        showToast(`Removed "${product.title}" from comparison.`);
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 4) {
        showToast("Maximum 4 products can be compared simultaneously.");
        return prev;
      }
      showToast(`Added "${product.title}" to comparison matrix.`);
      return [...prev, product];
    });
  }, [showToast]);

  const handleRemoveCompare = useCallback((productId: string) => {
    setComparedProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const handleClearCompare = useCallback(() => {
    setComparedProducts([]);
    showToast("Comparison cleared.");
  }, [showToast]);

  // Quick Add to Cart
  const handleQuickAddToCart = useCallback(
    (product: CatalogProduct) => {
      setAddingCartId(product.id);
      addItem(product, 1);
      setTimeout(() => {
        setAddingCartId(null);
        openCart();
      }, 350);
    },
    [addItem, openCart]
  );

  // Toggle Filters
  const toggleMaterial = (mat: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(mat) ? prev.filter((m) => m !== mat) : [...prev, mat]
    );
  };

  const toggleColorTone = (colorId: string) => {
    setSelectedColorTones((prev) =>
      prev.includes(colorId) ? prev.filter((c) => c !== colorId) : [...prev, colorId]
    );
  };

  const toggleDeliveryTier = (tier: string) => {
    setSelectedDeliveryTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  // Reset all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedSubTypeId(null);
    setSelectedCategoryHandle(category?.handle || null);
    setSelectedMaterials([]);
    setSelectedColorTones([]);
    setSelectedWidthRange("all");
    setSelectedDeliveryTiers([]);
    setOnlyOnSale(false);
    setOnlyInStock(false);
    setPriceRange("all");
    setSortBy("featured");
    setVisibleCount(typeof pageSize === "number" ? pageSize : 24);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("type");
      window.history.replaceState(null, "", url.toString());
    }
    showToast("All filters reset.");
  };

  // Share curation link
  const handleShareCuration = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        showToast("Curation link copied to clipboard!");
      })
      .catch(() => {
        showToast("Failed to copy link.");
      });
  };

  // Filter & Sort Calculation
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return initialProducts
      .filter((p) => {
        // Keyword Search Filter
        if (query) {
          const matchTitle = p.title.toLowerCase().includes(query);
          const matchDesc = p.description?.toLowerCase().includes(query);
          const matchSubtitle = p.subtitle?.toLowerCase().includes(query);
          const matchSku = p.sku?.toLowerCase().includes(query);
          const matchMaterial = p.specs?.material?.toLowerCase().includes(query);
          const matchColor = p.specs?.color?.toLowerCase().includes(query);
          if (!matchTitle && !matchDesc && !matchSubtitle && !matchSku && !matchMaterial && !matchColor) {
            return false;
          }
        }

        // Category handle filter (if changed inside catalog)
        if (selectedCategoryHandle && !category) {
          const cat = allCategories?.find((c) => c.handle === selectedCategoryHandle);
          if (cat && p.categoryId !== cat.id) return false;
        }

        // Sub-type facet filter
        if (activeSubType && !productMatchesSubType(p, activeSubType)) {
          return false;
        }

        // Material filter
        if (selectedMaterials.length > 0 && (!p.specs?.material || !selectedMaterials.includes(p.specs.material))) {
          return false;
        }

        // Color Tone filter
        if (selectedColorTones.length > 0) {
          const prodColorText = `${p.specs?.color || ""} ${p.title}`.toLowerCase();
          const matchesAnyColor = selectedColorTones.some((toneId) => {
            const preset = COLOR_PRESETS.find((c) => c.id === toneId);
            if (!preset) return false;
            return preset.keywords.some((kw) => prodColorText.includes(kw));
          });
          if (!matchesAnyColor) return false;
        }

        // Width / Size filter
        if (selectedWidthRange !== "all") {
          const width = p.specs?.width_cm ?? 120;
          if (selectedWidthRange === "compact" && width >= 100) return false;
          if (selectedWidthRange === "medium" && (width < 100 || width > 160)) return false;
          if (selectedWidthRange === "wide" && width <= 160) return false;
        }

        // Delivery tier filter
        if (selectedDeliveryTiers.length > 0 && (!p.specs?.delivery_tier || !selectedDeliveryTiers.includes(p.specs.delivery_tier))) {
          return false;
        }

        // On Sale Filter
        if (onlyOnSale) {
          if (!p.compareAtPricePennies || p.compareAtPricePennies <= p.pricePennies) return false;
        }

        // In Stock Filter
        if (onlyInStock) {
          if (p.status === "out_of_stock") return false;
        }

        // Price range filter
        if (priceRange === "under_300" && p.pricePennies >= 30000) return false;
        if (priceRange === "300_600" && (p.pricePennies < 30000 || p.pricePennies > 60000)) return false;
        if (priceRange === "600_1200" && (p.pricePennies < 60000 || p.pricePennies > 120000)) return false;
        if (priceRange === "over_1200" && p.pricePennies <= 120000) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return a.pricePennies - b.pricePennies;
        if (sortBy === "price_desc") return b.pricePennies - a.pricePennies;
        if (sortBy === "savings") {
          const savingsA = (a.compareAtPricePennies || 0) - a.pricePennies;
          const savingsB = (b.compareAtPricePennies || 0) - b.pricePennies;
          return savingsB - savingsA;
        }
        if (sortBy === "width_asc") {
          return (a.specs?.width_cm ?? 0) - (b.specs?.width_cm ?? 0);
        }
        if (sortBy === "title_asc") {
          return a.title.localeCompare(b.title);
        }
        return 0; // default featured
      });
  }, [
    initialProducts,
    searchQuery,
    selectedCategoryHandle,
    category,
    allCategories,
    activeSubType,
    selectedMaterials,
    selectedColorTones,
    selectedWidthRange,
    selectedDeliveryTiers,
    onlyOnSale,
    onlyInStock,
    priceRange,
    sortBy,
  ]);

  // Reset pagination count when filters change
  useEffect(() => {
    setVisibleCount(typeof pageSize === "number" ? pageSize : filteredProducts.length);
  }, [
    searchQuery,
    selectedSubTypeId,
    selectedCategoryHandle,
    selectedMaterials,
    selectedColorTones,
    selectedWidthRange,
    selectedDeliveryTiers,
    onlyOnSale,
    onlyInStock,
    priceRange,
    sortBy,
    pageSize,
    filteredProducts.length,
  ]);

  const displayedProducts = useMemo(() => {
    if (pageSize === "all") return filteredProducts;
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, pageSize, visibleCount]);

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    (selectedSubTypeId ? 1 : 0) +
    (selectedCategoryHandle && !category ? 1 : 0) +
    selectedMaterials.length +
    selectedColorTones.length +
    (selectedWidthRange !== "all" ? 1 : 0) +
    selectedDeliveryTiers.length +
    (onlyOnSale ? 1 : 0) +
    (onlyInStock ? 1 : 0) +
    (priceRange !== "all" ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  const handleLoadMore = () => {
    const increment = typeof pageSize === "number" ? pageSize : 24;
    setVisibleCount((prev) => Math.min(prev + increment, filteredProducts.length));
  };

  const handleShowAll = () => {
    setVisibleCount(filteredProducts.length);
  };

  const progressPercent =
    filteredProducts.length > 0
      ? Math.min(100, Math.round((displayedProducts.length / filteredProducts.length) * 100))
      : 100;

  return (
    <div className="w-full px-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-navy-950 text-sand-50 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-navy-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Category Header Banner (shown only when not suppressed by parent page) */}
      {!hideHeaderBanner && (
        <div className="mb-8 pb-6 border-b border-sand-200">
          <div className="flex items-center gap-2 text-xs text-navy-500 mb-3">
            <Link href="/" className="hover:text-navy-950">
              Home
            </Link>
            <span>/</span>
            <Link href="/catalog" className="hover:text-navy-950">
              Collections
            </Link>
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
            onClick={() => setSelectedCategoryHandle(null)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              !category && !selectedCategoryHandle
                ? "bg-navy-950 text-sand-50 shadow-sm"
                : "bg-sand-100 text-navy-800 hover:bg-sand-200"
            }`}
          >
            All Items ({initialProducts.length})
          </Link>
          {allCategories.map((c) => {
            const isSelected = category?.id === c.id || selectedCategoryHandle === c.handle;
            return (
              <Link
                key={c.id}
                href={`/categories/${c.handle}`}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? "bg-navy-950 text-sand-50 shadow-sm"
                    : "bg-sand-100 text-navy-800 hover:bg-sand-200 border border-sand-200/80"
                }`}
              >
                {c.name}
              </Link>
            );
          })}
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
                      isSelected ? "bg-sand-50/20 text-sand-50" : "bg-sand-200 text-navy-600"
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
      <div className={`grid grid-cols-1 ${isSidebarCollapsed ? "lg:grid-cols-1" : "lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]"} gap-6 xl:gap-8 items-start`}>
        {/* Mobile Filter Toggle & Quick Bar */}
        <div className="lg:hidden col-span-1 flex items-center justify-between gap-3 p-3.5 bg-sand-100 rounded-xl border border-sand-200 shadow-xs">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex items-center gap-2 text-sm font-semibold text-navy-950 py-1"
          >
            <SlidersHorizontal className="w-4 h-4 text-brass-600" />
            <span>Filters & Refine</span>
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-navy-950 text-sand-50 text-[11px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-navy-600 font-semibold">{filteredProducts.length} Pieces</span>
            <button
              type="button"
              onClick={handleShareCuration}
              aria-label="Share Curation"
              className="p-1.5 rounded-lg bg-sand-200/80 text-navy-700 hover:text-navy-950"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Faceted Filter Sidebar (Desktop) */}
        <aside
          className={`${
            isSidebarCollapsed ? "hidden" : "hidden lg:block"
          } w-full max-w-[260px] space-y-4 text-xs self-start sticky top-24`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-sand-200">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-brass-600" />
              <h3 className="font-display font-bold text-navy-950 text-sm tracking-tight">
                Faceted Filter
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleCollapseAll}
                className="text-[11px] font-semibold text-navy-600 hover:text-navy-950 transition-colors"
                title={areAllSectionsCollapsed ? "Expand all sections" : "Collapse all sections"}
              >
                {areAllSectionsCollapsed ? "Expand All" : "Collapse"}
              </button>
              {hasActiveFilters && (
                <>
                  <span className="text-sand-300">·</span>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-[11px] font-semibold text-brass-700 hover:underline flex items-center gap-0.5"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    Reset
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Offers & Availability Section */}
          <div className="border-b border-sand-200/90 pb-3">
            <button
              type="button"
              onClick={() => toggleSection("offers")}
              className="w-full flex items-center justify-between py-1.5 text-left group"
            >
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-navy-900 group-hover:text-brass-700 transition-colors">
                <Percent className="w-3.5 h-3.5 text-rose-600" />
                <span>Offers & Stock</span>
              </span>
              <div className="flex items-center gap-1.5">
                {(onlyOnSale || onlyInStock) && (
                  <span className="w-4 h-4 rounded-full bg-navy-950 text-sand-50 text-[10px] font-bold flex items-center justify-center">
                    {(onlyOnSale ? 1 : 0) + (onlyInStock ? 1 : 0)}
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-navy-400 group-hover:text-navy-950 transition-transform duration-200 ${
                    collapsedSections.offers ? "-rotate-90" : "rotate-0"
                  }`}
                />
              </div>
            </button>
            {!collapsedSections.offers && (
              <div className="space-y-2 pt-2">
                <div className="p-2.5 rounded-xl bg-sand-100/90 border border-sand-200/90 space-y-1">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[11px] font-bold text-navy-950">Special Price Drops</span>
                    <input
                      type="checkbox"
                      checked={onlyOnSale}
                      onChange={(e) => setOnlyOnSale(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500 border-sand-300"
                    />
                  </label>
                  <p className="text-[10px] text-navy-600">Verified price reductions</p>
                </div>

                <div className="p-2.5 rounded-xl bg-sand-100/90 border border-sand-200/90">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-navy-950">
                      <Truck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Immediate Dispatch</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={onlyInStock}
                      onChange={(e) => setOnlyInStock(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-emerald-700 focus:ring-emerald-500 border-sand-300"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Room / Category Filter in Sidebar */}
          {allCategories && allCategories.length > 0 && !category && (
            <div className="border-b border-sand-200/90 pb-3">
              <button
                type="button"
                onClick={() => toggleSection("room")}
                className="w-full flex items-center justify-between py-1.5 text-left group"
              >
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-navy-900 group-hover:text-brass-700 transition-colors">
                  <Layers className="w-3.5 h-3.5 text-brass-600" />
                  <span>Room / Department</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {selectedCategoryHandle && !category && (
                    <span className="w-4 h-4 rounded-full bg-navy-950 text-sand-50 text-[10px] font-bold flex items-center justify-center">
                      1
                    </span>
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-navy-400 group-hover:text-navy-950 transition-transform duration-200 ${
                      collapsedSections.room ? "-rotate-90" : "rotate-0"
                    }`}
                  />
                </div>
              </button>
              {!collapsedSections.room && (
                <div className="space-y-1.5 pt-2 text-xs text-navy-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sidebar_category"
                      checked={!selectedCategoryHandle}
                      onChange={() => setSelectedCategoryHandle(null)}
                      className="rounded-full text-navy-950 focus:ring-brass-500 w-3.5 h-3.5"
                    />
                    <span>All Collections ({initialProducts.length})</span>
                  </label>
                  {allCategories.map((c) => {
                    const count = initialProducts.filter((p) => p.categoryId === c.id).length;
                    return (
                      <label key={c.id} className="flex items-center justify-between gap-2 cursor-pointer">
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="sidebar_category"
                            checked={selectedCategoryHandle === c.handle}
                            onChange={() => setSelectedCategoryHandle(c.handle)}
                            className="rounded-full text-navy-950 focus:ring-brass-500 w-3.5 h-3.5"
                          />
                          <span className="truncate">{c.name}</span>
                        </span>
                        <span className="text-[10px] text-navy-400 font-medium">{count}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Color & Finish Swatch Filter */}
          <div className="border-b border-sand-200/90 pb-3">
            <button
              type="button"
              onClick={() => toggleSection("colors")}
              className="w-full flex items-center justify-between py-1.5 text-left group"
            >
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-navy-900 group-hover:text-brass-700 transition-colors">
                <Sparkles className="w-3.5 h-3.5 text-brass-600" />
                <span>Color & Finish</span>
              </span>
              <div className="flex items-center gap-1.5">
                {selectedColorTones.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-navy-950 text-sand-50 text-[10px] font-bold flex items-center justify-center">
                    {selectedColorTones.length}
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-navy-400 group-hover:text-navy-950 transition-transform duration-200 ${
                    collapsedSections.colors ? "-rotate-90" : "rotate-0"
                  }`}
                />
              </div>
            </button>
            {!collapsedSections.colors && (
              <div className="pt-2 space-y-2">
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {COLOR_PRESETS.map((preset) => {
                    const isSelected = selectedColorTones.includes(preset.id);
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => toggleColorTone(preset.id)}
                        className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left transition-all ${
                          isSelected
                            ? "bg-navy-950 text-sand-50 border-navy-950 shadow-xs"
                            : "bg-sand-50 text-navy-800 border-sand-200 hover:bg-sand-100"
                        }`}
                      >
                        <span
                          className={`w-3 h-3 rounded-full shrink-0 ${preset.border ? "border border-sand-400" : ""}`}
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span className="truncate text-[10.5px] font-medium leading-tight">{preset.label.split("&")[0]}</span>
                      </button>
                    );
                  })}
                </div>
                {selectedColorTones.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedColorTones([])}
                    className="text-[10px] text-brass-700 hover:underline pt-0.5 block"
                  >
                    Clear selected colors
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Width / Dimension Scale Filter */}
          <div className="border-b border-sand-200/90 pb-3">
            <button
              type="button"
              onClick={() => toggleSection("dimensions")}
              className="w-full flex items-center justify-between py-1.5 text-left group"
            >
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-navy-900 group-hover:text-brass-700 transition-colors">
                <Ruler className="w-3.5 h-3.5 text-brass-600" />
                <span>Width / Scale</span>
              </span>
              <div className="flex items-center gap-1.5">
                {selectedWidthRange !== "all" && (
                  <span className="w-4 h-4 rounded-full bg-navy-950 text-sand-50 text-[10px] font-bold flex items-center justify-center">
                    1
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-navy-400 group-hover:text-navy-950 transition-transform duration-200 ${
                    collapsedSections.dimensions ? "-rotate-90" : "rotate-0"
                  }`}
                />
              </div>
            </button>
            {!collapsedSections.dimensions && (
              <div className="space-y-1.5 pt-2 text-xs text-navy-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="width_range"
                    checked={selectedWidthRange === "all"}
                    onChange={() => setSelectedWidthRange("all")}
                    className="rounded-full text-navy-950 focus:ring-brass-500 w-3.5 h-3.5"
                  />
                  <span>All Widths</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="width_range"
                    checked={selectedWidthRange === "compact"}
                    onChange={() => setSelectedWidthRange("compact")}
                    className="rounded-full text-navy-950 focus:ring-brass-500 w-3.5 h-3.5"
                  />
                  <span>Compact (&lt; 100 cm)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="width_range"
                    checked={selectedWidthRange === "medium"}
                    onChange={() => setSelectedWidthRange("medium")}
                    className="rounded-full text-navy-950 focus:ring-brass-500 w-3.5 h-3.5"
                  />
                  <span>Standard (100–160 cm)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="width_range"
                    checked={selectedWidthRange === "wide"}
                    onChange={() => setSelectedWidthRange("wide")}
                    className="rounded-full text-navy-950 focus:ring-brass-500 w-3.5 h-3.5"
                  />
                  <span>Grand (&gt; 160 cm)</span>
                </label>
              </div>
            )}
          </div>

          {/* Price Range Filter */}
          <div className="border-b border-sand-200/90 pb-3">
            <button
              type="button"
              onClick={() => toggleSection("price")}
              className="w-full flex items-center justify-between py-1.5 text-left group"
            >
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-navy-900 group-hover:text-brass-700 transition-colors">
                <span>Price (20% VAT)</span>
              </span>
              <div className="flex items-center gap-1.5">
                {priceRange !== "all" && (
                  <span className="w-4 h-4 rounded-full bg-navy-950 text-sand-50 text-[10px] font-bold flex items-center justify-center">
                    1
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-navy-400 group-hover:text-navy-950 transition-transform duration-200 ${
                    collapsedSections.price ? "-rotate-90" : "rotate-0"
                  }`}
                />
              </div>
            </button>
            {!collapsedSections.price && (
              <div className="space-y-1.5 pt-2 text-xs text-navy-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price_range"
                    checked={priceRange === "all"}
                    onChange={() => setPriceRange("all")}
                    className="rounded-full text-navy-950 focus:ring-brass-500 w-3.5 h-3.5"
                  />
                  <span>All Prices</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price_range"
                    checked={priceRange === "under_300"}
                    onChange={() => setPriceRange("under_300")}
                    className="rounded-full text-navy-950 focus:ring-brass-500 w-3.5 h-3.5"
                  />
                  <span>Under £300</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price_range"
                    checked={priceRange === "300_600"}
                    onChange={() => setPriceRange("300_600")}
                    className="rounded-full text-navy-950 focus:ring-brass-500 w-3.5 h-3.5"
                  />
                  <span>£300 – £600</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price_range"
                    checked={priceRange === "600_1200"}
                    onChange={() => setPriceRange("600_1200")}
                    className="rounded-full text-navy-950 focus:ring-brass-500 w-3.5 h-3.5"
                  />
                  <span>£600 – £1,200</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price_range"
                    checked={priceRange === "over_1200"}
                    onChange={() => setPriceRange("over_1200")}
                    className="rounded-full text-navy-950 focus:ring-brass-500 w-3.5 h-3.5"
                  />
                  <span>Over £1,200</span>
                </label>
              </div>
            )}
          </div>

          {/* Material & Upholstery Filter */}
          {materials.length > 0 && (
            <div className="border-b border-sand-200/90 pb-3">
              <button
                type="button"
                onClick={() => toggleSection("materials")}
                className="w-full flex items-center justify-between py-1.5 text-left group"
              >
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-navy-900 group-hover:text-brass-700 transition-colors">
                  <span>Upholstery & Material</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {selectedMaterials.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-navy-950 text-sand-50 text-[10px] font-bold flex items-center justify-center">
                      {selectedMaterials.length}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-navy-400 group-hover:text-navy-950 transition-transform duration-200 ${
                      collapsedSections.materials ? "-rotate-90" : "rotate-0"
                    }`}
                  />
                </div>
              </button>
              {!collapsedSections.materials && (
                <div className="space-y-1.5 pt-2 text-xs text-navy-800 capitalize max-h-48 overflow-y-auto pr-1">
                  {materials.map((mat) => (
                    <label key={mat} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMaterials.includes(mat)}
                        onChange={() => toggleMaterial(mat)}
                        className="rounded border-sand-300 text-navy-950 focus:ring-brass-500 w-3.5 h-3.5"
                      />
                      <span className="truncate">{mat.replace("_", " ")}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Delivery Logistics Tier Filter */}
          <div className="border-b border-sand-200/90 pb-3">
            <button
              type="button"
              onClick={() => toggleSection("delivery")}
              className="w-full flex items-center justify-between py-1.5 text-left group"
            >
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-navy-900 group-hover:text-brass-700 transition-colors">
                <Truck className="w-3.5 h-3.5 text-brass-600" />
                <span>UK Delivery Tier</span>
              </span>
              <div className="flex items-center gap-1.5">
                {selectedDeliveryTiers.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-navy-950 text-sand-50 text-[10px] font-bold flex items-center justify-center">
                    {selectedDeliveryTiers.length}
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-navy-400 group-hover:text-navy-950 transition-transform duration-200 ${
                    collapsedSections.delivery ? "-rotate-90" : "rotate-0"
                  }`}
                />
              </div>
            </button>
            {!collapsedSections.delivery && (
              <div className="space-y-1.5 pt-2 text-xs text-navy-800">
                {deliveryTiers.map((tier) => (
                  <label key={tier} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDeliveryTiers.includes(tier)}
                      onChange={() => toggleDeliveryTier(tier)}
                      className="rounded border-sand-300 text-navy-950 focus:ring-brass-500 w-3.5 h-3.5"
                    />
                    <span className="truncate">
                      {tier === "two_man_white_glove" && "White Glove"}
                      {tier === "pallet" && "Pallet Freight"}
                      {tier === "standard_parcel" && "Standard Parcel"}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Quality Checked Furniture Banner */}
          <div className="p-3.5 rounded-xl bg-sand-100/90 border border-sand-200/90 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-sage-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-brass-600" />
              <span className="text-[11px]">UK Quality Checked</span>
            </div>
            <p className="text-navy-600 text-[10.5px] leading-relaxed">
              Rigorous structural durability, robust joinery, and protective packaging on every order.
            </p>
          </div>
        </aside>

        {/* Product Grid & Controls Area */}
        <section className={`${isSidebarCollapsed ? "w-full" : "min-w-0"} space-y-6`}>
          {/* In-Catalog Live Search Bar & Top Action Bar */}
          <div className="p-4 rounded-2xl bg-sand-100/70 border border-sand-200/90 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search input with icon */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search within catalog (e.g. oak, velvet, desk, 3 drawer, wardrobe...)"
                  className="w-full bg-sand-50 border border-sand-300 rounded-xl pl-9 pr-9 py-2 text-xs sm:text-sm text-navy-950 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-brass-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-950"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Top Action Buttons (Master Filter Toggle, Share, Reset) */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                  className={`hidden lg:inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    isSidebarCollapsed
                      ? "bg-navy-950 text-sand-50 border-navy-950 shadow-sm hover:bg-navy-900"
                      : "bg-sand-50 border-sand-300 text-navy-800 hover:bg-sand-200"
                  }`}
                  title={isSidebarCollapsed ? "Show Filters Sidebar" : "Hide Filters Sidebar"}
                >
                  {isSidebarCollapsed ? (
                    <>
                      <PanelLeftOpen className="w-3.5 h-3.5 text-brass-400" />
                      <span>Show Filters</span>
                      {hasActiveFilters && (
                        <span className="w-4 h-4 rounded-full bg-brass-500 text-navy-950 text-[10px] font-bold flex items-center justify-center">
                          {activeFilterCount}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <PanelLeftClose className="w-3.5 h-3.5 text-navy-600" />
                      <span>Hide Filters</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShareCuration}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sand-50 border border-sand-300 text-navy-800 hover:bg-sand-200 text-xs font-semibold transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-brass-600" />
                  <span className="hidden sm:inline">Share</span>
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sand-200 text-navy-900 hover:bg-sand-300 text-xs font-semibold transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Controls Bar: Count, Sort, View Mode, Per Page */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-sand-200/80 text-xs">
              <span className="text-navy-600 font-medium">
                Showing <strong className="text-navy-950">{displayedProducts.length}</strong> of{" "}
                <strong className="text-navy-950">{filteredProducts.length}</strong> pieces
                {searchQuery && (
                  <span>
                    {" "}
                    matching &ldquo;<span className="font-semibold text-brass-700">{searchQuery}</span>&rdquo;
                  </span>
                )}
                {activeSubType && <span className="text-brass-700 font-semibold"> in {activeSubType.label}</span>}
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                {/* Sort Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-navy-500 hidden md:inline">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-sand-50 border border-sand-300 text-navy-950 py-1.5 px-2.5 rounded-lg focus:ring-1 focus:ring-brass-500 outline-none text-xs"
                  >
                    <option value="featured">Featured & Curated</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="savings">Biggest Price Drop</option>
                    <option value="width_asc">Width: Compact to Grand</option>
                    <option value="title_asc">Title: A to Z</option>
                  </select>
                </div>

                {/* View Mode Switcher (Standard 4-col vs Editorial 2-col vs List) */}
                <div className="flex items-center bg-sand-200/80 p-0.5 rounded-lg border border-sand-300/80">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid_standard")}
                    title="Standard Grid (3/4 Columns)"
                    className={`p-1.5 rounded-md transition-colors ${
                      viewMode === "grid_standard"
                        ? "bg-sand-50 text-navy-950 shadow-xs"
                        : "text-navy-600 hover:text-navy-950"
                    }`}
                  >
                    <Grid3X3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("grid_editorial")}
                    title="Editorial Comfort Grid (2 Columns)"
                    className={`p-1.5 rounded-md transition-colors ${
                      viewMode === "grid_editorial"
                        ? "bg-sand-50 text-navy-950 shadow-xs"
                        : "text-navy-600 hover:text-navy-950"
                    }`}
                  >
                    <Grid2X2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    title="Detailed List View"
                    className={`p-1.5 rounded-md transition-colors ${
                      viewMode === "list"
                        ? "bg-sand-50 text-navy-950 shadow-xs"
                        : "text-navy-600 hover:text-navy-950"
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Page Size Selector */}
                <div className="hidden lg:flex items-center gap-1 text-[11px] text-navy-500">
                  <span>Show:</span>
                  {[24, 48, "all"].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setPageSize(size as any)}
                      className={`px-1.5 py-0.5 rounded font-semibold transition-colors ${
                        pageSize === size
                          ? "bg-navy-950 text-sand-50"
                          : "hover:bg-sand-200 text-navy-700"
                      }`}
                    >
                      {size === "all" ? "All" : size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Active Filter Chips Bar */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sand-200 border border-sand-300 rounded-full text-xs text-navy-900 font-medium">
                  <span>Search: &ldquo;{searchQuery}&rdquo;</span>
                  <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search">
                    <X className="w-3 h-3 text-navy-600 hover:text-navy-950" />
                  </button>
                </span>
              )}
              {selectedSubTypeId && activeSubType && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-navy-950 text-sand-50 rounded-full text-xs font-semibold shadow-xs">
                  <span>Sub-type: {activeSubType.label}</span>
                  <button type="button" onClick={() => handleSelectSubType(null)} aria-label="Clear subtype">
                    <X className="w-3 h-3 text-sand-300 hover:text-sand-50" />
                  </button>
                </span>
              )}
              {selectedCategoryHandle && !category && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sand-200 border border-sand-300 rounded-full text-xs text-navy-900 capitalize">
                  <span>Room: {selectedCategoryHandle.replace("-", " ")}</span>
                  <button type="button" onClick={() => setSelectedCategoryHandle(null)} aria-label="Clear room">
                    <X className="w-3 h-3 text-navy-600 hover:text-navy-950" />
                  </button>
                </span>
              )}
              {onlyOnSale && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 border border-rose-300 text-rose-800 rounded-full text-xs font-semibold">
                  <span>Special Offers Only</span>
                  <button type="button" onClick={() => setOnlyOnSale(false)} aria-label="Remove sale filter">
                    <X className="w-3 h-3 text-rose-800" />
                  </button>
                </span>
              )}
              {onlyInStock && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-full text-xs font-semibold">
                  <span>In Stock Only</span>
                  <button type="button" onClick={() => setOnlyInStock(false)} aria-label="Remove stock filter">
                    <X className="w-3 h-3 text-emerald-800" />
                  </button>
                </span>
              )}
              {selectedColorTones.map((cId) => {
                const preset = COLOR_PRESETS.find((c) => c.id === cId);
                return (
                  <span
                    key={cId}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-sand-100 border border-sand-300 rounded-full text-xs text-navy-800 font-medium"
                  >
                    <span>Color: {preset?.label.split("&")[0] || cId}</span>
                    <button type="button" onClick={() => toggleColorTone(cId)} aria-label="Remove color">
                      <X className="w-3 h-3 text-navy-600 hover:text-navy-950" />
                    </button>
                  </span>
                );
              })}
              {selectedWidthRange !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sand-100 border border-sand-300 rounded-full text-xs text-navy-800 font-medium capitalize">
                  <span>Width: {selectedWidthRange}</span>
                  <button type="button" onClick={() => setSelectedWidthRange("all")} aria-label="Remove width">
                    <X className="w-3 h-3 text-navy-600 hover:text-navy-950" />
                  </button>
                </span>
              )}
              {selectedMaterials.map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-sand-100 border border-sand-300 rounded-full text-xs text-navy-800 capitalize"
                >
                  <span>{m.replace("_", " ")}</span>
                  <button type="button" onClick={() => toggleMaterial(m)} aria-label="Remove material">
                    <X className="w-3 h-3 text-navy-600 hover:text-navy-950" />
                  </button>
                </span>
              ))}
              {selectedDeliveryTiers.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-sand-100 border border-sand-300 rounded-full text-xs text-navy-800"
                >
                  <span>{t === "two_man_white_glove" ? "White Glove" : t}</span>
                  <button type="button" onClick={() => toggleDeliveryTier(t)} aria-label="Remove tier">
                    <X className="w-3 h-3 text-navy-600 hover:text-navy-950" />
                  </button>
                </span>
              ))}
              {priceRange !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sand-100 border border-sand-300 rounded-full text-xs text-navy-800">
                  <span>Price: {priceRange.replace("_", " ").toUpperCase()}</span>
                  <button type="button" onClick={() => setPriceRange("all")} aria-label="Remove price filter">
                    <X className="w-3 h-3 text-navy-600 hover:text-navy-950" />
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
            <div className="py-20 text-center bg-sand-100 rounded-2xl border border-sand-200 space-y-4">
              <h3 className="font-display font-bold text-xl text-navy-950">No Matching Furniture Pieces</h3>
              <p className="text-xs sm:text-sm text-navy-600 max-w-sm mx-auto">
                No items match your active filters or search terms. Try clearing one or more facets to view our available UK collections.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-5 py-2.5 bg-navy-950 text-sand-50 rounded-xl text-xs font-semibold hover:bg-navy-900 transition-colors shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            /* Product Cards View Container */
            <div className="space-y-8">
              {/* Standard Grid Mode (4 cols on xl with sidebar, 5 cols when collapsed) */}
              {viewMode === "grid_standard" && (
                <StaggerContainer
                  key={`std-${selectedSubTypeId}-${sortBy}-${priceRange}-${searchQuery}-${displayedProducts.length}-${isSidebarCollapsed}`}
                  className={`grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 ${
                    isSidebarCollapsed ? "xl:grid-cols-5" : "xl:grid-cols-4"
                  } gap-3 sm:gap-6`}
                >
                  {displayedProducts.map((product) => {
                    const isSaved = isWishlisted(product.id);
                    const isCompared = comparedProducts.some((p) => p.id === product.id);
                    const klarnaMonth = Math.round(product.pricePennies / 3);

                    return (
                      <StaggerItem key={product.id}>
                        <article className="group flex flex-col rounded-2xl overflow-hidden bg-sand-100/80 border border-sand-200/90 hover:border-sand-300 transition-[box-shadow,border-color] duration-300 shadow-sm hover:shadow-card active:scale-[0.99] h-full">
                          {/* Image Box */}
                          <div className="relative block aspect-[4/3] bg-sand-200 overflow-hidden">
                            <Link href={`/products/${product.handle}`} prefetch={false} className="block w-full h-full">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={product.thumbnailUrl}
                                alt={product.title}
                                decoding="async"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                loading="lazy"
                              />
                            </Link>

                            {/* Delivery Badge */}
                            <span className="absolute top-2 left-2 z-10 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold rounded bg-navy-950/90 backdrop-blur-sm text-sand-50 flex items-center gap-1 shadow-ambient">
                              <Truck className="w-2.5 h-2.5 text-brass-400" />
                              <span className="truncate max-w-[85px] sm:max-w-none">
                                {product.specs?.delivery_tier === "two_man_white_glove"
                                  ? "White Glove"
                                  : "Free UK Delivery"}
                              </span>
                            </span>

                            {/* Wishlist Button */}
                            <button
                              type="button"
                              onClick={() => toggleWishlist(product)}
                              aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
                              className={`absolute top-2 right-2 z-10 p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-all shadow-sm ${
                                isSaved
                                  ? "bg-sand-50 text-rose-600 ring-1 ring-rose-200"
                                  : "bg-sand-50/80 text-navy-700 hover:text-navy-950 hover:bg-sand-50"
                              }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-rose-600" : ""}`} />
                            </button>

                            {/* Quick View Button (hover overlay) */}
                            <div className="absolute inset-x-2 bottom-2 z-10 hidden sm:flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => setQuickViewProduct(product)}
                                className="flex-1 py-1.5 px-2 rounded-lg bg-sand-50/95 backdrop-blur-sm text-navy-950 text-[11px] font-bold hover:bg-sand-50 transition-colors shadow-md flex items-center justify-center gap-1.5"
                              >
                                <Eye className="w-3.5 h-3.5 text-brass-600" />
                                <span>Quick View</span>
                              </button>
                            </div>
                          </div>

                          {/* Card Content */}
                          <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-navy-500 mb-1">
                                <span className="capitalize truncate max-w-[85px] sm:max-w-none">
                                  {product.specs?.material ? product.specs.material.replace("_", " ") : "Hardwood"}
                                </span>
                                <span className="shrink-0 font-medium">{product.specs?.width_cm ?? 120}cm W</span>
                              </div>

                              <h3 className="font-display font-bold text-xs sm:text-base text-navy-950 group-hover:text-brass-600 transition-colors line-clamp-1">
                                <Link href={`/products/${product.handle}`} prefetch={false}>
                                  {product.title}
                                </Link>
                              </h3>

                              <p className="text-[11px] sm:text-xs text-navy-600 mt-1 line-clamp-2 hidden sm:block">
                                {product.subtitle}
                              </p>
                            </div>

                            {/* Price, Klarna, & Action Buttons */}
                            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-sand-200/80 space-y-1.5 sm:space-y-2">
                              <div className="flex items-baseline justify-between gap-1 flex-wrap">
                                <span className="font-display font-bold text-sm sm:text-lg text-navy-950">
                                  {formatGBP(product.pricePennies)}
                                </span>
                                {product.compareAtPricePennies && product.compareAtPricePennies > product.pricePennies && (
                                  <span className="text-[10px] sm:text-xs line-through text-navy-400 font-medium">
                                    {formatGBP(product.compareAtPricePennies)}
                                  </span>
                                )}
                              </div>

                              {/* Klarna finance hint */}
                              <div className="text-[9px] sm:text-[10px] text-navy-600 flex items-center justify-between">
                                <span>3x {formatGBP(klarnaMonth)} with Klarna</span>
                                <span className="text-emerald-700 font-semibold">20% VAT Incl.</span>
                              </div>

                              {/* Quick Actions (Quick Add & Compare) */}
                              <div className="grid grid-cols-2 gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleQuickAddToCart(product)}
                                  disabled={addingCartId === product.id}
                                  className="py-1.5 sm:py-2 px-2 rounded-lg bg-navy-950 hover:bg-navy-900 active:scale-95 text-sand-50 text-[10px] sm:text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1"
                                >
                                  {addingCartId === product.id ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <ShoppingBag className="w-3 h-3 text-brass-400" />
                                  )}
                                  <span className="truncate">{addingCartId === product.id ? "Added!" : "Quick Add"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleCompare(product)}
                                  className={`py-1.5 sm:py-2 px-2 rounded-lg border text-[10px] sm:text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                                    isCompared
                                      ? "bg-sand-200 border-navy-950 text-navy-950"
                                      : "bg-sand-50 border-sand-300 text-navy-700 hover:bg-sand-200"
                                  }`}
                                >
                                  <Layers className="w-3 h-3 text-brass-600" />
                                  <span className="truncate">{isCompared ? "Compared" : "Compare"}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </article>
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>
              )}

              {/* Editorial / Comfort Grid Mode (2 columns with sidebar, 3 when collapsed) */}
              {viewMode === "grid_editorial" && (
                <div
                  className={`grid grid-cols-1 ${
                    isSidebarCollapsed ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2"
                  } gap-6`}
                >
                  {displayedProducts.map((product) => {
                    const isSaved = isWishlisted(product.id);
                    const isCompared = comparedProducts.some((p) => p.id === product.id);
                    const klarnaMonth = Math.round(product.pricePennies / 3);

                    return (
                      <article
                        key={product.id}
                        className="group flex flex-col rounded-2xl overflow-hidden bg-sand-100/90 border border-sand-200/90 hover:border-sand-300 transition-all shadow-sm hover:shadow-card"
                      >
                        <div className="relative aspect-[16/10] bg-sand-200 overflow-hidden">
                          <Link href={`/products/${product.handle}`} className="block w-full h-full">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={product.thumbnailUrl}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </Link>
                          <span className="absolute top-3 left-3 z-10 px-2.5 py-1 text-[10px] font-semibold rounded bg-navy-950/90 backdrop-blur-sm text-sand-50 flex items-center gap-1.5 shadow-sm">
                            <Truck className="w-3 h-3 text-brass-400" />
                            {product.specs?.delivery_tier === "two_man_white_glove"
                              ? "White Glove (Room of Choice)"
                              : "Free Mainland UK Delivery"}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleWishlist(product)}
                            className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition-all shadow-sm ${
                              isSaved ? "bg-sand-50 text-rose-600" : "bg-sand-50/80 text-navy-700 hover:bg-sand-50"
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isSaved ? "fill-rose-600" : ""}`} />
                          </button>
                        </div>
                        <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <div className="flex items-center justify-between text-xs text-navy-500 mb-1">
                              <span className="font-semibold text-brass-700 uppercase tracking-wider text-[10px]">
                                {product.specs?.material?.replace("_", " ") || "Handcrafted Furniture"}
                              </span>
                              <span>
                                {product.specs?.width_cm ?? 120}cm W × {product.specs?.height_cm ?? 85}cm H
                              </span>
                            </div>
                            <h3 className="font-display font-bold text-xl text-navy-950 group-hover:text-brass-600 transition-colors">
                              <Link href={`/products/${product.handle}`}>{product.title}</Link>
                            </h3>
                            <p className="text-xs text-navy-600 mt-2 line-clamp-2 leading-relaxed">
                              {product.subtitle || product.description}
                            </p>
                          </div>
                          <div className="pt-4 border-t border-sand-200 space-y-3">
                            <div className="flex items-baseline justify-between">
                              <div>
                                <span className="font-display font-bold text-2xl text-navy-950">
                                  {formatGBP(product.pricePennies)}
                                </span>
                                {product.compareAtPricePennies && product.compareAtPricePennies > product.pricePennies && (
                                  <span className="ml-2 text-xs line-through text-navy-400">
                                    {formatGBP(product.compareAtPricePennies)}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-emerald-800 font-medium">Includes 20% UK VAT</span>
                            </div>
                            <div className="text-xs text-navy-600 p-2 rounded-lg bg-sand-200/50 flex items-center justify-between">
                              <span>Klarna: 3 monthly payments of {formatGBP(klarnaMonth)}</span>
                              <span className="text-navy-500 text-[10px] font-bold">0% APR</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleQuickAddToCart(product)}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5"
                              >
                                <ShoppingBag className="w-3.5 h-3.5 text-brass-400" />
                                <span>Add to Bag</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setQuickViewProduct(product)}
                                className="py-2.5 px-3 rounded-xl bg-sand-200 hover:bg-sand-300 text-navy-950 text-xs font-semibold transition-colors flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleCompare(product)}
                                className={`p-2.5 rounded-xl border transition-colors ${
                                  isCompared ? "bg-navy-950 text-sand-50" : "bg-sand-50 text-navy-700 hover:bg-sand-200"
                                }`}
                                title="Compare"
                              >
                                <Layers className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* List View Mode (1 column detailed rows) */}
              {viewMode === "list" && (
                <div className="space-y-4">
                  {displayedProducts.map((product) => {
                    const isSaved = isWishlisted(product.id);
                    const isCompared = comparedProducts.some((p) => p.id === product.id);
                    const klarnaMonth = Math.round(product.pricePennies / 3);

                    return (
                      <article
                        key={product.id}
                        className="group flex flex-col md:flex-row items-stretch rounded-2xl overflow-hidden bg-sand-100/90 border border-sand-200/90 hover:border-sand-300 transition-all shadow-sm hover:shadow-card p-4 sm:p-5 gap-5"
                      >
                        {/* Photo */}
                        <div className="relative w-full md:w-56 aspect-[4/3] rounded-xl overflow-hidden bg-sand-200 shrink-0">
                          <Link href={`/products/${product.handle}`} className="block w-full h-full">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={product.thumbnailUrl}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleWishlist(product)}
                            className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md ${
                              isSaved ? "bg-sand-50 text-rose-600" : "bg-sand-50/80 text-navy-700"
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-rose-600" : ""}`} />
                          </button>
                        </div>

                        {/* Specs & Description (Center) */}
                        <div className="flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <div className="flex items-center gap-2 text-xs text-navy-500 mb-1">
                              <span className="font-semibold text-brass-700 uppercase tracking-wider text-[10px]">
                                {product.specs?.material?.replace("_", " ") || "Handcrafted Furniture"}
                              </span>
                              {product.sku && <span className="font-mono text-[10px]">SKU: {product.sku}</span>}
                            </div>
                            <h3 className="font-display font-bold text-base sm:text-lg text-navy-950 group-hover:text-brass-600 transition-colors">
                              <Link href={`/products/${product.handle}`}>{product.title}</Link>
                            </h3>
                            <p className="text-xs text-navy-600 mt-1 line-clamp-2 leading-relaxed">
                              {product.subtitle || product.description}
                            </p>
                          </div>

                          {/* Dimensions & Logistics Grid */}
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-navy-700 pt-2 border-t border-sand-200/80">
                            <span className="inline-flex items-center gap-1 font-semibold">
                              <Ruler className="w-3 h-3 text-brass-600" />
                              {product.specs?.width_cm ?? 120}W × {product.specs?.height_cm ?? 85}H × {product.specs?.depth_cm ?? 60}D cm
                            </span>
                            <span>·</span>
                            <span>Weight: {product.specs?.weight_kg ?? 35}kg</span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              BS 5852 Certified
                            </span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1 text-navy-800">
                              <Truck className="w-3 h-3 text-brass-600" />
                              {product.specs?.delivery_tier === "two_man_white_glove" ? "White Glove" : "Free UK Freight"}
                            </span>
                          </div>
                        </div>

                        {/* Pricing & Actions (Right) */}
                        <div className="w-full md:w-52 flex flex-col justify-between border-t md:border-t-0 md:border-l border-sand-200 pt-3 md:pt-0 md:pl-5 space-y-3 shrink-0">
                          <div>
                            <div className="font-display font-bold text-xl text-navy-950">
                              {formatGBP(product.pricePennies)}
                            </div>
                            {product.compareAtPricePennies && product.compareAtPricePennies > product.pricePennies && (
                              <div className="text-xs line-through text-navy-400">
                                {formatGBP(product.compareAtPricePennies)}
                              </div>
                            )}
                            <div className="text-[10px] text-emerald-700 font-medium mt-0.5">20% UK VAT Included</div>
                            <div className="text-[10px] text-navy-600 mt-1">
                              Or 3x {formatGBP(klarnaMonth)} (Klarna)
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickAddToCart(product)}
                              className="w-full py-2 px-3 rounded-lg bg-navy-950 hover:bg-navy-900 text-sand-50 text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5"
                            >
                              <ShoppingBag className="w-3.5 h-3.5 text-brass-400" />
                              <span>Add to Bag</span>
                            </button>
                            <div className="grid grid-cols-2 gap-1">
                              <button
                                type="button"
                                onClick={() => setQuickViewProduct(product)}
                                className="py-1.5 px-2 rounded-lg bg-sand-200 hover:bg-sand-300 text-navy-900 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Preview</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleCompare(product)}
                                className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 ${
                                  isCompared ? "bg-navy-950 text-sand-50" : "bg-sand-50 text-navy-800 hover:bg-sand-200"
                                }`}
                              >
                                <Layers className="w-3 h-3" />
                                <span>{isCompared ? "Compared" : "Compare"}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* Progress & Pagination Bar */}
              {filteredProducts.length > displayedProducts.length && (
                <div className="pt-8 pb-4 text-center space-y-3">
                  <div className="max-w-xs mx-auto space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-navy-600 font-medium">
                      <span>
                        Showing {displayedProducts.length} of {filteredProducts.length} pieces
                      </span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-sand-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-navy-950 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      className="px-6 py-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-sand-50 text-xs font-semibold transition-all shadow-sm"
                    >
                      Show More Pieces
                    </button>
                    <button
                      type="button"
                      onClick={handleShowAll}
                      className="px-5 py-2.5 rounded-xl bg-sand-200 hover:bg-sand-300 text-navy-950 text-xs font-semibold transition-colors"
                    >
                      View All {filteredProducts.length}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Mobile Slide-Over Filter Drawer */}
      {isMobileFilterOpen && (
        <div
          className="fixed inset-0 z-50 flex bg-navy-950/70 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm h-full bg-sand-50 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-sand-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-brass-600" />
                <h3 className="font-display font-bold text-base text-navy-950">
                  Filters & Refine ({activeFilterCount})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1.5 rounded-full hover:bg-sand-200 text-navy-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Filters Body */}
            <div className="p-4 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Special offers toggle */}
              <div className="p-3 rounded-xl bg-sand-100 border border-sand-200">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-bold text-navy-950">Special Offers Only</span>
                  <input
                    type="checkbox"
                    checked={onlyOnSale}
                    onChange={(e) => setOnlyOnSale(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600"
                  />
                </label>
              </div>

              {/* In stock toggle */}
              <div className="p-3 rounded-xl bg-sand-100 border border-sand-200">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-bold text-navy-950">In Stock & Immediate Dispatch</span>
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-700"
                  />
                </label>
              </div>

              {/* Color Tones */}
              <div className="space-y-2">
                <h4 className="font-bold text-navy-900 uppercase tracking-wider text-[11px]">Color & Finish</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => toggleColorTone(preset.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left ${
                        selectedColorTones.includes(preset.id)
                          ? "bg-navy-950 text-sand-50 border-navy-950"
                          : "bg-sand-100 border-sand-200 text-navy-800"
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0 border border-sand-300"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span className="truncate text-[11px]">{preset.label.split("&")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Width */}
              <div className="space-y-2">
                <h4 className="font-bold text-navy-900 uppercase tracking-wider text-[11px]">Width</h4>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="m_width"
                      checked={selectedWidthRange === "all"}
                      onChange={() => setSelectedWidthRange("all")}
                    />
                    <span>All Widths</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="m_width"
                      checked={selectedWidthRange === "compact"}
                      onChange={() => setSelectedWidthRange("compact")}
                    />
                    <span>Compact (&lt; 100 cm)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="m_width"
                      checked={selectedWidthRange === "medium"}
                      onChange={() => setSelectedWidthRange("medium")}
                    />
                    <span>Standard (100–160 cm)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="m_width"
                      checked={selectedWidthRange === "wide"}
                      onChange={() => setSelectedWidthRange("wide")}
                    />
                    <span>Grand (&gt; 160 cm)</span>
                  </label>
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <h4 className="font-bold text-navy-900 uppercase tracking-wider text-[11px]">Price</h4>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="m_price"
                      checked={priceRange === "all"}
                      onChange={() => setPriceRange("all")}
                    />
                    <span>All Prices</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="m_price"
                      checked={priceRange === "under_300"}
                      onChange={() => setPriceRange("under_300")}
                    />
                    <span>Under £300</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="m_price"
                      checked={priceRange === "300_600"}
                      onChange={() => setPriceRange("300_600")}
                    />
                    <span>£300 – £600</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="m_price"
                      checked={priceRange === "600_1200"}
                      onChange={() => setPriceRange("600_1200")}
                    />
                    <span>£600 – £1,200</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="m_price"
                      checked={priceRange === "over_1200"}
                      onChange={() => setPriceRange("over_1200")}
                    />
                    <span>Over £1,200</span>
                  </label>
                </div>
              </div>

              {/* Delivery Tier */}
              <div className="space-y-2">
                <h4 className="font-bold text-navy-900 uppercase tracking-wider text-[11px]">Delivery Tier</h4>
                <div className="space-y-1.5">
                  {deliveryTiers.map((tier) => (
                    <label key={tier} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedDeliveryTiers.includes(tier)}
                        onChange={() => toggleDeliveryTier(tier)}
                      />
                      <span>
                        {tier === "two_man_white_glove" ? "White Glove" : tier === "pallet" ? "Pallet" : "Standard"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-sand-200 bg-sand-100 flex items-center gap-3">
              <button
                type="button"
                onClick={clearAllFilters}
                className="w-1/3 py-2.5 rounded-xl border border-sand-300 text-xs font-semibold text-navy-800"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-navy-950 text-sand-50 text-xs font-semibold shadow-md"
              >
                Show {filteredProducts.length} Pieces
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      <ProductQuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        onCompareToggle={handleToggleCompare}
        isCompared={quickViewProduct ? comparedProducts.some((p) => p.id === quickViewProduct.id) : false}
      />

      {/* Product Comparison Drawer & Modal */}
      <ProductCompareDrawer
        comparedProducts={comparedProducts}
        onRemoveProduct={handleRemoveCompare}
        onClearAll={handleClearCompare}
      />
    </div>
  );
}
