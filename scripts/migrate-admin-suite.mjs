import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "san_furniture",
};

async function migrateAdminSuite() {
  const pool = mysql.createPool(DB_CONFIG);
  console.log(`[Migration] Connected to MySQL database "${DB_CONFIG.database}"...`);

  // 1. Create system_settings table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value TEXT NOT NULL,
      category VARCHAR(50) NOT NULL DEFAULT 'general',
      description VARCHAR(255) NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("✓ Verified `system_settings` table.");

  // Seed default system settings if empty
  const defaultSettings = [
    { key: "company_name", val: "SAN Furniture UK Ltd", cat: "legal", desc: "Registered UK Entity Name" },
    { key: "company_number", val: "14289123", cat: "legal", desc: "Companies House Registration" },
    { key: "vat_number", val: "GB 438 9123 76", cat: "legal", desc: "HMRC VAT Registration Number" },
    { key: "registered_address", val: "48 Grosvenor Square, Mayfair, London W1K 2HP, United Kingdom", cat: "legal", desc: "Official Registered Office" },
    { key: "support_email", val: "concierge@sanfurniture.co.uk", cat: "contact", desc: "Customer Support Email" },
    { key: "support_phone", val: "+44 (0) 20 7946 0912", cat: "contact", desc: "Customer Phone Line" },
    { key: "free_shipping_threshold_pennies", val: "50000", cat: "logistics", desc: "Free 2-Man delivery threshold (£500.00)" },
    { key: "standard_delivery_fee_pennies", val: "4900", cat: "logistics", desc: "Standard parcel / pallet rate (£49.00)" },
    { key: "white_glove_fee_pennies", val: "9900", cat: "logistics", desc: "Two-man white glove delivery fee (£99.00)" },
    { key: "highlands_surcharge_pennies", val: "4900", cat: "logistics", desc: "Scottish Highlands postcodes extra surcharge (£49.00)" },
    { key: "dropship_auto_dispatch", val: "true", cat: "dropshipping", desc: "Auto-send Purchase Order EDI to UK suppliers" },
    { key: "dropship_min_margin_percent", val: "30", cat: "dropshipping", desc: "Floor markup margin safeguard %" },
    { key: "stripe_enabled", val: "true", cat: "payment", desc: "Stripe UK Credit/Debit Cards gateway" },
    { key: "klarna_enabled", val: "true", cat: "payment", desc: "Klarna Pay in 3 / Financing gateway" },
    { key: "klarna_merchant_id", val: "K1482910_GB", cat: "payment", desc: "Klarna UK Merchant Account" },
    { key: "ip_jail_max_failures", val: "5", cat: "security", desc: "Failed attempts before IP lockout" },
    { key: "ip_jail_duration_mins", val: "15", cat: "security", desc: "Temporary IP jail lock duration in minutes" },
  ];

  for (const item of defaultSettings) {
    await pool.query(
      `INSERT INTO system_settings (setting_key, setting_value, category, description)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE description = VALUES(description);`,
      [item.key, item.val, item.cat, item.desc]
    );
  }
  console.log("✓ Seeded system settings defaults.");

  // 2. Create suppliers table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      location VARCHAR(150) NOT NULL,
      contact_name VARCHAR(100) NULL,
      contact_email VARCHAR(150) NOT NULL,
      contact_phone VARCHAR(50) NULL,
      feed_type VARCHAR(20) NOT NULL DEFAULT 'json',
      feed_url VARCHAR(255) NULL,
      lead_time_days INT NOT NULL DEFAULT 7,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      last_sync_at DATETIME NULL,
      sync_status VARCHAR(50) NOT NULL DEFAULT 'operational',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("✓ Verified `suppliers` table.");

  // Seed sample suppliers
  const sampleSuppliers = [
    {
      id: "sup_uk_craft",
      name: "UK Craft Sofas & Upholstery Works",
      code: "uk_craft_sofas",
      location: "Long Eaton, Nottinghamshire, UK",
      contact_name: "Edward Harrison (Works Director)",
      contact_email: "edi-dispatch@ukcraftsofas.co.uk",
      contact_phone: "+44 115 972 8810",
      feed_type: "json",
      feed_url: "https://api.ukcraftsofas.co.uk/v2/edi-stock.json",
      lead_time_days: 7,
      sync_status: "operational",
    },
    {
      id: "sup_nordic_living",
      name: "Nordic Living UK Importers",
      code: "nordic_living_uk",
      location: "Tilbury Docks Distribution Hub, Essex, UK",
      contact_name: "Astrid Lindholm (Logistics Head)",
      contact_email: "b2b-orders@nordiclivinguk.com",
      contact_phone: "+44 1375 852 400",
      feed_type: "csv",
      feed_url: "https://feeds.nordiclivinguk.com/stock-feed.csv",
      lead_time_days: 4,
      sync_status: "operational",
    },
    {
      id: "sup_cotswold_artisan",
      name: "Cotswold Solid Oak Joinery",
      code: "sup_cotswold",
      location: "Cirencester, Gloucestershire, UK",
      contact_name: "Arthur Pendelton (Master Joiner)",
      contact_email: "orders@cotswoldtimberwork.co.uk",
      contact_phone: "+44 1285 654 321",
      feed_type: "xml",
      feed_url: "https://cotswoldtimberwork.co.uk/edi/catalog.xml",
      lead_time_days: 14,
      sync_status: "operational",
    },
  ];

  for (const s of sampleSuppliers) {
    await pool.query(
      `INSERT INTO suppliers (id, name, code, location, contact_name, contact_email, contact_phone, feed_type, feed_url, lead_time_days, is_active, last_sync_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), location = VALUES(location), sync_status = VALUES(sync_status);`,
      [s.id, s.name, s.code, s.location, s.contact_name, s.contact_email, s.contact_phone, s.feed_type, s.feed_url, s.lead_time_days, s.sync_status]
    );
  }
  console.log("✓ Seeded sample UK dropship suppliers.");

  await pool.end();
  console.log("🎉 Admin Suite Migration complete!");
}

migrateAdminSuite().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
