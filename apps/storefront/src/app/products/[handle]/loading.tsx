import React from "react";

export default function ProductDetailLoading() {
  return (
    <div className="bg-sand-50 min-h-screen">
      {/* Breadcrumb Skeleton */}
      <div className="border-b border-sand-200 bg-sand-100/50 py-3.5">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex items-center gap-2">
          <div className="h-3.5 w-12 rounded shimmer-skeleton" />
          <div className="h-3.5 w-3 rounded-full shimmer-skeleton" />
          <div className="h-3.5 w-16 rounded shimmer-skeleton" />
          <div className="h-3.5 w-3 rounded-full shimmer-skeleton" />
          <div className="h-3.5 w-36 rounded shimmer-skeleton" />
        </div>
      </div>

      {/* Main Product Layout Skeleton */}
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          
          {/* Left Gallery Skeleton (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="w-full aspect-[4/3] rounded-2xl shimmer-skeleton border border-sand-200" />
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-20 h-20 rounded-lg shimmer-skeleton border border-sand-200" />
              ))}
            </div>
          </div>

          {/* Right Product Details Skeleton (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <div className="h-4 w-32 rounded-full shimmer-skeleton" />
              <div className="h-8 w-4/5 rounded-lg shimmer-skeleton" />
              <div className="h-6 w-28 rounded shimmer-skeleton" />
            </div>

            <div className="p-4 rounded-xl bg-white border border-sand-200 space-y-2.5 shadow-xs">
              <div className="h-4 w-1/2 rounded shimmer-skeleton" />
              <div className="h-3 w-3/4 rounded shimmer-skeleton" />
            </div>

            <div className="h-12 w-full rounded-xl shimmer-skeleton" />
            <div className="h-12 w-full rounded-xl shimmer-skeleton" />
          </div>

        </div>
      </div>
    </div>
  );
}
