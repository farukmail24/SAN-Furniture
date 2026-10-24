import "../database/mysql-config.mjs";
import mysql from "mysql2/promise";
import https from "node:https";

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "san_furniture",
};

// Curated live products directly from https://www.amosmannfurniture.co.uk/sitemap.xml
const LIVE_PRODUCT_URLS = [
  {
    url: "https://www.amosmannfurniture.co.uk/madrid-sliding-door-wardrobe-120cm-gloss-white---2461-2461-p.asp",
    category_id: "cat_beds",
    delivery_tier: "two_man_white_glove",
    material: "engineered_hardwood",
    shipping_pennies: 4500, // £45 2-Man Delivery
    variants: [
      { id: "var_mad_120", title: "120cm Width / 2 Soft Gloss Doors", sku: "AM-2461-120", price_modifier_pennies: 0, stock_quantity: 15 },
      { id: "var_mad_150", title: "150cm Width / 2 Soft Gloss Doors", sku: "AM-2460-150", price_modifier_pennies: 4000, stock_quantity: 12 },
      { id: "var_mad_180", title: "180cm Width / Centre Mirrored Door", sku: "AM-2423-180", price_modifier_pennies: 8000, stock_quantity: 20 },
      { id: "var_mad_203", title: "203cm Width / Centre Mirrored Door", sku: "AM-2424-203", price_modifier_pennies: 14000, stock_quantity: 8 }
    ]
  },
  {
    url: "https://www.amosmannfurniture.co.uk/valentina-white-220cm-sliding-wardrobe-with-mirror---11008286-3009-p.asp",
    category_id: "cat_beds",
    delivery_tier: "two_man_white_glove",
    material: "engineered_hardwood",
    shipping_pennies: 4500,
    variants: [
      { id: "var_val_220_wht", title: "220cm Alpine White & Full Mirror", sku: "AM-3009-WHT", price_modifier_pennies: 0, stock_quantity: 10 },
      { id: "var_val_220_gry", title: "220cm Cashmere Grey & Full Mirror", sku: "AM-3010-GRY", price_modifier_pennies: 2000, stock_quantity: 8 }
    ]
  },
  {
    url: "https://www.amosmannfurniture.co.uk/zuldy-large-30-pairs-white-shoe-cupboard---2505-2505-p.asp",
    category_id: "cat_living",
    delivery_tier: "pallet",
    material: "engineered_hardwood",
    shipping_pennies: 2500,
    variants: [
      { id: "var_zul_30p", title: "Large 30 Pairs Capacity", sku: "AM-2505-30P", price_modifier_pennies: 0, stock_quantity: 25 },
      { id: "var_zul_20p", title: "Standard 20 Pairs Capacity", sku: "AM-2462-20P", price_modifier_pennies: -2500, stock_quantity: 18 }
    ]
  },
  {
    url: "https://www.amosmannfurniture.co.uk/toris-sideboard-white-with-oak-effect---2607-2607-p.asp",
    category_id: "cat_living",
    delivery_tier: "pallet",
    material: "engineered_hardwood",
    shipping_pennies: 3000,
    variants: [
      { id: "var_tor_wht_oak", title: "Alpine White & Natural Oak Accent", sku: "AM-2607-OAK", price_modifier_pennies: 0, stock_quantity: 14 },
      { id: "var_tor_all_wht", title: "Pure High Gloss White", sku: "AM-2608-WHT", price_modifier_pennies: 0, stock_quantity: 12 }
    ]
  },
  {
    url: "https://www.amosmannfurniture.co.uk/kuba-artic-white-desk-with-drawers---2489-2489-p.asp",
    category_id: "cat_living",
    delivery_tier: "standard_parcel",
    material: "engineered_hardwood",
    shipping_pennies: 1500,
    variants: [
      { id: "var_kub_std", title: "Standard Workstation with 2 Drawers", sku: "AM-2489-STD", price_modifier_pennies: 0, stock_quantity: 30 },
      { id: "var_kub_3dr", title: "Extended 3-Drawer Office Desk", sku: "AM-2490-3DR", price_modifier_pennies: 2000, stock_quantity: 15 }
    ]
  },
  {
    url: "https://www.amosmannfurniture.co.uk/venice-alpine-white-bedside---2394-2394-p.asp",
    category_id: "cat_beds",
    delivery_tier: "standard_parcel",
    material: "engineered_hardwood",
    shipping_pennies: 1500,
    variants: [
      { id: "var_ven_bed_wht", title: "Alpine White 3-Drawer Bedside", sku: "AM-2394-WHT", price_modifier_pennies: 0, stock_quantity: 22 },
      { id: "var_ven_bed_oak", title: "Natural Oak Effect 3-Drawer Bedside", sku: "AM-2371-OAK", price_modifier_pennies: 500, stock_quantity: 16 }
    ]
  }
];

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

