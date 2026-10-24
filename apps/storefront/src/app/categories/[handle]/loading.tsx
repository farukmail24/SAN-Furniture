import React from "react";

export default function CategoryLoading() {
  return (
    <div className="bg-sand-50 min-h-screen">
      {/* Breadcrumb Skeleton */}
      <div className="border-b border-sand-200 bg-sand-100/50 py-3.5">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex items-center gap-2">
          <div className="h-3.5 w-12 rounded shimmer-skeleton" />
          <div className="h-3.5 w-3 rounded-full shimmer-skeleton" />
          <div className="h-3.5 w-16 rounded shimmer-skeleton" />
          <div className="h-3.5 w-3 rounded-full shimmer-skeleton" />
          <div className="h-3.5 w-28 rounded shimmer-skeleton" />
        </div>
      </div>

      {/* Category Hero Skeleton */}
      <div className="border-b border-sand-200 bg-navy-950 py-12 sm:py-16 text-sand-50">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-xl space-y-3">
            <div className="h-3.5 w-36 rounded-full shimmer-skeleton-dark" />
            <div className="h-10 w-72 rounded-lg shimmer-skeleton-dark" />
            <div className="h-4 w-full rounded shimmer-skeleton-dark" />
          </div>
        </div>
      </div>

      {/* Category Products Grid Skeleton */}
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-sand-200">
          <div className="h-4 w-32 rounded shimmer-skeleton" />
          <div className="h-8 w-40 rounded-lg shimmer-skeleton" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-sand-200 bg-white p-3 space-y-3 shadow-xs"
            >
              <div className="w-full aspect-[4/3] rounded-lg shimmer-skeleton" />
              <div className="space-y-2 pt-1">
                <div className="h-4 w-3/4 rounded shimmer-skeleton" />
                <div className="h-3 w-1/2 rounded shimmer-skeleton" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-5 w-20 rounded shimmer-skeleton" />
                  <div className="h-4 w-16 rounded shimmer-skeleton" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
