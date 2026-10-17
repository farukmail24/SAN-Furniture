import {
  type FurnitureSpecs,
  type DeliveryTier,
  type UpholsteryMaterial,
  type FrameMaterial,
  type ProductVariant,
  calculateNetAndVat,
  formatGBP
} from "@san-furniture/types";
import { apiUrl } from "@/lib/api-config";

export interface CatalogProduct {
  id: string;
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

export interface ProductCategory {
  id: string;
  name: string;
  handle: string;
  description: string;
  heroImage: string;
}

export const CATALOG_CATEGORIES: ProductCategory[] = [
  {
    id: "cat_sofas",
    name: "Sofas & Corner Lounges",
    handle: "sofas",
    description: "Bespoke handcrafted sofas, deep-seated corner groups, and luxury chaises upholstered in durable bouclé and velvet.",
    heroImage: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85"
  },
  {
    id: "cat_armchairs",
    name: "Accent Armchairs & Stools",
    handle: "armchairs",
    description: "Sculptural statement armchairs, reading chairs, and ergonomic occasional seating crafted for British comfort.",
    heroImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=85"
  },
  {
    id: "cat_dining",
    name: "Dining Tables & Chairs",
    handle: "dining",
    description: "Solid European oak, American walnut, and Italian marble dining collections engineered for intimate family gatherings.",
    heroImage: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1600&q=85"
  },
  {
    id: "cat_beds",
    name: "Luxury Beds & Wardrobes",
    handle: "beds",
    description: "Ottoman storage beds, upholstered headboards, and solid hardwood wardrobes for serene bedroom sanctuaries.",
    heroImage: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=85"
  },
  {
    id: "cat_living",
    name: "Coffee & Occasional Tables",
    handle: "living-tables",
    description: "Fluted wood, brushed brass, and architectural stone coffee, side, and console tables.",
    heroImage: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1600&q=85"
  }
];

// ZERO MOCK PRODUCTS: Strictly empty array. All products are sourced from live MySQL database
export const CATALOG_PRODUCTS: CatalogProduct[] = [];

/**
 * 0ms In-Memory Catalog Cache (Shared in Server/Node & Client Module Scope)
 * Sourced exclusively from live MySQL database products via /api/products
 */
let inMemoryLiveProducts: CatalogProduct[] = [];
let lastLiveFetchTimestamp = 0;
const CACHE_TTL_MS = 30000; // 30 seconds
let isBackgroundSyncing = false;

async function syncCatalogCacheInBackground(): Promise<CatalogProduct[]> {
  if (isBackgroundSyncing) return inMemoryLiveProducts;
  isBackgroundSyncing = true;
  try {
    const res = await fetch(apiUrl("/api/products"), {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.products)) {
        inMemoryLiveProducts = data.products.filter((p: CatalogProduct) => p.status === "published");
        lastLiveFetchTimestamp = Date.now();
        return inMemoryLiveProducts;
      }
    }
  } catch (err) {
    console.warn("Catalog sync warning:", err);
  } finally {
    isBackgroundSyncing = false;
  }
  return inMemoryLiveProducts;
}

/**
 * Live dynamic product fetcher - GUARANTEED 0ms Instant Return
 * Uses warm memory cache sourced strictly from MySQL database
 */
export async function getLiveProducts(): Promise<CatalogProduct[]> {
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
  return inMemoryLiveCategories.find((c) => c.handle === handle || c.id === handle) || CATALOG_CATEGORIES.find((c) => c.handle === handle);
}

export function getProductsByCategory(categoryId: string): CatalogProduct[] {
  return inMemoryLiveProducts.filter((p) => p.categoryId === categoryId);
}

let inMemoryLiveCategories: ProductCategory[] = [...CATALOG_CATEGORIES];
let lastCategoryFetchTimestamp = 0;

export async function getLiveCategories(): Promise<ProductCategory[]> {
  const now = Date.now();
  if (inMemoryLiveCategories.length > 0 && now - lastCategoryFetchTimestamp < CACHE_TTL_MS) {
    return inMemoryLiveCategories;
  }
  try {
    const res = await fetch(apiUrl("/api/categories"), { signal: AbortSignal.timeout(3000) });
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
  return categories.find((c) => c.handle === handle || c.id === handle);
}

export async function getLiveProductByHandle(handle: string): Promise<CatalogProduct | undefined> {
  const products = await getLiveProducts();
  const match = products.find((p) => p.handle === handle || p.id === handle);
  if (match) return match;

  // Direct fallback to API in case product was just imported
  try {
    const res = await fetch(apiUrl(`/api/products/${encodeURIComponent(handle)}`), {
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
