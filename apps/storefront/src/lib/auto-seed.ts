import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

function findSqlDump(): string {
  const candidates = [
    path.resolve(process.cwd(), "san_furniture.sql"),
    path.resolve(process.cwd(), "database/san_furniture.sql"),
    path.resolve(__dirname, "../../../../../san_furniture.sql"),
    path.resolve(__dirname, "../../../../../database/san_furniture.sql"),
    path.resolve(__dirname, "../../san_furniture.sql"),
    path.resolve(__dirname, "../san_furniture.sql"),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        const text = fs.readFileSync(c, "utf8");
        if (text.includes("CREATE TABLE") && text.includes("products")) {
          return text;
        }
      } catch {}
    }
  }
  return "";
}

/**
 * Non-destructive schema updater that adds missing tables or columns without dropping existing data
 */
async function ensureNonDestructiveSchema(connection: mysql.Connection): Promise<void> {
  try {
    // 0. Ensure products.sku column exists
    const [prodCols]: any = await connection.query("SHOW COLUMNS FROM `products` LIKE 'sku'").catch(() => [[]]);
    if (!prodCols || prodCols.length === 0) {
      await connection.query("ALTER TABLE `products` ADD COLUMN `sku` varchar(64) DEFAULT NULL AFTER `handle`").catch(() => {});
      await connection.query("ALTER TABLE `products` ADD KEY `idx_products_sku` (`sku`)").catch(() => {});
    }

    // 1. Ensure customer_payment_methods exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`customer_payment_methods\` (
        \`id\` varchar(64) NOT NULL,
        \`customer_id\` varchar(64) DEFAULT NULL,
        \`customer_email\` varchar(255) NOT NULL,
        \`brand\` varchar(32) DEFAULT 'Visa',
        \`last4\` varchar(4) NOT NULL,
        \`exp_month\` int(11) NOT NULL,
        \`exp_year\` int(11) NOT NULL,
        \`cardholder_name\` varchar(255) DEFAULT NULL,
        \`stripe_payment_method_id\` varchar(100) DEFAULT NULL,
        \`stripe_customer_id\` varchar(100) DEFAULT NULL,
        \`is_saved_for_future\` tinyint(1) DEFAULT 0,
        \`is_default\` tinyint(1) DEFAULT 1,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (\`id\`),
        KEY \`idx_cpm_email\` (\`customer_email\`),
        KEY \`idx_cpm_customer_id\` (\`customer_id\`),
        KEY \`idx_cpm_saved\` (\`customer_email\`,\`is_saved_for_future\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Ensure customer_password_resets exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`customer_password_resets\` (
        \`id\` varchar(36) NOT NULL,
        \`customer_id\` varchar(36) NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`token_hash\` varchar(255) NOT NULL,
        \`expires_at\` datetime NOT NULL,
        \`used_at\` datetime DEFAULT NULL,
        \`created_at\` datetime NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (\`id\`),
        KEY \`idx_cpr_token\` (\`token_hash\`),
        KEY \`idx_cpr_email\` (\`email\`),
        KEY \`idx_cpr_cust\` (\`customer_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Ensure orders cancellation columns exist
    const [cols]: any = await connection.query("SHOW COLUMNS FROM orders LIKE 'cancellation_reason'").catch(() => [[]]);
    if (!Array.isArray(cols) || cols.length === 0) {
      await connection.query(`
        ALTER TABLE \`orders\`
        ADD COLUMN \`cancellation_reason\` text DEFAULT NULL AFTER \`fulfillment_status\`,
        ADD COLUMN \`cancelled_by\` varchar(255) DEFAULT NULL AFTER \`cancellation_reason\`,
        ADD COLUMN \`cancelled_at\` datetime DEFAULT NULL AFTER \`cancelled_by\`
      `).catch(() => {});
    }
  } catch (err) {
    console.warn("[auto-seed] Non-destructive schema check error:", err);
  }
}

export async function autoSeedDatabaseIfNeeded(): Promise<boolean> {
  const rawHost = process.env.DB_HOST || "127.0.0.1";
  const host = rawHost.toLowerCase() === "localhost" ? "127.0.0.1" : rawHost;

  let connection: mysql.Connection | null = null;
  try {
    connection = await mysql.createConnection({
      host,
      port: Number.parseInt(process.env.DB_PORT || "3306", 10),
      user: process.env.DB_USERNAME || process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_DATABASE || process.env.DB_NAME || "san_furniture",
      multipleStatements: true,
    });

    // Check existing tables
    const [tableRows]: any = await connection.query("SHOW TABLES").catch(() => [[]]);
    const tableCount = Array.isArray(tableRows) ? tableRows.length : 0;

    if (tableCount > 0) {
      // Run non-destructive schema additions
      await ensureNonDestructiveSchema(connection);

      const [rows]: any = await connection
        .query("SELECT COUNT(*) as c FROM products")
        .catch(() => [[{ c: 0 }]]);

      const count = Number(rows?.[0]?.c ?? 0);
      if (count > 0) {
        return false; // Already populated
      }

      // Products table is empty, but other tables exist. Check if orders or customers exist.
      const [orderRows]: any = await connection.query("SELECT COUNT(*) as c FROM orders").catch(() => [[{ c: 0 }]]);
      const [custRows]: any = await connection.query("SELECT COUNT(*) as c FROM customers").catch(() => [[{ c: 0 }]]);
      const orderCount = Number(orderRows?.[0]?.c ?? 0);
      const custCount = Number(custRows?.[0]?.c ?? 0);

      if (orderCount > 0 || custCount > 0) {
        console.warn(`> Safety Guard: Database has live operational records (${orderCount} orders, ${custCount} customers). Will NOT drop tables.`);
        return false;
      }
    }

    console.log("> Database empty or missing tables. Auto-seeding from san_furniture.sql...");
    const sql = findSqlDump();
    if (!sql) {
      console.warn("> Could not locate san_furniture.sql to auto-seed.");
      return false;
    }

    await connection.query(sql);
    console.log("> Database auto-seeded successfully with all tables and catalog items!");
    return true;
  } catch (err) {
    console.warn("> Auto-seed check error:", err);
    return false;
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch {}
    }
  }
}
