import mysql from "mysql2/promise";

async function run() {
  const conn = await mysql.createConnection("mysql://root:@127.0.0.1:3306/san_furniture");
  const [rows] = await conn.execute("SELECT section_key, content_json FROM site_page_sections WHERE content_json LIKE '%amosmann%'");
  for (const r of rows) {
    console.log("=== SECTION:", r.section_key);
    const content = JSON.parse(r.content_json);
    const str = JSON.stringify(content, null, 2);
    const lines = str.split("\n").filter((l) => l.toLowerCase().includes("amosmann"));
    console.log(lines.join("\n"));
  }
  await conn.end();
}

run().catch(console.error);
