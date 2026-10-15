import React from "react";

export default function StorefrontLoadingSkeleton() {
  return (
    <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-pulse">
      {/* Hero Skeleton */}
      <div className="h-96 w-full rounded-3xl bg-sand-200/80" />

      {/* Grid Skeleton */}
      <div className="space-y-6">
        <div className="h-6 w-48 bg-sand-300 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-sand-200/80" />
          ))}
        </div>
      </div>
    </div>
  );
}
