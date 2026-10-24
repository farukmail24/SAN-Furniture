"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiUrl } from "@/lib/api-config";
import { fetchWithSwr, getCachedData } from "@/lib/api-cache";

import { DEFAULT_STOREFRONT_SECTIONS, type SiteSection } from "./cms-defaults";
export { DEFAULT_STOREFRONT_SECTIONS, type SiteSection };

/**
 * Server-Side direct fetcher for instant SSR rendering without client flicker
 */
export async function getLiveSections(pageKey: string = "all"): Promise<Record<string, SiteSection> | null> {
  try {
    const endpoint = apiUrl(pageKey === "all" ? "/api/content/sections" : `/api/content/sections?page=${pageKey}`);
    const res = await fetch(endpoint, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      return data.sections || null;
    }
  } catch (err) {
    console.warn("SSR live sections fetch warning:", err);
  }
  return null;
}

export async function getLiveReviews(): Promise<Array<{ id: string; customer_name: string; rating: number; title: string; comment: string }>> {
  try {
    const res = await fetch(apiUrl("/api/reviews"), {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      return data.reviews || [];
    }
  } catch (err) {
    console.warn("SSR live reviews fetch warning:", err);
  }
  return [];
}

// React Context for Seamless SSR-to-Client Site Sections
interface CmsContextValue {
  sections: Record<string, SiteSection>;
  getSection: <T extends Record<string, any>>(sectionKey: string, fallback: T) => { isEnabled: boolean; content: T };
}

const CmsContext = createContext<CmsContextValue | null>(null);

export function CmsProvider({
  initialSections,
  children,
}: {
  initialSections?: Record<string, SiteSection> | null;
  children: React.ReactNode;
}) {
  const [sections, setSections] = useState<Record<string, SiteSection>>(() => {
    const base: Record<string, SiteSection> = {};
    for (const [key, def] of Object.entries(DEFAULT_STOREFRONT_SECTIONS)) {
      base[key] = {
        id: `sec_${key}`,
        pageKey: "all",
        sectionKey: key,
        sectionName: def.sectionName,
        isEnabled: def.isEnabled,
        sortOrder: 1,
        content: def.content,
      };
    }
    if (initialSections && typeof initialSections === "object") {
      return { ...base, ...initialSections };
    }
    return base;
  });

  useEffect(() => {
    const refreshSections = () => {
      const endpoint = apiUrl("/api/content/sections");
      fetch(endpoint, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.sections && typeof data.sections === "object") {
            setSections((prev) => ({ ...prev, ...data.sections }));
          }
        })
        .catch(() => {});
    };

    // 1. Initial background fetch to guarantee 100% database freshness
    refreshSections();

    // 2. Immediate reactive update when admin saves in CMS
    const handleCmsEvent = (e: any) => {
      if (e?.detail?.sectionKey && e?.detail?.content) {
        setSections((prev) => ({
          ...prev,
          [e.detail.sectionKey]: {
            ...prev[e.detail.sectionKey],
            isEnabled: e.detail.isEnabled ?? prev[e.detail.sectionKey]?.isEnabled ?? true,
            content: e.detail.content,
          },
        }));
      }
      refreshSections();
    };

    window.addEventListener("san_cms_updated", handleCmsEvent);
    window.addEventListener("storage", (e) => {
      if (e.key === "san_cms_last_update") refreshSections();
    });

    return () => {
      window.removeEventListener("san_cms_updated", handleCmsEvent);
    };
  }, []);

  const getSection = <T extends Record<string, any>>(sectionKey: string, fallback: T): { isEnabled: boolean; content: T } => {
    const found = sections[sectionKey];
    if (!found) {
      const def = DEFAULT_STOREFRONT_SECTIONS[sectionKey];
      return {
        isEnabled: def ? def.isEnabled : true,
        content: (def?.content || fallback) as T,
      };
    }
    return {
      isEnabled: found.isEnabled,
      content: { ...fallback, ...(found.content || {}) },
    };
  };

  return React.createElement(
    CmsContext.Provider,
    { value: { sections, getSection } },
    children
  );
}

export type CmsPageKey =
  | "home"
  | "header"
  | "footer"
  | "catalog"
  | "product_detail"
  | "cart"
  | "checkout"
  | "about"
  | "delivery_returns"
  | "contact_faq"
  | "account"
  | "all"
  | (string & {});

/**
 * Hook to retrieve live, editable CMS sections for any page with 0ms cached defaults
 */
export function usePageSections(
  pageKey: CmsPageKey,
  initialSections?: Record<string, SiteSection> | null
) {
  const context = useContext(CmsContext);

  const [localSections, setLocalSections] = useState<Record<string, SiteSection>>(() => {
    if (context?.sections) {
      return context.sections;
    }
    const initialMap: Record<string, SiteSection> = {};
    for (const [key, def] of Object.entries(DEFAULT_STOREFRONT_SECTIONS)) {
      initialMap[key] = {
        id: `sec_${key}`,
        pageKey,
        sectionKey: key,
        sectionName: def.sectionName,
        isEnabled: def.isEnabled,
        sortOrder: 1,
        content: def.content,
      };
    }
    if (initialSections && typeof initialSections === "object") {
      return { ...initialMap, ...initialSections };
    }
    return initialMap;
  });

  useEffect(() => {
    if (context) return; // If provider exists, it manages syncing centrally
    const endpoint = apiUrl(pageKey === "all" ? "/api/content/sections" : `/api/content/sections?page=${pageKey}`);
    
    const cached = getCachedData<{ sections: Record<string, SiteSection> }>(endpoint);
    if (cached?.sections) {
      setLocalSections((prev) => ({ ...prev, ...cached.sections }));
    }

    fetchWithSwr(endpoint, (data: any) => {
      if (data?.sections && typeof data.sections === "object") {
        setLocalSections((prev) => ({ ...prev, ...data.sections }));
      }
    }).catch(() => {});
  }, [pageKey, context]);

  if (context) {
    return context;
  }

  const getSection = <T extends Record<string, any>>(sectionKey: string, fallback: T): { isEnabled: boolean; content: T } => {
    const found = localSections[sectionKey];
    if (!found) {
      const def = DEFAULT_STOREFRONT_SECTIONS[sectionKey];
      return {
        isEnabled: def ? def.isEnabled : true,
        content: (def?.content || fallback) as T,
      };
    }
    return {
      isEnabled: found.isEnabled,
      content: { ...fallback, ...(found.content || {}) },
    };
  };

  return { sections: localSections, getSection };
}
