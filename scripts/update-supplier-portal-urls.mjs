import "../database/mysql-config.mjs";
import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "san_furniture",
};

async function updateFeedUrls() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log(`[Suppliers] Updating B2B Trade Portal URLs...`);

  // Update Amos Mann Furniture feed_url to authentic Trade Portal
  await conn.query(`
    UPDATE suppliers 
    SET feed_url = 'https://www.amosmannfurniture.co.uk/drop-ship-service'
    WHERE code = 'amos_mann_furniture' OR id = 'sup_amos_mann'
  `);
  console.log("✓ Updated Amos Mann Furniture B2B portal URL.");

  // Update Furniture To Go feed_url to authentic Trade Portal
  await conn.query(`
    UPDATE suppliers 
    SET feed_url = 'https://furniture-to-go.co.uk/customer/account/login/'
    WHERE code = 'furniture_to_go' OR id = 'sup_furniture_to_go'
  `);
  console.log("✓ Updated Furniture To Go B2B portal URL.");

  const [rows] = await conn.query("SELECT id, name, code, feed_url FROM suppliers WHERE is_active = 1");
  console.table(rows);

  await conn.end();
}

updateFeedUrls().catch(err => {
  console.error("Error updating feed URLs:", err);
  process.exit(1);
});
