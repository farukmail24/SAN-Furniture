-- ====================================================================
-- SAN FURNITURE (UK) - HIGH-PERFORMANCE MYSQL DATABASE SCHEMA & SEED
-- Compatible with MySQL 8.0+ & MariaDB 10.4+ (phpMyAdmin / XAMPP)
-- Database: san_furniture
-- Collation: utf8mb4_unicode_ci
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `san_furniture` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `san_furniture`;

-- 1. PRODUCT CATEGORIES TABLE
DROP TABLE IF EXISTS `furniture_specs`;
DROP TABLE IF EXISTS `supplier_feed_items`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `postcode_zones`;
DROP TABLE IF EXISTS `order_po_dispatches`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `security_ip_jail`;
DROP TABLE IF EXISTS `admin_audit_logs`;

CREATE TABLE `categories` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `handle` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `hero_image` VARCHAR(512) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_category_handle` (`handle`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. PRODUCTS TABLE (UK Dropshipping Master Table)
CREATE TABLE `products` (
  `id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `handle` VARCHAR(255) NOT NULL,
  `subtitle` VARCHAR(255) DEFAULT NULL,
  `description` TEXT,
  `category_id` VARCHAR(64) NOT NULL,
  `status` ENUM('published','draft','out_of_stock') NOT NULL DEFAULT 'published',
  `price_pennies` INT NOT NULL COMMENT 'Price in GBP integer pennies (e.g. £1299.00 = 129900)',
  `compare_at_price_pennies` INT DEFAULT NULL,
  `vat_rate_percent` DECIMAL(5,2) NOT NULL DEFAULT 20.00 COMMENT 'HMRC UK Standard VAT (20%)',
  `gtin_barcode` VARCHAR(64) DEFAULT NULL,
  `thumbnail_url` VARCHAR(512) NOT NULL,
  `images_json` LONGTEXT DEFAULT NULL COMMENT 'JSON array of high-res image URLs',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_product_handle` (`handle`),
  KEY `idx_prod_cat_status_price` (`category_id`, `status`, `price_pennies`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. FURNITURE SPECIFICATIONS & UK STATUTORY COMPLIANCE
CREATE TABLE `furniture_specs` (
  `id` VARCHAR(64) NOT NULL,
  `product_id` VARCHAR(64) NOT NULL,
  `width_cm` DECIMAL(6,2) NOT NULL,
  `height_cm` DECIMAL(6,2) NOT NULL,
  `depth_cm` DECIMAL(6,2) NOT NULL,
  `seat_height_cm` DECIMAL(6,2) DEFAULT NULL,
  `seat_depth_cm` DECIMAL(6,2) DEFAULT NULL,
  `arm_height_cm` DECIMAL(6,2) DEFAULT NULL,
  `weight_kg` DECIMAL(6,2) NOT NULL,
  `material` VARCHAR(100) NOT NULL COMMENT 'boucle, velvet, linen, solid_oak, etc.',
  `frame_material` VARCHAR(100) NOT NULL COMMENT 'solid_oak, engineered_hardwood, steel',
  `color` VARCHAR(100) NOT NULL,
  `assembly_required` TINYINT(1) NOT NULL DEFAULT 0,
  `assembly_time_mins` INT DEFAULT NULL,
  `doorway_clearance_min_cm` DECIMAL(6,2) NOT NULL DEFAULT 76.20 COMMENT 'UK Standard Doorway Clearance (30 inches)',
  `delivery_tier` ENUM('standard_parcel','pallet','two_man_white_glove') NOT NULL DEFAULT 'standard_parcel',
  `fire_safety_compliant` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'UK Furniture and Furnishings Fire Safety Regs 1988',
  `fire_safety_standard` VARCHAR(100) NOT NULL DEFAULT 'BS 5852: Part 1: 1979',
  `fire_safety_cert` VARCHAR(100) NOT NULL DEFAULT 'BS-LON-2026-CERT',
  `lead_time_days` INT NOT NULL DEFAULT 7,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_specs_product` (`product_id`),
  CONSTRAINT `fk_specs_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. DROPSHIP SUPPLIER FEED RECONCILIATION
CREATE TABLE `supplier_feed_items` (
  `id` VARCHAR(64) NOT NULL,
  `supplier_id` VARCHAR(100) NOT NULL,
  `supplier_sku` VARCHAR(255) NOT NULL,
  `product_id` VARCHAR(64) NOT NULL,
  `cost_price_pennies` INT NOT NULL COMMENT 'Supplier wholesale cost in pennies',
  `shipping_cost_pennies` INT NOT NULL DEFAULT 0,
  `markup_percentage` DECIMAL(5,2) NOT NULL DEFAULT 35.00,
  `retail_price_pennies` INT NOT NULL,
  `stock_level` INT NOT NULL DEFAULT 0,
  `lead_time_days` INT NOT NULL DEFAULT 7,
  `last_synced_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_supplier_sku` (`supplier_id`, `supplier_sku`),
  KEY `idx_supplier_product` (`product_id`),
  CONSTRAINT `fk_supplier_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. UK POSTCODE SURCHARGE & LOGISTICS ZONES
