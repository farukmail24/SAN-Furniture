import React from "react";

export default function AdminNotificationsLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1200px] mx-auto w-full">
      <div className="space-y-2 pb-2">
        <div className="h-7 w-48 rounded-lg shimmer-skeleton" />
        <div className="h-4 w-72 rounded-md shimmer-skeleton" />
      </div>

      <div className="rounded-2xl border border-sand-200/80 bg-white p-5 space-y-3 shadow-xs">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3 px-4 rounded-xl border border-sand-100 bg-sand-50/50">
            <div className="w-10 h-10 rounded-full shimmer-skeleton shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-1/2 rounded shimmer-skeleton" />
              <div className="h-3 w-1/4 rounded shimmer-skeleton" />
            </div>
            <div className="h-3 w-16 rounded shimmer-skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
