"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ArrowRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  CreditCard,
  Sparkles,
  Clock,
  Tag,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  MegaMenuContent,
  MegaMenuTab,
  MegaMenuColumn,
  MegaMenuLink as MegaMenuLinkType,
  MegaMenuPerk,
} from "@/lib/cms-defaults";

const PERK_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Truck,
  ShieldCheck,
  RotateCcw,
  CreditCard,
  Sparkles,
  Clock,
  Tag,
  Star,
};

interface MegaMenuProps {
  data: MegaMenuContent;
  className?: string;
}

export function MegaMenu({ data, className = "" }: MegaMenuProps) {
  const pathname = usePathname();
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(112);

  const tabs = data?.tabs || [];
  const bottomPerks = data?.bottom_perks || [];

  // Dynamically track exact header height so backdrop starts strictly at header bottom
  useEffect(() => {
    const header = containerRef.current?.closest("header");
    if (!header) return;
    const updateHeight = () => {
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(header);
    window.addEventListener("resize", updateHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  // Toggle mega menu on CLICK instead of accidental hover
  const handleToggleTab = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveTabId((prev) => (prev === tabId ? null : tabId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setActiveTabId(null);
    }
  };

  // Close on route change
  useEffect(() => {
    setActiveTabId(null);
  }, [pathname]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveTabId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeTab = tabs.find((t) => t.id === activeTabId) || null;

  if (!tabs.length) return null;

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={`h-full flex items-center ${className}`}
    >
      {/* Top Level Navigation Tabs */}
      <nav
        className="h-full flex items-center justify-center gap-1 xl:gap-2 2xl:gap-3 text-sm font-medium text-navy-900 flex-nowrap"
        aria-label="Main Navigation"
      >
        {tabs.map((tab) => {
          const isSelected = activeTabId === tab.id;
          const isCurrentRoute =
            pathname === tab.href ||
            (tab.href !== "/catalog" && pathname.startsWith(tab.href));

          return (
            <div
              key={tab.id}
              className="h-full flex items-center relative py-2 shrink-0"
            >
              <button
                type="button"
                onClick={(e) => handleToggleTab(e, tab.id)}
                aria-expanded={isSelected}
                aria-haspopup="true"
                className={`group relative flex items-center gap-1 xl:gap-1.5 px-2.5 xl:px-3.5 py-2 rounded-lg text-xs lg:text-[13px] xl:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isSelected
                    ? "text-brass-800 bg-sand-200/90 font-bold shadow-2xs"
                    : isCurrentRoute
                    ? "text-brass-700 bg-sand-200/50 font-semibold"
                    : "text-navy-900 hover:text-brass-700 hover:bg-sand-100/90"
                }`}
              >
                <span className="whitespace-nowrap select-none">{tab.label}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-navy-400 group-hover:text-brass-600 transition-transform duration-300 shrink-0 ${
                    isSelected ? "rotate-180 text-brass-700" : ""
                  }`}
                />

                {/* Floating E-Commerce Notification Badge (Top-Right Pill with Downward Pointer) */}
                {tab.badge && (
                  <span className="absolute -top-2.5 right-1.5 flex items-center justify-center pointer-events-none">
                    <span
                      className={`relative px-1.5 py-0.5 text-[8.5px] font-extrabold tracking-wider uppercase rounded-full shadow-xs whitespace-nowrap leading-none border ${
                        tab.badge.toUpperCase() === "SALE" ||
                        tab.badge.toUpperCase() === "HOT" ||
                        tab.badge.includes("%")
                          ? "bg-terracotta-600 text-white border-terracotta-700/40"
                          : "bg-brass-600 text-white border-brass-700/40"
                      }`}
                    >
                      {tab.badge}
                      {/* Downward indicator pointer */}
                      <span
                        className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-x-2 border-x-transparent border-t-[3px] ${
                          tab.badge.toUpperCase() === "SALE" ||
                          tab.badge.toUpperCase() === "HOT" ||
                          tab.badge.includes("%")
                            ? "border-t-terracotta-600"
                            : "border-t-brass-600"
                        }`}
                      />
                    </span>
                  </span>
                )}
              </button>

              {/* Bottom active tab indicator bar aligned with header border */}
              {isSelected && (
                <span className="absolute bottom-0 inset-x-2 h-[2.5px] bg-brass-600 rounded-t-full shadow-xs pointer-events-none" />
              )}
            </div>
          );
        })}
      </nav>

      {/* Dropdown Mega Menu Panel & Backdrop */}
      <AnimatePresence>
        {activeTab && (
          <>
            {/* Dimmed backdrop overlay covering page content strictly below header */}
            <motion.div
              key="mega-menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setActiveTabId(null)}
              style={{ top: `${headerHeight}px` }}
              className="fixed inset-x-0 bottom-0 bg-navy-950/40 backdrop-blur-[2px] z-30 pointer-events-auto"
            />

            {/* Seamless Mega Menu Panel with Smooth Motion Effect */}
            <motion.div
              key={`mega-menu-panel-${activeTab.id}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-0 top-full pt-0 pb-8 px-4 sm:px-6 lg:px-8 z-50 pointer-events-auto flex justify-center"
            >
              <div
                style={{ backgroundColor: "#FAF8F5" }}
                className="w-full max-w-[1520px] bg-sand-50 rounded-b-2xl border-x border-b border-sand-300 shadow-[0_25px_60px_-15px_rgba(0,7,45,0.25)] overflow-hidden relative z-50"
              >
                <div
                  key={activeTab.id}
                  style={{ backgroundColor: "#FAF8F5" }}
                  className="p-6 lg:p-8 grid grid-cols-12 gap-6 lg:gap-8 animate-fade-in bg-sand-50"
                >
                  {/* Left Side: Category Columns (7 Columns on large screens) */}
                  <div
                    className={`grid gap-6 lg:gap-8 ${
                      activeTab.columns.length === 1
                        ? "col-span-12 lg:col-span-6 grid-cols-1"
                        : activeTab.columns.length === 2
                        ? "col-span-12 lg:col-span-7 grid-cols-2"
                        : "col-span-12 lg:col-span-7 grid-cols-3"
                    }`}
                  >
                    <div className="col-span-full flex items-center justify-between pb-2 border-b border-sand-200">
                      <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">
                        Explore {activeTab.label}
                      </span>
                      <Link
                        href={activeTab.href}
                        onClick={() => setActiveTabId(null)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-brass-700 hover:text-brass-800 transition-colors"
                      >
                        <span>Browse All {activeTab.label} Furniture</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                    {activeTab.columns.map((column, colIdx) => (
                      <div key={colIdx} className="space-y-3.5">
                        <div className="flex items-center gap-2 pb-1.5 border-b border-sand-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-brass-600 shrink-0" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-navy-950 truncate">
                            {column.title}
                          </h4>
                        </div>
                        <ul className="space-y-1.5 text-xs">
                          {column.links.map((link, lIdx) => (
                            <li key={lIdx}>
                              <Link
                                href={link.href}
                                prefetch={false}
                                onClick={() => setActiveTabId(null)}
                                className="group flex items-center justify-between py-1.5 px-2.5 -mx-2.5 rounded-lg text-navy-800 hover:text-navy-950 hover:bg-sand-200/60 transition-colors"
                              >
                                <span className="group-hover:translate-x-0.5 transition-transform duration-150 font-medium">
                                  {link.label}
                                </span>
                                {link.badge && (
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                      link.badge === "HOT" || link.badge === "SALE" || link.badge.includes("%")
                                        ? "bg-terracotta-100 text-terracotta-800 border border-terracotta-200"
                                        : link.badge === "NEW"
                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                        : "bg-brass-100 text-brass-800 border border-brass-200"
                                    }`}
                                  >
                                    {link.badge}
                                  </span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Right Side: Featured Showcase & Highlight Product (5 Columns on large screens) */}
                  <div className="col-span-12 lg:col-span-5 grid grid-cols-1 xl:grid-cols-2 gap-4 border-t lg:border-t-0 lg:border-l border-sand-200/90 pt-6 lg:pt-0 lg:pl-8">
                    {/* Promo Banner Card */}
                    {activeTab.featured_promo && (
                      <Link
                        href={activeTab.featured_promo.cta_href || activeTab.href}
                        prefetch={false}
                        onClick={() => setActiveTabId(null)}
                        style={{ backgroundColor: "#00072D" }}
                        className="group relative flex flex-col justify-end p-5 rounded-2xl overflow-hidden bg-navy-950 text-sand-50 transition-all hover:shadow-lg hover:scale-[1.01] min-h-[220px]"
                      >
                        {activeTab.featured_promo.image_url && (
                          <div className="absolute inset-0 z-0">
                            <img
                              src={activeTab.featured_promo.image_url}
                              alt={activeTab.featured_promo.title}
                              className="w-full h-full object-cover opacity-60 group-hover:opacity-70 group-hover:scale-105 transition-all duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-transparent" />
                          </div>
                        )}
                        <div className="relative z-10 space-y-2">
                          {activeTab.featured_promo.badge && (
                            <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-brass-500 text-navy-950 rounded-full border border-brass-400">
                              {activeTab.featured_promo.badge}
                            </span>
                          )}
                          <h4 className="text-sm font-bold text-white group-hover:text-brass-300 transition-colors leading-snug">
                            {activeTab.featured_promo.title}
                          </h4>
                          <p className="text-[11px] text-sand-300 line-clamp-2 leading-relaxed">
                            {activeTab.featured_promo.subtitle}
                          </p>
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brass-400 pt-1">
                            <span>{activeTab.featured_promo.cta_label || "Explore"}</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </Link>
                    )}

                    {/* Featured Product Card */}
                    {activeTab.featured_product && (
                      <Link
                        href={activeTab.featured_product.href}
                        prefetch={false}
                        onClick={() => setActiveTabId(null)}
                        style={{ backgroundColor: "#FFFFFF" }}
                        className="group flex flex-col justify-between p-4 rounded-2xl bg-white border border-sand-200 shadow-sm hover:border-brass-400/80 hover:shadow-md transition-all hover:scale-[1.01]"
                      >
                        <div className="space-y-3">
                          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-sand-100 border border-sand-200/60">
                            {activeTab.featured_product.image_url ? (
                              <img
                                src={activeTab.featured_product.image_url}
                                alt={activeTab.featured_product.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-navy-400 text-xs">
                                SAN Collection
                              </div>
                            )}
                            {activeTab.featured_product.tag && (
                              <span className="absolute top-2 left-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-navy-950/90 text-sand-50 rounded-md backdrop-blur-xs">
                                {activeTab.featured_product.tag}
                              </span>
                            )}
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-navy-950 group-hover:text-brass-700 line-clamp-2 transition-colors">
                              {activeTab.featured_product.title}
                            </h5>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-sand-100 flex items-center justify-between mt-2">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-extrabold text-navy-950 font-mono">
                              {activeTab.featured_product.price_str}
                            </span>
                            {activeTab.featured_product.original_price_str && (
                              <span className="text-[10px] text-navy-400 line-through font-mono">
                                {activeTab.featured_product.original_price_str}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-brass-700 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            <span>View</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Bottom Reassurance & Trust Bar */}
                {bottomPerks.length > 0 && (
                  <div
                    style={{ backgroundColor: "#F4F1EA" }}
                    className="bg-sand-100 border-t border-sand-200 px-6 lg:px-8 py-3.5 relative z-10"
                  >
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-navy-800">
                      {bottomPerks.map((perk, pIdx) => {
                        const IconComponent = PERK_ICON_MAP[perk.icon] || ShieldCheck;
                        return (
                          <div key={pIdx} className="flex items-center gap-2">
                            <IconComponent className="w-4 h-4 text-brass-600 shrink-0" />
                            <span className="text-[11px] font-medium leading-tight truncate">
                              {perk.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
