/**
 * In-Memory Stale-While-Revalidate (SWR) Cache
 * Provides INSTANT (0ms) data loading across pages and tabs,
 * updating in the background without UI freezing or blank loading spinners.
 */

import { apiUrl } from "@/lib/api-config";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

/**
 * Synchronously retrieves cached data if available
 * Used for zero-latency initial state initialization
 */
export function getCachedData<T>(url: string, method: string = "GET"): T | null {
  const cacheKey = `${method}:${url}`;
  const entry = memoryCache.get(cacheKey);
  return entry ? (entry.data as T) : null;
}

/**
 * Pre-fetches an API route into cache in the background
 */
export async function preloadCache(url: string, options?: RequestInit): Promise<void> {
  if (typeof window === "undefined") return;
  const cacheKey = `${options?.method || "GET"}:${url}`;
  const entry = memoryCache.get(cacheKey);
  if (entry && Date.now() - entry.timestamp < 30000) {
    return; // Already warm within last 30s
  }
  try {
    const res = await fetch(url, options);
    if (!res.ok) return;
    const data = await res.json();
    memoryCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  } catch {
    // Preload failures silently ignored
  }
}

/**
 * Preload all major Admin suite endpoints in background
 * Executed when Admin layout initializes
 */
export function preloadAdminRoutes(): void {
  if (typeof window === "undefined") return;
  // Delay slightly (250ms) to prioritize current route hydration
  setTimeout(() => {
    const endpoints = [
      apiUrl("/api/admin/categories"),
      apiUrl("/api/admin/products"),
      apiUrl("/api/admin/orders"),
      apiUrl("/api/admin/customers"),
      apiUrl("/api/admin/users"),
      apiUrl("/api/admin/reviews"),
      apiUrl("/api/admin/settings"),
      apiUrl("/api/admin/media"),
    ];
    endpoints.forEach((ep) => preloadCache(ep));
  }, 250);
}

export async function fetchWithSwr<T>(
  url: string,
  onData: (data: T, isFromCache: boolean) => void,
  options?: RequestInit,
  ttlMs: number = 60000
): Promise<T> {
  const cacheKey = `${options?.method || "GET"}:${url}`;
  const cached = memoryCache.get(cacheKey);

  // 1. If cached data is available, deliver it INSTANTLY (0ms)
  if (cached) {
    onData(cached.data, true);
    // If cache is very fresh (< 10 seconds), skip immediate background revalidation to save bandwidth
    if (Date.now() - cached.timestamp < 10000) {
      return cached.data;
    }
  }

  // 2. Fetch fresh data in the background
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const freshData = await res.json();

    // Update cache
    memoryCache.set(cacheKey, {
      data: freshData,
      timestamp: Date.now(),
    });

    // Deliver fresh data
    onData(freshData, false);
    return freshData;
  } catch (err) {
    // If background fetch fails but we had cached data, silently keep cached data
    if (cached) {
      return cached.data;
    }
    throw err;
  }
}

/**
 * Invalidate cache entries matching a prefix or URL
 * E.g., invalidateCache("/api/admin/products") after creating or editing a product.
 */
export function invalidateCache(urlPrefix?: string) {
  if (!urlPrefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(urlPrefix)) {
      memoryCache.delete(key);
    }
  }
}
