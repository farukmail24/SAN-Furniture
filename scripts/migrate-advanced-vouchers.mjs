import mysql from "mysql2/promise";

async function run() {
  const pool = mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "san_furniture",
    waitForConnections: true,
    connectionLimit: 5,
  });

  console.log("Running migration for advanced promotions & vouchers...");

  // 1. Alter promotions table
  const [promoCols] = await pool.query("DESCRIBE promotions");
  const existingPromoCols = new Set(promoCols.map((c) => c.Field));

  if (!existingPromoCols.has("starts_at")) {
    await pool.query("ALTER TABLE promotions ADD COLUMN starts_at DATETIME NULL AFTER is_active");
    console.log("✓ Added starts_at to promotions");
  }
  if (!existingPromoCols.has("expires_at")) {
    await pool.query("ALTER TABLE promotions ADD COLUMN expires_at DATETIME NULL AFTER starts_at");
    console.log("✓ Added expires_at to promotions");
  }
  if (!existingPromoCols.has("per_customer_limit")) {
    await pool.query("ALTER TABLE promotions ADD COLUMN per_customer_limit INT NOT NULL DEFAULT 1 AFTER max_uses");
    console.log("✓ Added per_customer_limit to promotions");
  }
  if (!existingPromoCols.has("first_order_only")) {
    await pool.query("ALTER TABLE promotions ADD COLUMN first_order_only TINYINT(1) NOT NULL DEFAULT 0 AFTER per_customer_limit");
    console.log("✓ Added first_order_only to promotions");
  }
  if (!existingPromoCols.has("max_discount_pennies")) {
    await pool.query("ALTER TABLE promotions ADD COLUMN max_discount_pennies INT NULL AFTER discount_value");
    console.log("✓ Added max_discount_pennies to promotions");
  }

  // 2. Alter orders table
  const [orderCols] = await pool.query("DESCRIBE orders");
  const existingOrderCols = new Set(orderCols.map((c) => c.Field));

  if (!existingOrderCols.has("discount_pennies")) {
    await pool.query("ALTER TABLE orders ADD COLUMN discount_pennies INT NOT NULL DEFAULT 0 AFTER subtotal_pennies");
    console.log("✓ Added discount_pennies to orders");
  }
  if (!existingOrderCols.has("voucher_code")) {
    await pool.query("ALTER TABLE orders ADD COLUMN voucher_code VARCHAR(50) DEFAULT NULL AFTER discount_pennies");
    console.log("✓ Added voucher_code to orders");
  }

  // 3. Create voucher_redemptions table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS voucher_redemptions (
      id VARCHAR(64) PRIMARY KEY,
      voucher_id VARCHAR(36) NOT NULL,
      voucher_code VARCHAR(50) NOT NULL,
      order_id VARCHAR(64) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      discount_pennies INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_voucher_redemptions_code (voucher_code),
      INDEX idx_voucher_redemptions_email (customer_email),
      INDEX idx_voucher_redemptions_order (order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("✓ voucher_redemptions table verified");

  // 4. Update WELCOME50 to have first_order_only = 1
  await pool.query("UPDATE promotions SET first_order_only = 1 WHERE code = 'WELCOME50'");
  console.log("✓ WELCOME50 updated with first_order_only = 1");

  await pool.end();
  console.log("Migration completed successfully!");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
