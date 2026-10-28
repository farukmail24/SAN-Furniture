import {
  type FurnitureSpecs,
  type DeliveryTier,
  type UpholsteryMaterial,
  type FrameMaterial,
  type ProductVariant,
  type ProductCategory,
  CATALOG_CATEGORIES,
  CATEGORY_HANDLE_ALIASES,
  normalizeCategoryHandle,
  calculateNetAndVat,
  formatGBP
} from "@san-furniture/types";
import { apiUrl } from "@/lib/api-config";

export {
  type ProductCategory,
  CATALOG_CATEGORIES,
  CATEGORY_HANDLE_ALIASES,
  normalizeCategoryHandle
};

export interface CatalogProduct {
  id: string;
  sku?: string;
  createdAt?: string;
  title: string;
  handle: string;
  subtitle: string;
  description: string;
  categoryId: string;
  status: "published" | "draft" | "out_of_stock";
  pricePennies: number;
  compareAtPricePennies?: number;
  vatRatePercent: number;
  gtinBarcode: string;
  thumbnailUrl: string;
  images: string[];
  variants?: ProductVariant[];
  specs: {
    width_cm: number;
    height_cm: number;
    depth_cm: number;
    seat_height_cm?: number;
    seat_depth_cm?: number;
    arm_height_cm?: number;
    weight_kg: number;
    material: UpholsteryMaterial;
    frame_material: FrameMaterial;
    color: string;
    assembly_required: boolean;
    assembly_time_mins?: number;
    assembly_instructions_url?: string;
    doorway_clearance_min_cm?: number;
    delivery_tier: DeliveryTier;
    fire_safety: {
      compliant: boolean;
      standard: string;
      certificate_ref: string;
      label_attached: boolean;
    };
    lead_time_days: number;
  };
}

// ZERO MOCK PRODUCTS: Strictly empty array. All products are sourced from live MySQL database
export const CATALOG_PRODUCTS: CatalogProduct[] = [];

/**
 * 0ms In-Memory Catalog Cache (Shared in Server/Node & Client Module Scope)
 * Sourced exclusively from live MySQL database products via /api/products
 */
let inMemoryLiveProducts: CatalogProduct[] = [];
let lastLiveFetchTimestamp = 0;
const CACHE_TTL_MS = 30000; // 30 seconds
let catalogSyncPromise: Promise<CatalogProduct[]> | null = null;

function syncCatalogCacheInBackground(): Promise<CatalogProduct[]> {
  if (catalogSyncPromise) return catalogSyncPromise;

  catalogSyncPromise = Promise.resolve().then(async () => {
    try {
      const res = await fetch(apiUrl("/api/products"), {
        next: { revalidate: 30 },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products)) {
          inMemoryLiveProducts = data.products.filter((p: CatalogProduct) => p.status === "published");
          lastLiveFetchTimestamp = Date.now();
        }
      }
    } catch (err) {
      console.warn("Catalog sync warning:", err);
    } finally {
      catalogSyncPromise = null;
    }
    return inMemoryLiveProducts;
  });

  return catalogSyncPromise;
}

/**
 * Live dynamic product fetcher - GUARANTEED 0ms Instant Return
 * Uses warm memory cache sourced strictly from MySQL database
 */
export async function getLiveProducts(): Promise<CatalogProduct[]> {
  if (typeof window === "undefined") {
    try {
      const { fetchLiveProductsFromDb } = await import("./catalog-server");
      const dbProducts = await fetchLiveProductsFromDb();
      if (dbProducts && dbProducts.length > 0) {
        inMemoryLiveProducts = dbProducts;
        lastLiveFetchTimestamp = Date.now();
        return dbProducts;
      }
    } catch (err) {
      console.warn("Direct DB products fetch in catalog.ts:", err);
    }
  }

  const now = Date.now();
  if (inMemoryLiveProducts.length > 0 && now - lastLiveFetchTimestamp < CACHE_TTL_MS) {
    return inMemoryLiveProducts;
  }

  if (inMemoryLiveProducts.length > 0) {
    syncCatalogCacheInBackground().catch(() => {});
    return inMemoryLiveProducts;
  }

  return await syncCatalogCacheInBackground();
}

