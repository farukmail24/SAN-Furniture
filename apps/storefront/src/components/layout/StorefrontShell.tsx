"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartProvider } from "@/lib/cart-context";

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    // Dedicated Admin Panel: Completely isolated from consumer Header & Footer
    return <>{children}</>;
  }

  // Consumer Storefront: Luxury Navigation, Header & Footer
  return (
    <CartProvider>
      <Header />
      <main className="flex-1" suppressHydrationWarning>
        {children}
      </main>
      <Footer />
    </CartProvider>
  );
}
