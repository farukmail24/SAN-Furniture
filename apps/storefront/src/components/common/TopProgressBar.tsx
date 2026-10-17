"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * TopProgressBar
 * High-performance, tactile navigation progress bar.
 * Fires instantly on internal link clicks for tactile responsiveness.
 * Remains smoothly active throughout the entire page loading/compilation duration.
 * Snaps to 100% and gracefully fades out ONLY when the route transition arrives.
 */
export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const isNavigatingRef = useRef(false);
  const watchdogRef = useRef<NodeJS.Timeout | null>(null);
  const animIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const completeAndHide = () => {
    if (animIntervalRef.current) {
      clearInterval(animIntervalRef.current);
      animIntervalRef.current = null;
    }
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
    isNavigatingRef.current = false;
    setProgress(100);
    setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 180);
  };

  // Whenever route (pathname or searchParams) changes, immediately complete and hide
  useEffect(() => {
    if (isNavigatingRef.current || progress > 0) {
      completeAndHide();
    }
  }, [pathname, searchParams]);

  // Click interceptor for instant tactile feedback
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      const targetAttr = target.getAttribute("target");
      const isExternalTarget = targetAttr === "_blank" || target.target === "_blank";

      // Skip external links, hashes, download, or modifier keys (Ctrl/Cmd click)
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        isExternalTarget ||
        target.hasAttribute("download") ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // Check if clicking the same URL
      const cleanHref = href.split("?")[0].split("#")[0];
      const cleanCurrent = (window.location.pathname || pathname).split("?")[0].split("#")[0];
      if (cleanHref === cleanCurrent && !href.includes("?")) {
        return;
      }

      // Start navigation indicator
      isNavigatingRef.current = true;
      setIsVisible(true);
      setProgress(25);

      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
      animIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          // Smooth, non-linear progression that keeps moving throughout the wait
          if (prev < 50) return prev + 6;
          if (prev < 70) return prev + 3;
          if (prev < 85) return prev + 1.2;
          if (prev < 92) return prev + 0.4;
          if (prev < 95) return prev + 0.1;
          return prev;
        });
      }, 100);

      // Failsafe Watchdog: Auto-complete after 10 seconds ONLY if navigation was completely abandoned or failed
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
      watchdogRef.current = setTimeout(() => {
        completeAndHide();
      }, 10000);
    };

    document.addEventListener("click", handleLinkClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleLinkClick, { capture: true });
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
    };
  }, [pathname]);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[999999] pointer-events-none h-[3px] bg-transparent"
    >
      <div
        className="h-full bg-gradient-to-r from-brass-600 via-amber-400 to-amber-200 shadow-[0_0_12px_rgba(200,155,60,0.9)]"
        style={{
          width: `${progress}%`,
          opacity: isVisible || progress > 0 ? 1 : 0,
          transition:
            progress === 0
              ? "none"
              : progress === 100
              ? "width 100ms ease-out, opacity 180ms ease-out"
              : "width 180ms cubic-bezier(0.1, 0.9, 0.2, 1)",
        }}
      />
    </div>
  );
}
