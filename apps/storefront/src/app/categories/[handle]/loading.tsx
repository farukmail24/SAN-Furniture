import React from "react";

export default function CategoryLoading() {
  return (
    <div className="bg-sand-50 min-h-screen">
      {/* Breadcrumb Skeleton */}
      <div className="border-b border-sand-200 bg-sand-100/50 py-3">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex items-center gap-2">
          <div className="h-3 w-12 bg-sand-200 rounded animate-pulse" />
          <div className="h-3 w-3 bg-sand-200 rounded animate-pulse" />
          <div className="h-3 w-16 bg-sand-200 rounded animate-pulse" />
          <div className="h-3 w-3 bg-sand-200 rounded animate-pulse" />
          <div className="h-3 w-28 bg-sand-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Category Hero Skeleton */}
      <div className="border-b border-sand-200 bg-navy-950 py-12 sm:py-16 text-sand-50">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-xl space-y-3">
            <div className="h-3 w-36 bg-navy-800 rounded animate-pulse" />
            <div className="h-10 w-72 bg-navy-800 rounded-lg animate-pulse" />
            <div className="h-4 w-full bg-navy-800 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Category Products Grid Skeleton */}
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-sand-200">
          <div className="h-4 w-32 bg-sand-200 rounded animate-pulse" />
          <div className="h-8 w-40 bg-sand-200 rounded-lg animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-sand-200 bg-sand-100/40 p-3 space-y-3 animate-pulse"
            >
              <div className="w-full aspect-[4/3] rounded-lg bg-sand-200/80" />
              <div className="space-y-2 pt-1">
                <div className="h-4 w-3/4 bg-sand-200 rounded" />
                <div className="h-3 w-1/2 bg-sand-200 rounded" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-5 w-20 bg-sand-200 rounded" />
                  <div className="h-4 w-16 bg-sand-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
