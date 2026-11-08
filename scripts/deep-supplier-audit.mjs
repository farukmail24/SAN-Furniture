import mysql from "mysql2/promise";
import fs from "fs";

async function main() {
  const conn = await mysql.createConnection("mysql://root:@127.0.0.1:3306/san_furniture");

  console.log("=== CHECKING PRODUCTS TABLE FOR SUPPLIER REFERENCES ===");
  const [prods] = await conn.execute(
    "SELECT id, handle, title, description, thumbnail_url, images_json FROM products"
  );

  let ekmcdnCount = 0;
  let ftgUrlCount = 0;
  let textMentionCount = 0;

  for (const p of prods) {
    const raw = `${p.title} ${p.description} ${p.thumbnail_url} ${p.images_json}`.toLowerCase();
    if (raw.includes("amosmann") || raw.includes("amos mann")) {
      textMentionCount++;
      console.log(`Product #${p.id} (${p.handle}) mentions amos mann`);
    }
    if (raw.includes("furniture-to-go") || raw.includes("furniture to go") || raw.includes("furnituretogo")) {
      textMentionCount++;
      console.log(`Product #${p.id} (${p.handle}) mentions furniture to go`);
    }
    if (raw.includes("ekmcdn.com/amosmann1")) {
      ekmcdnCount++;
    }
  }

  console.log(`Products mentioning supplier in text: ${textMentionCount}`);
  console.log(`Products with ekmcdn.com/amosmann1 image URLs: ${ekmcdnCount}`);

  await conn.end();
}

main().catch(console.error);
