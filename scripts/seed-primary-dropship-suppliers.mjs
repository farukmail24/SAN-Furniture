import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "san_furniture",
};

async function seedDropshipSuppliers() {
  const pool = mysql.createPool(DB_CONFIG);
  console.log(`[Seed] Connecting to MySQL database "${DB_CONFIG.database}"...`);

  // 1. Upsert Amos Mann Furniture
  await pool.query(`
    INSERT INTO suppliers (
      id, name, code, location, contact_name, contact_email, contact_phone,
      feed_type, feed_url, lead_time_days, is_active, last_sync_at, sync_status, created_at
    ) VALUES (
      'sup_amos_mann',
      'Amos Mann Furniture (Leicester Trade Dropshipping)',
      'amos_mann_furniture',
      'Leicester, Leicestershire, UK (Faircharm Ind Estate)',
      'Amos Mann B2B Trade Desk',
      'orders@amosmannfurniture.co.uk',
      '+44 116 273 0005',
      'json',
      'https://www.amosmannfurniture.co.uk/trade/feed.json',
      5,
      1,
      NOW(),
      'operational',
      NOW()
    )
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      code = VALUES(code),
      location = VALUES(location),
      contact_name = VALUES(contact_name),
      contact_email = VALUES(contact_email),
      contact_phone = VALUES(contact_phone),
      feed_type = VALUES(feed_type),
      feed_url = VALUES(feed_url),
      lead_time_days = VALUES(lead_time_days),
      is_active = 1,
      last_sync_at = NOW(),
      sync_status = 'operational';
  `);
  console.log("✓ Upserted Amos Mann Furniture supplier record.");

  // 2. Upsert Furniture To Go (FTG)
  await pool.query(`
    INSERT INTO suppliers (
      id, name, code, location, contact_name, contact_email, contact_phone,
      feed_type, feed_url, lead_time_days, is_active, last_sync_at, sync_status, created_at
    ) VALUES (
      'sup_furniture_to_go',
      'Furniture To Go (FTG Wiltshire UK Distribution Centre)',
      'furniture_to_go',
      'Unit 14 Merlin Way, Melksham, Wiltshire SN12 6TJ, UK',
      'FTG Trade Dropship Team',
      'orders@furniture-to-go.co.uk',
      '+44 1225 584 750',
      'csv',
      'https://furniture-to-go.co.uk/feeds/stock-inventory.csv',
      3,
      1,
      NOW(),
      'operational',
      NOW()
    )
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      code = VALUES(code),
      location = VALUES(location),
      contact_name = VALUES(contact_name),
      contact_email = VALUES(contact_email),
      contact_phone = VALUES(contact_phone),
      feed_type = VALUES(feed_type),
      feed_url = VALUES(feed_url),
      lead_time_days = VALUES(lead_time_days),
      is_active = 1,
      last_sync_at = NOW(),
      sync_status = 'operational';
  `);
  console.log("✓ Upserted Furniture To Go (FTG) supplier record.");

  // 3. Map Amos Mann Products in supplier_feed_items
  const amosItems = [
    { id: 'supp_am_01', sku: 'AM-MAD-180-MIR', prodId: 'prod_am_madrid_180', cost: 24900, ship: 4500, markup: 45.0, retail: 44900, stock: 15, lead: 5 },
    { id: 'supp_am_02', sku: 'AM-VEN-203-OAK', prodId: 'prod_am_venice_203', cost: 29900, ship: 4500, markup: 46.0, retail: 54900, stock: 12, lead: 5 },
    { id: 'supp_am_03', sku: 'AM-MIA-250-WHT', prodId: 'prod_am_miami_250', cost: 37900, ship: 5500, markup: 46.0, retail: 69900, stock: 8, lead: 7 },
    { id: 'supp_am_04', sku: 'AM-TEX-3PC-GRY', prodId: 'prod_am_texas_set', cost: 31900, ship: 5000, markup: 47.0, retail: 59900, stock: 10, lead: 7 },
    { id: 'supp_am_05', sku: 'AM-ATH-TV-BLK', prodId: 'prod_am_athens_tv', cost: 11900, ship: 2500, markup: 48.0, retail: 22900, stock: 25, lead: 3 },
    { id: 'supp_am_06', sku: 'AM-ATL-SB-CSH', prodId: 'prod_am_atlantis_sideboard', cost: 13900, ship: 3000, markup: 48.0, retail: 26900, stock: 18, lead: 5 },
    { id: 'supp_am_07', sku: 'AM-ELI-DIN-GLS', prodId: 'prod_am_elise_dining', cost: 21900, ship: 4000, markup: 49.0, retail: 42900, stock: 9, lead: 5 },
    { id: 'supp_am_08', sku: 'AM-KAN-DSK-OAK', prodId: 'prod_am_kano_desk', cost: 9500, ship: 2000, markup: 50.0, retail: 18900, stock: 30, lead: 3 },
    { id: 'supp_am_09', sku: 'AM-SAN-SHOE-MIR', prodId: 'prod_am_santino_shoe', cost: 7500, ship: 1500, markup: 50.0, retail: 14900, stock: 40, lead: 3 },
  ];

  for (const it of amosItems) {
    await pool.query(`
      INSERT INTO supplier_feed_items (
        id, supplier_id, supplier_sku, product_id, cost_price_pennies, shipping_cost_pennies,
        markup_percentage, retail_price_pennies, stock_level, lead_time_days, last_synced_at
      ) VALUES (?, 'amos_mann_furniture', ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        cost_price_pennies = VALUES(cost_price_pennies),
        shipping_cost_pennies = VALUES(shipping_cost_pennies),
        retail_price_pennies = VALUES(retail_price_pennies),
        stock_level = VALUES(stock_level),
        lead_time_days = VALUES(lead_time_days),
        last_synced_at = NOW();
    `, [it.id, it.sku, it.prodId, it.cost, it.ship, it.markup, it.retail, it.stock, it.lead]);
  }
  console.log(`✓ Mapped ${amosItems.length} Amos Mann products into supplier_feed_items.`);

  // 4. Seed Furniture To Go (FTG) Bestseller Catalog Products
  const ftgProducts = [
    {
      id: "prod_ftg_copenhagen_4dr",
      title: "Copenhagen 4-Drawer Deep Chest of Drawers in Solid Danish Oak",
      handle: "copenhagen-4-drawer-deep-chest-danish-oak",
      subtitle: "Scandinavian minimalism with brushed brass cup handles and smooth metal runners",
      description: "Crafted in Denmark by Furniture To Go, the Copenhagen 4-Drawer Chest pairs timeless Nordic aesthetics with everyday durability. Featuring deep storage drawers with reinforced bases and precision ball-bearing runners.",
      category_id: "cat_beds",
      status: "published",
      price_pennies: 21900, // £219.00
      compare_at_price_pennies: 27900,
      vat_rate_percent: 20.00,
      gtin_barcode: "5707310349821",
      thumbnail_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=1200&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=1200&auto=format&fit=crop"
      ],
      specs: {
        width_cm: 91,
        height_cm: 90,
        depth_cm: 40,
        weight_kg: 32,
        material: "solid_oak_and_mdf",
        frame_material: "solid_danish_oak",
        color: "Danish Oak Natural",
        assembly_required: 1,
        doorway_clearance_min_cm: 50,
        delivery_tier: "standard_parcel",
        fire_safety_compliant: 1,
        fire_safety_standard: "BS 5852: Part 1: 1979",
        lead_time_days: 2
      },
      feed: {
        id: "supp_ftg_01",
        sku: "FTG-CPH-4DR-OAK",
        cost: 9500, // £95.00 trade
        ship: 1500, // £15.00 DPD parcel
        markup: 56.6,
        retail: 21900,
        stock: 35,
        lead: 2
      }
    },
    {
      id: "prod_ftg_paris_3dr_wardrobe",
      title: "Paris 3-Door 2-Drawer Classic Wardrobe with Mirrored Centre in Matt White",
      handle: "paris-3-door-mirrored-wardrobe-matt-white",
      subtitle: "Romantic Parisian styling with decorative cornice moulding and bevelled mirror door",
      description: "The Paris 3-Door Wardrobe from Furniture To Go infuses Parisian elegance into any master bedroom. Generously proportioned with twin hanging rails, multiple internal shelving nooks, and smooth gliding lower drawers.",
      category_id: "cat_beds",
      status: "published",
      price_pennies: 47900, // £479.00
      compare_at_price_pennies: 59900,
      vat_rate_percent: 20.00,
      gtin_barcode: "5707310349838",
      thumbnail_url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1200&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1200&auto=format&fit=crop"
      ],
      specs: {
        width_cm: 143,
        height_cm: 201,
        depth_cm: 61,
        weight_kg: 88,
        material: "high_density_mdf",
        frame_material: "engineered_hardwood",
        color: "Matt Alpine White",
        assembly_required: 1,
        doorway_clearance_min_cm: 70,
        delivery_tier: "two_man_white_glove",
        fire_safety_compliant: 1,
        fire_safety_standard: "BS 5852: Part 1: 1979",
        lead_time_days: 3
      },
      feed: {
        id: "supp_ftg_02",
        sku: "FTG-PAR-3DR-WHT",
        cost: 23500, // £235.00 trade
        ship: 4000, // £40.00 2-man
        markup: 51.0,
        retail: 47900,
        stock: 14,
        lead: 3
      }
    },
    {
      id: "prod_ftg_oslo_desk",
      title: "Oslo Scandinavian Minimalist Writing Desk with 3 Drawers",
      handle: "oslo-scandinavian-minimalist-writing-desk",
      subtitle: "Two-tone anthracite and warm oak finish with recessed cutout handle pulls",
      description: "Designed for modern home study suites and compact home offices, the Oslo Desk blends functionality with clean Danish lines. Three smooth drawer compartments keep stationary organised.",
      category_id: "cat_living",
      status: "published",
      price_pennies: 24900, // £249.00
      compare_at_price_pennies: 31900,
      vat_rate_percent: 20.00,
      gtin_barcode: "5707310349845",
      thumbnail_url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=1200&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=1200&auto=format&fit=crop"
      ],
      specs: {
        width_cm: 120,
        height_cm: 77,
        depth_cm: 55,
        weight_kg: 29,
        material: "danish_foil_and_oak",
        frame_material: "solid_oak_legs",
        color: "Anthracite & Natural Oak",
        assembly_required: 1,
        doorway_clearance_min_cm: 60,
        delivery_tier: "standard_parcel",
        fire_safety_compliant: 1,
        fire_safety_standard: "BS 5852: Part 1: 1979",
        lead_time_days: 2
      },
      feed: {
        id: "supp_ftg_03",
        sku: "FTG-OSL-DSK-ANT",
        cost: 11500, // £115.00 trade
        ship: 1500, // £15.00 parcel
        markup: 53.8,
        retail: 24900,
        stock: 22,
        lead: 2
      }
    },
    {
      id: "prod_ftg_modena_dining",
      title: "Modena High-Gloss Extending 6-8 Seater Dining Table",
      handle: "modena-extending-dining-table-high-gloss",
      subtitle: "Centre-leaf butterfly extension mechanism with mirror polished chrome trim",
      description: "The Modena dining table extends effortlessly from 160cm to 200cm, seating up to 8 dinner guests in style. Engineered with a scratch-resistant Italian UV high-gloss coating.",
      category_id: "cat_dining",
      status: "published",
      price_pennies: 49900, // £499.00
      compare_at_price_pennies: 64900,
      vat_rate_percent: 20.00,
      gtin_barcode: "5707310349852",
      thumbnail_url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=1200&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=1200&auto=format&fit=crop"
      ],
      specs: {
        width_cm: 160,
        height_cm: 76,
        depth_cm: 90,
        weight_kg: 56,
        material: "uv_high_gloss_mdf",
        frame_material: "heavy_pedestal_base",
        color: "Pure High-Gloss White",
        assembly_required: 1,
        doorway_clearance_min_cm: 65,
        delivery_tier: "two_man_white_glove",
        fire_safety_compliant: 1,
        fire_safety_standard: "BS 5852: Part 1: 1979",
        lead_time_days: 3
      },
      feed: {
        id: "supp_ftg_04",
        sku: "FTG-MOD-DIN-GLS",
        cost: 24500, // £245.00 trade
        ship: 4000, // £40.00 2-man
        markup: 50.9,
        retail: 49900,
        stock: 11,
        lead: 3
      }
    }
  ];

  for (const prod of ftgProducts) {
    // Upsert product
    await pool.query(`
      INSERT INTO products (
        id, title, handle, subtitle, description, category_id, status,
        price_pennies, compare_at_price_pennies, vat_rate_percent, gtin_barcode,
        thumbnail_url, images_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        handle = VALUES(handle),
        subtitle = VALUES(subtitle),
        description = VALUES(description),
        category_id = VALUES(category_id),
        status = VALUES(status),
        price_pennies = VALUES(price_pennies),
        compare_at_price_pennies = VALUES(compare_at_price_pennies),
        thumbnail_url = VALUES(thumbnail_url),
        images_json = VALUES(images_json),
        updated_at = NOW();
    `, [
      prod.id, prod.title, prod.handle, prod.subtitle, prod.description,
      prod.category_id, prod.status, prod.price_pennies, prod.compare_at_price_pennies,
      prod.vat_rate_percent, prod.gtin_barcode, prod.thumbnail_url,
      JSON.stringify(prod.images)
    ]);

    // Upsert furniture_specs
    await pool.query(`
      INSERT INTO furniture_specs (
        product_id, width_cm, height_cm, depth_cm, seat_height_cm, weight_kg,
        material, frame_material, color, assembly_required, doorway_clearance_min_cm,
        delivery_tier, fire_safety_compliant, fire_safety_standard, lead_time_days
      ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        width_cm = VALUES(width_cm),
        height_cm = VALUES(height_cm),
        depth_cm = VALUES(depth_cm),
        weight_kg = VALUES(weight_kg),
        material = VALUES(material),
        color = VALUES(color),
        assembly_required = VALUES(assembly_required),
        delivery_tier = VALUES(delivery_tier),
        lead_time_days = VALUES(lead_time_days);
    `, [
      prod.id, prod.specs.width_cm, prod.specs.height_cm, prod.specs.depth_cm,
      prod.specs.weight_kg, prod.specs.material, prod.specs.frame_material,
      prod.specs.color, prod.specs.assembly_required, prod.specs.doorway_clearance_min_cm,
      prod.specs.delivery_tier, prod.specs.fire_safety_compliant, prod.specs.fire_safety_standard,
      prod.specs.lead_time_days
    ]);

    // Upsert supplier_feed_item
    await pool.query(`
      INSERT INTO supplier_feed_items (
        id, supplier_id, supplier_sku, product_id, cost_price_pennies, shipping_cost_pennies,
        markup_percentage, retail_price_pennies, stock_level, lead_time_days, last_synced_at
      ) VALUES (?, 'furniture_to_go', ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        cost_price_pennies = VALUES(cost_price_pennies),
        shipping_cost_pennies = VALUES(shipping_cost_pennies),
        retail_price_pennies = VALUES(retail_price_pennies),
        stock_level = VALUES(stock_level),
        lead_time_days = VALUES(lead_time_days),
        last_synced_at = NOW();
    `, [
      prod.feed.id, prod.feed.sku, prod.id, prod.feed.cost,
      prod.feed.ship, prod.feed.markup, prod.feed.retail,
      prod.feed.stock, prod.feed.lead
    ]);
  }

  console.log(`✓ Seeded ${ftgProducts.length} Furniture To Go products into catalog and supplier_feed_items.`);

  await pool.end();
  console.log("✓ All dropshipping primary suppliers and products registered successfully!");
}

seedDropshipSuppliers().catch(err => {
  console.error("Error seeding dropship suppliers:", err);
  process.exit(1);
});
