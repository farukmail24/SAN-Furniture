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

  const [categories] = await pool.query("SELECT id, name, handle FROM categories");
  console.log("=== CURRENT CATEGORIES IN DB ===");
  console.log(categories);

  const [bathProducts] = await pool.query(
    "SELECT id, title, handle, category_id FROM products WHERE title LIKE '%bathroom%' OR title LIKE '%vanity%' OR title LIKE '%sink%'"
  );
  console.log("=== BATHROOM/SINK PRODUCTS ===");
  console.log(bathProducts);

  const [kidsProducts] = await pool.query(
    "SELECT id, title, handle, category_id FROM products WHERE title LIKE '%kids%' OR title LIKE '%child%' OR title LIKE '%bunk%' OR title LIKE '%cabin bed%' OR title LIKE '%midsleeper%'"
  );
  console.log("=== KIDS PRODUCTS ===");
  console.log(kidsProducts);

  const [catCounts] = await pool.query(
    "SELECT category_id, COUNT(*) as cnt FROM products GROUP BY category_id"
  );
  console.log("=== PRODUCTS PER CATEGORY ===");
  console.log(catCounts);

  await pool.end();
}

main().catch(console.error);
