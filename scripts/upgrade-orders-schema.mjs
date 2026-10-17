import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "san_furniture",
  });

  try {
    await conn.query("ALTER TABLE orders ADD COLUMN billing_address TEXT NULL");
    console.log("billing_address column added");
  } catch (e) {
    console.log("billing_address:", e.message);
  }

  try {
    await conn.query("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'card'");
    console.log("payment_method column added");
  } catch (e) {
    console.log("payment_method:", e.message);
  }

  const [cols] = await conn.query("DESCRIBE orders");
  console.log("Updated columns:", cols.map(c => c.Field));
  await conn.end();
}

main().catch(console.error);