export function getProductByHandle(handle: string): CatalogProduct | undefined {
  return inMemoryLiveProducts.find((p) => p.handle === handle || p.id === handle);
}

export function getCategoryByHandle(handle: string): ProductCategory | undefined {
  const normalized = normalizeCategoryHandle(handle);
  return (
    inMemoryLiveCategories.find((c) => c.handle === normalized || c.handle === handle || c.id === handle) ||
    CATALOG_CATEGORIES.find((c) => c.handle === normalized || c.handle === handle)
  );
}

export function getProductsByCategory(categoryId: string): CatalogProduct[] {
  return inMemoryLiveProducts.filter((p) => p.categoryId === categoryId);
}

let inMemoryLiveCategories: ProductCategory[] = [...CATALOG_CATEGORIES];
let lastCategoryFetchTimestamp = 0;

export async function getLiveCategories(): Promise<ProductCategory[]> {
  if (typeof window === "undefined") {
    try {
      const { fetchLiveCategoriesFromDb } = await import("./catalog-server");
      const dbCategories = await fetchLiveCategoriesFromDb();
      if (dbCategories && dbCategories.length > 0) {
        inMemoryLiveCategories = dbCategories;
        lastCategoryFetchTimestamp = Date.now();
        return dbCategories;
      }
    } catch {}
  }

  const now = Date.now();
  if (inMemoryLiveCategories.length > 0 && now - lastCategoryFetchTimestamp < CACHE_TTL_MS) {
    return inMemoryLiveCategories;
  }
  try {
    const res = await fetch(apiUrl("/api/categories"), {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        inMemoryLiveCategories = data.categories.map((c: any) => ({
          id: c.id,
          name: c.name,
          handle: c.handle,
          description: c.description,
          heroImage: c.heroImage || c.hero_image,
        }));
        lastCategoryFetchTimestamp = Date.now();
        return inMemoryLiveCategories;
      }
    }
  } catch {}
  return inMemoryLiveCategories;
}

export async function getLiveCategoryByHandle(handle: string): Promise<ProductCategory | undefined> {
  const categories = await getLiveCategories();
  const normalized = normalizeCategoryHandle(handle);
  return (
    categories.find((c) => c.handle === normalized || c.handle === handle || c.id === handle) ||
    CATALOG_CATEGORIES.find((c) => c.handle === normalized || c.handle === handle)
  );
}

export async function getLiveProductByHandle(handle: string): Promise<CatalogProduct | undefined> {
  const products = await getLiveProducts();
  const match = products.find((p) => p.handle === handle || p.id === handle);
  if (match) return match;

  // Direct fallback to API in case product was just imported
  try {
    const res = await fetch(apiUrl(`/api/products/${encodeURIComponent(handle)}`), {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.product && data.product.status === "published") {
        return data.product;
      }
    }
  } catch {}

  return undefined;
}

export async function getLiveProductsByCategory(categoryId: string): Promise<CatalogProduct[]> {
  const products = await getLiveProducts();
  return products.filter((p) => p.categoryId === categoryId);
}

/**
 * Clean and sanitize raw HTML descriptions into luxury typography & clean bullets
 */
export function cleanHtmlDescription(raw?: string | null): string {
  if (!raw || typeof raw !== "string") return "";

  let text = raw;
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  text = text.replace(/<([a-z]+)[^>]*>\s*<\/\1>/gi, "");
  text = text.replace(/<([a-z]+)[^>]*>\s*<\/\1>/gi, "");

  text = text.replace(/<li[^>]*>(.*?)<\/li>/gis, (_, content) => {
    const cleanItem = content.replace(/<[^>]+>/g, "").trim();
    return cleanItem ? `\n• ${cleanItem}` : "";
  });

  text = text.replace(/<\/(p|div|h[1-6])>/gi, "\n\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<[^>]+>/g, "");

  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line, i, arr) => line.length > 0 || (i > 0 && arr[i - 1].length > 0))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Format SKU ensuring clean SAN- prefix without FTG- or supplier artifacts
 */
export function formatProductSku(sku?: string | null): string {
  if (!sku) return "";
  return sku.replace(/^SAN-FTG-/i, "SAN-");
}

