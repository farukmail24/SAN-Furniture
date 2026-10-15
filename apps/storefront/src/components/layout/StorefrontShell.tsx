"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileAppDock } from "./MobileAppDock";
import { CartProvider } from "@/lib/cart-context";

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    // Dedicated Admin Panel: Completely isolated from consumer Header & Footer
    return (
      <div className="w-full min-h-screen flex flex-col flex-1" suppressHydrationWarning>
        {children}
      </div>
    );
  }

  // Consumer Storefront: Luxury Navigation, Header, Mobile App Dock & Footer
  return (
    <CartProvider>
      <Header />
      <main className="flex-1 pb-20 lg:pb-0" suppressHydrationWarning>
        {children}
      </main>
      <Footer />
      <MobileAppDock />
    </CartProvider>
  );
}
