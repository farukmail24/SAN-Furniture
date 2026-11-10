import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { autoSeedDatabaseIfNeeded } from "@/lib/auto-seed";
import { getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();

    // Auto-heal FTG Sofa prices in MySQL to eliminate dropship financial losses
    try {
      await pool.query(
        `UPDATE products SET price_pennies = 107021, compare_at_price_pennies = 133750, updated_at = NOW() 
         WHERE (handle LIKE '%omaha-set-of-2-x-3-seater-sofas%' OR sku LIKE '%90A1120733%' OR title LIKE '%Omaha Set of 2 x 3 Seater Sofas%') 
           AND price_pennies < 60000`
      );
      await pool.query(
        `UPDATE products SET price_pennies = 107021, compare_at_price_pennies = 133750, updated_at = NOW() 
         WHERE (sku LIKE '%90A1121033%' OR title LIKE '%Westham Set of 2 x 3 Seater Sofas%') 
           AND price_pennies < 60000`
      );
      await pool.query(
        `UPDATE products SET price_pennies = 87360, compare_at_price_pennies = 109200, updated_at = NOW() 
         WHERE (sku LIKE '%90AH000024968%' OR sku LIKE '%90AH000024966%' OR title LIKE '%Corner Sofa%') 
           AND price_pennies < 50000`
      );
      await pool.query(
        `UPDATE products SET price_pennies = 53511, compare_at_price_pennies = 66875, updated_at = NOW() 
         WHERE (sku IN ('SAN-90A0000112073', 'SAN-90A0000112062', 'SAN-90A0000112103') OR (title LIKE '%3 Seater Sofa%' AND title NOT LIKE '%Set of 2%')) 
           AND price_pennies < 30000`
      );
      await pool.query(
        `UPDATE supplier_feed_items SET cost_price_pennies = 63703, retail_price_pennies = 107021, last_synced_at = NOW() 
         WHERE (supplier_sku LIKE '%90A1120733%' OR supplier_sku LIKE '%90A1121033%' OR product_id LIKE '%omaha%' OR product_id LIKE '%westham%') 
           AND cost_price_pennies < 50000`
      );
      await pool.query(
        `UPDATE supplier_feed_items SET cost_price_pennies = 52000, retail_price_pennies = 87360, last_synced_at = NOW() 
         WHERE (supplier_sku LIKE '%90AH00002496%' OR product_id LIKE '%corner%') 
           AND cost_price_pennies < 40000`
      );
      await pool.query(
        `UPDATE supplier_feed_items SET cost_price_pennies = 31852, retail_price_pennies = 53511, last_synced_at = NOW() 
         WHERE supplier_sku IN ('90A0000112073', '90A0000112062', '90A0000112103') 
           AND cost_price_pennies < 20000`
      );
    } catch {}

    const fetchQuery = `
      SELECT p.*, s.width_cm, s.height_cm, s.depth_cm, s.seat_height_cm, s.weight_kg,
             s.material, s.color, s.assembly_required, s.assembly_instructions_url, s.fire_safety_compliant, s.delivery_tier,
             sup.supplier_id,
             sup.supplier_sku,
             sup.source_url as supplier_source_url,
             COALESCE(sup.cost_price_pennies, 0) as cost_price_pennies,
             COALESCE(sup.markup_percentage, 40) as markup_percentage,
             COALESCE(sup.stock_level, 25) as stock_level,
             COALESCE(sup.shipping_cost_pennies, 4900) as shipping_cost_pennies,
             COALESCE(sup.lead_time_days, 5) as lead_time_days
      FROM products p
      LEFT JOIN furniture_specs s ON p.id = s.product_id
      LEFT JOIN (
        SELECT product_id,
               MAX(supplier_id) as supplier_id,
               MAX(supplier_sku) as supplier_sku,
               MAX(source_url) as source_url,
               COALESCE(MAX(cost_price_pennies), 0) as cost_price_pennies,
               COALESCE(MAX(markup_percentage), 40) as markup_percentage,
               COALESCE(MAX(stock_level), 25) as stock_level,
               COALESCE(MAX(shipping_cost_pennies), 4900) as shipping_cost_pennies,
               COALESCE(MAX(lead_time_days), 5) as lead_time_days
        FROM supplier_feed_items
        GROUP BY product_id
      ) sup ON p.id = sup.product_id
      ORDER BY p.created_at DESC
    `;

    let [rows]: any = await pool.query(fetchQuery).catch(() => [[]]);

    if (!Array.isArray(rows) || rows.length === 0) {
      const seeded = await autoSeedDatabaseIfNeeded();
      if (seeded) {
        const [reFetched]: any = await pool.query(fetchQuery).catch(() => [[]]);
        rows = reFetched;
      }
    }

    return NextResponse.json({
      success: true,
      products: Array.isArray(rows) ? rows : [],
      total: Array.isArray(rows) ? rows.length : 0,
    });
  } catch (err: any) {
    console.error("Failed to fetch admin products:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();

    // Auto-heal FTG Sofa prices in MySQL to eliminate dropship financial losses
    try {
      await pool.query(
        `UPDATE products SET price_pennies = 107021, compare_at_price_pennies = 133750, updated_at = NOW() 
         WHERE (handle LIKE '%omaha-set-of-2-x-3-seater-sofas%' OR sku LIKE '%90A1120733%' OR title LIKE '%Omaha Set of 2 x 3 Seater Sofas%') 
           AND price_pennies < 60000`
      );
      await pool.query(
        `UPDATE products SET price_pennies = 107021, compare_at_price_pennies = 133750, updated_at = NOW() 
         WHERE (sku LIKE '%90A1121033%' OR title LIKE '%Westham Set of 2 x 3 Seater Sofas%') 
           AND price_pennies < 60000`
      );
      await pool.query(
        `UPDATE products SET price_pennies = 87360, compare_at_price_pennies = 109200, updated_at = NOW() 
         WHERE (sku LIKE '%90AH000024968%' OR sku LIKE '%90AH000024966%' OR title LIKE '%Corner Sofa%') 
           AND price_pennies < 50000`
      );
      await pool.query(
        `UPDATE products SET price_pennies = 53511, compare_at_price_pennies = 66875, updated_at = NOW() 
         WHERE (sku IN ('SAN-90A0000112073', 'SAN-90A0000112062', 'SAN-90A0000112103') OR (title LIKE '%3 Seater Sofa%' AND title NOT LIKE '%Set of 2%')) 
           AND price_pennies < 30000`
      );
      await pool.query(
        `UPDATE supplier_feed_items SET cost_price_pennies = 63703, retail_price_pennies = 107021, last_synced_at = NOW() 
         WHERE (supplier_sku LIKE '%90A1120733%' OR supplier_sku LIKE '%90A1121033%' OR product_id LIKE '%omaha%' OR product_id LIKE '%westham%') 
           AND cost_price_pennies < 50000`
      );
      await pool.query(
        `UPDATE supplier_feed_items SET cost_price_pennies = 52000, retail_price_pennies = 87360, last_synced_at = NOW() 
         WHERE (supplier_sku LIKE '%90AH00002496%' OR product_id LIKE '%corner%') 
           AND cost_price_pennies < 40000`
      );
      await pool.query(
        `UPDATE supplier_feed_items SET cost_price_pennies = 31852, retail_price_pennies = 53511, last_synced_at = NOW() 
         WHERE supplier_sku IN ('90A0000112073', '90A0000112062', '90A0000112103') 
           AND cost_price_pennies < 20000`
      );
    } catch {}
    const body = await request.json();
    const {
      title,
      handle,
      sku,
      subtitle,
      description,
      categoryId,
      pricePennies,
      compareAtPricePennies,
      thumbnailUrl,
      images,
      status = "published",
      // Furniture specs
      widthCm = 0,
      heightCm = 0,
      depthCm = 0,
      seatHeightCm,
      weightKg = 0,
      material = "Solid Wood",
      color = "Natural",
      assemblyRequired = 0,
      fireSafetyCompliant = 1,
      deliveryTier = "two_man_white_glove",
      costPricePennies = 0,
      markupPercentage = 40,
      stockLevel = 25,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Product title is required" }, { status: 400 });
    }

    const prodHandle =
      handle ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    const prodId = `prod_${prodHandle.replace(/-/g, "_")}_${Date.now()}`;
    const imagesJson = JSON.stringify(images || (thumbnailUrl ? [thumbnailUrl] : []));
    const prodSku = sku ? String(sku).trim() : null;

    // 1. Insert product
    await pool.query(
      `INSERT INTO products (
        id, title, handle, sku, subtitle, description, category_id, status,
        price_pennies, compare_at_price_pennies, vat_rate_percent, thumbnail_url,
        images_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 20.00, ?, ?, NOW(), NOW())`,
      [
        prodId,
        title,
        prodHandle,
        prodSku,
        subtitle || null,
        description || null,
        categoryId || "cat_sofas",
        status,
        Number(pricePennies) || 0,
        compareAtPricePennies ? Number(compareAtPricePennies) : null,
        thumbnailUrl || "",
        imagesJson,
      ]
    );

    // 2. Insert furniture specs
    const specId = `spec_${prodId}`;
    await pool.query(
      `INSERT INTO furniture_specs (
        id, product_id, width_cm, height_cm, depth_cm, seat_height_cm,
        weight_kg, material, color, assembly_required, fire_safety_compliant,
        delivery_tier, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        specId,
        prodId,
        Number(widthCm) || 0,
        Number(heightCm) || 0,
        Number(depthCm) || 0,
        seatHeightCm ? Number(seatHeightCm) : null,
        Number(weightKg) || 0,
        material,
        color,
        assemblyRequired ? 1 : 0,
        fireSafetyCompliant ? 1 : 0,
        deliveryTier,
      ]
    );

    // 3. Insert supplier feed item record
    const feedId = `feed_${prodId}`;
    await pool.query(
      `INSERT INTO supplier_feed_items (
        id, supplier_id, supplier_sku, product_id, cost_price_pennies,
        markup_percentage, stock_level, last_synced_at
      ) VALUES (?, 'sup_amos_mann', ?, ?, ?, ?, ?, NOW())`,
      [
        feedId,
        `SKU-${prodHandle.toUpperCase()}`,
        prodId,
        Number(costPricePennies) || Math.round((Number(pricePennies) || 0) * 0.6),
        Number(markupPercentage) || 40,
        Number(stockLevel) || 25,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      productId: prodId,
      handle: prodHandle,
    });
  } catch (err: any) {
    console.error("Failed to create product:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create product", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
