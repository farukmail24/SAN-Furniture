-- =========================================================================
-- SAN FURNITURE: HEADER STICKY NAVIGATION & PDP CLEANUP SQL UPDATE
-- Run this script in phpMyAdmin -> SQL tab
-- =========================================================================

-- 1. Ensure site_page_sections table exists
CREATE TABLE IF NOT EXISTS `site_page_sections` (
  `id` varchar(64) NOT NULL,
  `page_key` varchar(64) NOT NULL,
  `section_key` varchar(64) NOT NULL,
  `section_name` varchar(128) NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `content_json` longtext NOT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `section_key` (`section_key`),
  KEY `idx_page_key` (`page_key`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Update or Insert Header Sticky Navigation Controls (is_sticky = true, sticky_behavior = 'always')
INSERT INTO `site_page_sections` (`id`, `page_key`, `section_key`, `section_name`, `is_enabled`, `sort_order`, `content_json`, `updated_at`)
VALUES (
  'sec_header_main',
  'header',
  'header_main',
  'Header Navigation & Sticky Controls',
  1,
  2,
  '{"is_sticky":true,"sticky_behavior":"always","hide_topbar_on_scroll":false,"search_placeholder":"Search sofas, solid oak dining, ottoman beds...","support_cta_label":"Concierge Help","hotline_label":"Direct Dispatch Line: +44 20 7946 0192","client_portal_label":"Client Account"}',
  NOW()
)
ON DUPLICATE KEY UPDATE
  `section_name` = 'Header Navigation & Sticky Controls',
  `is_enabled` = 1,
  `content_json` = '{"is_sticky":true,"sticky_behavior":"always","hide_topbar_on_scroll":false,"search_placeholder":"Search sofas, solid oak dining, ottoman beds...","support_cta_label":"Concierge Help","hotline_label":"Direct Dispatch Line: +44 20 7946 0192","client_portal_label":"Client Account"}',
  `updated_at` = NOW();

-- 3. Update PDP Value Badges (Remove 12-Month Guarantee from Product Detail Page)
INSERT INTO `site_page_sections` (`id`, `page_key`, `section_key`, `section_name`, `is_enabled`, `sort_order`, `content_json`, `updated_at`)
VALUES (
  'sec_pdp_value_badges',
  'product_detail',
  'pdp_value_badges',
  'Guarantees & Reassurance Badges',
  1,
  1,
  '{"badges":[{"icon":"Truck","title":"Free Mainland Delivery","subtitle":"Direct to your door within 15 days across Mainland UK","description":"Direct to your door within 15 days across Mainland UK"},{"icon":"ShieldCheck","title":"UK Quality Checked","subtitle":"Rigorous structural durability & quality inspection","description":"Rigorous structural durability & quality inspection"},{"icon":"CreditCard","title":"Secure Card Checkout","subtitle":"256-bit encrypted checkout via Stripe UK","description":"256-bit encrypted checkout via Stripe UK"}]}',
  NOW()
)
ON DUPLICATE KEY UPDATE
  `section_name` = 'Guarantees & Reassurance Badges',
  `is_enabled` = 1,
  `content_json` = '{"badges":[{"icon":"Truck","title":"Free Mainland Delivery","subtitle":"Direct to your door within 15 days across Mainland UK","description":"Direct to your door within 15 days across Mainland UK"},{"icon":"ShieldCheck","title":"UK Quality Checked","subtitle":"Rigorous structural durability & quality inspection","description":"Rigorous structural durability & quality inspection"},{"icon":"CreditCard","title":"Secure Card Checkout","subtitle":"256-bit encrypted checkout via Stripe UK","description":"256-bit encrypted checkout via Stripe UK"}]}',
  `updated_at` = NOW();
