import React from "react";

export default function AccountLoading() {
  return (
    <div className="bg-sand-50 min-h-screen py-10 sm:py-14">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Profile Card Skeleton */}
        <div className="rounded-2xl border border-sand-200 bg-white p-6 sm:p-8 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full shimmer-skeleton" />
            <div className="space-y-2">
              <div className="h-5 w-44 rounded shimmer-skeleton" />
              <div className="h-3.5 w-32 rounded shimmer-skeleton" />
            </div>
          </div>
          <div className="h-9 w-28 rounded-lg shimmer-skeleton" />
        </div>

        {/* Tab Pills Skeleton */}
        <div className="flex gap-3 border-b border-sand-200 pb-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-24 rounded-lg shimmer-skeleton" />
          ))}
        </div>

        {/* Orders / Content Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-sand-200 bg-white p-6 space-y-4 shadow-xs"
            >
              <div className="flex justify-between items-center pb-3 border-b border-sand-100">
                <div className="h-4 w-32 rounded shimmer-skeleton" />
                <div className="h-6 w-20 rounded-full shimmer-skeleton" />
              </div>
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-lg shimmer-skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 rounded shimmer-skeleton" />
                  <div className="h-3 w-1/4 rounded shimmer-skeleton" />
                  <div className="h-4 w-20 rounded shimmer-skeleton" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
