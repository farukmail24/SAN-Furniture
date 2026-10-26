"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw, Home, AlertTriangle } from "lucide-react";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // If a chunk failed to load (new deployment happened), auto-reload once to fetch new chunks
    const isChunkError =
      error?.name === "ChunkLoadError" ||
      error?.message?.includes("Loading chunk") ||
      error?.message?.includes("ChunkLoadError");

    if (isChunkError && typeof window !== "undefined") {
      const key = "san_chunk_reload_ts";
      const last = parseInt(sessionStorage.getItem(key) || "0", 10);
      const now = Date.now();
      if (now - last > 10000) {
        sessionStorage.setItem(key, String(now));
        window.location.reload();
        return;
      }
    }
  }, [error]);

  return (
    <div className="min-h-[70vh] bg-sand-50 flex items-center justify-center p-6 text-center antialiased">
      <div className="max-w-md w-full bg-white border border-sand-300 rounded-2xl p-8 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-950">
          Session Update Required
        </h2>
        <p className="text-xs text-navy-600 mt-2 leading-relaxed">
          A new version of SAN Furniture has been deployed. Please reload the page to refresh your session.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.reload();
              } else {
                reset();
              }
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-navy-950 text-sand-50 text-xs font-bold hover:bg-navy-900 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <RotateCw className="w-3.5 h-3.5 text-brass-400" />
            <span>Reload Page</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-sand-300 bg-sand-50 text-navy-950 text-xs font-bold hover:bg-sand-200 transition-colors inline-flex items-center justify-center gap-2 shadow-2xs"
          >
            <Home className="w-3.5 h-3.5 text-navy-600" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
