import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Connecting to MySQL on 127.0.0.1:3306...");
  const conn = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "",
    database: "san_furniture",
    multipleStatements: true,
  });

  console.log("1. Ensuring cat_armchairs category exists...");
  await conn.query(`
    INSERT INTO categories (id, name, handle, description, hero_image, created_at)
    VALUES (
      'cat_armchairs',
      'Accent Armchairs & Stools',
      'armchairs',
      'Sculptural statement armchairs, luxury bouclé fireside reading chairs, and ergonomic occasional seating handcrafted for modern British homes.',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=85',
      NOW()
    )
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      handle = VALUES(handle),
      description = VALUES(description),
      hero_image = VALUES(hero_image)
  `);

  console.log("2. Moving 12 desks from cat_living to cat_office...");
  const deskIds = [
    "prod_live_am_2922rz", // Alex White Corner Desk
    "prod_live_am_2614rz", // Amur Artic White Computer Office Desk
    "prod_live_am_2490rz", // Blanco Artic White Desk With 3 Drawers
    "prod_live_am_2491rz", // Blanco Small Artic White Desk
    "prod_live_am_2561rz", // Carin Corner Flexi Desk Oak Effect
    "prod_live_am_2560rz", // Carin Corner Flexi Desk White
    "prod_live_am_2564rz", // Double Matt White Computer Desk Table with Bookcase
    "prod_live_am_2489rz", // Kuba Artic White Desk With Drawers
    "prod_live_am_2617rz", // Santino Large White Gloss Computer Desk S15
    "prod_live_am_2619rz", // Santino White Gloss Computer Desk S14
    "prod_live_am_2503rz", // Turin Artic White Desk/Dressing Table
    "prod_live_am_2647rz", // Turin White and Oak Desk/Dressing Table
  ];

  const [deskRes] = await conn.query(
    "UPDATE products SET category_id = 'cat_office', updated_at = NOW() WHERE id IN (?)",
    [deskIds]
  );
  console.log(`Desks moved to cat_office: ${(deskRes).affectedRows}`);

  console.log("3. Moving chests/dressing tables/tallboys from cat_living to cat_beds...");
  const bedroomIds = [
    "prod_live_am_2712rz", // Santino White Gloss 2 Drawer Dressing Table S31
    "prod_live_am_2429",   // Madrid White Gloss Tall Chest Of Drawers
    "prod_live_am_2705rz", // Pietra Tallboy Chest of Drawers Grey and White Gloss 6 DRW
    "prod_live_am_2661rz", // Ramina Concrete Grey And White Narrow Chest of Drawers
    "prod_live_am_2622rz", // Santino White High Gloss Chest Of Drawers S3
    "prod_live_am_2642rz", // Santino White Gloss Slim Tallboy Storage Unit with Cupboard and Drawers S11
  ];

  const [bedRes] = await conn.query(
    "UPDATE products SET category_id = 'cat_beds', updated_at = NOW() WHERE id IN (?)",
    [bedroomIds]
  );
  console.log(`Bedroom items moved to cat_beds: ${(bedRes).affectedRows}`);

  console.log("4. Inserting Luxury Curated Products (Armchairs, Sofas, Dining)...");
  const curatedProducts = [
    // --- ARMCHAIRS (cat_armchairs) ---
    {
      id: "prod_armchair_001",
      sku: "ACC-REG-SWV-CRM",
      title: "The Regent 360° Swivel Armchair in Cream Bouclé",
      handle: "regent-360-swivel-armchair-cream-boucle",
      subtitle: "Cocooning circular silhouette on concealed ball-bearing swivel base",
      description: "Sculptural curved armchair offering 360-degree silent rotation. Upholstered in dense wool-blend bouclé with high-density resilient foam cushioning. Built for modern British living rooms and bedrooms.",
      categoryId: "cat_armchairs",
      status: "published",
      pricePennies: 54900,
      compareAtPricePennies: 62000,
      vatRatePercent: 20.0,
      gtinBarcode: "5060123456011",
      thumbnailUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85",
      images: [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=1200&q=85"
      ],
      specs: {
        width_cm: 86.0,
        height_cm: 78.0,
        depth_cm: 88.0,
        seat_height_cm: 43.0,
        seat_depth_cm: 58.0,
        arm_height_cm: 64.0,
        weight_kg: 28.0,
        material: "boucle",
        frame_material: "powder_coated_steel",
        color: "Cream",
        assembly_required: false,
        delivery_tier: "two_man_white_glove",
        fire_safety_compliant: true,
        fire_safety_standard: "UK Furniture & Furnishings (Fire Safety) Regulations 1988 (BS 5852:2006)",
        fire_safety_cert: "BS-LON-2026-011",
        lead_time_days: 4,
      },
      supplierCostPennies: 28000,
    },
    {
      id: "prod_armchair_002",
      sku: "ACC-FTZ-WAL-SAD",
      title: "The Fitzrovia Mid-Century Lounge Chair in Saddle Leather",
      handle: "fitzrovia-mid-century-lounge-chair-saddle-leather",
      subtitle: "Sculpted American walnut timber frame with aniline leather sling",
      description: "Honouring Danish modernist architecture, the Fitzrovia features exposed mortise-and-tenon walnut joinery and hand-stitched saddle leather. An iconic fireside or reading statement.",
      categoryId: "cat_armchairs",
      status: "published",
      pricePennies: 74900,
      compareAtPricePennies: 84900,
      vatRatePercent: 20.0,
      gtinBarcode: "5060123456012",
      thumbnailUrl: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=85",
      images: [
        "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=85"
      ],
      specs: {
        width_cm: 74.0,
        height_cm: 82.0,
        depth_cm: 84.0,
        seat_height_cm: 41.0,
        seat_depth_cm: 54.0,
        arm_height_cm: 58.0,
        weight_kg: 22.0,
        material: "leather",
        frame_material: "american_walnut",
        color: "Saddle Tan",
        assembly_required: false,
        delivery_tier: "two_man_white_glove",
        fire_safety_compliant: true,
        fire_safety_standard: "UK Furniture & Furnishings (Fire Safety) Regulations 1988 (BS 5852:2006)",
        fire_safety_cert: "BS-LON-2026-012",
        lead_time_days: 5,
      },
      supplierCostPennies: 39000,
    },
    {
      id: "prod_armchair_003",
      sku: "ACC-MB-WNG-HRB",
      title: "The Marylebone Wingback Fireside Chair in Herringbone Wool",
      handle: "marylebone-wingback-fireside-chair-herringbone-wool",
      subtitle: "High-backed traditional wing chair with solid turned oak legs",
      description: "Classic British wingback tailored in Yorkshire-milled herringbone wool. Provides lumbar contouring, deep shoulder support, and timeless sophistication for fireside libraries.",
      categoryId: "cat_armchairs",
      status: "published",
      pricePennies: 69900,
      compareAtPricePennies: 79900,
      vatRatePercent: 20.0,
      gtinBarcode: "5060123456013",
      thumbnailUrl: "https://images.unsplash.com/photo-1512212621149-107ffe572d2f?auto=format&fit=crop&w=1200&q=85",
      images: [
        "https://images.unsplash.com/photo-1512212621149-107ffe572d2f?auto=format&fit=crop&w=1200&q=85"
      ],
      specs: {
        width_cm: 82.0,
        height_cm: 104.0,
        depth_cm: 88.0,
        seat_height_cm: 47.0,
        seat_depth_cm: 56.0,
        arm_height_cm: 65.0,
        weight_kg: 31.0,
        material: "wool_blend",
        frame_material: "solid_oak",
        color: "Oat Herringbone",
        assembly_required: false,
        delivery_tier: "two_man_white_glove",
        fire_safety_compliant: true,
        fire_safety_standard: "UK Furniture & Furnishings (Fire Safety) Regulations 1988 (BS 5852:2006)",
        fire_safety_cert: "BS-LON-2026-013",
        lead_time_days: 6,
      },
      supplierCostPennies: 36000,
    },
    {
      id: "prod_armchair_004",
      sku: "ACC-PRM-OR-VLV",
      title: "The Primrose Fluted Cocktail Chair in Burnt Orange Velvet",
      handle: "primrose-fluted-cocktail-chair-burnt-orange-velvet",
      subtitle: "Channel-tufted barrel back with tapered brushed brass stiletto legs",
      description: "Art deco glamour engineered for dressing rooms and living alcoves. Velvet tested to 60,000 Martindale rubs with stain-resistant protective nano-coating.",
      categoryId: "cat_armchairs",
      status: "published",
      pricePennies: 39900,
      compareAtPricePennies: 44900,
      vatRatePercent: 20.0,
      gtinBarcode: "5060123456014",
      thumbnailUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85",
      images: [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85"
      ],
      specs: {
        width_cm: 72.0,
        height_cm: 79.0,
        depth_cm: 74.0,
        seat_height_cm: 45.0,
        seat_depth_cm: 52.0,
        arm_height_cm: 60.0,
        weight_kg: 16.0,
        material: "velvet",
        frame_material: "brushed_brass",
        color: "Burnt Orange",
        assembly_required: true,
        assembly_time_mins: 10,
        delivery_tier: "standard_parcel",
        fire_safety_compliant: true,
        fire_safety_standard: "UK Furniture & Furnishings (Fire Safety) Regulations 1988 (BS 5852:2006)",
        fire_safety_cert: "BS-LON-2026-014",
        lead_time_days: 3,
      },
      supplierCostPennies: 19500,
    },
    {
      id: "prod_armchair_005",
      sku: "ACC-SHR-OTM-WHT",
      title: "The Shoreditch Bouclé Ottoman Stool & Storage Bench",
      handle: "shoreditch-boucle-ottoman-stool-storage-bench",
      subtitle: "Deep padded dressing stool with hidden storage compartment",
      description: "Cylindrical storage pouffe with soft-close hydraulic hinge and removable interior liner. Wrapped in thick looped bouclé fabric.",
      categoryId: "cat_armchairs",
      status: "published",
      pricePennies: 18900,
      compareAtPricePennies: 22900,
      vatRatePercent: 20.0,
      gtinBarcode: "5060123456015",
      thumbnailUrl: "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=1200&q=85",
      images: [
        "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=1200&q=85"
      ],
      specs: {
        width_cm: 50.0,
        height_cm: 46.0,
        depth_cm: 50.0,
        seat_height_cm: 46.0,
        weight_kg: 9.5,
        material: "boucle",
        frame_material: "engineered_hardwood",
        color: "Alabaster White",
        assembly_required: false,
        delivery_tier: "standard_parcel",
        fire_safety_compliant: true,
        fire_safety_standard: "UK Furniture & Furnishings (Fire Safety) Regulations 1988 (BS 5852:2006)",
        fire_safety_cert: "BS-LON-2026-015",
        lead_time_days: 3,
      },
      supplierCostPennies: 8800,
    },

    // --- SOFAS & SEATING (cat_sofas) ---
    {
      id: "prod_sofa_002",
      sku: "HEIR-BEL-FOR-LHC",
      title: "The Belgravia Left-Hand Corner Group in Forest Velvet",
      handle: "belgravia-left-hand-corner-group-forest-velvet",
      subtitle: "Generous corner chaise wrapped in stain-resistant British velvet",
      description: "Designed for expansive living rooms, the Belgravia corner group offers modular seating with plush padded bolsters and heavy hardwood frame.",
      categoryId: "cat_sofas",
      status: "published",
      pricePennies: 219900,
      compareAtPricePennies: 249900,
      vatRatePercent: 20.0,
      gtinBarcode: "5060123456002",
      thumbnailUrl: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=85",
      images: [
        "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=85"
      ],
      specs: {
        width_cm: 295.0,
        height_cm: 82.0,
        depth_cm: 165.0,
        seat_height_cm: 44.0,
        seat_depth_cm: 68.0,
        arm_height_cm: 62.0,
        weight_kg: 110.0,
        material: "velvet",
        frame_material: "engineered_hardwood",
        color: "Forest Green",
        assembly_required: true,
        assembly_time_mins: 15,
        doorway_clearance_min_cm: 72.0,
        delivery_tier: "two_man_white_glove",
        fire_safety_compliant: true,
        fire_safety_standard: "UK Furniture & Furnishings (Fire Safety) Regulations 1988 (BS 5852:2006)",
        fire_safety_cert: "BS-LON-2026-002",
        lead_time_days: 10,
      },
      supplierCostPennies: 115000,
    },
    {
      id: "prod_sofa_003",
      sku: "HEIR-MAY-LIN-2S",
      title: "The Mayfair 2-Seater Loveseat in Natural Linen",
      handle: "mayfair-2-seater-loveseat-natural-linen",
      subtitle: "Compact apartment loveseat with slubbed Belgian linen upholstery",
      description: "Ideal for London flats and Victorian reception rooms. Clean knife-edge cushions and slim tapered walnut legs.",
      categoryId: "cat_sofas",
      status: "published",
      pricePennies: 89900,
      compareAtPricePennies: 105000,
      vatRatePercent: 20.0,
      gtinBarcode: "5060123456003",
      thumbnailUrl: "https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=1200&q=85",
      images: [
        "https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=1200&q=85"
      ],
      specs: {
        width_cm: 168.0,
        height_cm: 80.0,
        depth_cm: 90.0,
        seat_height_cm: 45.0,
        seat_depth_cm: 58.0,
        arm_height_cm: 62.0,
        weight_kg: 48.0,
        material: "linen_blend",
        frame_material: "american_walnut",
        color: "Natural Flax",
        assembly_required: false,
        doorway_clearance_min_cm: 70.0,
        delivery_tier: "two_man_white_glove",
        fire_safety_compliant: true,
        fire_safety_standard: "UK Furniture & Furnishings (Fire Safety) Regulations 1988 (BS 5852:2006)",
        fire_safety_cert: "BS-LON-2026-003",
        lead_time_days: 5,
      },
      supplierCostPennies: 46000,
    },
    {
      id: "prod_sofa_004",
      sku: "HEIR-COT-CH-4S",
      title: "The Cotswold 4-Seater Deep Lounge Sofa in Charcoal Chenille",
      handle: "cotswold-4-seater-deep-lounge-sofa-charcoal-chenille",
      subtitle: "Ultra-deep 105cm lounging profile with stain-resistant weave",
      description: "Designed for movie nights and relaxed evenings. Premium feather-down filled cushions with solid beechwood inner framing.",
      categoryId: "cat_sofas",
      status: "published",
      pricePennies: 164900,
      compareAtPricePennies: 189900,
      vatRatePercent: 20.0,
      gtinBarcode: "5060123456004",
      thumbnailUrl: "https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?auto=format&fit=crop&w=1200&q=85",
      images: [
        "https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?auto=format&fit=crop&w=1200&q=85"
      ],
      specs: {
        width_cm: 245.0,
        height_cm: 86.0,
        depth_cm: 105.0,
        seat_height_cm: 46.0,
        seat_depth_cm: 66.0,
        arm_height_cm: 64.0,
        weight_kg: 82.0,
        material: "chenille",
        frame_material: "engineered_hardwood",
        color: "Charcoal Grey",
        assembly_required: false,
        doorway_clearance_min_cm: 74.0,
        delivery_tier: "two_man_white_glove",
        fire_safety_compliant: true,
        fire_safety_standard: "UK Furniture & Furnishings (Fire Safety) Regulations 1988 (BS 5852:2006)",
        fire_safety_cert: "BS-LON-2026-004",
        lead_time_days: 7,
      },
      supplierCostPennies: 84000,
    },
    {
      id: "prod_sofa_005",
      sku: "HEIR-RCH-SB-NVY",
      title: "The Richmond 3-Seater Velvet Chesterfield Sofa Bed in Navy",
      handle: "richmond-3-seater-velvet-chesterfield-sofa-bed-navy",
      subtitle: "Dual-action fold-out European pocket-sprung mattress with deep buttoning",
      description: "Iconic British rolled arms with deep button-tufting. Conceals a three-fold European mechanism with 12cm pocket sprung mattress.",
      categoryId: "cat_sofas",
      status: "published",
      pricePennies: 149900,
      compareAtPricePennies: 175000,
      vatRatePercent: 20.0,
      gtinBarcode: "5060123456005",
      thumbnailUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85",
      images: [
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85"
      ],
      specs: {
        width_cm: 224.0,
        height_cm: 80.0,
        depth_cm: 96.0,
        seat_height_cm: 48.0,
        seat_depth_cm: 60.0,
        arm_height_cm: 75.0,
        weight_kg: 96.0,
        material: "velvet",
        frame_material: "solid_oak",
        color: "Midnight Navy",
        assembly_required: false,
        doorway_clearance_min_cm: 75.0,
        delivery_tier: "two_man_white_glove",
        fire_safety_compliant: true,
        fire_safety_standard: "UK Furniture & Furnishings (Fire Safety) Regulations 1988 (BS 5852:2006)",
        fire_safety_cert: "BS-LON-2026-005",
        lead_time_days: 7,
      },
      supplierCostPennies: 76000,
    },

    // --- DINING ROOM SEATING (cat_dining) ---
    {
      id: "prod_dining_003",
      sku: "TIMB-MRL-WSH-PR",
      title: "The Marlow Wishbone Solid Oak Dining Chairs (Set of 2)",
      handle: "marlow-wishbone-solid-oak-dining-chairs-set-of-2",
      subtitle: "Steam-bent curved backrest with natural hand-woven papercord seat",
      description: "Classic mid-century silhouette engineered for ergonomic dining comfort. Sold as a pair.",
      categoryId: "cat_dining",
      status: "published",
      pricePennies: 34900,
      compareAtPricePennies: 39900,
      vatRatePercent: 20.0,
      gtinBarcode: "5060123456023",
      thumbnailUrl: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=85",
      images: [
        "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=85"
      ],
      specs: {
        width_cm: 54.0,
        height_cm: 76.0,
        depth_cm: 52.0,
        seat_height_cm: 45.0,
        weight_kg: 12.0,
        material: "none",
        frame_material: "solid_oak",
        color: "Natural Oak",
        assembly_required: false,
        delivery_tier: "standard_parcel",
        fire_safety_compliant: true,
        fire_safety_standard: "UK Quality Checked: Exempt (Solid Wood / Papercord)",
        fire_safety_cert: "WOOD-EXEMPT-002",
        lead_time_days: 3,
      },
      supplierCostPennies: 16800,
    },
    {
      id: "prod_dining_004",
      sku: "ACC-STJ-VLV-PR",
      title: "The St James Velvet Upholstered Dining Chairs (Set of 2)",
      handle: "st-james-velvet-upholstered-dining-chairs-pair",
      subtitle: "Contoured bucket seat in stain-resistant velvet with brass caps",
      description: "Luxuriously padded dining chairs with high-density foam and slender matte black steel legs with brass feet. Sold as a pair.",
      categoryId: "cat_dining",
      status: "published",
      pricePennies: 39900,
      compareAtPricePennies: 45900,
      vatRatePercent: 20.0,
      gtinBarcode: "5060123456024",
      thumbnailUrl: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=85",
      images: [
        "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=85"
      ],
      specs: {
        width_cm: 52.0,
        height_cm: 84.0,
        depth_cm: 58.0,
        seat_height_cm: 48.0,
        weight_kg: 15.0,
        material: "velvet",
        frame_material: "powder_coated_steel",
        color: "Warm Amber",
        assembly_required: true,
        assembly_time_mins: 15,
        delivery_tier: "standard_parcel",
        fire_safety_compliant: true,
        fire_safety_standard: "UK Furniture & Furnishings (Fire Safety) Regulations 1988 (BS 5852:2006)",
        fire_safety_cert: "BS-LON-2026-024",
        lead_time_days: 4,
      },
      supplierCostPennies: 19500,
    },
  ];

  for (const p of curatedProducts) {
    await conn.query(`
      INSERT INTO products (
        id, sku, title, handle, subtitle, description, category_id, status,
        price_pennies, compare_at_price_pennies, vat_rate_percent, gtin_barcode,
        thumbnail_url, images_json, variants_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        sku = VALUES(sku),
        title = VALUES(title),
        handle = VALUES(handle),
        subtitle = VALUES(subtitle),
        description = VALUES(description),
        category_id = VALUES(category_id),
        status = VALUES(status),
        price_pennies = VALUES(price_pennies),
        compare_at_price_pennies = VALUES(compare_at_price_pennies),
        vat_rate_percent = VALUES(vat_rate_percent),
        thumbnail_url = VALUES(thumbnail_url),
        images_json = VALUES(images_json),
        updated_at = NOW()
    `, [
      p.id,
      p.sku,
      p.title,
      p.handle,
      p.subtitle,
      p.description,
      p.categoryId,
      p.status,
      p.pricePennies,
      p.compareAtPricePennies,
      p.vatRatePercent,
      p.gtinBarcode,
      p.thumbnailUrl,
      JSON.stringify(p.images),
      JSON.stringify([]),
    ]);

    const s = p.specs;
    await conn.query(`
      INSERT INTO furniture_specs (
        id, product_id, width_cm, height_cm, depth_cm, seat_height_cm,
        seat_depth_cm, arm_height_cm, weight_kg, material, frame_material,
        color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
        delivery_tier, fire_safety_compliant, fire_safety_standard,
        fire_safety_cert, lead_time_days, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        width_cm = VALUES(width_cm),
        height_cm = VALUES(height_cm),
        depth_cm = VALUES(depth_cm),
        seat_height_cm = VALUES(seat_height_cm),
        seat_depth_cm = VALUES(seat_depth_cm),
        arm_height_cm = VALUES(arm_height_cm),
        weight_kg = VALUES(weight_kg),
        material = VALUES(material),
        frame_material = VALUES(frame_material),
        color = VALUES(color),
        assembly_required = VALUES(assembly_required),
        assembly_time_mins = VALUES(assembly_time_mins),
        doorway_clearance_min_cm = VALUES(doorway_clearance_min_cm),
        delivery_tier = VALUES(delivery_tier),
        fire_safety_compliant = VALUES(fire_safety_compliant),
        fire_safety_standard = VALUES(fire_safety_standard),
        fire_safety_cert = VALUES(fire_safety_cert),
        lead_time_days = VALUES(lead_time_days)
    `, [
      `spec_${p.id}`,
      p.id,
      s.width_cm,
      s.height_cm,
      s.depth_cm,
      s.seat_height_cm ?? null,
      s.seat_depth_cm ?? null,
      s.arm_height_cm ?? null,
      s.weight_kg,
      s.material,
      s.frame_material,
      s.color,
      s.assembly_required ? 1 : 0,
      s.assembly_time_mins ?? 0,
      s.doorway_clearance_min_cm ?? 76.20,
      s.delivery_tier,
      s.fire_safety_compliant ? 1 : 0,
      s.fire_safety_standard,
      s.fire_safety_cert,
      s.lead_time_days,
    ]);

    await conn.query(`
      INSERT INTO supplier_feed_items (
        id, supplier_id, supplier_sku, product_id, source_url,
        cost_price_pennies, shipping_cost_pennies, markup_percentage,
        retail_price_pennies, stock_level, lead_time_days, last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        cost_price_pennies = VALUES(cost_price_pennies),
        retail_price_pennies = VALUES(retail_price_pennies),
        stock_level = VALUES(stock_level),
        last_synced_at = NOW()
    `, [
      `sup_${p.id}`,
      "uk_accent_studios",
      p.sku,
      p.id,
      p.thumbnailUrl,
      p.supplierCostPennies,
      2500,
      40,
      p.pricePennies,
      25,
      s.lead_time_days,
    ]);
  }
  console.log(`Inserted/Updated ${curatedProducts.length} luxury curated products with specs!`);

  console.log("5. Checking final category product distribution...");
  const [counts] = await conn.query(`
    SELECT c.id, c.name, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id AND p.status = 'published'
    GROUP BY c.id, c.name
    ORDER BY c.id
  `);
  console.table(counts);

  await conn.end();
  console.log("Database migration finished successfully!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
