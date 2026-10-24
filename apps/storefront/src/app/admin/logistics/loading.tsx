import React from "react";

export default function AdminLogisticsLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto w-full">
      <div className="space-y-2 pb-2">
        <div className="h-7 w-56 rounded-lg shimmer-skeleton" />
        <div className="h-4 w-80 rounded-md shimmer-skeleton" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-sand-200/80 bg-white p-6 space-y-4 shadow-xs">
            <div className="h-6 w-40 rounded shimmer-skeleton" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded shimmer-skeleton" />
              <div className="h-4 w-2/3 rounded shimmer-skeleton" />
            </div>
            <div className="h-10 w-full rounded-xl shimmer-skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
