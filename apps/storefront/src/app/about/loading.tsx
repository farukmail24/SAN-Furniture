import React from "react";

export default function AboutLoading() {
  return (
    <div className="bg-sand-50 min-h-screen">
      {/* Breadcrumb Skeleton */}
      <div className="border-b border-sand-200 bg-sand-100/50 py-3.5">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex items-center gap-2">
          <div className="h-3.5 w-12 rounded shimmer-skeleton" />
          <div className="h-3.5 w-3 rounded-full shimmer-skeleton" />
          <div className="h-3.5 w-24 rounded shimmer-skeleton" />
        </div>
      </div>

      {/* Hero Header Skeleton */}
      <div className="border-b border-sand-200 bg-sand-100/30 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="h-4 w-36 mx-auto rounded-full shimmer-skeleton" />
          <div className="h-10 w-3/4 mx-auto rounded-lg shimmer-skeleton" />
          <div className="h-4 w-full max-w-xl mx-auto rounded shimmer-skeleton" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="w-full aspect-[21/9] rounded-2xl shimmer-skeleton border border-sand-200" />
        <div className="space-y-4 pt-4">
          <div className="h-4 w-full rounded shimmer-skeleton" />
          <div className="h-4 w-5/6 rounded shimmer-skeleton" />
          <div className="h-4 w-4/6 rounded shimmer-skeleton" />
        </div>
      </div>
    </div>
  );
}
