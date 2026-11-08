import mysql from "mysql2/promise";

async function run() {
  const conn = await mysql.createConnection("mysql://root:@127.0.0.1:3306/san_furniture");
  const [rows] = await conn.execute(`
    SELECT id, handle, title, category_id 
    FROM products 
    WHERE LOWER(title) LIKE '%bathroom%' 
       OR LOWER(title) LIKE '%vanity%' 
       OR LOWER(title) LIKE '%sink%' 
       OR LOWER(title) LIKE '%kids%' 
       OR LOWER(title) LIKE '%child%' 
       OR LOWER(title) LIKE '%bunk%' 
       OR LOWER(title) LIKE '%cabin%'
  `);
  console.table(rows);
  await conn.end();
}

run().catch(console.error);