CREATE TABLE `postcode_zones` (
  `id` VARCHAR(64) NOT NULL,
  `zone_code` VARCHAR(50) NOT NULL,
  `zone_name` VARCHAR(100) NOT NULL,
  `prefix_list` TEXT NOT NULL COMMENT 'Comma-separated UK postal prefixes',
  `surcharge_pennies` INT NOT NULL DEFAULT 0,
  `lead_time_extra_days` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_zone_code` (`zone_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. ORDERS & FULFILLMENT TABLE
CREATE TABLE `orders` (
  `id` VARCHAR(64) NOT NULL,
  `order_number` VARCHAR(100) NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_email` VARCHAR(255) NOT NULL,
  `customer_phone` VARCHAR(50) DEFAULT NULL,
  `shipping_address` TEXT NOT NULL,
  `shipping_postcode` VARCHAR(20) NOT NULL,
  `shipping_zone` VARCHAR(50) NOT NULL DEFAULT 'mainland_uk',
  `delivery_tier` VARCHAR(50) NOT NULL DEFAULT 'two_man_white_glove',
  `subtotal_pennies` INT NOT NULL,
  `shipping_pennies` INT NOT NULL DEFAULT 0,
  `vat_pennies` INT NOT NULL,
  `total_pennies` INT NOT NULL,
  `payment_status` ENUM('pending','paid','refunded','failed') NOT NULL DEFAULT 'pending',
  `fulfillment_status` ENUM('unfulfilled','po_dispatched','in_transit','delivered') NOT NULL DEFAULT 'unfulfilled',
  `stripe_payment_intent_id` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_order_number` (`order_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. AUTOMATED SUPPLIER PURCHASE ORDERS (PO)
CREATE TABLE `order_po_dispatches` (
  `id` VARCHAR(64) NOT NULL,
  `po_number` VARCHAR(100) NOT NULL,
  `order_id` VARCHAR(64) NOT NULL,
  `supplier_id` VARCHAR(100) NOT NULL,
  `item_count` INT NOT NULL DEFAULT 1,
  `delivery_tier` VARCHAR(50) NOT NULL DEFAULT 'two_man_white_glove',
  `status` ENUM('pending','dispatched','acknowledged','delivered') NOT NULL DEFAULT 'dispatched',
  `tracking_number` VARCHAR(255) DEFAULT NULL,
  `carrier` VARCHAR(100) DEFAULT NULL,
  `dispatched_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_po_number` (`po_number`),
  KEY `idx_po_order` (`order_id`),
  CONSTRAINT `fk_po_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. ENTERPRISE BRUTE FORCE SECURITY & IP JAIL
CREATE TABLE `security_ip_jail` (
  `id` VARCHAR(64) NOT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `strike_count` INT NOT NULL DEFAULT 1,
  `reason` VARCHAR(255) NOT NULL,
  `locked_until` TIMESTAMP NULL DEFAULT NULL,
  `is_permanent` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_jailed_ip` (`ip_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. ADMIN OPERATIONS AUDIT LOGS
CREATE TABLE `admin_audit_logs` (
  `id` VARCHAR(64) NOT NULL,
  `actor` VARCHAR(100) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `resource` VARCHAR(100) NOT NULL,
  `details_json` LONGTEXT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- SEED DATA INSERTION
-- ====================================================================

-- CATEGORIES
INSERT INTO `categories` (`id`, `name`, `handle`, `description`, `hero_image`) VALUES
('cat_sofas', 'Sofas & Corner Lounges', 'sofas', 'Bespoke handcrafted sofas, deep-seated corner groups, and luxury chaises upholstered in durable bouclé and velvet.', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85'),
('cat_armchairs', 'Accent Armchairs & Stools', 'armchairs', 'Sculptural statement armchairs, reading chairs, and ergonomic occasional seating crafted for British comfort.', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=85'),
('cat_dining', 'Dining Tables & Chairs', 'dining', 'Solid European oak, American walnut, and Italian marble dining collections engineered for intimate family gatherings.', 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1600&q=85'),
('cat_beds', 'Luxury Beds & Wardrobes', 'beds', 'Ottoman storage beds, upholstered headboards, and solid hardwood wardrobes for serene bedroom sanctuaries.', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=85'),
('cat_living', 'Coffee & Occasional Tables', 'living-tables', 'Fluted wood, brushed brass, and architectural stone coffee, side, and console tables.', 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1600&q=85');

-- PRODUCTS
INSERT INTO `products` (`id`, `title`, `handle`, `subtitle`, `description`, `category_id`, `status`, `price_pennies`, `compare_at_price_pennies`, `vat_rate_percent`, `gtin_barcode`, `thumbnail_url`, `images_json`) VALUES
('prod_sofa_001', 'The Kensington 3-Seater Sofa in Oat Bouclé', 'kensington-3-seater-sofa-oat-boucle', 'Architectural profile with solid oak plinth and textured bouclé', 'The Kensington pairs deep proportions with sculptural contours. Features high-resilience foam wrapped in feather-down pocketing, delivering an exquisite lounging experience designed for modern British architecture.', 'cat_sofas', 'published', 129900, 149900, 20.00, '5060123456001', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85', '["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85","https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=85"]'),
('prod_sofa_002', 'The Belgravia Left-Hand Corner Group in Forest Velvet', 'belgravia-left-hand-corner-group-forest-velvet', 'Generous corner chaise wrapped in stain-resistant British velvet', 'Designed for expansive living rooms, the Belgravia corner group offers modular seating with plush padded bolsters and heavy-gauge serpentine springs.', 'cat_sofas', 'published', 219900, 249900, 20.00, '5060123456002', 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=85', '["https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=85","https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85"]'),
('prod_sofa_003', 'The Mayfair 2-Seater Loveseat in Natural Linen', 'mayfair-2-seater-loveseat-natural-linen', 'Compact tailored silhouette with Belgian washed linen slipcover', 'Ideal for townhouses and intimate bay windows, the Mayfair offers slender sloped arms, reversible down cushions, and a relaxed removable linen slipcover.', 'cat_sofas', 'published', 89900, NULL, 20.00, '5060123456003', 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=1200&q=85', '["https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=1200&q=85"]'),
('prod_chair_001', 'The Chelsea Bouclé Swivel Armchair', 'chelsea-boucle-swivel-armchair', '360-degree brushed brass swivel with cocooning curved silhouette', 'The Chelsea brings playful sculptural geometry into the living space. Upholstered in tactile curly wool bouclé with silent 360-degree rotation.', 'cat_armchairs', 'published', 49900, 59900, 20.00, '5060123456004', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85', '["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85"]'),
('prod_chair_002', 'The Knightsbridge Wingback Reading Chair', 'knightsbridge-wingback-reading-chair', 'Modern interpretation of the classic British fireside wing chair', 'Featuring hand-tufted lumbar cushioning, blackened steel stiletto legs, and buttery cognac aniline leather upholstery.', 'cat_armchairs', 'published', 74900, 84900, 20.00, '5060123456005', 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=85', '["https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=85"]'),
('prod_dining_001', 'The Windsor Solid European Oak 8-Seater Dining Table', 'windsor-solid-oak-8-seater-dining-table', 'Hand-finished 40mm solid European oak with chamfered live edge', 'Crafted from sustainable FSC-certified French oak. The 240cm table top rests upon architectural trestle legs with blackened iron tension rods.', 'cat_dining', 'published', 159900, 189900, 20.00, '5060123456006', 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=85', '["https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=85"]'),
('prod_dining_002', 'The Richmond Walnut Extending Dining Table', 'richmond-walnut-extending-dining-table', 'Seats 6 to 10 with concealed smooth butterfly extension mechanism', 'Rich American black walnut veneers with solid walnut perimeter banding. Smooth synchronized metal ball-bearing runner extends from 180cm to 260cm in seconds.', 'cat_dining', 'published', 179900, NULL, 20.00, '5060123456007', 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=1200&q=85', '["https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=1200&q=85"]'),
('prod_table_001', 'The Somerset Fluted Travertine Coffee Table', 'somerset-fluted-travertine-coffee-table', 'Honed Roman travertine with sculptural fluted cylindrical base', 'Cut from solid Italian beige travertine with natural unfilled pitting. A low-profile architectural focal point with matte protective sealant against spills.', 'cat_living', 'published', 64900, 74900, 20.00, '5060123456008', 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=85', '["https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=85"]');

-- FURNITURE SPECIFICATIONS
INSERT INTO `furniture_specs` (`id`, `product_id`, `width_cm`, `height_cm`, `depth_cm`, `seat_height_cm`, `seat_depth_cm`, `arm_height_cm`, `weight_kg`, `material`, `frame_material`, `color`, `assembly_required`, `assembly_time_mins`, `doorway_clearance_min_cm`, `delivery_tier`, `fire_safety_compliant`, `fire_safety_standard`, `fire_safety_cert`, `lead_time_days`) VALUES
('spec_sofa_001', 'prod_sofa_001', 218.00, 84.00, 98.00, 45.00, 64.00, 62.00, 68.00, 'boucle', 'solid_oak', 'Oat Cream', 0, NULL, 75.00, 'two_man_white_glove', 1, 'BS 5852: Part 1: 1979', 'BS-LON-2026-001', 7),
('spec_sofa_002', 'prod_sofa_002', 295.00, 82.00, 165.00, 44.00, 68.00, NULL, 110.00, 'velvet', 'engineered_hardwood', 'Forest Green', 1, 15, 72.00, 'two_man_white_glove', 1, 'BS 5852: Part 1: 1979', 'BS-LON-2026-002', 10),
('spec_sofa_003', 'prod_sofa_003', 165.00, 80.00, 92.00, 46.00, 58.00, 60.00, 46.00, 'linen', 'solid_oak', 'Natural Flax', 0, NULL, 70.00, 'two_man_white_glove', 1, 'BS 5852: Part 1: 1979', 'BS-LON-2026-003', 5),
('spec_chair_001', 'prod_chair_001', 82.00, 76.00, 80.00, 43.00, 56.00, 58.00, 24.00, 'boucle', 'steel', 'Chalk White', 0, NULL, 65.00, 'standard_parcel', 1, 'BS 5852: Part 1: 1979', 'BS-LON-2026-004', 3),
('spec_chair_002', 'prod_chair_002', 88.00, 102.00, 90.00, 47.00, 55.00, 64.00, 32.00, 'leather', 'solid_oak', 'Cognac Tan', 1, 10, 68.00, 'pallet', 1, 'BS 5852: Part 1: 1979', 'BS-LON-2026-005', 5),
('spec_dining_001', 'prod_dining_001', 240.00, 76.00, 100.00, NULL, NULL, NULL, 92.00, 'solid_oak', 'solid_oak', 'Natural Oiled Oak', 1, 25, 76.20, 'pallet', 1, 'BS 5852: Part 1: 1979', 'BS-LON-2026-006', 7),
('spec_dining_002', 'prod_dining_002', 180.00, 76.00, 95.00, NULL, NULL, NULL, 86.00, 'walnut', 'solid_oak', 'Smoked Walnut', 1, 20, 76.20, 'pallet', 1, 'BS 5852: Part 1: 1979', 'BS-LON-2026-007', 7),
('spec_table_001', 'prod_table_001', 110.00, 38.00, 110.00, NULL, NULL, NULL, 64.00, 'travertine', 'steel', 'Beige Travertine', 0, NULL, 70.00, 'pallet', 1, 'BS 5852: Part 1: 1979', 'BS-LON-2026-008', 5);

-- SUPPLIER DROPSHIP FEEDS
INSERT INTO `supplier_feed_items` (`id`, `supplier_id`, `supplier_sku`, `product_id`, `cost_price_pennies`, `shipping_cost_pennies`, `markup_percentage`, `retail_price_pennies`, `stock_level`, `lead_time_days`) VALUES
('supp_001', 'uk_craft_sofas', 'CRAFT-KEN-01', 'prod_sofa_001', 68000, 4500, 45.00, 129900, 14, 7),
('supp_002', 'uk_craft_sofas', 'CRAFT-BELG-02', 'prod_sofa_002', 118000, 6500, 48.00, 219900, 8, 10),
('supp_003', 'uk_craft_sofas', 'CRAFT-MAYF-03', 'prod_sofa_003', 46000, 3500, 52.00, 89900, 19, 5),
('supp_004', 'nordic_living_uk', 'NORD-CHEL-04', 'prod_chair_001', 25000, 1500, 55.00, 49900, 26, 3),
('supp_005', 'nordic_living_uk', 'NORD-KNIG-05', 'prod_chair_002', 39000, 3000, 50.00, 74900, 11, 5),
('supp_006', 'cotswold_timber', 'COTS-WIND-06', 'prod_dining_001', 82000, 5500, 52.00, 159900, 6, 7),
('supp_007', 'cotswold_timber', 'COTS-RICH-07', 'prod_dining_002', 94000, 5500, 50.00, 179900, 9, 7),
('supp_008', 'nordic_living_uk', 'NORD-SOME-08', 'prod_table_001', 34000, 4000, 50.00, 64900, 15, 5);

-- UK POSTCODE ZONES
INSERT INTO `postcode_zones` (`id`, `zone_code`, `zone_name`, `prefix_list`, `surcharge_pennies`, `lead_time_extra_days`, `is_active`) VALUES
('zone_001', 'mainland_uk', 'UK Mainland Standard Delivery', 'E,EC,N,NW,SE,SW,W,WC,BR,CR,DA,EN,HA,IG,KT,RM,SM,TW,UB,B,M,L,BS,CF,NE,LS,Sheffield,CB,OX', 0, 0, 1),
('zone_002', 'scottish_highlands', 'Scottish Highlands', 'IV,KW,PH,AB,PA', 4900, 3, 1),
('zone_003', 'scottish_islands', 'Scottish Offshore Islands', 'HS,ZE', 6900, 5, 1),
('zone_004', 'northern_ireland', 'Northern Ireland', 'BT', 5900, 4, 1),
('zone_005', 'channel_islands', 'Channel Islands & Isle of Man', 'GY,JE,IM', 6900, 5, 1);

-- SAMPLE ORDERS
INSERT INTO `orders` (`id`, `order_number`, `customer_name`, `customer_email`, `customer_phone`, `shipping_address`, `shipping_postcode`, `shipping_zone`, `delivery_tier`, `subtotal_pennies`, `shipping_pennies`, `vat_pennies`, `total_pennies`, `payment_status`, `fulfillment_status`, `stripe_payment_intent_id`) VALUES
('ord_001', 'ORD-SAN-9981', 'Eleanor Vance', 'eleanor.vance@mayfair.co.uk', '+44 7700 900123', 'Flat 4, 12 Kensington Palace Gardens', 'W8 4QP', 'mainland_uk', 'two_man_white_glove', 129900, 0, 21650, 129900, 'paid', 'po_dispatched', 'pi_test_uk_001'),
('ord_002', 'ORD-SAN-9982', 'Alistair Campbell', 'alistair.c@highland-estates.scot', '+44 7700 900456', 'Glenmoriston Lodge, Loch Ness Road', 'IV1 1AA', 'scottish_highlands', 'two_man_white_glove', 219900, 4900, 37467, 224800, 'paid', 'po_dispatched', 'pi_test_uk_002');

-- AUTOMATED PURCHASE ORDERS (PO)
INSERT INTO `order_po_dispatches` (`id`, `po_number`, `order_id`, `supplier_id`, `item_count`, `delivery_tier`, `status`, `tracking_number`, `carrier`) VALUES
('po_001', 'PO-SAN-2026-001', 'ord_001', 'uk_craft_sofas', 1, 'two_man_white_glove', 'dispatched', 'ARROW-XL-98214', 'ArrowXL 2-Man White Glove'),
('po_002', 'PO-SAN-2026-002', 'ord_002', 'uk_craft_sofas', 1, 'two_man_white_glove', 'dispatched', 'ARROW-XL-98215', 'ArrowXL 2-Man White Glove');

-- ADMIN AUDIT LOGS
INSERT INTO `admin_audit_logs` (`id`, `actor`, `action`, `resource`, `details_json`, `ip_address`) VALUES
('log_001', 'system_initializer', 'SEED_CATALOG', 'database/san_furniture', '{"tables_initialized": 9, "products_count": 8, "categories_count": 5}', '127.0.0.1'),
('log_002', 'ops_admin@sanfurniture.co.uk', 'INITIALIZE_MARGINS', 'margin_guard', '{"floor_margin_pct": 15, "default_markup_pct": 45}', '127.0.0.1');

-- COMPLETED SAN FURNITURE MYSQL SCHEMA & SEED
