"use client";

import { useEffect } from "react";

/**
 * ExtensionErrorGuard
 * Lightweight client guard to catch and silence third-party extension errors.
 * Zero CPU overhead, zero MutationObserver loops.
 */
export function ExtensionErrorGuard() {
  useEffect(() => {
    function isIgnored(val: any): boolean {
      if (!val) return false;
      let str = "";
      try {
        if (typeof val === "string") {
          str = val;
        } else if (val instanceof Error) {
          str = (val.message || "") + " " + (val.stack || "");
        } else if (typeof val === "object") {
          str =
            (val.message || "") +
            " " +
            (val.filename || "") +
            " " +
            (val.reason?.message || val.reason?.stack || "") +
            " " +
            (val.error?.message || val.error?.stack || "");
        }
      } catch {
        str = "";
      }
      const lower = str.toLowerCase();
      return (
        lower.includes("chrome-extension://") ||
        lower.includes("moz-extension://") ||
        lower.includes("safari-extension://") ||
        lower.includes("m_id") ||
        lower.includes("200.js") ||
        lower.includes("bis_skin_checked") ||
        lower.includes("cz-shortcut-listen") ||
        lower.includes("fdprocessedid")
      );
    }

    const errorHandler = (e: ErrorEvent) => {
      if (isIgnored(e)) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };

    const rejectionHandler = (e: PromiseRejectionEvent) => {
      if (isIgnored(e)) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };

    window.addEventListener("error", errorHandler, true);
    window.addEventListener("unhandledrejection", rejectionHandler, true);

    return () => {
      window.removeEventListener("error", errorHandler, true);
      window.removeEventListener("unhandledrejection", rejectionHandler, true);
    };
  }, []);

  return null;
}
