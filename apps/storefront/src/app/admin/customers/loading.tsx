import React from "react";

export default function AdminCustomersLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1680px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg shimmer-skeleton" />
          <div className="h-4 w-72 rounded-md shimmer-skeleton" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-32 rounded-xl shimmer-skeleton" />
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-sand-200/80 bg-white p-5 space-y-2.5 shadow-xs">
            <div className="h-3.5 w-28 rounded shimmer-skeleton" />
            <div className="h-8 w-24 rounded-lg shimmer-skeleton" />
            <div className="h-3 w-36 rounded shimmer-skeleton" />
          </div>
        ))}
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl border border-sand-200/80 bg-white p-5 space-y-4 shadow-xs">
        <div className="h-10 w-full sm:w-80 rounded-xl shimmer-skeleton" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center justify-between py-3.5 px-4 rounded-xl border border-sand-100 bg-sand-50/50 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full shimmer-skeleton shrink-0" />
                <div className="space-y-1.5 min-w-0">
                  <div className="h-4 w-36 rounded shimmer-skeleton" />
                  <div className="h-3 w-48 rounded shimmer-skeleton" />
                </div>
              </div>
              <div className="hidden sm:block h-4 w-28 rounded shimmer-skeleton" />
              <div className="h-6 w-20 rounded-full shimmer-skeleton" />
              <div className="h-4 w-20 rounded shimmer-skeleton" />
              <div className="h-8 w-20 rounded-lg shimmer-skeleton" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
