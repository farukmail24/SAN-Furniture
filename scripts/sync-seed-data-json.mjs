import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

async function main() {
  const conn = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "",
    database: "san_furniture",
  });

  const [products] = await conn.query("SELECT * FROM products ORDER BY id ASC");
  const [specs] = await conn.query("SELECT * FROM furniture_specs ORDER BY id ASC");

  const filePath = path.resolve("apps/storefront/src/lib/products-seed-data.json");
  fs.writeFileSync(filePath, JSON.stringify({ products, specs }, null, 2), "utf8");

  console.log(`Synced products-seed-data.json: ${(products).length} products, ${(specs).length} specs.`);
  await conn.end();
}

main().catch(console.error);
