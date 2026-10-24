import React from "react";

export default function AdminAuditLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto w-full">
      <div className="space-y-2 pb-2">
        <div className="h-7 w-48 rounded-lg shimmer-skeleton" />
        <div className="h-4 w-72 rounded-md shimmer-skeleton" />
      </div>

      <div className="rounded-2xl border border-sand-200/80 bg-white p-5 space-y-3 shadow-xs">
        <div className="h-10 w-full sm:w-80 rounded-xl shimmer-skeleton" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center justify-between py-3.5 px-4 rounded-xl border border-sand-100 bg-sand-50/50">
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-1/3 rounded shimmer-skeleton" />
                <div className="h-3 w-1/4 rounded shimmer-skeleton" />
              </div>
              <div className="h-4 w-28 rounded shimmer-skeleton" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
