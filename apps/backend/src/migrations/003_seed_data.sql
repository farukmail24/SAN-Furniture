-- Insert Product Categories

INSERT INTO product_categories (id, name, handle, description, is_active)
VALUES ('cat_sofas', 'Sofas & Corner Lounges', 'sofas', 'Bespoke handcrafted sofas, deep-seated corner groups, and luxury chaises upholstered in durable bouclé and velvet.', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO product_categories (id, name, handle, description, is_active)
VALUES ('cat_armchairs', 'Accent Armchairs & Stools', 'armchairs', 'Sculptural statement armchairs, reading chairs, and ergonomic occasional seating.', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO product_categories (id, name, handle, description, is_active)
VALUES ('cat_dining', 'Dining Tables & Chairs', 'dining', 'Solid European oak, American walnut, and Italian marble dining collections engineered for family living.', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO product_categories (id, name, handle, description, is_active)
VALUES ('cat_beds', 'Luxury Beds & Wardrobes', 'beds', 'Ottoman storage beds, upholstered headboards, and solid hardwood wardrobes.', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO product_categories (id, name, handle, description, is_active)
VALUES ('cat_living', 'Coffee & Occasional Tables', 'living-tables', 'Fluted wood, brushed brass, and architectural stone coffee, side, and console tables.', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;


-- Insert Products and Furniture Specs

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_sofa_001',
  'The Kensington 3-Seater Sofa in Oat Bouclé',
  'kensington-3-seater-sofa-oat-boucle',
  'Architectural profile with solid oak plinth and textured bouclé',
  'The Kensington pairs deep proportions with sculptural contours. Features high-resilience foam wrapped in feather-down pocketing.',
  'cat_sofas',
  'published',
  129900,
  149900,
  20,
  true,
  '5060123456001',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_sofa_001',
  218,
  84,
  98,
  45,
  64,
  62,
  68,
  'boucle',
  'solid_oak',
  'Oat Cream',
  false,
  NULL,
  75,
  'two_man_white_glove',
  true,
  'BS 5852: Part 1: 1979',
  'BS-LON-2026-001',
  7
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_heirloom_sofas',
  'HEIR-KEN-OAT-3S',
  'prod_sofa_001',
  68000,
  4500,
  45.0,
  129900,
  12,
  7
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_sofa_002',
  'The Belgravia Left-Hand Corner Group in Forest Velvet',
  'belgravia-left-hand-corner-group-forest-velvet',
  'Generous corner chaise wrapped in stain-resistant British velvet',
  'Designed for expansive living rooms, the Belgravia corner group offers modular seating with plush padded bolsters.',
  'cat_sofas',
  'published',
  219900,
  249900,
  20,
  true,
  '5060123456002',
  'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_sofa_002',
  295,
  82,
  165,
  44,
  68,
  NULL,
  110,
  'velvet',
  'engineered_hardwood',
  'Forest Green',
  true,
  15,
  72,
  'two_man_white_glove',
  true,
  'BS 5852: Part 1: 1979',
  'BS-LON-2026-002',
  10
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_heirloom_sofas',
  'HEIR-BEL-FOR-LHC',
  'prod_sofa_002',
  115000,
  6500,
  45.0,
  219900,
  6,
  10
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_sofa_003',
  'The Mayfair 2-Seater Loveseat in Natural Linen',
  'mayfair-2-seater-loveseat-natural-linen',
  'Compact apartment loveseat with slubbed Belgian linen upholstery',
  'Ideal for London flats and Victorian reception rooms. Clean knife-edge cushions and slim tapered walnut legs.',
  'cat_sofas',
  'published',
  89900,
  105000,
  20,
  true,
  '5060123456003',
  'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_sofa_003',
  168,
  80,
  90,
  45,
  NULL,
  NULL,
  48,
  'linen_blend',
  'american_walnut',
  'Natural Flax',
  false,
  NULL,
  70,
  'two_man_white_glove',
  true,
  'BS 5852: Part 1: 1979',
  'BS-LON-2026-003',
  5
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_heirloom_sofas',
  'HEIR-MAY-LIN-2S',
  'prod_sofa_003',
  46000,
  3500,
  45.0,
  89900,
  15,
  5
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_sofa_004',
  'The Cotswold 4-Seater Deep Lounge Sofa in Charcoal Chenille',
  'cotswold-4-seater-deep-lounge-sofa-charcoal-chenille',
  'Ultra-deep 105cm lounging profile with stain-resistant weave',
  'Designed for movie nights and relaxed evenings. Premium feather-down filled cushions with solid beechwood inner framing.',
  'cat_sofas',
  'published',
  164900,
  NULL,
  20,
  true,
  '5060123456004',
  'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_sofa_004',
  245,
  86,
  105,
  46,
  NULL,
  NULL,
  82,
  'chenille',
  'engineered_hardwood',
  'Charcoal Slate',
  false,
  NULL,
  80,
  'two_man_white_glove',
  true,
  'BS 5852: Part 1: 1979',
  'BS-LON-2026-004',
  8
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_heirloom_sofas',
  'HEIR-COT-CH-4S',
  'prod_sofa_004',
  86000,
  5000,
  45.0,
  164900,
  8,
  8
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_sofa_005',
  'The Richmond Modern Chesterfield in Cognac Top-Grain Leather',
  'richmond-modern-chesterfield-cognac-leather',
  'Heritage button-tufted silhouette with Italian pull-up leather',
  'A contemporary reinvention of the British Chesterfield with deeper seating, lower back, and darkened brass casters.',
  'cat_sofas',
  'published',
  239900,
  279900,
  20,
  true,
  '5060123456005',
  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_sofa_005',
  228,
  76,
  95,
  43,
  NULL,
  NULL,
  74,
  'top_grain_leather',
  'solid_oak',
  'Cognac Amber',
  false,
  NULL,
  75,
  'two_man_white_glove',
  true,
  'BS 5852: Part 1: 1979',
  'BS-LON-2026-005',
  12
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_heritage_leather',
  'HERIT-RCH-COG-3S',
  'prod_sofa_005',
  129000,
  5500,
  45.0,
  239900,
  5,
  12
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_sofa_006',
  'The Hampstead 3-Piece Curved Sectional in Bone Bouclé',
  'hampstead-3-piece-curved-sectional-bone-boucle',
  'Sculptural serpentine silhouette with seamless joinery',
  'Fluid curves and organic architecture make the Hampstead a breathtaking centrepiece for modern open-plan British residences.',
  'cat_sofas',
  'published',
  289900,
  320000,
  20,
  true,
  '5060123456006',
  'https://images.unsplash.com/photo-1512212621149-107ffe572d2f?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_sofa_006',
  320,
  78,
  140,
  42,
  NULL,
  NULL,
  125,
  'boucle',
  'engineered_hardwood',
  'Bone White',
  true,
  20,
  78,
  'two_man_white_glove',
  true,
  'BS 5852: Part 1: 1979',
  'BS-LON-2026-006',
  14
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_heirloom_sofas',
  'HEIR-HMP-CRV-SEC',
  'prod_sofa_006',
  154000,
  7500,
  45.0,
  289900,
  4,
  14
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_sofa_007',
  'The Chelsea Daybed Chaise in Rust Velvet',
  'chelsea-daybed-chaise-rust-velvet',
  'Single-cushion architectural lounger with brass cylinder bolster',
  'A sculptural daybed upholstered in lustrous rust velvet with a heavy solid walnut base and bespoke brass details.',
  'cat_sofas',
  'published',
  119900,
  NULL,
  20,
  true,
  '5060123456007',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_sofa_007',
  190,
  65,
  85,
  42,
  NULL,
  NULL,
  52,
  'velvet',
  'american_walnut',
  'Rust Terracotta',
  false,
  NULL,
  NULL,
  'two_man_white_glove',
  true,
  'BS 5852: Part 1: 1979',
  'BS-LON-2026-007',
  6
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_heirloom_sofas',
  'HEIR-CHL-DB-RST',
  'prod_sofa_007',
  62000,
  4000,
  45.0,
  119900,
  9,
  6
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_sofa_008',
  'The Oxford Slipcovered 3-Seater in Pure Washed Linen',
  'oxford-slipcovered-3-seater-washed-linen',
  'Removable machine-washable slipcover with relaxed skirt',
  'Effortless country elegance. The Oxford slipcover is woven from 100% pre-washed French flax linen with reinforced inner seams.',
  'cat_sofas',
  'published',
  144900,
  NULL,
  20,
  true,
  '5060123456008',
  'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_sofa_008',
  215,
  85,
  95,
  46,
  NULL,
  NULL,
  62,
  'linen_blend',
  'solid_oak',
  'Washed Chalk',
  false,
  NULL,
  NULL,
  'two_man_white_glove',
  true,
  'BS 5852: Part 1: 1979',
  'BS-LON-2026-008',
  7
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_heirloom_sofas',
  'HEIR-OXF-SLP-3S',
  'prod_sofa_008',
  76000,
  4500,
  45.0,
  144900,
  11,
  7
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_sofa_009',
  'The Bloomsbury Reversible Chaise Sofa in Midnight Navy',
  'bloomsbury-reversible-chaise-sofa-midnight-navy',
  'Flexible left or right chaise configuration with integrated ottoman storage',
  'Versatile modular seating with an easily reversible chaise cushion and heavy-duty steel pocket-sprung foundation.',
  'cat_sofas',
  'published',
  139900,
  159900,
  20,
  true,
  '5060123456009',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_sofa_009',
  232,
  84,
  155,
  45,
  NULL,
  NULL,
  78,
  'velvet',
  'engineered_hardwood',
  'Midnight Navy',
  true,
  15,
  NULL,
  'two_man_white_glove',
  true,
  'BS 5852: Part 1: 1979',
  'BS-LON-2026-009',
  6
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_heirloom_sofas',
  'HEIR-BLM-REV-NVY',
  'prod_sofa_009',
  72000,
  5000,
  45.0,
  139900,
  10,
  6
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_sofa_010',
  'The Soho Low-Slung Modular 4-Piece in Moss Bouclé',
  'soho-low-slung-modular-4-piece-moss-boucle',
  'Lounge-forward Italian profile with concealed crocodile clips',
  'Ground-hugging 38cm seat height with expansive deep foam and feather layering. Connect or rearrange freely.',
  'cat_sofas',
  'published',
  269900,
  NULL,
  20,
  true,
  '5060123456010',
  'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_sofa_010',
  310,
  72,
  190,
  38,
  NULL,
  NULL,
  118,
  'boucle',
  'engineered_hardwood',
  'Moss Sage',
  true,
  20,
  NULL,
  'two_man_white_glove',
  true,
  'BS 5852: Part 1: 1979',
  'BS-LON-2026-010',
  12
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_heirloom_sofas',
  'HEIR-SOH-MOD-MSS',
  'prod_sofa_010',
  142000,
  7000,
  45.0,
  269900,
  5,
  12
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_armchair_001',
  'The Regent 360° Swivel Armchair in Cream Bouclé',
  'regent-360-swivel-armchair-cream-boucle',
  'Cocooning circular silhouette on concealed ball-bearing swivel base',
  'Sculptural curved armchair offering 360-degree silent rotation. Upholstered in dense wool-blend bouclé.',
  'cat_armchairs',
  'published',
  54900,
  62000,
  20,
  true,
  '5060123456011',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_armchair_001',
  86,
  78,
  88,
  43,
  NULL,
  NULL,
  28,
  'boucle',
  'powder_coated_steel',
  'Cream',
  false,
  NULL,
  NULL,
  'two_man_white_glove',
  true,
  'BS 5852: Part 1: 1979',
  'BS-LON-2026-011',
  4
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_accent_studios',
  'ACC-REG-SWV-CRM',
  'prod_armchair_001',
  28000,
  2500,
  45.0,
  54900,
  22,
  4
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_armchair_002',
  'The Fitzrovia Mid-Century Lounge Chair in Saddle Leather',
  'fitzrovia-mid-century-lounge-chair-saddle-leather',
  'Sculpted American walnut timber frame with aniline leather sling',
  'Honouring Danish modernist architecture, the Fitzrovia features exposed mortise-and-tenon walnut joinery and hand-stitched leather.',
  'cat_armchairs',
  'published',
  74900,
  NULL,
  20,
  true,
  '5060123456012',
  'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_armchair_002',
  74,
  82,
  84,
  41,
  NULL,
  NULL,
  22,
  'top_grain_leather',
  'american_walnut',
  'Saddle Tan',
  false,
  NULL,
  NULL,
  'two_man_white_glove',
  true,
  'BS 5852: Part 1: 1979',
  'BS-LON-2026-012',
  5
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_accent_studios',
  'ACC-FTZ-WAL-SAD',
  'prod_armchair_002',
  39000,
  2500,
  45.0,
  74900,
  14,
  5
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_armchair_003',
  'The Marylebone Wingback Fireside Chair in Herringbone Wool',
  'marylebone-wingback-fireside-chair-herringbone-wool',
  'High-backed traditional wing chair with solid turned oak legs',
  'Classic British wingback tailored in Yorkshire-milled herringbone wool. Provides lumbar contouring and deep shoulder support.',
  'cat_armchairs',
  'published',
  69900,
  79900,
  20,
  true,
  '5060123456013',
  'https://images.unsplash.com/photo-1580481077195-c22ae007f3c4?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_armchair_003',
  82,
  104,
  88,
  47,
  NULL,
  NULL,
  31,
  'wool_blend',
  'solid_oak',
  'Oat Herringbone',
  false,
  NULL,
  NULL,
  'two_man_white_glove',
  true,
  'BS 5852: Part 1: 1979',
  'BS-LON-2026-013',
  6
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_accent_studios',
  'ACC-MB-WNG-HRB',
  'prod_armchair_003',
  36000,
  2500,
  45.0,
  69900,
  16,
  6
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_armchair_004',
  'The Primrose Fluted Cocktail Chair in Burnt Orange Velvet',
  'primrose-fluted-cocktail-chair-burnt-orange-velvet',
  'Channel-tufted barrel back with tapered brushed brass stiletto legs',
  'Art deco glamour engineered for dressing rooms and living alcoves. Velvet tested to 60,000 Martindale rubs.',
  'cat_armchairs',
  'published',
  39900,
  NULL,
  20,
  true,
  '5060123456014',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_armchair_004',
  72,
  79,
  74,
  45,
  NULL,
  NULL,
  16,
  'velvet',
  'brushed_brass',
  'Burnt Orange',
  true,
  10,
  NULL,
  'standard_parcel',
  true,
  'BS 5852: Part 1: 1979',
  'BS-LON-2026-014',
  3
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_accent_studios',
  'ACC-PRM-OR-VLV',
  'prod_armchair_004',
  19500,
  1500,
  45.0,
  39900,
  28,
  3
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_armchair_005',
  'The Shoreditch Bouclé Ottoman Stool & Storage Bench',
  'shoreditch-boucle-ottoman-stool-storage-bench',
  'Deep padded dressing stool with hidden storage compartment',
  'Cylindrical storage pouffe with soft-close hydraulic hinge and removable interior liner.',
  'cat_armchairs',
  'published',
  18900,
  NULL,
  20,
  true,
  '5060123456015',
  'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_armchair_005',
  50,
  46,
  50,
  46,
  NULL,
  NULL,
  9.5,
  'boucle',
  'engineered_hardwood',
  'Alabaster White',
  false,
  NULL,
  NULL,
  'standard_parcel',
  true,
  'BS 5852: Part 1: 1979',
  'BS-LON-2026-015',
  3
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_accent_studios',
  'ACC-SHR-OTM-WHT',
  'prod_armchair_005',
  8800,
  950,
  45.0,
  18900,
  45,
  3
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_dining_001',
  'The Henley Extendable Solid Oak Dining Table (180–240cm)',
  'henley-extendable-solid-oak-dining-table',
  'Solid European white oak with seamless butterfly extension mechanism',
  'Comfortably seats 6 to 10 guests. Crafted from sustainably harvested European oak with invisible matte protective lacquer.',
  'cat_dining',
  'published',
  124900,
  145000,
  20,
  true,
  '5060123456021',
  'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_dining_001',
  180,
  76,
  95,
  NULL,
  NULL,
  NULL,
  84,
  'none',
  'solid_oak',
  'Natural White Oak',
  true,
  20,
  NULL,
  'pallet',
  true,
  'BS 5852: Exempt (Solid Wood)',
  'WOOD-EXEMPT-001',
  5
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_timber_craft',
  'TIMB-HEN-OAK-EXT',
  'prod_dining_001',
  62000,
  4500,
  45.0,
  124900,
  18,
  5
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_dining_002',
  'The Carrara Calacatta Marble Round Dining Table (130cm)',
  'carrara-calacatta-marble-round-dining-table',
  'Hand-honed Italian Calacatta marble slab on solid fluted oak pedestal',
  'Circular dining table seating 4-6 diners. Natural grey and gold veining sealed with anti-etch nano-coating.',
  'cat_dining',
  'published',
  169900,
  199900,
  20,
  true,
  '5060123456022',
  'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_dining_002',
  130,
  75,
  130,
  NULL,
  NULL,
  NULL,
  132,
  'none',
  'marble',
  'White / Gold Calacatta',
  true,
  25,
  NULL,
  'two_man_white_glove',
  true,
  'BS 5852: Exempt (Marble)',
  'STONE-EXEMPT-001',
  8
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_stone_atelier',
  'STN-CAR-RND-130',
  'prod_dining_002',
  89000,
  7500,
  45.0,
  169900,
  7,
  8
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_dining_003',
  'The Marlow Wishbone Solid Oak Dining Chairs (Set of 2)',
  'marlow-wishbone-solid-oak-dining-chairs-set-of-2',
  'Steam-bent curved backrest with natural hand-woven papercord seat',
  'Classic mid-century silhouette engineered for ergonomic dining comfort. Sold as a pair.',
  'cat_dining',
  'published',
  34900,
  NULL,
  20,
  true,
  '5060123456023',
  'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_dining_003',
  54,
  76,
  52,
  45,
  NULL,
  NULL,
  12,
  'none',
  'solid_oak',
  'Natural Oak',
  false,
  NULL,
  NULL,
  'standard_parcel',
  true,
  'BS 5852: Exempt (Timber/Papercord)',
  'WOOD-EXEMPT-002',
  3
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_timber_craft',
  'TIMB-MRL-WSH-PR',
  'prod_dining_003',
  16800,
  1500,
  45.0,
  34900,
  32,
  3
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_dining_004',
  'The St James Velvet Upholstered Dining Chairs (Set of 2)',
  'st-james-velvet-upholstered-dining-chairs-pair',
  'Contoured bucket seat in stain-resistant velvet with brass caps',
  'Luxuriously padded dining chairs with high-density foam and slender matte black steel legs with brass feet.',
  'cat_dining',
  'published',
  39900,
  NULL,
  20,
  true,
  '5060123456024',
  'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_dining_004',
  52,
  84,
  58,
  48,
  NULL,
  NULL,
  15,
  'velvet',
  'powder_coated_steel',
  'Warm Amber',
  true,
  15,
  NULL,
  'standard_parcel',
  true,
  'BS 5852: Part 1: 1979',
  'BS-LON-2026-024',
  4
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_accent_studios',
  'ACC-STJ-VLV-PR',
  'prod_dining_004',
  19500,
  1800,
  45.0,
  39900,
  24,
  4
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_bed_001',
  'The Balmoral King Ottoman Storage Bed in Sand Linen',
  'balmoral-king-ottoman-storage-bed-sand-linen',
  'Gas-lift hydraulic storage with deep vertical channel headboard',
  'UK King size bed (150x200cm mattress fit) featuring 900 litres of concealed under-bed storage space and sprung birch slats.',
  'cat_beds',
  'published',
  139900,
  165000,
  20,
  true,
  '5060123456031',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_bed_001',
  162,
  130,
  215,
  NULL,
  NULL,
  NULL,
  88,
  'linen_blend',
  'engineered_hardwood',
  'Sandstone',
  true,
  45,
  NULL,
  'two_man_white_glove',
  true,
  'BS 5852: Part 1: 1979',
  'BS-LON-2026-031',
  7
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_slumber_beds',
  'SLUM-BAL-OTM-KNG',
  'prod_bed_001',
  71000,
  5500,
  45.0,
  139900,
  14,
  7
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_bed_002',
  'The Westminster Super King Winged Bed in Slate Bouclé',
  'westminster-super-king-winged-bed-slate-boucle',
  'Expansive 145cm grand winged headboard for bespoke master suites',
  'UK Super King (180x200cm mattress fit). Dramatic wing profile upholstered in heavy-duty commercial-grade bouclé.',
  'cat_beds',
  'published',
  169900,
  NULL,
  20,
  true,
  '5060123456032',
  'https://images.unsplash.com/photo-1540518614846-7ede433c4ef7?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_bed_002',
  205,
  145,
  220,
  NULL,
  NULL,
  NULL,
  95,
  'boucle',
  'solid_oak',
  'Slate Grey',
  true,
  40,
  NULL,
  'two_man_white_glove',
  true,
  'BS 5852: Part 1: 1979',
  'BS-LON-2026-032',
  9
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_slumber_beds',
  'SLUM-WST-WNG-SKG',
  'prod_bed_002',
  88000,
  6000,
  45.0,
  169900,
  8,
  9
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_bed_003',
  'The Greenwich Solid Walnut 3-Door Wardrobe',
  'greenwich-solid-walnut-3-door-wardrobe',
  'Full-length bevelled mirror, double hanging rails, and soft-close drawers',
  'Architectural wardrobe with rich American walnut grain and integrated recessed handles.',
  'cat_beds',
  'published',
  189900,
  219900,
  20,
  true,
  '5060123456033',
  'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_bed_003',
  155,
  205,
  62,
  NULL,
  NULL,
  NULL,
  115,
  'none',
  'american_walnut',
  'Warm Walnut',
  true,
  60,
  NULL,
  'two_man_white_glove',
  true,
  'BS 5852: Exempt (Timber)',
  'WOOD-EXEMPT-003',
  10
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_timber_craft',
  'TIMB-GRN-WDR-3D',
  'prod_bed_003',
  98000,
  7000,
  45.0,
  189900,
  5,
  10
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_living_001',
  'The Battersea Fluted Oak Oval Coffee Table',
  'battersea-fluted-oak-oval-coffee-table',
  'Tambour fluted solid oak pedestal base with bevelled oval top',
  'Soft curved oval silhouette designed to preserve flow in central living areas. Finished with durable heat-resistant oil.',
  'cat_living',
  'published',
  49900,
  58000,
  20,
  true,
  '5060123456041',
  'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_living_001',
  120,
  42,
  65,
  NULL,
  NULL,
  NULL,
  24,
  'none',
  'solid_oak',
  'Natural Oak',
  false,
  NULL,
  NULL,
  'standard_parcel',
  true,
  'BS 5852: Exempt (Wood)',
  'WOOD-EXEMPT-004',
  3
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_timber_craft',
  'TIMB-BAT-FLT-COF',
  'prod_living_001',
  24000,
  2000,
  45.0,
  49900,
  25,
  3
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;

INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, is_fire_safety_certified, gtin_barcode, thumbnail_url
) VALUES (
  'prod_living_002',
  'The Knightsbridge Brushed Brass & Tempered Glass Console Table',
  'knightsbridge-brushed-brass-glass-console-table',
  'Slender 30cm hallway depth with dual-tier 10mm tempered glass shelves',
  'Pencil-slim profile designed for Victorian entrance hallways and behind floating sofas. Hand-brushed brass finish.',
  'cat_living',
  'published',
  44900,
  NULL,
  20,
  true,
  '5060123456042',
  'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=85'
) ON CONFLICT (id) DO UPDATE SET price_pennies = EXCLUDED.price_pennies, status = EXCLUDED.status;

INSERT INTO furniture_specs (
  product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_certificate, lead_time_days
) VALUES (
  'prod_living_002',
  110,
  80,
  30,
  NULL,
  NULL,
  NULL,
  26,
  'none',
  'brushed_brass',
  'Brushed Brass / Clear Glass',
  true,
  15,
  NULL,
  'pallet',
  true,
  'BS 5852: Exempt (Metal/Glass)',
  'MET-EXEMPT-001',
  4
) ON CONFLICT (product_id) DO UPDATE SET width_cm = EXCLUDED.width_cm, delivery_tier = EXCLUDED.delivery_tier;

INSERT INTO supplier_feed_items (
  supplier_id, supplier_sku, internal_product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  'uk_stone_atelier',
  'STN-KNT-BRS-CNS',
  'prod_living_002',
  22000,
  2500,
  45.0,
  44900,
  19,
  4
) ON CONFLICT (supplier_id, supplier_sku) DO UPDATE SET stock_level = EXCLUDED.stock_level, cost_price_pennies = EXCLUDED.cost_price_pennies;