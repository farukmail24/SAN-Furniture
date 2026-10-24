-- ============================================================================
-- SAN FURNITURE: LATEST DATABASE UPDATE SCRIPT FOR PHPMYADMIN
-- Description: Adds delivery_options table, sets dynamic UK delivery policy,
--              ensures customer username column, without deleting existing data.
-- ============================================================================

-- 1. Ensure `username` column exists on `customers` table
SET @exist := (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'customers' 
    AND COLUMN_NAME = 'username'
);
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `customers` ADD COLUMN `username` varchar(100) DEFAULT NULL AFTER `email`', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Create `delivery_options` table if not exists
CREATE TABLE IF NOT EXISTS `delivery_options` (
  `id` varchar(64) NOT NULL,
  `name` varchar(150) NOT NULL,
  `badge` varchar(50) DEFAULT NULL,
  `price_pennies` int(11) NOT NULL DEFAULT 0,
  `description` text NOT NULL,
  `timeframe` varchar(100) NOT NULL DEFAULT '3 - 7 business days',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_del_opt_active_sort` (`is_active`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Populate default delivery options (Free Delivery Active, Paid Options Inactive)
INSERT INTO `delivery_options` (`id`, `name`, `badge`, `price_pennies`, `description`, `timeframe`, `is_active`, `sort_order`) 
VALUES
  ('del_opt_001', 'Free UK Mainland Delivery', 'FREE DELIVERY', 0, 'Complimentary room of choice delivery across mainland UK. Direct from SAN Central Distribution Hub with a 2-hour pre-delivery booking call.', '3 - 7 business days', 1, 1),
  ('del_opt_002', 'White Glove Delivery & Packaging Disposal', 'Assembly Included', 2900, 'Delivered into any room (up to 3rd floor). Full unboxing, inspection, item placement, and 100% eco-friendly packaging disposal & recycling.', '3 - 7 business days', 0, 2),
  ('del_opt_003', 'Priority Saturday / Weekend White Glove Delivery', 'Fastest Weekend Slot', 4900, 'Guaranteed Saturday delivery slot with priority loading at SAN Central Distribution Hub and live driver SMS GPS tracking.', 'Guaranteed Weekend Slot', 0, 3)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `badge` = VALUES(`badge`),
  `price_pennies` = VALUES(`price_pennies`),
  `description` = VALUES(`description`),
  `timeframe` = VALUES(`timeframe`),
  `is_active` = VALUES(`is_active`),
  `sort_order` = VALUES(`sort_order`);

-- 4. Insert or update latest UK delivery policy settings in `system_settings`
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `category`, `description`) 
VALUES
  ('delivery_policy_scope', 'mainland_only', 'logistics', 'Mainland UK only vs All UK delivery rule'),
  ('delivery_restricted_prefixes', 'IV, KW, PH, AB, PA, BT, HS, ZE, GY, JE, IM', 'logistics', 'Restricted UK non-mainland postcode prefixes'),
  ('delivery_non_serviceable_notice', 'We currently deliver exclusively to Mainland UK addresses. We are unable to fulfill orders to Northern Ireland, Scottish Highlands & Islands, or Channel Islands at this time. Please enter a valid Mainland UK delivery postcode.', 'logistics', 'Customer alert banner when non-mainland postcode is entered')
ON DUPLICATE KEY UPDATE 
  `setting_value` = VALUES(`setting_value`),
  `description` = VALUES(`description`);

-- 5. Update Header Claims, Phone Number, Positive Footer Copy & Stripe Card Trust Badges
UPDATE `system_settings` 
SET `setting_value` = '+44 20 7946 0192' 
WHERE `setting_key` = 'support_phone';

UPDATE `site_page_sections`
SET `content_json` = '{"delivery_claim":"UK Mainland Delivery Direct to Your Door","quality_claim":"UK Quality Checked • Free Mainland Delivery Within 15 Days","payment_claim":"Secure Card Payments","tax_claim":"Zero Hidden Fees","support_phone":"+44 20 7946 0192","show_support_phone":true,"banner_link":"/delivery"}'
WHERE `id` = 'sec_header_top_bar';

UPDATE `site_page_sections`
SET `content_json` = '{"search_placeholder":"Search sofas, solid oak dining, ottoman beds...","support_cta_label":"Concierge Help","hotline_label":"Direct Dispatch Line: +44 20 7946 0192","client_portal_label":"Client Account"}'
WHERE `id` = 'sec_header_main';

UPDATE `site_page_sections`
SET `content_json` = '{"pillars":[{"icon":"Truck","title":"UK Mainland Delivery","description":"Direct to your door across the UK Mainland."},{"icon":"RotateCcw","title":"Free Mainland Delivery","description":"Enjoy complimentary delivery across Mainland UK within 15 days."},{"icon":"Shield","title":"UK Quality Assured","description":"High-grade materials and rigorous structural quality testing for long-lasting home durability."},{"icon":"Sparkles","title":"Secure Card Payments","description":"Protected 256-bit SSL encrypted checkout accepting Visa, Mastercard, American Express and Maestro."}]}'
WHERE `id` = 'sec_footer_assurance';

UPDATE `site_page_sections`
SET `content_json` = '{"brand_bio":"Delivering bespoke craftsmanship, architectural aesthetics, and white-glove customer care straight to British homes.","support_title":"Customer Support (UK)","support_hours":"Monday – Friday: 09:00 – 18:00 GMT","support_email":"support@sanfurniture.com","support_phone":"+44 20 7946 0192","legal_note":"SAN Furniture Ltd • Registered in England & Wales • Timeless British Luxury & White-Glove Mainland Delivery"}'
WHERE `id` = 'sec_footer_brand_info';

UPDATE `site_page_sections`
SET `content_json` = '{"company_number":"","copyright_text":"© 2026 SAN Furniture. All rights reserved.","positive_copy":"SAN Furniture UK • Contemporary Home Living, Exceptional Quality & Free Mainland Delivery.","accepted_methods":["Visa","Mastercard","American Express","Maestro"]}'
WHERE `id` = 'sec_footer_payment_trust';

UPDATE `site_page_sections`
SET `content_json` = '{"cards":[{"title":"Direct-to-Door UK Delivery","description":"Specialist room-of-choice and pallet dispatch across Mainland UK.","badge":"Mainland UK"},{"title":"Rigorous UK Quality Standards","description":"Engineered for British living rooms with certified durability.","badge":"100% Tested"},{"title":"Free Mainland Delivery","description":"Complimentary direct delivery within 15 days across Mainland UK.","badge":"Free Delivery"},{"title":"Safe & Encrypted Checkout","description":"256-Bit SSL protected with Visa, Mastercard, American Express & Maestro.","badge":"SSL Encrypted"}]}'
WHERE `id` = 'sec_home_trust_strip';

UPDATE `site_page_sections`
SET `content_json` = '{"financing_headline":"Spread the cost with 0% APR options","financing_providers":"Klarna • Clearpay","vat_included_notice":"Transparent British Luxury. Zero hidden charges.","security_seal_text":"256-Bit Bank Grade SSL Encrypted Checkout"}'
WHERE `id` = 'sec_pdp_finance_perks';

UPDATE `site_page_sections`
SET `content_json` = '{"threshold_amount_gbp":500,"unqualified_message":"Free UK Mainland Delivery on all orders!","qualified_message":"You have unlocked Free UK White Glove Delivery!","vat_summary_label":"Inclusive Transparent UK Pricing"}'
WHERE `id` = 'sec_cart_threshold_banner';

UPDATE `site_page_sections`
SET `content_json` = '{"rating_score":"4.9/5 from 2,800+ UK Homeowners","trustpilot_badge":"Trustpilot Rated Excellent","headline_line1":"Bespoke Living,","headline_line2":"Handcrafted for Britain.","description":"Discover tactile textured bouclés, solid European white oak tables, and luxury gas-lift ottoman beds. Enjoy direct UK mainland delivery and premium craftsmanship straight to your home.","primary_cta_text":"Explore All Products","primary_cta_link":"/catalog","secondary_cta_text":"Shop By Room","secondary_cta_link":"#collection-grid","trust_items":[{"icon":"Truck","label":"UK Mainland Delivery"},{"icon":"ShieldCheck","label":"UK Quality Checked & Tested"},{"icon":"CreditCard","label":"Secure Card Checkout"}],"featured_badge":"Featured Masterpiece"}'
WHERE `id` = 'sec_home_hero';



