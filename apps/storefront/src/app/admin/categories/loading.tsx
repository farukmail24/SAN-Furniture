import React from "react";

export default function AdminCategoriesLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1680px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg shimmer-skeleton" />
          <div className="h-4 w-72 rounded-md shimmer-skeleton" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-36 rounded-xl shimmer-skeleton" />
        </div>
      </div>

      {/* Categories Grid (2 or 3 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl border border-sand-200/80 bg-white p-5 space-y-4 shadow-xs">
            <div className="w-full h-36 rounded-xl shimmer-skeleton" />
            <div className="space-y-2">
              <div className="h-5 w-3/4 rounded shimmer-skeleton" />
              <div className="h-3.5 w-full rounded shimmer-skeleton" />
              <div className="h-3.5 w-2/3 rounded shimmer-skeleton" />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-sand-100">
              <div className="h-4 w-20 rounded shimmer-skeleton" />
              <div className="h-8 w-24 rounded-lg shimmer-skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
