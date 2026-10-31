"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Menu,
  X,
  ArrowRight,
  User,
  Sparkles,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  CreditCard,
  Clock,
  Tag,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/cart-context";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CATALOG_CATEGORIES, type CatalogProduct } from "@/lib/catalog";
import { usePageSections, DEFAULT_STOREFRONT_SECTIONS } from "@/lib/cms";
import { MegaMenu } from "@/components/layout/MegaMenu";
import type { MegaMenuContent } from "@/lib/cms-defaults";

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

export function Header({ initialProducts }: { initialProducts?: CatalogProduct[] } = {}) {
  const pathname = usePathname();
  const { totalCount, openCart } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileTab, setExpandedMobileTab] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [customer, setCustomer] = useState<{ firstName?: string; email?: string } | null>(null);
  const [tickerIndex, setTickerIndex] = useState(0);

  const { getSection } = usePageSections("header");
  const topBar = getSection("header_top_bar", DEFAULT_STOREFRONT_SECTIONS.header_top_bar.content);
  const headerMain = getSection("header_main", DEFAULT_STOREFRONT_SECTIONS.header_main.content);
  const megaMenu = getSection<MegaMenuContent>(
    "header_mega_menu",
    DEFAULT_STOREFRONT_SECTIONS.header_mega_menu.content
  );

  const isSticky = headerMain?.content?.is_sticky !== false && headerMain?.isEnabled !== false;
  const stickyBehavior: "always" | "scroll_up" | "static" =
    !isSticky || headerMain?.content?.sticky_behavior === "static"
      ? "static"
      : headerMain?.content?.sticky_behavior === "scroll_up"
      ? "scroll_up"
      : "always";
  const hideTopbarOnScroll = Boolean(headerMain?.content?.hide_topbar_on_scroll);

  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up");
  const lastScrollY = React.useRef(0);

  useEffect(() => {
    if (stickyBehavior === "static") {
      setIsScrolled(false);
      return;
    }

    const handleScroll = () => {
      const currentY = window.scrollY;
      setIsScrolled(currentY > 30);

      if (currentY > lastScrollY.current && currentY > 100) {
        setScrollDirection("down");
      } else if (currentY < lastScrollY.current) {
        setScrollDirection("up");
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [stickyBehavior]);

  const mobileTickerItems = [
    {
      icon: <Truck className="w-3.5 h-3.5 text-brass-400 shrink-0" />,
      text: topBar.content.delivery_claim || "UK Mainland Delivery (10-15 Days)",
    },
    {
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
      text: "UK Quality Checked & Free Mainland Delivery Within 15 Days",
    },
    {
      icon: <CreditCard className="w-3.5 h-3.5 text-brass-400 shrink-0" />,
      text: "Zero Hidden Fees • Direct Workshop Value",
    },
    {
      icon: <Sparkles className="w-3.5 h-3.5 text-brass-300 shrink-0" />,
      text: "Bespoke White Glove Assembly Available",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % mobileTickerItems.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [mobileTickerItems.length]);

  React.useEffect(() => {
    setMounted(true);
    const syncCustomerAuth = () => {
      try {
        const stored = localStorage.getItem("san_customer_user");
        const token = localStorage.getItem("san_customer_token");
        if (stored && token) {
          setCustomer(JSON.parse(stored));
        } else {
          setCustomer(null);
        }
      } catch {
        setCustomer(null);
      }
    };
    syncCustomerAuth();
    const handleOpenSearch = () => setIsSearchOpen(true);
    window.addEventListener("storage", syncCustomerAuth);
    window.addEventListener("open-search-modal", handleOpenSearch);
    return () => {
      window.removeEventListener("storage", syncCustomerAuth);
      window.removeEventListener("open-search-modal", handleOpenSearch);
    };
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setExpandedMobileTab(null);
  }, [pathname]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        className={`w-full border-b border-sand-200 bg-sand-50/95 backdrop-blur-md relative z-40 transition-all duration-300 ${
          stickyBehavior === "static"
            ? "relative"
            : stickyBehavior === "scroll_up"
            ? `sticky top-0 ${scrollDirection === "down" && isScrolled ? "-translate-y-full shadow-none" : "translate-y-0 shadow-sm"}`
            : "sticky top-0 shadow-sm"
        }`}
      >
        {/* Top Value Proposition & Legal Bar */}
        {topBar.isEnabled && (
          <div
            className={`bg-[#00072D] text-sand-50 text-xs px-3 sm:px-6 lg:px-8 border-b border-brass-500/20 relative z-20 transition-all duration-300 overflow-hidden ${
              hideTopbarOnScroll && isScrolled
                ? "max-h-0 py-0 opacity-0 border-b-0"
                : "max-h-16 py-1 sm:py-2 opacity-100"
            }`}
          >
            {/* Mobile Announcement Ticker (Single rotating line for native mobile app feel) */}
            <div className="sm:hidden flex items-center justify-center text-center overflow-hidden h-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tickerIndex}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.22 }}
                  className="flex items-center justify-center gap-1.5 text-[11px] font-medium tracking-tight text-sand-200 truncate"
                >
                  {mobileTickerItems[tickerIndex]?.icon}
                  <span className="truncate">{mobileTickerItems[tickerIndex]?.text}</span>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Desktop Full Proposition Bar */}
            <div className="hidden sm:flex max-w-[1680px] mx-auto items-center justify-between text-[11px] sm:text-xs">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-sand-200 font-medium">
                  <Truck className="w-3.5 h-3.5 text-brass-500" />
                  {topBar.content.delivery_claim || "UK Mainland Delivery Direct to Your Door"}
                </span>
                <span className="hidden md:inline-block text-sand-500">|</span>
                <span className="hidden md:flex items-center gap-1 text-sand-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {topBar.content.quality_claim || "UK Quality Checked • Free Mainland Delivery Within 15 Days"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sand-300 font-medium">
                <span>{topBar.content.payment_claim || "Secure Card Payments"}</span>
                <span>•</span>
                <span>{(!topBar.content.tax_claim || /vat/i.test(topBar.content.tax_claim)) ? "Zero Hidden Fees" : topBar.content.tax_claim}</span>
                {topBar.content.show_support_phone && (
                  <>
                    <span className="hidden sm:inline text-sand-600">•</span>
                    <a
                      href={`tel:${(topBar.content.support_phone || "+44 20 7946 0192").replace(/\s+/g, "")}`}
                      className="hidden sm:inline text-sand-300 hover:text-sand-50 transition-colors"
                    >
                      {topBar.content.support_phone === "020 7946 0192"
                        ? "+44 20 7946 0192"
                        : (topBar.content.support_phone || "+44 20 7946 0192")}
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation Bar */}
        <div className="relative z-20 max-w-[1680px] mx-auto px-3.5 sm:px-6 lg:px-8 h-14 sm:h-16 lg:h-20 flex items-center justify-between gap-3 xl:gap-6">
          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open mobile navigation menu"
            className="lg:hidden p-2 rounded-xl text-navy-900 hover:bg-sand-200/80 active:scale-90 transition-all cursor-pointer"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Brand Logo (Centered on mobile for luxury app balance) */}
          <Link href="/" className="relative z-20 flex items-center justify-center lg:justify-start shrink-0 group py-1 flex-1 lg:flex-none">
            <img
              src="/SanFurnitureLogo.png"
              alt="SAN Furniture - Crafted for British Living"
              className="h-8 sm:h-10 xl:h-14 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
          </Link>

          {/* Primary Desktop Category Links or Dynamic Mega Menu */}
          {megaMenu.isEnabled && megaMenu.content?.tabs?.length > 0 ? (
            <MegaMenu data={megaMenu.content} className="hidden lg:flex items-center justify-center flex-1 mx-2 xl:mx-6 min-w-0" />
          ) : (
            <nav className="hidden lg:flex items-center justify-center gap-3 xl:gap-6 2xl:gap-8 text-xs lg:text-[13px] xl:text-sm font-medium text-navy-900 flex-nowrap flex-1 mx-2 xl:mx-6 min-w-0">
              {[
                { name: "All Furniture", href: "/catalog" },
                { name: "Sofas", href: "/categories/sofas" },
                { name: "Armchairs", href: "/categories/sofas?type=armchairs" },
                { name: "Dining", href: "/categories/dining" },
                { name: "Bedroom", href: "/categories/bedroom" },
                { name: "Living Room", href: "/categories/living-room" },
              ].map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={false}
                    className={`py-2 border-b-2 active:scale-[0.96] transition-all whitespace-nowrap shrink-0 ${
                      isActive
                        ? "text-brass-600 border-brass-500 font-semibold"
                        : "border-transparent hover:text-brass-600 hover:border-brass-500"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Search & Basket Actions */}
          <div className="relative z-20 flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Search Trigger Button (Desktop Only - Mobile has full-width app search pill below) */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search furniture catalog"
              className="hidden lg:flex items-center gap-2 p-2 xl:px-3 xl:py-1.5 text-xs text-navy-700 bg-sand-100 border border-sand-200 rounded-lg hover:bg-sand-200 hover:border-sand-300 transition-all cursor-pointer shrink-0"
            >
              <Search className="w-4 h-4 text-navy-600 shrink-0" />
              <span className="hidden xl:inline whitespace-nowrap text-navy-600 font-medium">Search furniture...</span>
              <kbd className="hidden 2xl:inline-block px-1.5 py-0.5 text-[10px] bg-sand-50 rounded border border-sand-300 text-navy-500 font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Customer Account Button (Desktop Only - Mobile has account in bottom dock) */}
            <Link
              href={mounted && customer ? "/account" : "/account/login"}
              prefetch={false}
              aria-label={customer ? `Client Portal (${customer.firstName || "Account"})` : "Sign In to Client Portal"}
              className="hidden lg:flex p-2 rounded-full hover:bg-sand-200 text-navy-900 transition-colors items-center gap-1.5"
              title={customer ? `SAN Client Portal (${customer.firstName || "Account"})` : "Sign In / Register"}
            >
              <div className="relative">
                <User className="w-5 h-5" />
                {mounted && customer && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-sand-50" />
                )}
              </div>
              {mounted && customer?.firstName && (
                <span className="hidden lg:inline text-xs font-semibold text-navy-900 max-w-[80px] truncate">
                  {customer.firstName}
                </span>
              )}
            </Link>

            {/* Shopping Basket Trigger Button */}
            <button
              type="button"
              onClick={openCart}
              aria-label={`Shopping Basket with ${totalCount} items`}
              className="relative p-2 sm:p-2.5 rounded-full bg-navy-950 text-sand-50 hover:bg-brass-600 transition-colors active:scale-90 cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5" />
              {mounted && totalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brass-500 text-navy-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-scale-in">
                  {totalCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dedicated App Search Bar Pill (IKEA/Zara Native App Style) */}
        <div className="lg:hidden px-3.5 pb-2.5 pt-0">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="w-full h-10 px-3.5 rounded-xl bg-sand-100/90 hover:bg-sand-200 border border-sand-300/80 text-xs text-navy-600 flex items-center justify-between shadow-xs active:scale-[0.98] transition-all cursor-pointer"
            aria-label="Open instant search"
          >
            <span className="flex items-center gap-2 text-navy-500 truncate">
              <Search className="w-4 h-4 text-brass-600 shrink-0" />
              <span className="truncate">Search sofas, dining tables, wardrobes...</span>
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-sand-200 text-navy-800 shrink-0 border border-sand-300">
              Search
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer - Native Mobile App Sheet with Framer Motion */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[90] lg:hidden">
            {/* Backdrop with fade-in animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Native Mobile App Sheet / Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 w-[88%] max-w-sm bg-[#FAF8F5] flex flex-col justify-between shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] z-[95] border-r border-sand-300 overflow-y-auto"
            >
              <div className="p-5 sm:p-6">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-4 border-b border-sand-200">
                  <Link
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center"
                  >
                    <img
                      src="/SanFurnitureLogo.png"
                      alt="SAN Furniture"
                      className="h-10 w-auto object-contain"
                    />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label="Close mobile navigation"
                    className="w-9 h-9 rounded-full bg-sand-200/80 hover:bg-sand-300 text-navy-800 flex items-center justify-center transition-transform active:scale-90"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Search Tap Target */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsSearchOpen(true);
                  }}
                  className="w-full mt-4 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-sand-100/90 border border-sand-200 text-xs text-navy-700 active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Search className="w-4 h-4 text-brass-600" />
                    <span>Search furniture...</span>
                  </div>
                  <kbd className="px-1.5 py-0.5 text-[10px] bg-sand-50 rounded border border-sand-300 text-navy-500 font-mono">
                    ⌘K
                  </kbd>
                </button>

                {/* Navigation Links: Accordion Mega Menu or Fallback */}
                <div className="mt-6">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-navy-500 mb-2.5 px-1">
                    Collections & Categories
                  </div>

                  {megaMenu.isEnabled && megaMenu.content?.tabs?.length > 0 ? (
                    <div className="space-y-2">
                      {/* Quick link: All Collections */}
                      <Link
                        href="/catalog"
                        prefetch={false}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between p-3 rounded-xl bg-sand-100/90 border border-sand-200 text-navy-950 active:scale-[0.99] transition-all font-semibold text-xs"
                      >
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-brass-600" />
                          <span>All Furniture Collections</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-navy-400" />
                      </Link>

                      {/* Dynamic Accordion Tabs */}
                      {megaMenu.content.tabs.map((tab) => {
                        const isExpanded = expandedMobileTab === tab.id;
                        const hasSubContent =
                          (tab.columns && tab.columns.length > 0) ||
                          tab.featured_promo ||
                          tab.featured_product;

                        return (
                          <div
                            key={tab.id}
                            className="rounded-xl border border-sand-200/90 bg-white overflow-hidden shadow-2xs"
                          >
                            {/* Tab Row */}
                            <div className="flex items-center justify-between p-2.5">
                              <Link
                                href={tab.href}
                                prefetch={false}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-2 text-xs font-bold text-navy-950 hover:text-brass-700 transition-colors flex-1 py-1 px-1"
                              >
                                <span>{tab.label}</span>
                                {tab.badge && (
                                  <span
                                    className={`px-1.5 py-0.5 text-[8.5px] font-bold uppercase rounded-full tracking-wider leading-none border ${
                                      tab.badge.toUpperCase() === "SALE" ||
                                      tab.badge.toUpperCase() === "HOT" ||
                                      tab.badge.includes("%")
                                        ? "bg-terracotta-600 text-white border-terracotta-700/40"
                                        : "bg-brass-600 text-white border-brass-700/40"
                                    }`}
                                  >
                                    {tab.badge}
                                  </span>
                                )}
                              </Link>

                              {hasSubContent && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedMobileTab(isExpanded ? null : tab.id)
                                  }
                                  aria-label={`Toggle ${tab.label} subcategories`}
                                  aria-expanded={isExpanded}
                                  className="p-1.5 rounded-lg bg-sand-100 hover:bg-sand-200 text-navy-700 transition-colors"
                                >
                                  <ChevronDown
                                    className={`w-4 h-4 transition-transform duration-200 ${
                                      isExpanded ? "rotate-180 text-brass-700" : ""
                                    }`}
                                  />
                                </button>
                              )}
                            </div>

                            {/* Accordion Content */}
                            <AnimatePresence initial={false}>
                              {isExpanded && hasSubContent && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2, ease: "easeOut" }}
                                  className="overflow-hidden bg-sand-50/70 border-t border-sand-200 px-3.5 py-3 space-y-3.5"
                                >
                                  {/* Quick direct link to the category */}
                                  <Link
                                    href={tab.href}
                                    prefetch={false}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center justify-between text-xs font-bold text-brass-700 pb-1.5 border-b border-sand-200/80"
                                  >
                                    <span>View All {tab.label}</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </Link>

                                  {/* Subcategory Columns */}
                                  {tab.columns?.map((col, cIdx) => (
                                    <div key={cIdx} className="space-y-1">
                                      <p className="text-[10px] font-bold uppercase tracking-wider text-navy-500">
                                        {col.title}
                                      </p>
                                      <div className="space-y-0.5">
                                        {col.links.map((link, lIdx) => (
                                          <Link
                                            key={lIdx}
                                            href={link.href}
                                            prefetch={false}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center justify-between py-1 px-1.5 rounded-md text-xs text-navy-800 hover:text-navy-950 hover:bg-sand-200/50 transition-colors"
                                          >
                                            <span className="font-medium">{link.label}</span>
                                            {link.badge && (
                                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-sand-200 text-navy-700 border border-sand-300">
                                                {link.badge}
                                              </span>
                                            )}
                                          </Link>
                                        ))}
                                      </div>
                                    </div>
                                  ))}

                                  {/* Mobile Promo Mini Banner */}
                                  {tab.featured_promo && (
                                    <Link
                                      href={tab.featured_promo.cta_href || tab.href}
                                      prefetch={false}
                                      onClick={() => setIsMobileMenuOpen(false)}
                                      className="block relative rounded-xl overflow-hidden bg-navy-950 p-3 text-sand-50 shadow-xs"
                                    >
                                      {tab.featured_promo.image_url && (
                                        <div className="absolute inset-0 z-0">
                                          <img
                                            src={tab.featured_promo.image_url}
                                            alt=""
                                            className="w-full h-full object-cover opacity-45"
                                          />
                                          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-transparent" />
                                        </div>
                                      )}
                                      <div className="relative z-10 space-y-1">
                                        {tab.featured_promo.badge && (
                                          <span className="inline-block px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-brass-500 text-navy-950 rounded">
                                            {tab.featured_promo.badge}
                                          </span>
                                        )}
                                        <p className="text-xs font-bold text-white leading-tight">
                                          {tab.featured_promo.title}
                                        </p>
                                        <p className="text-[10px] text-sand-300 line-clamp-1">
                                          {tab.featured_promo.subtitle}
                                        </p>
                                        <p className="text-[10px] font-semibold text-brass-400 flex items-center gap-1 pt-0.5">
                                          <span>{tab.featured_promo.cta_label || "Explore"}</span>
                                          <ArrowRight className="w-3 h-3" />
                                        </p>
                                      </div>
                                    </Link>
                                  )}

                                  {/* Mobile Featured Product Mini Card */}
                                  {tab.featured_product && (
                                    <Link
                                      href={tab.featured_product.href}
                                      prefetch={false}
                                      onClick={() => setIsMobileMenuOpen(false)}
                                      className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-sand-200 shadow-2xs"
                                    >
                                      {tab.featured_product.image_url && (
                                        <img
                                          src={tab.featured_product.image_url}
                                          alt=""
                                          className="w-11 h-11 rounded-lg object-cover bg-sand-100 shrink-0 border border-sand-200"
                                        />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        {tab.featured_product.tag && (
                                          <span className="text-[8px] font-bold uppercase tracking-wider text-brass-700 block">
                                            {tab.featured_product.tag}
                                          </span>
                                        )}
                                        <p className="text-[11px] font-bold text-navy-950 truncate leading-tight">
                                          {tab.featured_product.title}
                                        </p>
                                        <p className="text-xs font-bold text-navy-950 font-mono mt-0.5">
                                          {tab.featured_product.price_str}
                                        </p>
                                      </div>
                                      <ArrowRight className="w-3.5 h-3.5 text-navy-400 shrink-0" />
                                    </Link>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <nav className="flex flex-col gap-1 text-sm font-semibold text-navy-950">
                      <Link
                        href="/catalog"
                        prefetch={false}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between p-3 rounded-xl bg-sand-100/70 border border-sand-200/80 hover:bg-sand-200/70 text-navy-950 active:scale-[0.99] transition-all"
                      >
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-brass-600" />
                          <span>All Furniture Collections</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-navy-400" />
                      </Link>

                      {CATALOG_CATEGORIES.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/categories/${cat.handle}`}
                          prefetch={false}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl text-navy-800 hover:text-brass-700 hover:bg-sand-100/50 active:scale-[0.99] transition-all"
                        >
                          <span>{cat.name}</span>
                          <ChevronRight className="w-4 h-4 text-sand-400" />
                        </Link>
                      ))}
                    </nav>
                  )}
                </div>

                {/* Account / Client Portal Quick Card */}
                <div className="mt-6 pt-5 border-t border-sand-200">
                  <Link
                    href={mounted && customer ? "/account" : "/account/login"}
                    prefetch={false}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl bg-navy-950 text-sand-50 hover:bg-navy-900 active:scale-[0.98] transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-sand-100/10 flex items-center justify-center text-brass-400">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-semibold leading-tight">
                          {mounted && customer?.firstName ? customer.firstName : "Client Portal"}
                        </p>
                        <p className="text-[10px] text-sand-400">
                          {mounted && customer ? "View Orders & Account" : "Sign In / Register"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-sand-400" />
                  </Link>
                </div>
              </div>

              {/* Bottom UK Guarantees & Compliance */}
              <div className="p-5 sm:p-6 border-t border-sand-200 bg-sand-100/50 space-y-2 text-xs text-navy-700">
                {megaMenu.content?.bottom_perks && megaMenu.content.bottom_perks.length > 0 ? (
                  megaMenu.content.bottom_perks.slice(0, 3).map((perk, idx) => {
                    const IconComponent = PERK_ICON_MAP[perk.icon] || ShieldCheck;
                    return (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-navy-800 font-medium">
                        <IconComponent className="w-3.5 h-3.5 shrink-0 text-brass-600" />
                        <span className="truncate">{perk.text}</span>
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-forest-800 font-medium text-[11px]">
                      <Truck className="w-4 h-4 shrink-0 text-forest-700" />
                      <span>Free UK Mainland Delivery on All Orders</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-brass-600" />
                      <span>UK Quality Checked Furniture</span>
                    </div>
                  </>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Global Interactive Modals */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} initialProducts={initialProducts} />
      <CartDrawer />
    </>
  );
}
