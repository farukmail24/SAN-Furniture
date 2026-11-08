import mysql from "mysql2/promise";

async function run() {
  const conn = await mysql.createConnection("mysql://root:@127.0.0.1:3306/san_furniture");
  const [rows] = await conn.execute(
    "SELECT id, handle, title, description FROM products WHERE description LIKE '%amos mann%' OR description LIKE '%furniture to go%' LIMIT 5"
  );
  for (const r of rows) {
    console.log("=== ID:", r.id, "HANDLE:", r.handle);
    console.log("DESC:", r.description);
    console.log("-----------------------------------------");
  }
  await conn.end();
}

run().catch(console.error);
