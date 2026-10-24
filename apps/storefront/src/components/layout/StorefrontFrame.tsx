"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileAppDock } from "./MobileAppDock";
import { CartProvider } from "@/lib/cart-context";
import { PageTransition } from "@/components/motion/MotionWrapper";
import { ConciergeSupportWidget } from "@/components/support/ConciergeSupportWidget";
import { CookieConsentBanner } from "./CookieConsentBanner";
import { CmsProvider, type SiteSection } from "@/lib/cms";
import type { CatalogProduct } from "@/lib/catalog";

export default function StorefrontFrame({
  initialSections,
  initialProducts,
  children,
}: {
  initialSections?: Record<string, SiteSection> | null;
  initialProducts?: CatalogProduct[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <CmsProvider initialSections={initialSections}>
      <CartProvider>
        <Header initialProducts={initialProducts} />
        <main className="flex-1" suppressHydrationWarning>
          <PageTransition key={pathname}>{children}</PageTransition>
        </main>
        <Footer />
        <MobileAppDock />
        <ConciergeSupportWidget />
        <CookieConsentBanner />
      </CartProvider>
    </CmsProvider>
  );
}
