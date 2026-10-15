"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * TopProgressBar
 * High-performance, tactile navigation progress bar.
 * Fires INSTANTLY (0ms) on any internal link click or route transition,
 * eliminating the "is this link dead/broken?" delay.
 */
export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Complete progress on route change
  useEffect(() => {
    if (isVisible) {
      setProgress(100);
      document.body.style.cursor = "";
      const timer = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept all internal link clicks for 0ms instantaneous feedback
  useEffect(() => {
    let animInterval: NodeJS.Timeout | null = null;

    const handleLinkClick = (e: MouseEvent) => {
      // Find nearest anchor tag
      const target = (e.target as HTMLElement).closest("a");
      if (!target || !target.href) return;

      const href = target.getAttribute("href");
      // Skip external links, hashes, download, or modifier keys (Ctrl/Cmd click)
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.target === "_blank" ||
        target.hasAttribute("download") ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // Check if clicking current URL
      if (href === pathname || href === window.location.pathname) {
        return;
      }

      // Immediately show top progress bar and tactile cursor
      setIsVisible(true);
      setProgress(35);
      document.body.style.cursor = "progress";

      if (animInterval) clearInterval(animInterval);
      animInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 88) {
            if (animInterval) clearInterval(animInterval);
            return prev;
          }
          // Ease towards 88%
          return prev + Math.random() * 12;
        });
      }, 100);
    };

    document.addEventListener("click", handleLinkClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleLinkClick, { capture: true });
      if (animInterval) clearInterval(animInterval);
      document.body.style.cursor = "";
    };
  }, [pathname]);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[999999] pointer-events-none h-[3.5px] bg-transparent"
    >
      <div
        className="h-full bg-gradient-to-r from-brass-600 via-amber-400 to-amber-200 transition-all duration-150 ease-out shadow-[0_0_16px_rgba(200,155,60,0.95)]"
        style={{
          width: `${progress}%`,
          opacity: isVisible || progress > 0 ? 1 : 0,
        }}
      />
    </div>
  );
}
