import "../database/mysql-config.mjs";
import mysql from "mysql2/promise";

const conn = await mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "san_furniture"
});

console.log("[Test] 1. Marking Venice Bedside as out_of_stock...");
await conn.query("UPDATE products SET status = 'out_of_stock' WHERE id = 'prod_live_am_2394rz'");
await fetch("http://localhost:9000/api/products/cache/invalidate", { method: "POST" });

const res1 = await fetch("http://localhost:9000/api/products").then((r) => r.json());
const isHidden = !res1.products.some((p) => p.id === "prod_live_am_2394rz");
console.log(`Storefront visible products: ${res1.products.length} (Venice Bedside is hidden: ${isHidden})`);

console.log("\n[Test] 2. Restoring Venice Bedside as published (in stock)...");
await conn.query("UPDATE products SET status = 'published' WHERE id = 'prod_live_am_2394rz'");
await fetch("http://localhost:9000/api/products/cache/invalidate", { method: "POST" });

const res2 = await fetch("http://localhost:9000/api/products").then((r) => r.json());
const isRestored = res2.products.some((p) => p.id === "prod_live_am_2394rz");
console.log(`Storefront visible products: ${res2.products.length} (Venice Bedside is restored: ${isRestored})`);

await conn.end();
