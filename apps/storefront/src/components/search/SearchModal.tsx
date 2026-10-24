"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { Search, X, ArrowRight, CornerDownLeft, Sparkles, Loader2 } from "lucide-react";
import { CATALOG_CATEGORIES, type CatalogProduct } from "@/lib/catalog";
import { formatGBP } from "@san-furniture/types";
import { apiUrl } from "@/lib/api-config";
import { getCachedData } from "@/lib/api-cache";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProducts?: CatalogProduct[];
}

const TRENDING_SEARCHES = [
  "Chelsea Bedside",
  "Madrid Wardrobe",
  "Copenhagen Mirror",
  "Solid Oak",
  "Sliding Wardrobe",
  "Shoe Cupboard",
];

export function SearchModal({ isOpen, onClose, initialProducts }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [productsList, setProductsList] = useState<CatalogProduct[]>(() => {
    if (initialProducts && Array.isArray(initialProducts) && initialProducts.length > 0) {
      return initialProducts;
    }
    const cached = getCachedData<{ products: CatalogProduct[] }>(apiUrl("/api/products"));
    return cached?.products && Array.isArray(cached.products) && cached.products.length > 0
      ? cached.products
      : [];
  });

  // Sync initialProducts whenever they become available or update
  useEffect(() => {
    if (initialProducts && Array.isArray(initialProducts) && initialProducts.length > 0) {
      setProductsList(initialProducts);
    }
  }, [initialProducts]);

  const loadProducts = async (force: boolean = false) => {
    if (productsList.length > 0 && !force) return;
    try {
      setIsLoading(true);
      // Try local Next.js route first with cache busting
      const res = await fetch(`/api/products?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data?.products)
          ? data.products
          : (Array.isArray(data) ? data : []);
        if (list.length > 0) {
          setProductsList(list);
          return;
        }
      }

      // Secondary fallback via universal apiUrl
      const fallbackUrl = apiUrl("/api/products");
      const fallbackRes = await fetch(`${fallbackUrl}${fallbackUrl.includes("?") ? "&" : "?"}t=${Date.now()}`);
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        const fallbackList = Array.isArray(fallbackData?.products)
          ? fallbackData.products
          : (Array.isArray(fallbackData) ? fallbackData : []);
        if (fallbackList.length > 0) {
          setProductsList(fallbackList);
        }
      }
    } catch (err) {
      console.warn("SearchModal load products error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (productsList.length === 0) {
      loadProducts();
    }
  }, []);

  // When modal opens: auto-focus and ensure products are loaded
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
      if (productsList.length === 0) {
        loadProducts(true);
      }
    } else {
      setQuery("");
    }
  }, [isOpen, productsList.length]);

  // Global keyboard shortcuts (Cmd+K, Ctrl+K, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling
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

  // Live multi-token fuzzy search filtering
  const { items: searchResults, fallbackToAll } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);

    const matchesProduct = (product: CatalogProduct) => {
      if (tokens.length === 0) return true;
      const searchable = `
        ${product.title || ""} 
        ${product.subtitle || ""} 
        ${product.description || ""} 
        ${product.specs?.material || ""} 
        ${product.specs?.color || ""} 
        ${product.specs?.frame_material || ""} 
        ${product.handle || ""}
      `.toLowerCase();
      return tokens.every((token) => searchable.includes(token));
    };

    // Filter within selected category
    const categoryMatches = productsList.filter((product) => {
      if (selectedCategory !== "all" && product.categoryId !== selectedCategory) {
        return false;
      }
      return matchesProduct(product);
    });

    if (categoryMatches.length > 0 || !q) {
      return { items: categoryMatches.slice(0, 16), fallbackToAll: false };
    }

    // If 0 matches in category but search query exists, fallback across all categories
    const allMatches = productsList.filter(matchesProduct);
    if (allMatches.length > 0) {
      return { items: allMatches.slice(0, 16), fallbackToAll: true };
    }

    return { items: [], fallbackToAll: false };
  }, [productsList, query, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 md:p-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-950/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search catalog"
        className="relative mx-auto max-w-2xl transform overflow-hidden rounded-2xl bg-sand-50 shadow-2xl border border-sand-300 transition-all top-6 sm:top-0"
      >
        {/* Search Bar Input */}
        <div className="flex items-center px-4 border-b border-sand-200 bg-sand-100/70">
          <Search className="w-5 h-5 text-navy-500 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sofas, oak dining tables, bedside chests..."
            className="w-full h-14 bg-transparent text-sm sm:text-base text-navy-950 placeholder:text-navy-400 focus:outline-none"
          />
          {isLoading && (
            <Loader2 className="w-4 h-4 text-brass-600 animate-spin mr-2 shrink-0" />
          )}
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-full text-navy-400 hover:text-navy-900 transition-colors mr-2 cursor-pointer"
              aria-label="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold text-navy-500 bg-sand-200 rounded border border-sand-300 mr-2">
              ESC
            </kbd>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-navy-600 hover:text-navy-950 hover:bg-sand-200 transition-colors cursor-pointer"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 overflow-x-auto border-b border-sand-200 bg-sand-50 no-scrollbar text-xs">
          <span className="text-[10px] sm:text-[11px] font-semibold text-navy-500 uppercase tracking-wider mr-1 shrink-0">
            Filter:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === "all"
                ? "bg-navy-950 text-sand-50"
                : "bg-sand-200 text-navy-800 hover:bg-sand-300"
            }`}
          >
            All Products ({productsList.length})
          </button>
          {CATALOG_CATEGORIES.map((cat) => {
            const count = productsList.filter((p) => p.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-navy-950 text-sand-50"
                    : "bg-sand-200 text-navy-800 hover:bg-sand-300"
                }`}
              >
                {cat.name.split(" ")[0]} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        {/* Trending Searches Suggestions if query is empty */}
        {!query && (
          <div className="px-4 py-2.5 bg-sand-100/50 border-b border-sand-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
            <span className="text-navy-500 font-semibold uppercase tracking-wider shrink-0 mr-1">Trending:</span>
            {TRENDING_SEARCHES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setQuery(item)}
                className="px-2.5 py-0.5 rounded-md bg-sand-50 hover:bg-white text-navy-800 border border-sand-200 shrink-0 cursor-pointer active:scale-95 transition-all"
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {/* Fallback to all categories banner */}
        {fallbackToAll && (
          <div className="mx-3 my-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <span>Found {searchResults.length} matching pieces in other categories</span>
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className="text-navy-950 font-bold underline ml-2 cursor-pointer"
            >
              Show all
            </button>
          </div>
        )}

        {/* Results List */}
        <div className="max-h-[55vh] sm:max-h-[60vh] overflow-y-auto divide-y divide-sand-200 p-2">
          {isLoading && productsList.length === 0 ? (
            <div className="py-12 px-6 text-center">
              <Loader2 className="w-8 h-8 text-brass-600 animate-spin mx-auto mb-2" />
              <p className="font-display text-sm font-semibold text-navy-900">
                Loading live British furniture catalog...
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-12 px-6 text-center">
              <Sparkles className="w-8 h-8 text-brass-500 mx-auto mb-2 opacity-70" />
              <p className="font-display text-base font-bold text-navy-900 mb-1">
                No matching furniture found
              </p>
              <p className="text-xs text-navy-600 max-w-sm mx-auto">
                Try searching for &quot;wardrobe&quot;, &quot;bedside&quot;, &quot;oak&quot;, or &quot;mirror&quot; to discover our UK pieces.
              </p>
            </div>
          ) : (
            searchResults.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.handle}`}
                prefetch={false}
                onClick={onClose}
                className="group flex items-center justify-between p-3 rounded-xl hover:bg-sand-200/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-sand-200 shrink-0 border border-sand-300">
                    <img
                      src={product.thumbnailUrl}
                      alt={product.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-navy-950 group-hover:text-brass-600 transition-colors truncate">
                      {product.title}
                    </h4>
                    <p className="text-[11px] text-navy-600 truncate">
                      {product.specs?.color || "Luxury Finish"} • {product.specs?.material || "Premium Quality"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-3 shrink-0 text-right">
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-navy-950 block">
                      {formatGBP(product.pricePennies)}
                    </span>
                    <span className="text-[10px] text-forest-700 font-medium">
                      In Stock
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-navy-400 group-hover:text-brass-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Quick Footer Navigation */}
        <div className="p-3 bg-sand-100/70 border-t border-sand-200 flex items-center justify-between text-[11px] text-navy-600">
          <div className="flex items-center gap-3">
            <span>
              Showing {searchResults.length} {searchResults.length === 1 ? "result" : "results"}
            </span>
            <span>•</span>
            <span className="text-forest-700 font-semibold">Free UK Mainland Delivery</span>
          </div>
          <Link
            href="/catalog"
            onClick={onClose}
            className="flex items-center gap-1 font-semibold text-navy-950 hover:text-brass-600 transition-colors"
          >
            <span>View all products</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
