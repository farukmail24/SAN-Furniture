import React from "react";

export default function AdminSupportLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1680px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-2">
          <div className="h-7 w-52 rounded-lg shimmer-skeleton" />
          <div className="h-4 w-72 rounded-md shimmer-skeleton" />
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-sand-200/80 bg-white p-5 space-y-2.5 shadow-xs">
            <div className="h-3.5 w-24 rounded shimmer-skeleton" />
            <div className="h-8 w-16 rounded-lg shimmer-skeleton" />
          </div>
        ))}
      </div>

      {/* Tickets List */}
      <div className="rounded-2xl border border-sand-200/80 bg-white p-5 space-y-4 shadow-xs">
        <div className="h-10 w-full sm:w-80 rounded-xl shimmer-skeleton" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-4 px-4 rounded-xl border border-sand-100 bg-sand-50/50 gap-4">
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="h-4 w-1/2 rounded shimmer-skeleton" />
                <div className="h-3 w-1/3 rounded shimmer-skeleton" />
              </div>
              <div className="h-6 w-20 rounded-full shimmer-skeleton" />
              <div className="h-8 w-20 rounded-lg shimmer-skeleton" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
