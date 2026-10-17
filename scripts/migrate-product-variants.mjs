import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "san_furniture",
};

async function migrate() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log(`[Migration] Connecting to database "${DB_CONFIG.database}"...`);

  const [cols] = await conn.query("SHOW COLUMNS FROM products LIKE 'variants_json'");
  if (cols.length === 0) {
    await conn.query("ALTER TABLE products ADD COLUMN variants_json LONGTEXT DEFAULT NULL AFTER images_json");
    console.log("✓ Added variants_json column to products table.");
  } else {
    console.log("✓ Column variants_json already exists.");
  }

  await conn.end();
}

migrate().catch(console.error);
