import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "san_furniture",
  });

  const [rows] = await conn.execute(`
    SELECT c.id, c.name, c.handle, COUNT(p.id) AS product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id, c.name, c.handle
    ORDER BY c.id ASC
  `);

  console.table(rows);
  await conn.end();
}

main().catch(console.error);
