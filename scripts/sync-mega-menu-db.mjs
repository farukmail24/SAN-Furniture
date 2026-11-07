import mysql from "mysql2/promise";
import fs from "fs";

async function main() {
  const content = fs.readFileSync("apps/storefront/src/lib/cms-defaults.ts", "utf8");
  const match = content.match(/header_mega_menu:\s*\{[\s\S]*?\n  \},/);
  if (!match) {
    throw new Error("Could not find header_mega_menu");
  }

  // Extract the JS object by evaluating the block safely
  const objCode = "(" + match[0].replace(/^header_mega_menu:\s*/, "").replace(/,$/, "") + ")";
  const megaMenuData = eval(objCode);

  const conn = await mysql.createConnection("mysql://root:@127.0.0.1:3306/san_furniture");

  await conn.execute(
    `UPDATE site_page_sections 
     SET content_json = ?, updated_at = NOW() 
     WHERE section_key = 'header_mega_menu'`,
    [JSON.stringify(megaMenuData.content)]
  );

  console.log("Successfully updated header_mega_menu in site_page_sections!");

  // Verify
  const [rows] = await conn.execute("SELECT content_json FROM site_page_sections WHERE section_key = 'header_mega_menu'");
  const parsed = JSON.parse(rows[0].content_json);
  console.log("Updated Tabs:", parsed.tabs.map(t => t.label));

  await conn.end();
}

main().catch(console.error);
