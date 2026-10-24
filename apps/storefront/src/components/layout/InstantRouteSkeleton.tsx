"use client";

import React from "react";
import RootLoading from "@/app/loading";
import CatalogLoading from "@/app/catalog/loading";
import ProductDetailLoading from "@/app/products/[handle]/loading";
import AboutLoading from "@/app/about/loading";
import DeliveryLoading from "@/app/delivery/loading";
import ReturnsLoading from "@/app/returns/loading";
import ContactLoading from "@/app/contact/loading";

interface InstantRouteSkeletonProps {
  targetPath: string | null;
}

export function InstantRouteSkeleton({ targetPath }: InstantRouteSkeletonProps) {
  const path = targetPath || "";

  return (
    <div className="relative w-full min-h-screen animate-fade-in">
      {/* 2px Luxury Ambient Shimmer Pulse Line (Immediate Visual Confirmation on Click) */}
      <div className="fixed top-0 inset-x-0 z-50 h-[2.5px] bg-sand-200 overflow-hidden">
        <div className="h-full bg-brass-500 w-full animate-indeterminate-progress shadow-[0_0_10px_#C8A67B]" />
      </div>

      {/* Route-Specific Facebook-Style Skeleton UI */}
      {(() => {
        if (path.startsWith("/products/")) {
          return <ProductDetailLoading />;
        }
        if (path.startsWith("/catalog") || path.startsWith("/categories") || path.startsWith("/collections")) {
          return <CatalogLoading />;
        }
        if (path.startsWith("/about")) {
          return <AboutLoading />;
        }
        if (path.startsWith("/delivery")) {
          return <DeliveryLoading />;
        }
        if (path.startsWith("/returns")) {
          return <ReturnsLoading />;
        }
        if (path.startsWith("/contact")) {
          return <ContactLoading />;
        }
        return <RootLoading />;
      })()}
    </div>
  );
}
