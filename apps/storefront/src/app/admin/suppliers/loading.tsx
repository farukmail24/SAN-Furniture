import React from "react";

export default function AdminSuppliersLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1680px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-2">
          <div className="h-7 w-56 rounded-lg shimmer-skeleton" />
          <div className="h-4 w-80 rounded-md shimmer-skeleton" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-36 rounded-xl shimmer-skeleton" />
        </div>
      </div>

      {/* Supplier Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-sand-200/80 bg-white p-6 space-y-5 shadow-xs">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-6 w-48 rounded-lg shimmer-skeleton" />
                <div className="h-3.5 w-32 rounded shimmer-skeleton" />
              </div>
              <div className="h-6 w-20 rounded-full shimmer-skeleton" />
            </div>
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-sand-50/60 border border-sand-100">
              <div className="h-10 rounded shimmer-skeleton" />
              <div className="h-10 rounded shimmer-skeleton" />
              <div className="h-10 rounded shimmer-skeleton" />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-sand-100">
              <div className="h-4 w-32 rounded shimmer-skeleton" />
              <div className="h-9 w-28 rounded-xl shimmer-skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
