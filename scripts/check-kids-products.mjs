import mysql from "mysql2/promise";
import fs from "fs";

async function main() {
  const pool = await mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "san_furniture",
    waitForConnections: true,
    connectionLimit: 5,
  });

  const [products] = await pool.query("SELECT id, title, handle, category_id, description FROM products");
  console.log(`Total products in DB: ${products.length}`);

  const possibleKids = products.filter((p) => {
    const text = (p.title + " " + p.description).toLowerCase();
    return (
      text.includes("kids") ||
      text.includes("child") ||
      text.includes("junior") ||
      text.includes("nursery") ||
      text.includes("bunk") ||
      text.includes("cabin bed") ||
      text.includes("mid sleeper") ||
      text.includes("midsleeper") ||
      text.includes("high sleeper")
    );
  });

  console.log("=== POSSIBLE KIDS PRODUCTS IN DB ===");
  possibleKids.forEach((p) => console.log(p.id, p.title, p.category_id));

  await pool.end();
}

main().catch(console.error);
