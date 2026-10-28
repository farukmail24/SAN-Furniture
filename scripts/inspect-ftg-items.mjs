import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "",
  database: "san_furniture",
});

async function main() {
  const [fCols] = await pool.query("DESCRIBE furniture_specs");
  console.log("furniture_specs columns:", fCols.map((c) => c.Field));

  const [pCols] = await pool.query("DESCRIBE products");
  console.log("products columns:", pCols.map((c) => c.Field));

  const [rows] = await pool.query(`
    SELECT p.id, p.title, p.sku, sup.supplier_sku, sup.supplier_id, sup.source_url
    FROM products p 
    LEFT JOIN supplier_feed_items sup ON p.id = sup.product_id 
    WHERE sup.supplier_id = 'furniture_to_go' OR p.id LIKE '%ftg%'
  `);
  console.log(`Found ${rows.length} FTG items:`);
  console.log(JSON.stringify(rows, null, 2));

  await pool.end();
}

main().catch(console.error);
