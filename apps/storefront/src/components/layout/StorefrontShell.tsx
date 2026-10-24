"use client";

import React from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { SiteSection } from "@/lib/cms";
import type { CatalogProduct } from "@/lib/catalog";

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

  if (isAdminRoute) {
    return (
      <div className="w-full min-h-screen flex flex-col flex-1" suppressHydrationWarning>
        {children}
      </div>
    );
  }

  return (
    <StorefrontFrame initialSections={initialSections} initialProducts={initialProducts}>
      {children}
    </StorefrontFrame>
  );
}
