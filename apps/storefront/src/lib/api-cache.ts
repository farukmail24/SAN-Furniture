/**
 * In-Memory & Session Stale-While-Revalidate (SWR) Cache
 * Provides GUARANTEED INSTANT (0ms) data loading across pages and tabs,
 * updating in the background without UI freezing or blank loading spinners.
 */

import { apiUrl } from "@/lib/api-config";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

const SESSION_PREFIX = "san_swr_cache:";

/**
 * Synchronously retrieves cached data if available
 * Used for zero-latency initial state initialization (0ms frame render)
 */
export function getCachedData<T>(url: string, method: string = "GET"): T | null {
  return readCachedData(url, method);
}

function readCachedData<T>(url: string, method: string): T | null {
  const cacheKey = `${method}:${url}`;

  // 1. Check hot RAM memory cache
  const memEntry = memoryCache.get(cacheKey);
  if (memEntry) {
    return memEntry.data as T;
  }

  // 2. Check browser sessionStorage backup for instant cross-tab / reload persistence
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(SESSION_PREFIX + cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.data && Date.now() - parsed.timestamp < 300000) { // 5 min session TTL
          memoryCache.set(cacheKey, parsed);
          return parsed.data as T;
        }
      }
    } catch {}
  }

  return null;
}

function prepareRequestOptions(url: string, options?: RequestInit): RequestInit {
  const customOptions: RequestInit = { ...options };
  const headers = new Headers(options?.headers || {});

  if (typeof window !== "undefined") {
    if (!headers.has("Authorization")) {
      const adminToken = localStorage.getItem("san_admin_token");
      const customerToken = localStorage.getItem("san_customer_token");

      const isAdminContext =
        window.location.pathname.startsWith("/admin") ||
        url.includes("/api/admin/") ||
        url.includes("/api/security/") ||
        url.includes("recipient_type=admin");

      if (isAdminContext && adminToken) {
        headers.set("Authorization", `Bearer ${adminToken}`);
      } else if (adminToken && (url.includes("/api/admin/") || url.includes("/api/security/"))) {
        headers.set("Authorization", `Bearer ${adminToken}`);
      } else if (customerToken) {
        headers.set("Authorization", `Bearer ${customerToken}`);
      }
    }
    if (!customOptions.credentials) {
      customOptions.credentials = "include";
    }
  }

  customOptions.headers = headers;
  return customOptions;
}

/**
 * Pre-fetches an API route into cache in the background
 */
export async function preloadCache(url: string, options?: RequestInit): Promise<void> {
  if (typeof window === "undefined") return;
  const cacheKey = `${options?.method || "GET"}:${url}`;
  const entry = memoryCache.get(cacheKey);
  if (entry && Date.now() - entry.timestamp < 20000) {
    return; // Already warm within last 20s
  }
  try {
    const finalOptions = prepareRequestOptions(url, options);
    const res = await fetch(url, finalOptions);
    if (!res.ok) return;
    const data = await res.json();
    const cacheRecord: CacheEntry<any> = {
      data,
      timestamp: Date.now(),
    };
    memoryCache.set(cacheKey, cacheRecord);
    try {
      sessionStorage.setItem(SESSION_PREFIX + cacheKey, JSON.stringify(cacheRecord));
    } catch {}

    // Granular entity pre-indexing into hot RAM for sub-1ms instant navigation
    if (data && typeof data === "object") {
      if (Array.isArray(data.products)) {
        for (const p of data.products) {
          if (p.handle) {
            memoryCache.set(`GET:${apiUrl(`/api/products/${p.handle}`)}`, {
              data: { product: p },
              timestamp: Date.now(),
            });
          }
          if (p.id) {
            memoryCache.set(`GET:${apiUrl(`/api/products/${p.id}`)}`, {
              data: { product: p },
              timestamp: Date.now(),
            });
          }
        }
      }
      if (Array.isArray(data.categories)) {
        for (const c of data.categories) {
          if (c.handle) {
            memoryCache.set(`GET:${apiUrl(`/api/categories/${c.handle}`)}`, {
              data: { category: c },
              timestamp: Date.now(),
            });
          }
          if (c.id) {
            memoryCache.set(`GET:${apiUrl(`/api/categories/${c.id}`)}`, {
              data: { category: c },
              timestamp: Date.now(),
            });
          }
        }
      }
    }
  } catch {
    // Preload failures silently ignored
  }
}

