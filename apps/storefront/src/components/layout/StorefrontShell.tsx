"use client";

import React from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { SiteSection } from "@/lib/cms";
import type { CatalogProduct } from "@/lib/catalog";
import { AlertModalProvider } from "@/components/ui/AlertModal";

const StorefrontFrame = dynamic(() => import("./StorefrontFrame"));

export function StorefrontShell({
  initialSections,
  initialProducts,
  children,
}: {
  initialSections?: Record<string, SiteSection> | null;
  initialProducts?: CatalogProduct[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <AlertModalProvider>
      {isAdminRoute ? (
        <div className="w-full min-h-screen flex flex-col flex-1" suppressHydrationWarning>
          {children}
        </div>
      ) : (
        <StorefrontFrame initialSections={initialSections} initialProducts={initialProducts}>
          {children}
        </StorefrontFrame>
      )}
    </AlertModalProvider>
  );
}
