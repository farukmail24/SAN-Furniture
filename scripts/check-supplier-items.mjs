import mysql from "mysql2/promise";

const conn = await mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "san_furniture"
});

const [rows] = await conn.query("SELECT id, supplier_sku, source_url, product_id FROM supplier_feed_items WHERE supplier_id = 'amos_mann_furniture'");
console.log(rows);
await conn.end();