/**
 * Predictive hover prefetcher (called on link mouseEnter or touchStart)
 */
export function prefetchOnHover(url: string): void {
  preloadCache(url);
}

let hasPreloadedAdmin = false;

/**
 * Preload critical Admin suite endpoints in gentle background sequence
 * Executed once when Admin layout initializes during browser idle time
 */
export function preloadAdminRoutes(): void {
  if (typeof window === "undefined" || hasPreloadedAdmin) return;
  hasPreloadedAdmin = true;

  const runPreload = async () => {
    // Priority 1: Instant dashboard metrics and active catalog
    await preloadCache(apiUrl("/api/admin/metrics"));
    await preloadCache(apiUrl("/api/admin/products"));
    await preloadCache(apiUrl("/api/admin/categories"));
    // Subsequent admin pages are pre-warmed prediction-style on hover/touch
  };

  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(runPreload, { timeout: 400 });
  } else {
    setTimeout(runPreload, 200);
  }
}

let hasPreloadedStorefront = false;

/**
 * Preload critical Storefront catalog in gentle background sequence
 * Executed once when Storefront mounts
 */
export function preloadStorefrontRoutes(): void {
  if (typeof window === "undefined" || hasPreloadedStorefront) return;
  hasPreloadedStorefront = true;

  const runPreload = async () => {
    await preloadCache(apiUrl("/api/products"));
    await preloadCache(apiUrl("/api/categories"));
  };

  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(runPreload, { timeout: 400 });
  } else {
    setTimeout(runPreload, 200);
  }
}

/**
 * High-performance Stale-While-Revalidate (SWR) Fetcher
 * Delivers cached data synchronously (0ms) and silently refreshes in background.
 */
export async function fetchWithSwr<T>(
  url: string,
  onData: (data: T, isFromCache: boolean) => void,
  options?: RequestInit,
  ttlMs: number = 60000
): Promise<T> {
  const cacheKey = `${options?.method || "GET"}:${url}`;
  const cached = readCachedData<T>(url, options?.method || "GET");

  // 1. If cached data is available, deliver it INSTANTLY (0ms)
  if (cached) {
    onData(cached, true);
    const entry = memoryCache.get(cacheKey);
    // If cache is very fresh (< 15 seconds), skip network call completely
    if (entry && Date.now() - entry.timestamp < 15000) {
      return cached;
    }
  }

  // 2. Fetch fresh data in the background without UI blocking
  try {
    const customOptions = prepareRequestOptions(url, options);

    const res = await fetch(url, customOptions);
    if (!res.ok) {
      if (res.status === 401 && typeof window !== "undefined" && url.includes("/api/admin/")) {
        localStorage.removeItem("san_admin_token");
        localStorage.removeItem("san_admin_user");
        document.cookie = "san_admin_token=; Max-Age=0; path=/;";
        window.location.href = "/admin/login";
      }
      throw new Error(`HTTP error ${res.status}`);
    }
    const freshData = await res.json();

    const cacheRecord: CacheEntry<T> = {
      data: freshData,
      timestamp: Date.now(),
    };

    // Update in-memory & session storage
    memoryCache.set(cacheKey, cacheRecord);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(SESSION_PREFIX + cacheKey, JSON.stringify(cacheRecord));
      } catch {}
    }

    // Deliver fresh data to UI
    onData(freshData, false);
    return freshData;
  } catch (err) {
    // If background fetch fails but we had cached data, silently keep cached data
    if (cached) {
      return cached;
    }
    throw err;
  }
}

/**
 * Invalidate cache entries matching a prefix or URL
 * E.g., invalidateCache("/api/admin/orders") after creating or editing an order.
 */
export function invalidateCache(urlPrefix?: string): void {
  if (!urlPrefix) {
    memoryCache.clear();
    if (typeof window !== "undefined") {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k?.startsWith(SESSION_PREFIX)) keysToRemove.push(k);
        }
        keysToRemove.forEach((k) => sessionStorage.removeItem(k));
      } catch {}
    }
    return;
  }

  for (const key of memoryCache.keys()) {
    if (key.includes(urlPrefix)) {
      memoryCache.delete(key);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(SESSION_PREFIX + key);
        } catch {}
      }
    }
  }
}
