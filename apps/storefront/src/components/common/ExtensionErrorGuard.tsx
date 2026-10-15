"use client";

import { useEffect } from "react";

/**
 * ExtensionErrorGuard
 * Intercepts and suppresses runtime errors thrown by third-party browser extensions
 * (such as ad blockers, translation plugins, download managers, or coupon extensions like 200.js)
 * to prevent Next.js development error overlay from unnecessarily popping up.
 */
export function ExtensionErrorGuard() {
  useEffect(() => {
    function isExtensionError(event: ErrorEvent | PromiseRejectionEvent): boolean {
      const filename = "filename" in event ? event.filename || "" : "";
      const message =
        "message" in event
          ? event.message || ""
          : "reason" in event && event.reason?.message
          ? event.reason.message || ""
          : "";
      const stack =
        "error" in event && event.error?.stack
          ? event.error.stack || ""
          : "reason" in event && event.reason?.stack
          ? event.reason.stack || ""
          : "";

      return (
        filename.includes("chrome-extension://") ||
        filename.includes("moz-extension://") ||
        filename.includes("safari-extension://") ||
        stack.includes("chrome-extension://") ||
        stack.includes("moz-extension://") ||
        stack.includes("safari-extension://") ||
        message.includes("M_ID") ||
        stack.includes("M_ID")
      );
    }

    const errorHandler = (e: ErrorEvent) => {
      if (isExtensionError(e)) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };

    const rejectionHandler = (e: PromiseRejectionEvent) => {
      if (isExtensionError(e)) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };

    window.addEventListener("error", errorHandler, true);
    window.addEventListener("unhandledrejection", rejectionHandler, true);

    const purgeOverlays = () => {
      try {
        const portals = document.querySelectorAll("nextjs-portal");
        portals.forEach((portal) => {
          const shadow = portal.shadowRoot;
          if (shadow) {
            const html = shadow.innerHTML || "";
            const lower = html.toLowerCase();
            if (
              lower.includes("chrome-extension://") ||
              lower.includes("moz-extension://") ||
              lower.includes("safari-extension://") ||
              lower.includes("eppicocmhmnlblhjplcgkofcliegomcon") ||
              lower.includes("m_id") ||
              lower.includes("200.js")
            ) {
              portal.remove();
            }
          }
        });
      } catch {
        // Safe fallback
      }
    };

    const observer = new MutationObserver(purgeOverlays);
    observer.observe(document.body, { childList: true, subtree: true });
    const interval = setInterval(purgeOverlays, 300);

    return () => {
      window.removeEventListener("error", errorHandler, true);
      window.removeEventListener("unhandledrejection", rejectionHandler, true);
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return null;
}
