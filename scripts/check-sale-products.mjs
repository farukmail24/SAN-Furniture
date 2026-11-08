import mysql from "mysql2/promise";

async function main() {
  const pool = await mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "san_furniture",
    waitForConnections: true,
    connectionLimit: 5,
  });

  const [rows] = await pool.query(
    "SELECT COUNT(*) as count FROM products WHERE compare_at_price_pennies > price_pennies"
  );
  console.log("Products with compare_at > price:", rows[0].count);

  const [samples] = await pool.query(
    "SELECT id, title, price_pennies, compare_at_price_pennies FROM products WHERE compare_at_price_pennies > price_pennies LIMIT 5"
  );
  console.log("Sample discounted products:", samples);

  await pool.end();
}

main().catch(console.error);
