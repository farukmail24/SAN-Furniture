import React from "react";

export default function DeliveryLoading() {
  return (
    <div className="bg-sand-50 min-h-screen">
      {/* Breadcrumb Skeleton */}
      <div className="border-b border-sand-200 bg-sand-100/50 py-3.5">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex items-center gap-2">
          <div className="h-3.5 w-12 rounded shimmer-skeleton" />
          <div className="h-3.5 w-3 rounded-full shimmer-skeleton" />
          <div className="h-3.5 w-32 rounded shimmer-skeleton" />
        </div>
      </div>

      {/* Hero Header Skeleton */}
      <div className="border-b border-sand-200 bg-sand-100/30 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="h-4 w-40 mx-auto rounded-full shimmer-skeleton" />
          <div className="h-10 w-3/4 mx-auto rounded-lg shimmer-skeleton" />
          <div className="h-4 w-full max-w-lg mx-auto rounded shimmer-skeleton" />
        </div>
      </div>

      {/* Tiers Grid Skeleton */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-white border border-sand-200 space-y-4">
              <div className="h-6 w-32 rounded shimmer-skeleton" />
              <div className="h-4 w-full rounded shimmer-skeleton" />
              <div className="h-4 w-2/3 rounded shimmer-skeleton" />
              <div className="h-8 w-24 rounded-lg shimmer-skeleton pt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
