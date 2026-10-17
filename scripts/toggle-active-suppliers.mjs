import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "san_furniture",
};

async function toggleActiveSuppliers() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log(`[Suppliers] Updating active status in "${DB_CONFIG.database}"...`);

  // 1. Deactivate all suppliers EXCEPT Amos Mann Furniture and Furniture To Go
  const [deactRes] = await conn.query(`
    UPDATE suppliers 
    SET is_active = 0, sync_status = 'paused' 
    WHERE code NOT IN ('amos_mann_furniture', 'furniture_to_go')
  `);
  console.log(`✓ Deactivated / paused other suppliers (affected: ${deactRes.affectedRows})`);

  // 2. Ensure Amos Mann and Furniture To Go are active
  const [actRes] = await conn.query(`
    UPDATE suppliers 
    SET is_active = 1, sync_status = 'operational' 
    WHERE code IN ('amos_mann_furniture', 'furniture_to_go')
  `);
  console.log(`✓ Verified Amos Mann and Furniture To Go are active (affected: ${actRes.affectedRows})`);

  const [rows] = await conn.query("SELECT id, name, code, is_active, sync_status FROM suppliers ORDER BY is_active DESC, name ASC");
  console.log("\nCurrent Suppliers Status:");
  console.table(rows);

  await conn.end();
}

toggleActiveSuppliers().catch(err => {
  console.error("Error updating suppliers:", err);
  process.exit(1);
});
