"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag, ShieldCheck, Truck, Menu, X, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CATALOG_CATEGORIES } from "@/lib/catalog";

export function Header() {
  const { totalCount, openCart } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-sand-200 bg-sand-50/95 backdrop-blur-md">
        {/* Top Value Proposition & Legal Bar */}
        <div className="bg-navy-950 text-sand-50 text-xs py-2 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] sm:text-xs">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
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
          <Link href="/" className="flex flex-col items-start group">
            <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-navy-950 group-hover:text-brass-600 transition-colors">
              SAN <span className="font-light text-navy-700">FURNITURE</span>
            </span>
            <span className="text-[10px] tracking-widest text-navy-600 uppercase font-medium">
              Crafted for British Living
            </span>
          </Link>

          {/* Primary Desktop Category Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-navy-900">
            <Link
              href="/catalog"
              className="hover:text-brass-600 transition-colors py-2 border-b-2 border-transparent hover:border-brass-500"
            >
              All Furniture
            </Link>
            <Link
              href="/categories/sofas"
              className="hover:text-brass-600 transition-colors py-2 border-b-2 border-transparent hover:border-brass-500"
            >
              Sofas
            </Link>
            <Link
              href="/categories/armchairs"
              className="hover:text-brass-600 transition-colors py-2 border-b-2 border-transparent hover:border-brass-500"
            >
              Armchairs
            </Link>
            <Link
              href="/categories/dining"
              className="hover:text-brass-600 transition-colors py-2 border-b-2 border-transparent hover:border-brass-500"
            >
              Dining
            </Link>
            <Link
              href="/categories/beds"
              className="hover:text-brass-600 transition-colors py-2 border-b-2 border-transparent hover:border-brass-500"
            >
              Bedroom
            </Link>
            <Link
              href="/categories/living-tables"
              className="hover:text-brass-600 transition-colors py-2 border-b-2 border-transparent hover:border-brass-500"
            >
              Tables
            </Link>
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

            {/* Shopping Basket Trigger Button */}
            <button
              type="button"
              onClick={openCart}
              aria-label={`Shopping Basket with ${totalCount} items`}
              className="relative p-2.5 rounded-full bg-navy-950 text-sand-50 hover:bg-brass-600 transition-colors active:scale-95"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brass-500 text-navy-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-scale-in">
                  {totalCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-sand-50 p-6 flex flex-col justify-between shadow-2xl">
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-sand-200">
                  <span className="font-display text-xl font-bold text-navy-950">
                    SAN <span className="font-light text-navy-700">FURNITURE</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label="Close mobile menu"
                    className="p-1 text-navy-600 hover:text-navy-950"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <nav className="mt-6 flex flex-col gap-4 text-base font-semibold text-navy-950">
                  <Link
                    href="/catalog"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between py-2 border-b border-sand-200"
                  >
                    <span>All Furniture Collections</span>
                    <ArrowRight className="w-4 h-4 text-navy-400" />
                  </Link>
                  {CATALOG_CATEGORIES.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/categories/${cat.handle}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between py-2 text-navy-800 hover:text-brass-600"
                    >
                      <span>{cat.name}</span>
                      <ArrowRight className="w-4 h-4 text-sand-400" />
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="pt-6 border-t border-sand-200 space-y-3 text-xs text-navy-600">
                <div className="flex items-center gap-2 text-forest-700 font-medium">
                  <Truck className="w-4 h-4" />
                  <span>Free UK White Glove Delivery over £500</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brass-600" />
                  <span>UK Fire Safety Compliant (BS 5852)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Global Interactive Modals */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <CartDrawer />
    </>
  );
}
