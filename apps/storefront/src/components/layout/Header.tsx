"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/cart-context";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CATALOG_CATEGORIES } from "@/lib/catalog";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { totalCount, openCart } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [customer, setCustomer] = useState<{ firstName?: string; email?: string } | null>(null);

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
      <header className="sticky top-0 z-40 w-full border-b border-sand-200 bg-sand-50/95 backdrop-blur-md">
        {/* Top Value Proposition & Legal Bar */}
        <div className="bg-navy-950 text-sand-50 text-xs py-2 px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1680px] mx-auto flex items-center justify-between text-[11px] sm:text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-sage-600 font-medium">
                <Truck className="w-3.5 h-3.5" />
                Free 2-Man Delivery on UK Orders Over £500
              </span>
              <span className="hidden md:inline-block text-sand-400">|</span>
              <span className="hidden md:flex items-center gap-1 text-sand-300">
                <ShieldCheck className="w-3.5 h-3.5 text-brass-500" />
                100% Fire Safety Compliant (BS 5852)
              </span>
            </div>
            <div className="flex items-center gap-3 text-sand-300 font-medium">
              <span>Klarna Pay in 3</span>
              <span>•</span>
              <span>UK VAT Included</span>
            </div>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open mobile navigation menu"
            className="lg:hidden p-2 text-navy-900 hover:text-navy-700"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Brand Logo */}
          <Link href="/" className="flex items-center group py-1">
            <img
              src="/SanFurnitureLogo.png"
              alt="SAN Furniture - Crafted for British Living"
              className="h-16 sm:h-13 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
          </Link>

          {/* Primary Desktop Category Links with Instant Hover Prefetch */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-navy-900">
            {[
              { name: "All Furniture", href: "/catalog" },
              { name: "Sofas", href: "/categories/sofas" },
              { name: "Armchairs", href: "/categories/armchairs" },
              { name: "Dining", href: "/categories/dining" },
              { name: "Bedroom", href: "/categories/beds" },
              { name: "Tables", href: "/categories/living-tables" },
            ].map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  onMouseEnter={() => router.prefetch(link.href)}
                  onTouchStart={() => router.prefetch(link.href)}
                  className={`py-2 border-b-2 transition-colors ${
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

          {/* Search & Basket Actions */}
          <div className="flex items-center gap-3">
            {/* Search Trigger Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search furniture catalog"
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-navy-700 bg-sand-100 border border-sand-200 rounded-md hover:bg-sand-200 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4 text-navy-600" />
              <span className="hidden sm:inline">Search furniture...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-sand-50 rounded border border-sand-300 text-navy-500 font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Customer Account Button (Direct to login if guest, direct to account portal if client) */}
            <Link
              href={mounted && customer ? "/account" : "/account/login"}
              prefetch={true}
              aria-label={customer ? `Client Portal (${customer.firstName || "Account"})` : "Sign In to Client Portal"}
              className="p-2 rounded-full hover:bg-sand-200 text-navy-900 transition-colors flex items-center gap-1.5"
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
              className="relative p-2.5 rounded-full bg-navy-950 text-sand-50 hover:bg-brass-600 transition-colors active:scale-95"
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

      </header>

      {/* Mobile Navigation Drawer - Native Mobile App Sheet with Framer Motion (Rendered outside header to escape backdrop-filter containing block) */}
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
              className="fixed inset-y-0 left-0 w-[86%] max-w-sm bg-[#FAF8F5] flex flex-col justify-between shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] z-[95] border-r border-sand-300 overflow-y-auto"
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

                {/* Navigation Links */}
                <div className="mt-6">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-navy-500 mb-2 px-1">
                    Collections
                  </div>
                  <nav className="flex flex-col gap-1 text-sm font-semibold text-navy-950">
                    <Link
                      href="/catalog"
                      prefetch={true}
                      onTouchStart={() => router.prefetch("/catalog")}
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
                        prefetch={true}
                        onTouchStart={() => router.prefetch(`/categories/${cat.handle}`)}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-navy-800 hover:text-brass-700 hover:bg-sand-100/50 active:scale-[0.99] transition-all"
                      >
                        <span>{cat.name}</span>
                        <ChevronRight className="w-4 h-4 text-sand-400" />
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* Account / Client Portal Quick Card */}
                <div className="mt-6 pt-5 border-t border-sand-200">
                  <Link
                    href={mounted && customer ? "/account" : "/account/login"}
                    prefetch={true}
                    onTouchStart={() => router.prefetch(customer ? "/account" : "/account/login")}
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
              <div className="p-5 sm:p-6 border-t border-sand-200 bg-sand-100/50 space-y-2.5 text-xs text-navy-700">
                <div className="flex items-center gap-2 text-forest-800 font-medium text-[11px]">
                  <Truck className="w-4 h-4 shrink-0 text-forest-700" />
                  <span>Free UK White Glove Delivery over £500</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-brass-600" />
                  <span>BS 5852 Fire Safety Statutory Certified</span>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Global Interactive Modals */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <CartDrawer />
    </>
  );
}
