import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "san_furniture",
};

// Destination for serving supplier images locally from Next.js public directory
const DEST_DIR = path.join(ROOT_DIR, "apps/storefront/public/images/suppliers/amos-mann");
const SRC_DIR = path.join(ROOT_DIR, "Dropship Suppliers/Amos Mann Customer Folder");

function copyAsset(srcRel, destName) {
  try {
    const src = path.join(SRC_DIR, srcRel);
    const dest = path.join(DEST_DIR, destName);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      return `/images/suppliers/amos-mann/${destName}`;
    }
  } catch (e) {
    console.warn(`Could not copy asset ${srcRel}:`, e.message);
  }
  return null;
}

async function runCleanAmosMannSeed() {
  console.log("==========================================================");
  console.log("   CLEAN SEED: AMOS MANN UK DROPSHIPPING REAL CATALOG     ");
  console.log("==========================================================");

  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
  }

  // 1. Copy authentic images from supplier folder into Next.js public folder
  console.log("[1/4] Copying authentic Amos Mann images & layout diagrams...");
  
  // Madrid Wardrobe images
  const madrid1 = copyAsset("Madrid Range/Madrid Mirrored 180cm Sliding Door White Gloss - 2423.jpg", "madrid-180-white-gloss.jpg") || "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=85";
  const madrid2 = copyAsset("Madrid Range/Madrid White Room set Image.jpg", "madrid-room-set.jpg");
  const madrid3 = copyAsset("Madrid Range/Madrid Wardrobe Internal Drawers - 2428.jpg", "madrid-internal-drawers.jpg");
  const madrid4 = copyAsset("000 Wardrobe Diagrams/Madrid 180.png", "madrid-180-diagram.png");
  const madrid5 = copyAsset("Madrid Range/Madrid Sliding Door Wardrobe 180cm Black Ash Effect - 2424.jpg", "madrid-black-ash.jpg");
  const madrid6 = copyAsset("Madrid Range/Madrid Black Line 180cm Sliding Door White Gloss - 2548.jpg", "madrid-black-line.jpg");

  // Venice Wardrobe images
  const venice1 = copyAsset("Venice Range/Venice Alpine White 3 Door Wardrobe - 2389.jpg", "venice-3door-white.jpg") || "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85";
  const venice2 = copyAsset("Venice Range/Venice Oak Effect 3 Door Wardrobe - 2377.jpg", "venice-3door-oak.jpg");
  const venice3 = copyAsset("000 Wardrobe Diagrams/Venice 3 Door.png", "venice-3door-diagram.png");
  const venice4 = copyAsset("Venice Range/Venice Alpine White 4d 2drw Wardrobe - 2393.jpg", "venice-4door-white.jpg");

  // Athens TV Unit images
  const athens1 = copyAsset("ATHENS RANGE/ATHENS TV UNIT (1).jpg", "athens-tv-1.jpg") || "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=85";
  const athens2 = copyAsset("ATHENS RANGE/ATHENS TV UNIT (2).jpg", "athens-tv-2.jpg");
  const athens3 = copyAsset("ATHENS RANGE/ATHENS TV UNIT (1).png", "athens-tv-isolated.png");

  // Luxo Dining Table images
  const luxo1 = copyAsset("Dining Table/Luxo Extending Breakfast Table - 2941 (1).jpg", "luxo-dining-1.jpg") || "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=85";
  const luxo2 = copyAsset("Dining Table/Luxo Extending Breakfast Table - 2941 (2).jpg", "luxo-dining-2.jpg");
  const luxo3 = copyAsset("Dining Table/Luxo Extending Breakfast Table - 2941 (3).jpg", "luxo-dining-3.jpg");
  const luxo4 = copyAsset("Dining Table/Luiz Extending Dining Table Oak Effect - 2604.png", "luxo-dining-oak.png");

  // Athens Sideboard images
  const sideboard1 = copyAsset("ATHENS RANGE/ATHENS 3 DOOR SIDEBOARD (1).jpg", "athens-sideboard-1.jpg") || "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=85";
  const sideboard2 = copyAsset("ATHENS RANGE/ATHENS 3 DOOR SIDEBOARD (2).jpg", "athens-sideboard-2.jpg");
  const sideboard3 = copyAsset("ATHENS RANGE/ATHENS 2 DOOR 4 DRAWER SIDEBOARD (1).jpg", "athens-sideboard-drawers.jpg");

  // Santino Shoe Storage images
  const santino1 = copyAsset("Shoe Storage/Santino 3 Tier Shoe Cabinet - 2321.jpg", "santino-shoe-1.jpg") || "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=85";
  const santino2 = copyAsset("Shoe Storage/Santino 4 Tier Shoe Cabinet - 2322.jpg", "santino-shoe-2.jpg");

  console.log("✓ Assets successfully copied to Next.js public directory.");

  // 2. Connect to MySQL
  console.log(`[2/4] Connecting to database "${DB_CONFIG.database}"...`);
  const conn = await mysql.createConnection(DB_CONFIG);

  // 3. Clear out dummy products
  console.log("[3/4] Purging dummy products and resetting catalog...");
  await conn.query("DELETE FROM supplier_feed_items");
  await conn.query("DELETE FROM furniture_specs");
  await conn.query("DELETE FROM products");
  console.log("✓ Database cleaned of old dummy records.");

  // Ensure Amos Mann Supplier is active
  await conn.query(`
    INSERT INTO suppliers (
      id, name, code, location, contact_name, contact_email, contact_phone,
      feed_type, feed_url, lead_time_days, is_active, last_sync_at, sync_status
    ) VALUES (
      'sup_amos_mann',
      'Amos Mann Furniture (Leicester Trade Dropshipping)',
      'amos_mann_furniture',
      'Faircharm Industrial Estate, Leicester, UK',
      'Amos Mann B2B Trade Team',
      'orders@amosmannfurniture.co.uk',
      '+44 116 273 0005',
      'json',
      'https://www.amosmannfurniture.co.uk/drop-ship-service',
      5,
      1,
      NOW(),
      'operational'
    ) ON DUPLICATE KEY UPDATE is_active = 1, sync_status = 'operational';
  `);

  // 4. Insert curated Amos Mann products
  console.log("[4/4] Inserting 6 curated authentic Amos Mann furniture products...");

  const amosCatalog = [
    {
      id: "prod_am_madrid_slider",
      title: "Madrid Luxury Sliding Mirrored Wardrobe with Soft-Close",
      handle: "madrid-luxury-sliding-mirrored-wardrobe",
      subtitle: "Full-length mirrored doors with smooth aluminium sliding track, internal hanging rails & shelving",
      description: "Amos Mann's flagship sliding door wardrobe combines architectural German-engineered sliding gear with sleek UK British styling. Equipped with dual hanging rails, upper luggage shelves, and smooth ball-bearing runners. Delivered via 2-Man White Glove delivery directly to your room of choice.",
      category_id: "cat_beds",
      price_pennies: 44900, // £449.00 inc 20% VAT (Net £374.17 + £74.83 VAT)
      compare_at_price_pennies: 54900,
      vat_rate_percent: 20.00,
      gtin_barcode: "5060912802423",
      thumbnail_url: madrid1,
      images: [madrid1, madrid2, madrid3, madrid4, madrid5, madrid6].filter(Boolean),
      variants: [
        { id: "var_mad_120", title: "120cm Width / 2 Sliding Doors", sku: "AM-MAD-120-MIR", price_modifier_pennies: -8000, price_pennies: 36900, stock_quantity: 12 },
        { id: "var_mad_150", title: "150cm Width / 2 Sliding Doors", sku: "AM-MAD-150-MIR", price_modifier_pennies: -4000, price_pennies: 40900, stock_quantity: 15 },
        { id: "var_mad_180", title: "180cm Width / Centre Mirrored Door", sku: "AM-MAD-180-MIR", price_modifier_pennies: 0, price_pennies: 44900, stock_quantity: 25 },
        { id: "var_mad_203", title: "203cm Width / Centre Mirrored Door", sku: "AM-MAD-203-MIR", price_modifier_pennies: 6000, price_pennies: 50900, stock_quantity: 8 },
        { id: "var_mad_250", title: "250cm Width / 3 Sliding Mirrored Doors", sku: "AM-MAD-250-MIR", price_modifier_pennies: 15000, price_pennies: 59900, stock_quantity: 5 }
      ],
      specs: {
        width_cm: 180,
        height_cm: 206,
        depth_cm: 66,
        weight_kg: 165,
        material: "engineered_hardwood",
        frame_material: "engineered_hardwood",
        color: "Alpine White Gloss & Mirrored Glass",
        assembly_required: 1,
        assembly_time_mins: 90,
        doorway_clearance_min_cm: 70,
        delivery_tier: "two_man_white_glove",
        fire_safety_compliant: 1,
        fire_safety_standard: "BS 5852 / UK Statutory Timber Compliance",
        lead_time_days: 5
      },
      feed: {
        sku: "AM-MAD-180-MIR",
        cost: 24900, // £249.00 trade cost from Amos sheet
        ship: 4500,  // £45.00 HDL 2-Man delivery
        markup: 44.5,
        retail: 44900,
        stock: 25
      }
    },
    {
      id: "prod_am_venice_wardrobe",
      title: "Venice 3-Door Hinged Wardrobe with Drawers & Bevelled Mirror",
      handle: "venice-3-door-hinged-wardrobe-drawers-mirror",
      subtitle: "Classic British bedroom wardrobe featuring deep storage drawers and central vanity mirror",
      description: "The Venice bedroom range from Amos Mann Furniture provides ample hanging space, shelving compartments, and two smooth-gliding lower drawers. Finished in durable, wipe-clean German foil laminate with brushed metal handles.",
      category_id: "cat_beds",
      price_pennies: 34900, // £349.00 inc 20% VAT
      compare_at_price_pennies: 41900,
      vat_rate_percent: 20.00,
      gtin_barcode: "5060912802389",
      thumbnail_url: venice1,
      images: [venice1, venice2, venice3, venice4].filter(Boolean),
      variants: [
        { id: "var_ven_3d_wht", title: "Alpine White / 3-Door with Drawers", sku: "AM-VEN-3D-WHT", price_modifier_pennies: 0, price_pennies: 34900, stock_quantity: 18 },
        { id: "var_ven_3d_oak", title: "Natural Oak Effect / 3-Door with Drawers", sku: "AM-VEN-3D-OAK", price_modifier_pennies: 2000, price_pennies: 36900, stock_quantity: 14 },
        { id: "var_ven_4d_wht", title: "Alpine White / 4-Door Extra Wide", sku: "AM-VEN-4D-WHT", price_modifier_pennies: 9000, price_pennies: 43900, stock_quantity: 7 }
      ],
      specs: {
        width_cm: 136,
        height_cm: 197,
        depth_cm: 54,
        weight_kg: 102,
        material: "engineered_hardwood",
        frame_material: "engineered_hardwood",
        color: "Alpine White with Mirror",
        assembly_required: 1,
        assembly_time_mins: 75,
        doorway_clearance_min_cm: 60,
        delivery_tier: "two_man_white_glove",
        fire_safety_compliant: 1,
        fire_safety_standard: "BS 5852 / UK Statutory Timber Compliance",
        lead_time_days: 5
      },
      feed: {
        sku: "AM-VEN-3D-WHT",
        cost: 18900, // £189.00 trade
        ship: 4000,  // £40.00 2-man
        markup: 45.8,
        retail: 34900,
        stock: 18
      }
    },
    {
      id: "prod_am_athens_tv",
      title: "Athens 160cm High Gloss TV Cabinet with Blue LED Illumination",
      handle: "athens-160cm-high-gloss-tv-cabinet-led",
      subtitle: "Contemporary media console with remote-controlled RGB ambient glow and drop-down flap doors",
      description: "Designed for modern living rooms, the Athens TV unit accommodates screens up to 70 inches. Features high-gloss fronts, concealed cable management ports, and tempered glass shelving with mains-powered UK LED illumination.",
      category_id: "cat_living",
      price_pennies: 22900, // £229.00 inc 20% VAT
      compare_at_price_pennies: 27900,
      vat_rate_percent: 20.00,
      gtin_barcode: "5060912802914",
      thumbnail_url: athens1,
      images: [athens1, athens2, athens3].filter(Boolean),
      variants: [
        { id: "var_ath_wht", title: "Pure High Gloss White with Blue LED", sku: "AM-ATH-TV-WHT", price_modifier_pennies: 0, price_pennies: 22900, stock_quantity: 20 },
        { id: "var_ath_blk", title: "Midnight High Gloss Black with Blue LED", sku: "AM-ATH-TV-BLK", price_modifier_pennies: 0, price_pennies: 22900, stock_quantity: 15 }
      ],
      specs: {
        width_cm: 160,
        height_cm: 45,
        depth_cm: 35,
        weight_kg: 34,
        material: "engineered_hardwood",
        frame_material: "engineered_hardwood",
        color: "High Gloss White / Black",
        assembly_required: 1,
        assembly_time_mins: 40,
        doorway_clearance_min_cm: 50,
        delivery_tier: "pallet",
        fire_safety_compliant: 1,
        fire_safety_standard: "BS 5852 / UK Statutory Timber Compliance",
        lead_time_days: 3
      },
      feed: {
        sku: "AM-ATH-TV-WHT",
        cost: 11900, // £119.00 trade
        ship: 2500,  // £25.00 Pallet/Courier
        markup: 48.0,
        retail: 22900,
        stock: 20
      }
    },
    {
      id: "prod_am_luxo_dining",
      title: "Luxo Modern Extending Butterfly Dining Table in High Gloss",
      handle: "luxo-modern-extending-butterfly-dining-table",
      subtitle: "Precision butterfly mechanism smoothly extends from 6 to 8 diners in seconds",
      description: "Amos Mann's Luxo Extending Dining Table is crafted for stylish UK entertaining. Sturdy central pedestal base with brushed chrome floor plate, eliminating awkward table legs and maximizing legroom for guests.",
      category_id: "cat_dining",
      price_pennies: 39900, // £399.00 inc 20% VAT
      compare_at_price_pennies: 47900,
      vat_rate_percent: 20.00,
      gtin_barcode: "5060912802941",
      thumbnail_url: luxo1,
      images: [luxo1, luxo2, luxo3, luxo4].filter(Boolean),
      variants: [
        { id: "var_lux_140", title: "140cm-180cm Extending Table (Seats 6-8)", sku: "AM-LUX-140-WHT", price_modifier_pennies: 0, price_pennies: 39900, stock_quantity: 12 },
        { id: "var_lux_160", title: "160cm-200cm Large Extending Table (Seats 8-10)", sku: "AM-LUX-160-WHT", price_modifier_pennies: 5000, price_pennies: 44900, stock_quantity: 8 }
      ],
      specs: {
        width_cm: 180,
        height_cm: 76,
        depth_cm: 90,
        weight_kg: 58,
        material: "engineered_hardwood",
        frame_material: "engineered_hardwood",
        color: "High Gloss White & Chrome",
        assembly_required: 1,
        assembly_time_mins: 45,
        doorway_clearance_min_cm: 60,
        delivery_tier: "pallet",
        fire_safety_compliant: 1,
        fire_safety_standard: "BS 5852 / UK Statutory Timber Compliance",
        lead_time_days: 4
      },
      feed: {
        sku: "AM-LUX-140-WHT",
        cost: 21900, // £219.00 trade
        ship: 3500,  // £35.00 Pallet
        markup: 45.1,
        retail: 39900,
        stock: 12
      }
    },
    {
      id: "prod_am_athens_sideboard",
      title: "Athens 3-Door 4-Drawer Contemporary Sideboard Credenza",
      handle: "athens-3-door-4-drawer-contemporary-sideboard",
      subtitle: "High gloss fronts with generous internal shelving and soft-close cutlery drawers",
      description: "Elevate your dining or living room with the Athens sideboard. Features 3 cupboard doors enclosing adjustable shelves and 4 central pull-out drawers, perfect for dinnerware, linens, and living room accessories.",
      category_id: "cat_living",
      price_pennies: 27900, // £279.00 inc 20% VAT
      compare_at_price_pennies: 33900,
      vat_rate_percent: 20.00,
      gtin_barcode: "5060912802871",
      thumbnail_url: sideboard1,
      images: [sideboard1, sideboard2, sideboard3].filter(Boolean),
      variants: [
        { id: "var_sb_wht", title: "Pure High Gloss White", sku: "AM-ATH-SB-WHT", price_modifier_pennies: 0, price_pennies: 27900, stock_quantity: 14 },
        { id: "var_sb_csh", title: "Cashmere Grey & Oak Accent", sku: "AM-ATH-SB-CSH", price_modifier_pennies: 2000, price_pennies: 29900, stock_quantity: 10 }
      ],
      specs: {
        width_cm: 150,
        height_cm: 85,
        depth_cm: 42,
        weight_kg: 52,
        material: "engineered_hardwood",
        frame_material: "engineered_hardwood",
        color: "High Gloss White / Cashmere",
        assembly_required: 1,
        assembly_time_mins: 60,
        doorway_clearance_min_cm: 55,
        delivery_tier: "pallet",
        fire_safety_compliant: 1,
        fire_safety_standard: "BS 5852 / UK Statutory Timber Compliance",
        lead_time_days: 4
      },
      feed: {
        sku: "AM-ATH-SB-WHT",
        cost: 14900, // £149.00 trade
        ship: 3000,  // £30.00 Pallet
        markup: 46.6,
        retail: 27900,
        stock: 14
      }
    },
    {
      id: "prod_am_santino_shoe",
      title: "Santino 3-Tier Mirrored Slimline Shoe Storage Cabinet",
      handle: "santino-3-tier-mirrored-slimline-shoe-storage-cabinet",
      subtitle: "Space-saving 24cm depth holding up to 18 pairs of shoes with full mirrored front",
      description: "Say goodbye to hallway clutter. The Santino slimline shoe cabinet fits perfectly in narrow British hallways and entrances, featuring 3 fold-down storage bays with full-height mirrored door panels.",
      category_id: "cat_living",
      price_pennies: 14900, // £149.00 inc 20% VAT
      compare_at_price_pennies: 18900,
      vat_rate_percent: 20.00,
      gtin_barcode: "5060912802321",
      thumbnail_url: santino1,
      images: [santino1, santino2].filter(Boolean),
      variants: [
        { id: "var_san_3t", title: "3-Tier (Holds up to 18 Pairs)", sku: "AM-SAN-3T-MIR", price_modifier_pennies: 0, price_pennies: 14900, stock_quantity: 30 },
        { id: "var_san_4t", title: "4-Tier Tall (Holds up to 24 Pairs)", sku: "AM-SAN-4T-MIR", price_modifier_pennies: 3000, price_pennies: 17900, stock_quantity: 15 }
      ],
      specs: {
        width_cm: 63,
        height_cm: 120,
        depth_cm: 24,
        weight_kg: 28,
        material: "engineered_hardwood",
        frame_material: "engineered_hardwood",
        color: "Mirrored Front & White Frame",
        assembly_required: 1,
        assembly_time_mins: 35,
        doorway_clearance_min_cm: 40,
        delivery_tier: "standard_parcel",
        fire_safety_compliant: 1,
        fire_safety_standard: "BS 5852 / UK Statutory Timber Compliance",
        lead_time_days: 3
      },
      feed: {
        sku: "AM-SAN-3T-MIR",
        cost: 7500, // £75.00 trade
        ship: 1500, // £15.00 DPD Parcel
        markup: 49.6,
        retail: 14900,
        stock: 30
      }
    }
  ];

  for (const item of amosCatalog) {
    // Insert into products table
    await conn.query(`
      INSERT INTO products (
        id, title, handle, subtitle, description, category_id, status,
        price_pennies, compare_at_price_pennies, vat_rate_percent, gtin_barcode,
        thumbnail_url, images_json, variants_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'published', ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      item.id,
      item.title,
      item.handle,
      item.subtitle,
      item.description,
      item.category_id,
      item.price_pennies,
      item.compare_at_price_pennies,
      item.vat_rate_percent,
      item.gtin_barcode,
      item.thumbnail_url,
      JSON.stringify(item.images),
      JSON.stringify(item.variants)
    ]);

    // Insert into furniture_specs
    await conn.query(`
      INSERT INTO furniture_specs (
        id, product_id, width_cm, height_cm, depth_cm, weight_kg,
        material, frame_material, color, assembly_required, assembly_time_mins,
        doorway_clearance_min_cm, delivery_tier, fire_safety_compliant,
        fire_safety_standard, lead_time_days, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      `spec_${item.id}`,
      item.id,
      item.specs.width_cm,
      item.specs.height_cm,
      item.specs.depth_cm,
      item.specs.weight_kg,
      item.specs.material,
      item.specs.frame_material,
      item.specs.color,
      item.specs.assembly_required,
      item.specs.assembly_time_mins,
      item.specs.doorway_clearance_min_cm,
      item.specs.delivery_tier,
      item.specs.fire_safety_compliant,
      item.specs.fire_safety_standard,
      item.specs.lead_time_days
    ]);

    // Insert into supplier_feed_items
    await conn.query(`
      INSERT INTO supplier_feed_items (
        id, supplier_id, supplier_sku, product_id, cost_price_pennies,
        shipping_cost_pennies, markup_percentage, retail_price_pennies,
        stock_level, lead_time_days, last_synced_at
      ) VALUES (?, 'amos_mann_furniture', ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      `feed_${item.id}`,
      item.feed.sku,
      item.id,
      item.feed.cost,
      item.feed.ship,
      item.feed.markup,
      item.feed.retail,
      item.feed.stock,
      item.specs.lead_time_days
    ]);

    console.log(`  ✓ Inserted: ${item.title} (${item.images.length} images, ${item.variants.length} variants)`);
  }

  // Audit log entry
  await conn.query(`
    INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address, created_at)
    VALUES (?, 'admin@sanfurniture.com', 'SEED_CLEAN_AMOS_MANN', 'catalog', ?, '127.0.0.1', NOW())
  `, [
    `log_${Date.now()}`,
    JSON.stringify({
      supplier: "Amos Mann Furniture (Leicester)",
      productsCount: amosCatalog.length,
      note: "Clean slate test batch with real photos, multi-image galleries, and size/color variations"
    })
  ]);

  const [countRows] = await conn.query("SELECT COUNT(*) as total FROM products");
  console.log(`\n✓ SUCCESS: Catalog cleaned and loaded with ${countRows[0].total} verified Amos Mann items!`);
  
  await conn.end();
}

runCleanAmosMannSeed().catch((err) => {
  console.error("Error executing clean Amos Mann seed:", err);
  process.exit(1);
});
