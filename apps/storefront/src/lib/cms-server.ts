import { apiUrl } from "@/lib/api-config";
import type { SiteSection } from "@/lib/cms";
import { DEFAULT_STOREFRONT_SECTIONS } from "@/lib/cms-defaults";
import { getDbPool } from "@/lib/db";

// Server-side in-memory hot cache for instant 0ms SSR rendering
const serverSectionsCache = new Map<string, { data: Record<string, SiteSection>; timestamp: number }>();
let serverReviewsCache: { data: Array<any>; timestamp: number } | null = null;
const CACHE_TTL_MS = 60000; // 60s TTL with SWR background revalidation

export function invalidateServerSectionsCache() {
  serverSectionsCache.clear();
  serverReviewsCache = null;
}

/**
 * Server-Side direct fetcher for instant SSR rendering without client flicker
 * Strictly executed on Server / Node runtime (0 hooks, pure async fetch with memory cache)
 */
export async function getLiveSections(
  pageKey: string = "all",
  options: { fresh?: boolean } = {}
): Promise<Record<string, SiteSection> | null> {
  const cacheKey = pageKey || "all";
  const now = Date.now();
  const cached = serverSectionsCache.get(cacheKey);

  // 0ms Fast Path: If cached, return immediately and revalidate in background if stale
  if (cached && !options.fresh) {
    if (now - cached.timestamp >= CACHE_TTL_MS) {
      refreshSectionsInBackground(cacheKey).catch(() => {});
    }
    return cached.data;
  }

  return await refreshSectionsInBackground(cacheKey);
}

async function refreshSectionsInBackground(cacheKey: string): Promise<Record<string, SiteSection> | null> {
  // Fast Path 1: Direct MySQL Query (0ms loopback)
  try {
    const pool = getDbPool();
    let query = "SELECT * FROM site_page_sections";
    const params: any[] = [];
    if (cacheKey !== "all") {
      query += " WHERE page_key = ?";
      params.push(cacheKey);
    }
    query += " ORDER BY page_key ASC, sort_order ASC";

    const [rows]: any = await pool.query(query, params).catch(() => [[]]);
    if (Array.isArray(rows) && rows.length > 0) {
      const sectionsMap: Record<string, SiteSection> = {
        ...(cacheKey === "all" ? (DEFAULT_STOREFRONT_SECTIONS as any) : {}),
      };

      for (const row of rows) {
        let content = {};
        try {
          content = typeof row.content_json === "string" ? JSON.parse(row.content_json) : row.content_json;
        } catch {
          content = {};
        }

        sectionsMap[row.section_key] = {
          id: row.id,
          pageKey: row.page_key,
          sectionKey: row.section_key,
          sectionName: row.section_name,
          isEnabled: Boolean(row.is_enabled),
          sortOrder: row.sort_order,
          content,
          updatedAt: String(row.updated_at),
        };
      }

      serverSectionsCache.set(cacheKey, { data: sectionsMap, timestamp: Date.now() });
      return sectionsMap;
    }
  } catch {}

  // Fast Path 2: HTTP Fallback
  try {
    const endpoint = apiUrl(cacheKey === "all" ? "/api/content/sections" : `/api/content/sections?page=${cacheKey}`);
    const res = await fetch(endpoint, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.sections) {
        serverSectionsCache.set(cacheKey, { data: data.sections, timestamp: Date.now() });
        return data.sections;
      }
    }
  } catch (err) {
    console.warn("SSR live sections fetch warning:", err);
  }
  return serverSectionsCache.get(cacheKey)?.data || (DEFAULT_STOREFRONT_SECTIONS as any);
}

export async function getLiveReviews(): Promise<Array<{ id: string; customer_name: string; rating: number; title: string; comment: string }>> {
  const now = Date.now();
  if (serverReviewsCache) {
    if (now - serverReviewsCache.timestamp >= CACHE_TTL_MS) {
      refreshReviewsInBackground().catch(() => {});
    }
    return serverReviewsCache.data;
  }

  return await refreshReviewsInBackground();
}

async function refreshReviewsInBackground(): Promise<Array<any>> {
  // Fast Path 1: Direct MySQL Query
  try {
    const pool = getDbPool();
    const [rows]: any = await pool.query(
      "SELECT id, product_id, customer_name, rating, title, comment, verified_purchase, room_image_url, created_at FROM customer_reviews WHERE status = 'approved' ORDER BY rating DESC, created_at DESC LIMIT 50"
    ).catch(() => [[]]);

    if (Array.isArray(rows) && rows.length > 0) {
      serverReviewsCache = { data: rows, timestamp: Date.now() };
      return rows;
    }
  } catch {}

  // Fast Path 2: HTTP Fallback
  try {
    const res = await fetch(apiUrl("/api/reviews"), {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.reviews)) {
        serverReviewsCache = { data: data.reviews, timestamp: Date.now() };
        return data.reviews;
      }
    }
  } catch (err) {
    console.warn("SSR live reviews fetch warning:", err);
  }
  return serverReviewsCache?.data || [];
}
