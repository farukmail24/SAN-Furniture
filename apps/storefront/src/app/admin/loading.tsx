import React from "react";

export default function AdminLoadingSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sand-300">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-sand-300 rounded" />
          <div className="h-8 w-64 bg-sand-300 rounded" />
          <div className="h-3 w-80 bg-sand-200 rounded" />
        </div>
        <div className="h-10 w-36 bg-sand-300 rounded-xl" />
      </div>

      {/* Metrics Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-sand-100 border border-sand-200 space-y-2">
            <div className="h-3 w-20 bg-sand-300 rounded" />
            <div className="h-7 w-28 bg-sand-300 rounded" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="rounded-2xl bg-sand-100 border border-sand-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-9 w-72 bg-sand-200 rounded-xl" />
          <div className="h-9 w-28 bg-sand-200 rounded-xl" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div key={row} className="h-14 bg-sand-200/80 rounded-xl w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
