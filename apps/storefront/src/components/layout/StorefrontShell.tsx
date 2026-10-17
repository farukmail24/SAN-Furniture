"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileAppDock } from "./MobileAppDock";
import { CartProvider } from "@/lib/cart-context";
import { preloadCache } from "@/lib/api-cache";
import { apiUrl } from "@/lib/api-config";

import { PageTransition } from "@/components/motion/MotionWrapper";
import { ConciergeSupportWidget } from "@/components/support/ConciergeSupportWidget";

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  // Pre-warm client in-memory catalog cache in idle background (SPA-like instant feel)
  useEffect(() => {
    if (typeof window === "undefined" || isAdminRoute) return;
    const warmUp = () => {
      preloadCache(apiUrl("/api/products"));
      preloadCache(apiUrl("/api/categories"));
    };

    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(warmUp, { timeout: 1200 });
    } else {
      setTimeout(warmUp, 200);
    }
  }, [isAdminRoute]);

  if (isAdminRoute) {
    // Dedicated Admin Panel: Completely isolated from consumer Header & Footer
    return (
      <div className="w-full min-h-screen flex flex-col flex-1" suppressHydrationWarning>
        {children}
      </div>
    );
  }

  // Consumer Storefront: Luxury Navigation, Header, Mobile App Dock, Footer & Concierge Support
  return (
    <CartProvider>
      <Header />
      <main className="flex-1 pb-20 lg:pb-0" suppressHydrationWarning>
        <PageTransition key={pathname}>{children}</PageTransition>
      </main>
      <Footer />
      <MobileAppDock />
      <ConciergeSupportWidget />
    </CartProvider>
  );
}
