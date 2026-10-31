import { getDbPool } from "./db";

declare global {
  // eslint-disable-next-line no-var
  var __sanVoucherSchemaEnsured: boolean | undefined;
}

/**
 * Self-healing schema migrator for UK Promotions, Vouchers & Checkout.
 * Safely verifies and applies missing columns and tables to the active MySQL database.
 * Uses an in-memory memoization flag to prevent redundant DDL executions.
 */
export async function ensureVoucherSchema(force = false): Promise<{ success: boolean; changes: string[] }> {
  if (globalThis.__sanVoucherSchemaEnsured && !force) {
    return { success: true, changes: ["already_verified"] };
  }

  const pool = getDbPool();
  const changes: string[] = [];

  try {
    // 1. Verify or create voucher_redemptions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS voucher_redemptions (
        id VARCHAR(64) PRIMARY KEY,
        voucher_id VARCHAR(36) NOT NULL,
        voucher_code VARCHAR(50) NOT NULL,
        order_id VARCHAR(64) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        discount_pennies INT NOT NULL,
        gross_order_pennies INT NOT NULL DEFAULT 0,
        redeemed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_voucher_code (voucher_code),
        INDEX idx_customer_email (customer_email),
        INDEX idx_order_id (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    changes.push("voucher_redemptions_table_ready");

    // 2. Check and migrate promotions table columns
    const [promoColumns]: any = await pool.query("SHOW COLUMNS FROM promotions").catch(() => [[]]);
    const existingPromoCols = new Set(
      Array.isArray(promoColumns) ? promoColumns.map((c: any) => c.Field.toLowerCase()) : []
    );

    if (!existingPromoCols.has("starts_at")) {
      await pool.query("ALTER TABLE promotions ADD COLUMN starts_at DATETIME NULL AFTER is_active").catch(() => {});
      changes.push("added_starts_at");
    }
    if (!existingPromoCols.has("expires_at")) {
      await pool.query("ALTER TABLE promotions ADD COLUMN expires_at DATETIME NULL AFTER starts_at").catch(() => {});
      changes.push("added_expires_at");
    }
    if (!existingPromoCols.has("per_customer_limit")) {
      await pool.query("ALTER TABLE promotions ADD COLUMN per_customer_limit INT NOT NULL DEFAULT 1 AFTER max_uses").catch(() => {});
      changes.push("added_per_customer_limit");
    }
    if (!existingPromoCols.has("first_order_only")) {
      await pool.query("ALTER TABLE promotions ADD COLUMN first_order_only TINYINT(1) NOT NULL DEFAULT 0 AFTER per_customer_limit").catch(() => {});
      changes.push("added_first_order_only");
    }
    if (!existingPromoCols.has("max_discount_pennies")) {
      await pool.query("ALTER TABLE promotions ADD COLUMN max_discount_pennies INT NULL AFTER discount_value").catch(() => {});
      changes.push("added_max_discount_pennies");
    }

    // 3. Check and migrate orders table columns
    const [orderColumns]: any = await pool.query("SHOW COLUMNS FROM orders").catch(() => [[]]);
    const existingOrderCols = new Set(
      Array.isArray(orderColumns) ? orderColumns.map((c: any) => c.Field.toLowerCase()) : []
    );

    if (!existingOrderCols.has("discount_pennies")) {
      await pool.query("ALTER TABLE orders ADD COLUMN discount_pennies INT NOT NULL DEFAULT 0 AFTER subtotal_pennies").catch(() => {});
      changes.push("added_discount_pennies");
    }
    if (!existingOrderCols.has("voucher_code")) {
      await pool.query("ALTER TABLE orders ADD COLUMN voucher_code VARCHAR(50) DEFAULT NULL AFTER discount_pennies").catch(() => {});
      changes.push("added_voucher_code");
    }

    // 4. Ensure default seed vouchers exist if promotions table is empty
    const [existingCount]: any = await pool.query("SELECT COUNT(*) as count FROM promotions").catch(() => [[{ count: 1 }]]);
    if (existingCount?.[0]?.count === 0) {
      await pool.query(`
        INSERT INTO promotions (
          id, code, description, discount_type, discount_value, min_order_pennies,
          max_uses, usage_count, is_active, per_customer_limit, first_order_only, created_at
        ) VALUES 
        ('promo_welcome50', 'WELCOME50', 'Welcome to SAN: £50 off your first handcrafted order over £300', 'fixed_pennies', 5000, 30000, 1000, 0, 1, 1, 1, NOW()),
        ('promo_bankholiday20', 'BANKHOLIDAY20', 'Spring Bank Holiday Special: 20% off orders over £500', 'percentage', 20, 50000, 1000, 0, 1, 1, 0, NOW()),
        ('promo_luxury100', 'LUXURY100', 'Bespoke VIP Voucher: £100 off orders over £1,000', 'fixed_pennies', 10000, 100000, 1000, 0, 1, 1, 0, NOW())
      `).catch(() => {});
      changes.push("seeded_promotions");
    }

    globalThis.__sanVoucherSchemaEnsured = true;
    return { success: true, changes };
  } catch (err: any) {
    console.error("[ensureVoucherSchema] Migration error:", err?.message || err);
    return { success: false, changes: [err?.message || String(err)] };
  }
}
