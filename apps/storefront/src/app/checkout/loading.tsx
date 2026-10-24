import React from "react";

export default function CheckoutLoading() {
  return (
    <div className="bg-sand-50 min-h-screen py-10 sm:py-14">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Form Skeleton (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-sand-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="h-6 w-48 rounded shimmer-skeleton" />
              <div className="space-y-4">
                <div className="h-11 w-full rounded-xl shimmer-skeleton" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-11 w-full rounded-xl shimmer-skeleton" />
                  <div className="h-11 w-full rounded-xl shimmer-skeleton" />
                </div>
                <div className="h-11 w-full rounded-xl shimmer-skeleton" />
              </div>
            </div>

            <div className="rounded-2xl border border-sand-200 bg-white p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="h-6 w-40 rounded shimmer-skeleton" />
              <div className="h-20 w-full rounded-xl shimmer-skeleton" />
            </div>
          </div>

          {/* Right Summary Skeleton (5 cols) */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-sand-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs sticky top-28">
              <div className="h-6 w-36 rounded shimmer-skeleton" />
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-16 h-16 rounded-lg shimmer-skeleton" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded shimmer-skeleton" />
                      <div className="h-3 w-1/3 rounded shimmer-skeleton" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-sand-100 space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-20 rounded shimmer-skeleton" />
                  <div className="h-4 w-16 rounded shimmer-skeleton" />
                </div>
                <div className="flex justify-between">
                  <div className="h-5 w-24 rounded shimmer-skeleton" />
                  <div className="h-5 w-20 rounded shimmer-skeleton" />
                </div>
              </div>
              <div className="h-12 w-full rounded-xl shimmer-skeleton" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
