import "../database/mysql-config.mjs";
import mysql from "mysql2/promise";
import crypto from "node:crypto";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "san_furniture",
};

async function migrateAdminAdvances() {
  const pool = mysql.createPool(DB_CONFIG);
  console.log(`[Migration] Connected to MySQL database "${DB_CONFIG.database}"...`);

  // 1. Create media_assets table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS media_assets (
      id VARCHAR(64) PRIMARY KEY,
      file_name VARCHAR(255) NOT NULL,
      file_url TEXT NOT NULL,
      file_size_bytes INT NOT NULL DEFAULT 0,
      mime_type VARCHAR(100) NOT NULL DEFAULT 'image/jpeg',
      width_px INT NOT NULL DEFAULT 1200,
      height_px INT NOT NULL DEFAULT 800,
      alt_text VARCHAR(255) NULL,
      category VARCHAR(50) NOT NULL DEFAULT 'product',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("✓ Verified `media_assets` table.");

  // Seed default high-quality media library items
  const mediaItems = [
    {
      id: "media_sofa_001",
      file_name: "kensington-grand-boucle-sofa-ivory.jpg",
      file_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1400&q=85",
      file_size_bytes: 382400,
      mime_type: "image/jpeg",
      width_px: 1400,
      height_px: 933,
      alt_text: "The Kensington Grand 3-Seater Sofa in Warm Ivory Bouclé",
      category: "sofas",
    },
    {
      id: "media_sofa_002",
      file_name: "belgravia-l-shape-modular-chaise.jpg",
      file_url: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1400&q=85",
      file_size_bytes: 421000,
      mime_type: "image/jpeg",
      width_px: 1400,
      height_px: 933,
      alt_text: "The Belgravia Deep Sectional Sofa in Slate Grey Wool",
      category: "sofas",
    },
    {
      id: "media_chair_001",
      file_name: "chelsea-statement-cocoon-armchair.jpg",
      file_url: "https://images.unsplash.com/photo-1580481077195-c999333a0b59?auto=format&fit=crop&w=1400&q=85",
      file_size_bytes: 298400,
      mime_type: "image/jpeg",
      width_px: 1400,
      height_px: 933,
      alt_text: "The Chelsea Curved Cocoon Armchair in Textured Bouclé",
      category: "armchairs",
    },
    {
      id: "media_table_001",
      file_name: "cotswold-solid-english-oak-dining-table.jpg",
      file_url: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=1400&q=85",
      file_size_bytes: 512000,
      mime_type: "image/jpeg",
      width_px: 1400,
      height_px: 933,
      alt_text: "The Cotswold Hand-Turned Solid English Oak Dining Table",
      category: "dining",
    },
    {
      id: "media_bed_001",
      file_name: "westminster-fluted-velvet-ottoman-bed.jpg",
      file_url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=85",
      file_size_bytes: 489000,
      mime_type: "image/jpeg",
      width_px: 1400,
      height_px: 933,
      alt_text: "The Westminster Fluted Velvet Ottoman Storage Bed King Size",
      category: "bedroom",
    },
    {
      id: "media_swatch_001",
      file_name: "fabric-swatch-heritage-boucle-ivory.jpg",
      file_url: "https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?auto=format&fit=crop&w=1000&q=80",
      file_size_bytes: 184000,
      mime_type: "image/jpeg",
      width_px: 1000,
      height_px: 1000,
      alt_text: "Heavyweight Bouclé Fabric Swatch - Warm Ivory",
      category: "swatches",
    },
    {
      id: "media_logo_light",
      file_name: "san-furniture-primary-logo.png",
      file_url: "/SanFurnitureLogo.png",
      file_size_bytes: 62352,
      mime_type: "image/png",
      width_px: 800,
      height_px: 240,
      alt_text: "SAN Furniture Official Logo (Light Backgrounds)",
      category: "branding",
    },
    {
      id: "media_logo_dark",
      file_name: "san-furniture-dark-mode-logo.png",
      file_url: "/San-Furniture-Logo-Dark.png",
      file_size_bytes: 61191,
      mime_type: "image/png",
      width_px: 800,
      height_px: 240,
      alt_text: "SAN Furniture Official Logo (Dark Navy)",
      category: "branding",
    },
  ];

  for (const m of mediaItems) {
    await pool.query(
      `INSERT INTO media_assets (id, file_name, file_url, file_size_bytes, mime_type, width_px, height_px, alt_text, category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE file_url = VALUES(file_url), category = VALUES(category);`,
      [m.id, m.file_name, m.file_url, m.file_size_bytes, m.mime_type, m.width_px, m.height_px, m.alt_text, m.category]
    );
  }
  console.log("✓ Seeded sample media library assets.");

  // 2. Seed additional admin staff users in `admin_users` table
  const defaultPassHash = hashPassword("Admin123!Secure");
  const staffMembers = [
    {
      id: "admin_usr_02",
      email: "sophie.mercer@sanfurniture.com",
      full_name: "Sophie Mercer",
      role: "catalog_manager",
      is_active: 1,
    },
    {
      id: "admin_usr_03",
      email: "james.holloway@sanfurniture.com",
      full_name: "James Holloway",
      role: "logistics_operator",
      is_active: 1,
    },
    {
      id: "admin_usr_04",
      email: "clara.oswald@sanfurniture.com",
      full_name: "Clara Oswald",
      role: "support_agent",
      is_active: 1,
    },
  ];

  for (const s of staffMembers) {
    await pool.query(
      `INSERT INTO admin_users (id, email, password_hash, full_name, role, is_active, last_login_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role = VALUES(role), is_active = VALUES(is_active);`,
      [s.id, s.email, defaultPassHash, s.full_name, s.role, s.is_active]
    );
  }
  console.log("✓ Seeded additional admin staff accounts in `admin_users`.");

  // 3. Seed additional UK customer buyers in `customers` table
  const customerPassHash = hashPassword("CustomerPass123!");
  const newCustomers = [
    {
      id: "cust_03",
      email: "oliver.twist@kensington.co.uk",
      first_name: "Oliver",
      last_name: "Twist",
      phone: "+44 7911 123456",
    },
    {
      id: "cust_04",
      email: "charlotte.bronte@edinburgh.ac.uk",
      first_name: "Charlotte",
      last_name: "Brontë",
      phone: "+44 7822 654321",
    },
    {
      id: "cust_05",
      email: "william.darcy@pemberley.co.uk",
      first_name: "William",
      last_name: "Darcy",
      phone: "+44 7733 987654",
    },
  ];

  for (const c of newCustomers) {
    await pool.query(
      `INSERT INTO customers (id, email, password_hash, first_name, last_name, phone, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name), phone = VALUES(phone);`,
      [c.id, c.email, customerPassHash, c.first_name, c.last_name, c.phone]
    );

    // Also seed default address
    await pool.query(
      `INSERT INTO customer_addresses (id, customer_id, address_line1, address_line2, city, postcode, county, is_default_delivery, created_at)
       VALUES (?, ?, '14 Berkeley Mews', 'Flat 2B', 'London', 'W1J 5AW', 'Greater London', 1, NOW())
       ON DUPLICATE KEY UPDATE postcode = VALUES(postcode);`,
      [`addr_${c.id}`, c.id]
    );
  }
  console.log("✓ Seeded additional customer CRM records in `customers`.");

  await pool.end();
  console.log("🎉 Admin Advances Migration complete!");
}

migrateAdminAdvances().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
