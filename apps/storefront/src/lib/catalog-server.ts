import { getDbPool } from "@/lib/db";
import { autoSeedDatabaseIfNeeded } from "@/lib/auto-seed";
import type { CatalogProduct, ProductCategory } from "./catalog";
import { CATALOG_CATEGORIES, cleanHtmlDescription, formatProductSku } from "./catalog";

let cachedProducts: CatalogProduct[] = [];
let lastProductsFetch = 0;
const CACHE_TTL = 30000; // 30 seconds

export async function fetchLiveProductsFromDb(forceRefresh = false): Promise<CatalogProduct[]> {
  const now = Date.now();
  if (!forceRefresh && cachedProducts.length > 0 && now - lastProductsFetch < CACHE_TTL) {
    return cachedProducts;
  }

  try {
    const pool = getDbPool();

    const fetchQuery = `
      SELECT 
        p.id, p.sku, p.title, p.handle, p.subtitle, p.description, p.category_id as categoryId,
        p.status, p.price_pennies as pricePennies, p.compare_at_price_pennies as compareAtPricePennies,
        p.vat_rate_percent as vatRatePercent, p.gtin_barcode as gtinBarcode,
        p.thumbnail_url as thumbnailUrl, p.images_json, p.variants_json, p.created_at as createdAt,
        s.width_cm, s.height_cm, s.depth_cm, s.seat_height_cm, s.seat_depth_cm,
        s.arm_height_cm, s.weight_kg, s.material, s.frame_material, s.color,
        s.assembly_required, s.assembly_time_mins, s.assembly_instructions_url, s.doorway_clearance_min_cm,
        s.delivery_tier, s.fire_safety_compliant, s.fire_safety_standard,
        s.fire_safety_cert, s.lead_time_days
      FROM products p
      LEFT JOIN furniture_specs s ON p.id = s.product_id
      WHERE p.status IN ('published', 'active')
      ORDER BY p.created_at DESC
    `;

    let [rows]: any = await pool.query(fetchQuery).catch(() => [[]]);

    if (!Array.isArray(rows) || rows.length === 0) {
      await autoSeedDatabaseIfNeeded();
      const [reFetched]: any = await pool.query(fetchQuery).catch(() => [[]]);
      rows = reFetched;
    }

    const rawProducts = Array.isArray(rows) ? rows : [];

    const products: CatalogProduct[] = rawProducts.map((p: any) => {
      let images: string[] = [];
      try {
        images = p.images_json
          ? typeof p.images_json === "string"
            ? JSON.parse(p.images_json)
            : p.images_json
          : [];
      } catch {
        images = [];
      }
      if (images.length === 0 && p.thumbnailUrl) {
        images = [p.thumbnailUrl];
      }

      let variants: any[] = [];
      try {
        variants = p.variants_json
          ? typeof p.variants_json === "string"
            ? JSON.parse(p.variants_json)
            : p.variants_json
          : [];
      } catch {
        variants = [];
      }

      return {
        id: p.id,
        sku: p.sku ? formatProductSku(p.sku) : undefined,
        createdAt: p.createdAt ? String(p.createdAt) : undefined,
        title: p.title,
        handle: p.handle,
        subtitle: p.subtitle || "",
        description: cleanHtmlDescription(p.description),
        categoryId: p.categoryId,
        status: (p.status === "active" ? "published" : p.status) || "published",
        pricePennies: Number(p.pricePennies) || 0,
        compareAtPricePennies: p.compareAtPricePennies ? Number(p.compareAtPricePennies) : undefined,
        vatRatePercent: Number(p.vatRatePercent) || 20,
        gtinBarcode: p.gtinBarcode || "",
        thumbnailUrl: p.thumbnailUrl || images[0] || "",
        images,
        variants,
        specs: {
          width_cm: Number(p.width_cm) || 0,
          height_cm: Number(p.height_cm) || 0,
          depth_cm: Number(p.depth_cm) || 0,
          seat_height_cm: p.seat_height_cm ? Number(p.seat_height_cm) : undefined,
          seat_depth_cm: p.seat_depth_cm ? Number(p.seat_depth_cm) : undefined,
          arm_height_cm: p.arm_height_cm ? Number(p.arm_height_cm) : undefined,
          weight_kg: Number(p.weight_kg) || 0,
          material: p.material || "Hardwood",
          frame_material: p.frame_material || "Solid Wood",
          color: p.color || "Natural",
          assembly_required: Boolean(p.assembly_required),
          assembly_time_mins: p.assembly_time_mins ? Number(p.assembly_time_mins) : undefined,
          assembly_instructions_url:
            p.assembly_instructions_url && !p.assembly_instructions_url.includes("dropbox.com")
              ? p.assembly_instructions_url
              : undefined,
          doorway_clearance_min_cm: p.doorway_clearance_min_cm ? Number(p.doorway_clearance_min_cm) : undefined,
          delivery_tier: p.delivery_tier || "two_man_white_glove",
          fire_safety: {
            compliant: Boolean(p.fire_safety_compliant),
            standard: p.fire_safety_standard || "UK Furniture & Furnishings Regulations 1988",
            certificate_ref: p.fire_safety_cert || "UK-COMPLIANT-VERIFIED",
            label_attached: true,
          },
          lead_time_days: Number(p.lead_time_days) || 5,
        },
      };
    });

    if (products.length > 0) {
      cachedProducts = products;
      lastProductsFetch = now;
    }

    return products;
  } catch (err) {
    console.warn("fetchLiveProductsFromDb failed:", err);
    return cachedProducts;
  }
}

export async function fetchLiveCategoriesFromDb(): Promise<ProductCategory[]> {
  try {
    const pool = getDbPool();
    const [rows]: any = await pool.query(
      "SELECT id, name, handle, description, hero_image as heroImage FROM categories ORDER BY id ASC"
    ).catch(() => [[]]);

    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        handle: r.handle,
        description: r.description || "",
        heroImage: r.heroImage || "",
      }));
    }
  } catch (err) {
    console.warn("fetchLiveCategoriesFromDb failed:", err);
  }
  return CATALOG_CATEGORIES;
}
