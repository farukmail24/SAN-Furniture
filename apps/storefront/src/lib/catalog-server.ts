import { getDbPool } from "@/lib/db";
import { autoSeedDatabaseIfNeeded } from "@/lib/auto-seed";
import type { CatalogProduct, ProductCategory } from "./catalog";
import { CATALOG_CATEGORIES, cleanHtmlDescription, formatProductSku } from "./catalog";

let cachedProducts: CatalogProduct[] = [];
let lastProductsFetch = 0;
const CACHE_TTL = 30000; // 30 seconds
let isCatalogSyncAttempted = false;

async function autoSyncMissingProducts(pool: any): Promise<void> {
  if (isCatalogSyncAttempted) return;
  isCatalogSyncAttempted = true;

  try {
    const seedData = (await import("./products-seed-data.json")).default;
    const { products, specs } = seedData;
    if (!Array.isArray(products) || products.length === 0) return;

    const [existingIds]: any = await pool.query("SELECT id FROM products").catch(() => [[]]);
    const existingSet = new Set(
      Array.isArray(existingIds) ? existingIds.map((r: any) => r.id) : []
    );

    const missingProducts = products.filter((p: any) => !existingSet.has(p.id));
    if (missingProducts.length > 0) {
      console.log(`[catalog-server] Auto-syncing ${missingProducts.length} missing products to MySQL...`);
      const productCols = [
        "id", "handle", "sku", "title", "subtitle", "description", "category_id", "status",
        "price_pennies", "compare_at_price_pennies", "vat_rate_percent",
        "gtin_barcode", "thumbnail_url", "images_json", "variants_json", "created_at", "updated_at"
      ];

      for (const p of missingProducts) {
        await pool.query(
          `INSERT IGNORE INTO products (${productCols.map((c) => `\`${c}\``).join(", ")}) VALUES (${productCols.map(() => "?").join(", ")})`,
          productCols.map((c) => (p as any)[c] ?? null)
        ).catch((err: any) => console.warn(`Failed to insert product ${p.id}:`, err));

        if ((p as any).cost_price_pennies) {
          const supplierCols = [
            "id", "supplier_id", "supplier_sku", "product_id", "source_url",
            "cost_price_pennies", "shipping_cost_pennies", "markup_percentage",
            "retail_price_pennies", "stock_level", "lead_time_days", "last_synced_at"
          ];
          await pool.query(
            `INSERT IGNORE INTO supplier_feed_items (${supplierCols.map((c) => `\`${c}\``).join(", ")}) VALUES (${supplierCols.map(() => "?").join(", ")})`,
            [
              `sup_${p.id}`,
              p.id.includes("am_") ? "amos_mann" : "furniture_to_go",
              p.sku || p.id,
              p.id,
              p.thumbnail_url || null,
              Number((p as any).cost_price_pennies) || 0,
              4900,
              40,
              Number(p.price_pennies) || 0,
              25,
              5,
              new Date()
            ]
          ).catch(() => {});
        }
      }
    }

    if (Array.isArray(specs) && specs.length > 0) {
      const [existingSpecIds]: any = await pool.query("SELECT id FROM furniture_specs").catch(() => [[]]);
      const existingSpecSet = new Set(
        Array.isArray(existingSpecIds) ? existingSpecIds.map((r: any) => r.id) : []
      );
      const missingSpecs = specs.filter((s: any) => !existingSpecSet.has(s.id));
      if (missingSpecs.length > 0) {
        const specCols = [
          "id", "product_id", "width_cm", "height_cm", "depth_cm", "seat_height_cm",
          "seat_depth_cm", "arm_height_cm", "weight_kg", "material", "frame_material",
          "color", "assembly_required", "assembly_time_mins", "assembly_instructions_url",
          "doorway_clearance_min_cm", "delivery_tier", "fire_safety_compliant",
          "fire_safety_standard", "fire_safety_cert", "lead_time_days", "created_at"
        ];

        for (const s of missingSpecs) {
          await pool.query(
            `INSERT IGNORE INTO furniture_specs (${specCols.map((c) => `\`${c}\``).join(", ")}) VALUES (${specCols.map(() => "?").join(", ")})`,
            specCols.map((c) => (s as any)[c] ?? null)
          ).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn("[autoSyncMissingProducts] Warning:", err);
  }
}

export function formatRawDbProduct(p: any, specsOverride?: any): CatalogProduct {
  let images: string[] = [];
  try {
    images = p.images_json
      ? typeof p.images_json === "string"
        ? JSON.parse(p.images_json)
        : p.images_json
      : Array.isArray(p.images)
      ? p.images
      : [];
  } catch {
    images = [];
  }
  const thumb = p.thumbnailUrl || p.thumbnail_url || (images.length > 0 ? images[0] : "");
  if (images.length === 0 && thumb) {
    images = [thumb];
  }

  let variants: any[] = [];
  try {
    variants = p.variants_json
      ? typeof p.variants_json === "string"
        ? JSON.parse(p.variants_json)
        : p.variants_json
      : Array.isArray(p.variants)
      ? p.variants
      : [];
  } catch {
    variants = [];
  }

  const s = specsOverride || p;

  return {
    id: p.id,
    sku: p.sku ? formatProductSku(p.sku) : undefined,
    createdAt: p.createdAt ? String(p.createdAt) : p.created_at ? String(p.created_at) : undefined,
    title: p.title,
    handle: p.handle,
    subtitle: p.subtitle || "",
    description: cleanHtmlDescription(p.description),
    categoryId: p.categoryId || p.category_id,
    status: (p.status === "active" ? "published" : p.status) || "published",
    pricePennies: Number(p.pricePennies ?? p.price_pennies) || 0,
    compareAtPricePennies: (p.compareAtPricePennies ?? p.compare_at_price_pennies)
      ? Number(p.compareAtPricePennies ?? p.compare_at_price_pennies)
      : undefined,
    vatRatePercent: Number(p.vatRatePercent ?? p.vat_rate_percent) || 20,
    gtinBarcode: p.gtinBarcode || p.gtin_barcode || "",
    thumbnailUrl: thumb,
    images,
    variants,
    specs: {
      width_cm: Number(s.width_cm) || 0,
      height_cm: Number(s.height_cm) || 0,
      depth_cm: Number(s.depth_cm) || 0,
      seat_height_cm: s.seat_height_cm ? Number(s.seat_height_cm) : undefined,
      seat_depth_cm: s.seat_depth_cm ? Number(s.seat_depth_cm) : undefined,
      arm_height_cm: s.arm_height_cm ? Number(s.arm_height_cm) : undefined,
      weight_kg: Number(s.weight_kg) || 0,
      material: s.material || "Hardwood",
      frame_material: s.frame_material || "Solid Wood",
      color: s.color || "Natural",
      assembly_required: Boolean(Number(s.assembly_required)),
      assembly_time_mins: s.assembly_time_mins ? Number(s.assembly_time_mins) : undefined,
      assembly_instructions_url:
        s.assembly_instructions_url && !s.assembly_instructions_url.includes("dropbox.com")
          ? s.assembly_instructions_url
          : undefined,
      doorway_clearance_min_cm: s.doorway_clearance_min_cm ? Number(s.doorway_clearance_min_cm) : undefined,
      delivery_tier: s.delivery_tier || "two_man_white_glove",
      fire_safety: {
        compliant: Boolean(Number(s.fire_safety_compliant)),
        standard: s.fire_safety_standard || "UK Furniture & Furnishings Regulations 1988",
        certificate_ref: s.fire_safety_cert || "UK-COMPLIANT-VERIFIED",
        label_attached: true,
      },
      lead_time_days: Number(s.lead_time_days) || 5,
    },
  };
}

export async function syncSingleProductToDb(p: any, s?: any): Promise<void> {
  try {
    const pool = getDbPool();
    const productCols = [
      "id", "handle", "sku", "title", "subtitle", "description", "category_id", "status",
      "price_pennies", "compare_at_price_pennies", "vat_rate_percent",
      "gtin_barcode", "thumbnail_url", "images_json", "variants_json", "created_at", "updated_at"
    ];
    await pool.query(
      `INSERT IGNORE INTO products (${productCols.map((c) => `\`${c}\``).join(", ")}) VALUES (${productCols.map(() => "?").join(", ")})`,
      productCols.map((c) => (p as any)[c] ?? null)
    ).catch(() => {});

    if (s) {
      const specCols = [
        "id", "product_id", "width_cm", "height_cm", "depth_cm", "seat_height_cm",
        "seat_depth_cm", "arm_height_cm", "weight_kg", "material", "frame_material",
        "color", "assembly_required", "assembly_time_mins", "assembly_instructions_url",
        "doorway_clearance_min_cm", "delivery_tier", "fire_safety_compliant",
        "fire_safety_standard", "fire_safety_cert", "lead_time_days", "created_at"
      ];
      await pool.query(
        `INSERT IGNORE INTO furniture_specs (${specCols.map((c) => `\`${c}\``).join(", ")}) VALUES (${specCols.map(() => "?").join(", ")})`,
        specCols.map((c) => (s as any)[c] ?? null)
      ).catch(() => {});
    }

    if (p.cost_price_pennies) {
      const supplierCols = [
        "id", "supplier_id", "supplier_sku", "product_id", "source_url",
        "cost_price_pennies", "shipping_cost_pennies", "markup_percentage",
        "retail_price_pennies", "stock_level", "lead_time_days", "last_synced_at"
      ];
      await pool.query(
        `INSERT IGNORE INTO supplier_feed_items (${supplierCols.map((c) => `\`${c}\``).join(", ")}) VALUES (${supplierCols.map(() => "?").join(", ")})`,
        [
          `sup_${p.id}`,
          p.id.includes("am_") ? "amos_mann" : "furniture_to_go",
          p.sku || p.id,
          p.id,
          p.thumbnail_url || null,
          Number(p.cost_price_pennies) || 0,
          4900,
          40,
          Number(p.price_pennies) || 0,
          25,
          5,
          new Date()
        ]
      ).catch(() => {});
    }
  } catch {}
}

export async function fetchLiveProductsFromDb(forceRefresh = false): Promise<CatalogProduct[]> {
  const now = Date.now();
  if (forceRefresh) {
    isCatalogSyncAttempted = false;
  }
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

    if (!isCatalogSyncAttempted || !Array.isArray(rows) || rows.length === 0) {
      if (!Array.isArray(rows) || rows.length === 0) {
        await autoSeedDatabaseIfNeeded();
      }
      await autoSyncMissingProducts(pool);
      const [reFetched]: any = await pool.query(fetchQuery).catch(() => [[]]);
      if (Array.isArray(reFetched) && reFetched.length > 0) {
        rows = reFetched;
      }
    }

    const rawProducts = Array.isArray(rows) ? rows : [];
    const products: CatalogProduct[] = rawProducts.map((p: any) => formatRawDbProduct(p));

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
