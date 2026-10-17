import React from "react";

export default function ProductDetailLoading() {
  return (
    <div className="bg-sand-50 min-h-screen">
      {/* Breadcrumb Skeleton */}
      <div className="border-b border-sand-200 bg-sand-100/50 py-3">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex items-center gap-2">
          <div className="h-3 w-12 bg-sand-200 rounded animate-pulse" />
          <div className="h-3 w-3 bg-sand-200 rounded animate-pulse" />
          <div className="h-3 w-16 bg-sand-200 rounded animate-pulse" />
          <div className="h-3 w-3 bg-sand-200 rounded animate-pulse" />
          <div className="h-3 w-36 bg-sand-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Main Product Layout Skeleton */}
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          
          {/* Left Gallery Skeleton (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="w-full aspect-[4/3] rounded-2xl bg-sand-200/80 animate-pulse border border-sand-300" />
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-20 h-20 rounded-lg bg-sand-200 animate-pulse border border-sand-300" />
              ))}
            </div>
          </div>

          {/* Right Product Details Skeleton (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <div className="h-4 w-32 bg-sand-200 rounded animate-pulse" />
              <div className="h-8 w-4/5 bg-sand-200 rounded-lg animate-pulse" />
              <div className="h-5 w-28 bg-sand-200 rounded animate-pulse" />
            </div>

            <div className="p-4 rounded-xl bg-sand-100/60 border border-sand-200 space-y-2 animate-pulse">
              <div className="h-4 w-1/2 bg-sand-200 rounded" />
              <div className="h-3 w-3/4 bg-sand-200 rounded" />
            </div>

            <div className="h-12 w-full rounded-xl bg-sand-200 animate-pulse" />
            <div className="h-12 w-full rounded-xl bg-sand-200 animate-pulse" />
          </div>

        </div>
      </div>
    </div>
  );
}
