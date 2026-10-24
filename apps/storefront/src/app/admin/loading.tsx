import React from "react";

/**
 * Admin Panel Universal Instant Shimmer Skeleton (Facebook-style)
 * Provides instant 0ms visual transition when clicking any menu or tab in the Admin suite
 */
export default function AdminLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1680px] mx-auto w-full">
      {/* Top Header & Action Buttons Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg shimmer-skeleton" />
          <div className="h-4 w-72 rounded-md shimmer-skeleton" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 rounded-xl shimmer-skeleton" />
          <div className="h-9 w-32 rounded-xl shimmer-skeleton" />
        </div>
      </div>

      {/* KPI Stats Cards Skeleton (4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-sand-200/80 bg-white p-5 space-y-3 shadow-xs"
          >
            <div className="flex justify-between items-center">
              <div className="h-3.5 w-24 rounded shimmer-skeleton" />
              <div className="w-8 h-8 rounded-lg shimmer-skeleton" />
            </div>
            <div className="h-8 w-32 rounded-lg shimmer-skeleton" />
            <div className="h-3 w-40 rounded shimmer-skeleton" />
          </div>
        ))}
      </div>

      {/* Main Table / Data Card Skeleton */}
      <div className="rounded-2xl border border-sand-200/80 bg-white p-5 sm:p-6 space-y-5 shadow-xs">
        {/* Table Filters & Search Bar */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 pb-4 border-b border-sand-100">
          <div className="h-10 w-full sm:w-80 rounded-xl shimmer-skeleton" />
          <div className="flex gap-2">
            <div className="h-10 w-28 rounded-xl shimmer-skeleton" />
            <div className="h-10 w-24 rounded-xl shimmer-skeleton" />
          </div>
        </div>

        {/* Table Rows Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3.5 px-4 rounded-xl border border-sand-100 bg-sand-50/50 gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg shimmer-skeleton shrink-0" />
                <div className="space-y-1.5 min-w-0">
                  <div className="h-4 w-40 rounded shimmer-skeleton" />
                  <div className="h-3 w-24 rounded shimmer-skeleton" />
                </div>
              </div>
              <div className="hidden sm:block h-4 w-28 rounded shimmer-skeleton" />
              <div className="h-6 w-20 rounded-full shimmer-skeleton" />
              <div className="h-4 w-16 rounded shimmer-skeleton" />
              <div className="h-8 w-8 rounded-lg shimmer-skeleton" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
