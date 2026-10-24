import React from "react";

export default function AdminSettingsLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1200px] mx-auto w-full">
      {/* Header */}
      <div className="space-y-2 pb-2">
        <div className="h-7 w-48 rounded-lg shimmer-skeleton" />
        <div className="h-4 w-72 rounded-md shimmer-skeleton" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-sand-200/80 pb-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-28 rounded-xl shimmer-skeleton" />
        ))}
      </div>

      {/* Settings Form Card */}
      <div className="rounded-2xl border border-sand-200/80 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-36 rounded shimmer-skeleton" />
            <div className="h-11 w-full rounded-xl shimmer-skeleton" />
          </div>
        ))}
        <div className="pt-4 border-t border-sand-100 flex justify-end">
          <div className="h-10 w-32 rounded-xl shimmer-skeleton" />
        </div>
      </div>
    </div>
  );
}
