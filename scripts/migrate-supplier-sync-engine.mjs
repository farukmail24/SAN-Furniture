import "../database/mysql-config.mjs";
import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "san_furniture",
};

async function runMigration() {
  console.log("Connecting to MySQL...");
  const conn = await mysql.createConnection(DB_CONFIG);

  // 1. Create supplier_sync_logs table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS supplier_sync_logs (
      id varchar(64) NOT NULL,
      supplier_id varchar(100) NOT NULL,
      trigger_type enum('cron', 'manual', 'webhook') NOT NULL DEFAULT 'manual',
      items_scanned int(11) NOT NULL DEFAULT 0,
      prices_updated int(11) NOT NULL DEFAULT 0,
      stock_updated int(11) NOT NULL DEFAULT 0,
      status enum('success', 'partial', 'failed') NOT NULL DEFAULT 'success',
      duration_ms int(11) NOT NULL DEFAULT 0,
      diff_summary_json longtext DEFAULT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (id),
      KEY idx_sync_supplier (supplier_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("✓ Table supplier_sync_logs ready");

  // 2. Add source_url column to supplier_feed_items if not present
  const [cols] = await conn.query("SHOW COLUMNS FROM supplier_feed_items LIKE 'source_url'");
  if (cols.length === 0) {
    await conn.query("ALTER TABLE supplier_feed_items ADD COLUMN source_url VARCHAR(500) DEFAULT NULL AFTER product_id");
    console.log("✓ Added source_url column to supplier_feed_items");
  } else {
    console.log("✓ Column source_url already exists in supplier_feed_items");
  }

  // 3. Update source_url for existing live Amos Mann products
  const updates = [
    { sku: "2461", url: "https://www.amosmannfurniture.co.uk/madrid-sliding-door-wardrobe-120cm-gloss-white---2461-2461-p.asp" },
    { sku: "11008286", url: "https://www.amosmannfurniture.co.uk/valentina-white-220cm-sliding-wardrobe-with-mirror---11008286-3009-p.asp" },
    { sku: "2505", url: "https://www.amosmannfurniture.co.uk/zuldy-large-30-pairs-white-shoe-cupboard---2505-2505-p.asp" },
    { sku: "2607", url: "https://www.amosmannfurniture.co.uk/toris-sideboard-white-with-oak-effect---2607-2607-p.asp" },
    { sku: "2489", url: "https://www.amosmannfurniture.co.uk/kuba-artic-white-desk-with-drawers---2489-2489-p.asp" },
    { sku: "2394", url: "https://www.amosmannfurniture.co.uk/venice-alpine-white-bedside---2394-2394-p.asp" }
  ];

  for (const u of updates) {
    await conn.query(
      "UPDATE supplier_feed_items SET source_url = ? WHERE supplier_sku LIKE ? AND supplier_id = 'amos_mann_furniture'",
      [u.url, `%${u.sku}%`]
    );
  }
  console.log("✓ Updated source_url for active Amos Mann products");

  // 4. Update Amos Mann supplier settings in database
  await conn.query(`
    UPDATE suppliers 
    SET feed_type = 'live_scraper', 
        feed_url = 'https://www.amosmannfurniture.co.uk/sitemap.xml',
        sync_status = 'operational'
    WHERE code = 'amos_mann_furniture'
  `);
  console.log("✓ Updated Amos Mann supplier feed type to 'live_scraper'");

  // 5. Add default system settings for auto sync
  const settings = [
    ['amos_mann_auto_sync_enabled', 'true', 'dropshipping', 'Enable background automatic sync with Amos Mann live site'],
    ['amos_mann_sync_interval_hours', '6', 'dropshipping', 'Hours between automated live website extractions'],
    ['amos_mann_last_cron_run', new Date().toISOString(), 'dropshipping', 'Timestamp of last background extraction run']
  ];

  for (const [key, val, cat, desc] of settings) {
    await conn.query(`
      INSERT INTO system_settings (setting_key, setting_value, category, description, updated_at)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
    `, [key, val, cat, desc]);
  }
  console.log("✓ System settings for Amos Mann auto-sync initialized");

  await conn.end();
  console.log("Migration complete!");
}

runMigration().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
