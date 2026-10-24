import React from "react";

/**
 * Root Route Instant Shimmer Skeleton (Facebook-style)
 * Provides instant 0ms visual transition on link click across the entire storefront
 */
export default function RootLoading() {
  return (
    <div className="bg-sand-50 min-h-screen">
      {/* Top Breadcrumb / Nav Skeleton */}
      <div className="border-b border-sand-200 bg-sand-100/50 py-3.5">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex items-center gap-2.5">
          <div className="h-3.5 w-14 rounded-md shimmer-skeleton" />
          <div className="h-3.5 w-3 rounded-full shimmer-skeleton" />
          <div className="h-3.5 w-24 rounded-md shimmer-skeleton" />
        </div>
      </div>

      {/* Hero / Banner Skeleton */}
      <div className="border-b border-sand-200 bg-sand-100/30 py-8 sm:py-12">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-4">
          <div className="h-4 w-32 rounded-full shimmer-skeleton" />
          <div className="h-10 w-3/4 max-w-xl rounded-lg shimmer-skeleton" />
          <div className="h-4 w-full max-w-2xl rounded-md shimmer-skeleton" />
        </div>
      </div>

      {/* Content Grid Skeleton */}
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-sand-200 bg-white p-3 space-y-3 shadow-xs"
            >
              <div className="w-full aspect-[4/3] rounded-lg shimmer-skeleton" />
              <div className="space-y-2 pt-1">
                <div className="h-4 w-3/4 rounded-md shimmer-skeleton" />
                <div className="h-3 w-1/2 rounded-md shimmer-skeleton" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-5 w-20 rounded-md shimmer-skeleton" />
                  <div className="h-4 w-16 rounded-md shimmer-skeleton" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
