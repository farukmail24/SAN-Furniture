"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export function MobileAppDock() {
  const pathname = usePathname();
  const { totalCount, openCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkAuth = () => {
      try {
        const token = localStorage.getItem("san_customer_token");
        const user = localStorage.getItem("san_customer_user");
        setIsLoggedIn(Boolean(token && user));
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  // Do not display dock in admin screens
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent("open-search-modal"));
  };

  const isHomeActive = pathname === "/";
  const isCatalogActive = pathname?.startsWith("/catalog") || pathname?.startsWith("/categories") || pathname?.startsWith("/collections");
  const isAccountActive = pathname?.startsWith("/account");

  return (
    <nav
      aria-label="Mobile Application Navigation Dock"
      data-no-print="true"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-sand-50/92 backdrop-blur-xl border-t border-sand-300/80 shadow-[0_-4px_24px_rgba(15,23,42,0.08)] pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 transition-all no-print print:hidden"
    >
      <div className="max-w-md mx-auto px-4 flex items-center justify-between">
        
        {/* 1. Home Tab */}
        <Link
          href="/"
          prefetch={false}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all active:scale-90 select-none ${
            isHomeActive ? "text-navy-950 font-bold" : "text-navy-600 hover:text-navy-900 font-medium"
          }`}
        >
          <div className="relative flex items-center justify-center w-7 h-7">
            <Home className={`w-5 h-5 transition-transform duration-200 ${isHomeActive ? "scale-110 text-brass-600 stroke-[2.4]" : "stroke-[1.8]"}`} />
            {isHomeActive && (
              <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-brass-600 shadow-sm animate-scale-in" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Home</span>
        </Link>

        {/* 2. Catalog / Explore Tab */}
        <Link
          href="/catalog"
          prefetch={false}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all active:scale-90 select-none ${
            isCatalogActive ? "text-navy-950 font-bold" : "text-navy-600 hover:text-navy-900 font-medium"
          }`}
        >
          <div className="relative flex items-center justify-center w-7 h-7">
            <Compass className={`w-5 h-5 transition-transform duration-200 ${isCatalogActive ? "scale-110 text-brass-600 stroke-[2.4]" : "stroke-[1.8]"}`} />
            {isCatalogActive && (
              <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-brass-600 shadow-sm animate-scale-in" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Explore</span>
        </Link>

        {/* 3. Search Floating Action Trigger */}
        <button
          type="button"
          onClick={handleOpenSearch}
          aria-label="Open Instant Search"
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-navy-600 hover:text-navy-950 transition-all active:scale-90 select-none cursor-pointer group"
        >
          <div className="relative flex items-center justify-center w-7 h-7">
            <Search className="w-5 h-5 stroke-[1.8] group-hover:stroke-[2.2] group-hover:text-brass-600 transition-colors" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 font-medium">Search</span>
        </button>

        {/* 4. Cart / Basket Drawer Trigger */}
        <button
          type="button"
          onClick={openCart}
          aria-label={`Shopping Basket (${totalCount} items)`}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-navy-600 hover:text-navy-950 transition-all active:scale-90 select-none cursor-pointer group"
        >
          <div className="relative flex items-center justify-center w-7 h-7">
            <ShoppingBag className="w-5 h-5 stroke-[1.8] group-hover:stroke-[2.2] group-hover:text-brass-600 transition-colors" />
            {mounted && totalCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brass-500 text-navy-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-scale-in">
                {totalCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 font-medium">Basket</span>
        </button>

        {/* 5. Account / Client Portal Tab */}
        <Link
          href={mounted && isLoggedIn ? "/account" : "/account/login"}
          prefetch={false}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all active:scale-90 select-none ${
            isAccountActive ? "text-navy-950 font-bold" : "text-navy-600 hover:text-navy-900 font-medium"
          }`}
        >
          <div className="relative flex items-center justify-center w-7 h-7">
            <User className={`w-5 h-5 transition-transform duration-200 ${isAccountActive ? "scale-110 text-brass-600 stroke-[2.4]" : "stroke-[1.8]"}`} />
            {mounted && isLoggedIn && (
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border-2 border-sand-50" />
            )}
            {isAccountActive && (
              <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-brass-600 shadow-sm animate-scale-in" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">
            {mounted && isLoggedIn ? "Account" : "Sign In"}
          </span>
        </Link>

      </div>
    </nav>
  );
}
