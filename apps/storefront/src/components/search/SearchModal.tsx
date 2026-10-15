"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { Search, X, ArrowRight, CornerDownLeft, Sparkles, SlidersHorizontal } from "lucide-react";
import { CATALOG_PRODUCTS, CATALOG_CATEGORIES, type CatalogProduct } from "@/lib/catalog";
import { formatGBP } from "@san-furniture/types";
import { apiUrl } from "@/lib/api-config";
import { fetchWithSwr, getCachedData } from "@/lib/api-cache";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  const cachedProds = getCachedData<{ products: CatalogProduct[] }>(apiUrl("/api/products"));
  const [productsList, setProductsList] = useState<CatalogProduct[]>(
    () => cachedProds?.products || CATALOG_PRODUCTS
  );

  useEffect(() => {
    fetchWithSwr<{ products: CatalogProduct[] }>(
      apiUrl("/api/products"),
      (data) => {
        if (Array.isArray(data?.products) && data.products.length > 0) {
          setProductsList(data.products);
        }
      }
    ).catch(() => {});
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

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

  // Live product search filtering
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    return productsList.filter((product) => {
      // Category filter
      if (selectedCategory !== "all" && product.categoryId !== selectedCategory) {
        return false;
      }
      if (!q) return true; // Show category or top items if query is empty

      const matchTitle = product.title.toLowerCase().includes(q);
      const matchSubtitle = (product.subtitle || "").toLowerCase().includes(q);
      const matchDesc = (product.description || "").toLowerCase().includes(q);
      const matchMaterial = (product.specs?.material || "").toLowerCase().includes(q);
      const matchColor = (product.specs?.color || "").toLowerCase().includes(q);

      return matchTitle || matchSubtitle || matchDesc || matchMaterial || matchColor;
    }).slice(0, 8);
  }, [productsList, query, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search catalog"
        className="relative mx-auto max-w-2xl transform overflow-hidden rounded-xl bg-sand-50 shadow-2xl border border-sand-300 transition-all"
      >
        {/* Search Bar Input */}
        <div className="flex items-center px-4 border-b border-sand-200 bg-sand-100/60">
          <Search className="w-5 h-5 text-navy-500 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sofas, oak dining tables, bouclé armchairs..."
            className="w-full h-14 bg-transparent text-sm sm:text-base text-navy-950 placeholder:text-navy-400 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-full text-navy-400 hover:text-navy-900 transition-colors mr-2"
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
            className="p-1.5 rounded-lg text-navy-600 hover:text-navy-950 hover:bg-sand-200 transition-colors"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 overflow-x-auto border-b border-sand-200 bg-sand-50 scrollbar-none text-xs">
          <span className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider mr-1">
            Filter:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              selectedCategory === "all"
                ? "bg-navy-950 text-sand-50"
                : "bg-sand-200 text-navy-800 hover:bg-sand-300"
            }`}
          >
            All Products
          </button>
          {CATALOG_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-navy-950 text-sand-50"
                  : "bg-sand-200 text-navy-800 hover:bg-sand-300"
              }`}
            >
              {cat.name.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-sand-200 p-2">
          {searchResults.length === 0 ? (
            <div className="py-12 px-6 text-center">
              <Sparkles className="w-8 h-8 text-brass-500 mx-auto mb-2 opacity-70" />
              <p className="font-display text-base font-bold text-navy-900 mb-1">
                No matching furniture found
              </p>
              <p className="text-xs text-navy-600 max-w-sm mx-auto">
                Try searching for &quot;bouclé&quot;, &quot;oak&quot;, &quot;velvet&quot;, or &quot;marble&quot; to discover our UK pieces.
              </p>
            </div>
          ) : (
            searchResults.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.handle}`}
                onClick={onClose}
                className="group flex items-center justify-between p-3 rounded-lg hover:bg-sand-200/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-sand-200 flex-shrink-0 border border-sand-300">
                    <img
                      src={product.thumbnailUrl}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-navy-950 group-hover:text-brass-600 transition-colors truncate">
                      {product.title}
                    </h4>
                    <p className="text-[11px] text-navy-600 truncate">
                      {product.specs.color} • {product.specs.material}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-3 flex-shrink-0 text-right">
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
            <span className="text-brass-600 font-medium">Free White Glove over £500</span>
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