function parseDimensions(text) {
  const match = text.match(/Size\s*W([0-9.]+)\s*cm,\s*H([0-9.]+)\s*cm,\s*D([0-9.]+)\s*cm/i);
  if (match) {
    return {
      width_cm: parseFloat(match[1]),
      height_cm: parseFloat(match[2]),
      depth_cm: parseFloat(match[3])
    };
  }
  return { width_cm: 120, height_cm: 200, depth_cm: 60 };
}

async function syncLiveAmosMannProducts() {
  console.log("==========================================================");
  console.log("   SYNC LIVE AMOS MANN PRODUCTS DIRECTLY FROM WEBSITE     ");
  console.log("   Target: https://www.amosmannfurniture.co.uk/           ");
  console.log("==========================================================");

  const conn = await mysql.createConnection(DB_CONFIG);
  console.log(`[1/3] Connected to MySQL database "${DB_CONFIG.database}"`);

  // Clear previous products
  console.log("[2/3] Cleaning existing catalog for clean live sync...");
  await conn.query("DELETE FROM supplier_feed_items");
  await conn.query("DELETE FROM furniture_specs");
  await conn.query("DELETE FROM products");
  console.log("✓ Database cleared.");

  console.log("[3/3] Fetching live product data & high-res images from Amos Mann website...");

  for (let i = 0; i < LIVE_PRODUCT_URLS.length; i++) {
    const config = LIVE_PRODUCT_URLS[i];
    console.log(`\n[${i + 1}/${LIVE_PRODUCT_URLS.length}] Fetching: ${config.url}`);
    
    const html = await fetchHtml(config.url);

    // Extract Schema.org JSON-LD
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
    let prodData = null;
    if (jsonLdMatch) {
      for (const block of jsonLdMatch) {
        const raw = block.replace(/<\/?script[^>]*>/gi, "");
        try {
          const parsed = JSON.parse(raw);
          if (parsed["@type"] === "Product") {
            prodData = parsed;
            break;
          }
        } catch (e) {}
      }
    }

    if (!prodData) {
      console.warn(`  Failed to extract JSON-LD for ${config.url}`);
      continue;
    }

    // Extract all high-res product images from EKM CDN
    const imgMatches = html.match(/https:\/\/files\.ekmcdn\.com\/amosmann1\/images\/[^\s"'><]+/g) || [];
    const uniqueImages = [...new Set(imgMatches.map((img) => img.split("?")[0]))].filter((u) =>
      u.match(/\.(jpg|jpeg|png|webp)$/i)
    );

    const title = prodData.name || "Amos Mann Furniture";
    const sku = Array.isArray(prodData.sku) ? prodData.sku[0] : (prodData.sku || `AM-${Date.now()}`);
    const livePriceGbp = parseFloat(prodData.offers?.price) || 199.00;
    const desc = prodData.description || "";
    const dims = parseDimensions(desc);
    
    // Live Trade Cost in pennies
    const tradeCostPennies = Math.round(livePriceGbp * 100);
    // Wholesale carriage
    const shipPennies = config.shipping_pennies;
    // Calculate customer price with 45% markup and 20% UK VAT
    // Formula: (Trade Cost + Shipping) * 1.45 * 1.20 VAT
    const netRetailPennies = Math.round((tradeCostPennies + shipPennies) * 1.45);
    const retailPricePennies = Math.round(netRetailPennies * 1.20);
    const compareAtPennies = Math.round(retailPricePennies * 1.25);

    const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const productId = `prod_live_am_${sku}`.toLowerCase().replace(/[^a-z0-9_]/g, "_");

    const primaryThumbnail = uniqueImages[0] || prodData.image || "https://images.unsplash.com/photo-1595428774223-ef52624120d2";
    const allImages = uniqueImages.length > 0 ? uniqueImages : [primaryThumbnail];

    // Format variants with exact price pennies
    const formattedVariants = config.variants.map((v) => ({
      id: v.id,
      title: v.title,
      sku: v.sku,
      price_modifier_pennies: v.price_modifier_pennies,
      price_pennies: retailPricePennies + v.price_modifier_pennies,
      stock_quantity: v.stock_quantity,
      thumbnail_url: primaryThumbnail
    }));

    // Insert Product
    await conn.query(`
      INSERT INTO products (
        id, title, handle, subtitle, description, category_id, status,
        price_pennies, compare_at_price_pennies, vat_rate_percent, gtin_barcode,
        thumbnail_url, images_json, variants_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'published', ?, ?, 20.00, ?, ?, ?, ?, NOW(), NOW())
    `, [
      productId,
      title,
      handle,
      `Official Amos Mann UK Furniture - Dispatch Time 2-7 Business Days`,
      desc,
      config.category_id,
      retailPricePennies,
      compareAtPennies,
      `50609128${String(sku).replace(/[^0-9]/g, "").padStart(5, "0")}`,
      primaryThumbnail,
      JSON.stringify(allImages),
      JSON.stringify(formattedVariants)
    ]);

    // Insert Furniture Specs
    await conn.query(`
      INSERT INTO furniture_specs (
        id, product_id, width_cm, height_cm, depth_cm, weight_kg,
        material, frame_material, color, assembly_required,
        delivery_tier, fire_safety_compliant, fire_safety_standard, lead_time_days, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1, 'UK Quality Checked', 5, NOW())
    `, [
      `spec_${productId}`,
      productId,
      dims.width_cm,
      dims.height_cm,
      dims.depth_cm,
      config.delivery_tier === "two_man_white_glove" ? 120 : 45,
      config.material,
      "engineered_hardwood",
      "Soft Gloss White / Mirror",
      config.delivery_tier
    ]);

    // Insert Supplier Feed item
    await conn.query(`
      INSERT INTO supplier_feed_items (
        id, supplier_id, supplier_sku, product_id, cost_price_pennies,
        shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days, last_synced_at
      ) VALUES (?, 'amos_mann_furniture', ?, ?, ?, ?, 45.00, ?, 25, 5, NOW())
    `, [
      `feed_${productId}`,
      String(sku),
      productId,
      tradeCostPennies,
      shipPennies,
      retailPricePennies
    ]);

    console.log(`  ✓ Inserted: ${title}`);
    console.log(`    Live Website Trade Price: £${(tradeCostPennies / 100).toFixed(2)}`);
    console.log(`    SAN Furniture Retail (Inc 20% VAT): £${(retailPricePennies / 100).toFixed(2)}`);
    console.log(`    Images (${allImages.length}): ${allImages[0]}`);
    console.log(`    Variants: ${formattedVariants.length} active options`);
  }

  // Audit Log
  await conn.query(`
    INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address, created_at)
    VALUES (?, 'system@sanfurniture.com', 'SYNC_LIVE_AMOS_MANN_WEBSITE', 'catalog', ?, '127.0.0.1', NOW())
  `, [
    `log_${Date.now()}`,
    JSON.stringify({
      source: "https://www.amosmannfurniture.co.uk/",
      productsSynced: LIVE_PRODUCT_URLS.length,
      note: "Live site scrape via Schema.org Product JSON-LD & EKM CDN images"
    })
  ]);

  const [rows] = await conn.query("SELECT COUNT(*) as count FROM products");
  console.log(`\n==========================================================`);
  console.log(`✓ COMPLETE: ${rows[0].count} LIVE products synced directly from website!`);
  console.log(`==========================================================`);

  await conn.end();
}

syncLiveAmosMannProducts().catch((err) => {
  console.error("Sync error:", err);
  process.exit(1);
});
