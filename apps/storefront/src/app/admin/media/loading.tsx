import React from "react";

export default function AdminMediaLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1680px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg shimmer-skeleton" />
          <div className="h-4 w-72 rounded-md shimmer-skeleton" />
        </div>
        <div className="h-9 w-32 rounded-xl shimmer-skeleton" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
          <div key={i} className="aspect-square rounded-xl shimmer-skeleton border border-sand-200" />
        ))}
      </div>
    </div>
  );
}
