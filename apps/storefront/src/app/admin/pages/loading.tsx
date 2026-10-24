import React from "react";

export default function AdminPagesLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1680px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-2">
          <div className="h-7 w-56 rounded-lg shimmer-skeleton" />
          <div className="h-4 w-80 rounded-md shimmer-skeleton" />
        </div>
      </div>

      {/* Pages Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl border border-sand-200/80 bg-white p-6 space-y-4 shadow-xs">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-5 w-40 rounded shimmer-skeleton" />
                <div className="h-3.5 w-24 rounded shimmer-skeleton" />
              </div>
              <div className="h-6 w-16 rounded-full shimmer-skeleton" />
            </div>
            <div className="space-y-2">
              <div className="h-3.5 w-full rounded shimmer-skeleton" />
              <div className="h-3.5 w-3/4 rounded shimmer-skeleton" />
            </div>
            <div className="h-9 w-full rounded-xl shimmer-skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
