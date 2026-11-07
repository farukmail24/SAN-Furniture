import fs from "fs";
import mysql from "mysql2/promise";

async function main() {
  const filePath = "apps/storefront/src/lib/cms-defaults.ts";
  let content = fs.readFileSync(filePath, "utf8");

  // Replace /categories/ with /
  content = content.replace(/"\/categories\//g, '"/');
  fs.writeFileSync(filePath, content, "utf8");
  console.log("Updated apps/storefront/src/lib/cms-defaults.ts with clean URLs!");

  // Now sync to site_page_sections in MySQL
  const match = content.match(/header_mega_menu:\s*\{[\s\S]*?\n  \},/);
  if (!match) throw new Error("header_mega_menu block not found");

  const objCode = "(" + match[0].replace(/^header_mega_menu:\s*/, "").replace(/,$/, "") + ")";
  const megaMenuData = eval(objCode);

  const conn = await mysql.createConnection("mysql://root:@127.0.0.1:3306/san_furniture");

  await conn.execute(
    `UPDATE site_page_sections 
     SET content_json = ?, updated_at = NOW() 
     WHERE section_key = 'header_mega_menu'`,
    [JSON.stringify(megaMenuData.content)]
  );

  console.log("Synced clean URLs to site_page_sections in MySQL database!");

  // Verify
  const [rows] = await conn.execute("SELECT content_json FROM site_page_sections WHERE section_key = 'header_mega_menu'");
  const parsed = JSON.parse(rows[0].content_json);
  console.log("Sample clean tab links:");
  for (const t of parsed.tabs) {
    console.log(` - ${t.label} -> ${t.href}`);
    if (t.columns?.[0]?.links?.[1]) {
      console.log(`     sublink -> ${t.columns[0].links[1].href}`);
    }
  }

  await conn.end();
}

main().catch(console.error);
