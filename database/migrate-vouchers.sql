-- ========================================================
-- SAN FURNITURE: ADVANCED PROMOTIONS & VOUCHER MIGRATION
-- Run this in phpMyAdmin if auto-migration is delayed
-- ========================================================

-- 1. Create Voucher Redemptions Audit Table
CREATE TABLE IF NOT EXISTS `voucher_redemptions` (
  `id` VARCHAR(64) NOT NULL,
  `voucher_id` VARCHAR(36) NOT NULL,
  `voucher_code` VARCHAR(50) NOT NULL,
  `order_id` VARCHAR(64) NOT NULL,
  `customer_email` VARCHAR(255) NOT NULL,
  `discount_pennies` INT NOT NULL,
  `gross_order_pennies` INT NOT NULL DEFAULT 0,
  `redeemed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_voucher_code` (`voucher_code`),
  KEY `idx_customer_email` (`customer_email`),
  KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Add Missing Columns to Promotions Table
ALTER TABLE `promotions` 
  ADD COLUMN IF NOT EXISTS `starts_at` DATETIME NULL AFTER `is_active`,
  ADD COLUMN IF NOT EXISTS `expires_at` DATETIME NULL AFTER `starts_at`,
  ADD COLUMN IF NOT EXISTS `per_customer_limit` INT NOT NULL DEFAULT 1 AFTER `max_uses`,
  ADD COLUMN IF NOT EXISTS `first_order_only` TINYINT(1) NOT NULL DEFAULT 0 AFTER `per_customer_limit`,
  ADD COLUMN IF NOT EXISTS `max_discount_pennies` INT NULL AFTER `discount_value`;

-- 3. Add Missing Columns to Orders Table
ALTER TABLE `orders`
  ADD COLUMN IF NOT EXISTS `discount_pennies` INT NOT NULL DEFAULT 0 AFTER `subtotal_pennies`,
  ADD COLUMN IF NOT EXISTS `voucher_code` VARCHAR(50) DEFAULT NULL AFTER `discount_pennies`;

-- 4. Mark Welcome Voucher for First Orders
UPDATE `promotions` SET `first_order_only` = 1 WHERE `code` = 'WELCOME50';
