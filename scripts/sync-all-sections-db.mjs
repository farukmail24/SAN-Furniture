import mysql from "mysql2/promise";
import fs from "fs";

async function main() {
  const content = fs.readFileSync("apps/storefront/src/lib/cms-defaults.ts", "utf8");
  const conn = await mysql.createConnection("mysql://root:@127.0.0.1:3306/san_furniture");

  // Update header_mega_menu
  const megaMatch = content.match(/header_mega_menu:\s*\{[\s\S]*?\n  \},/);
  if (megaMatch) {
    const objCode = "(" + megaMatch[0].replace(/^header_mega_menu:\s*/, "").replace(/,$/, "") + ")";
    const megaMenuData = eval(objCode);
    await conn.execute(
      "UPDATE site_page_sections SET content_json = ?, updated_at = NOW() WHERE section_key = 'header_mega_menu'",
      [JSON.stringify(megaMenuData.content)]
    );
    console.log("Updated header_mega_menu in DB");
  }

  // Update home_curated_suite
  const curatedMatch = content.match(/home_curated_suite:\s*\{[\s\S]*?\n  \},/);
  if (curatedMatch) {
    const objCode = "(" + curatedMatch[0].replace(/^home_curated_suite:\s*/, "").replace(/,$/, "") + ")";
    const curatedData = eval(objCode);
    await conn.execute(
      "UPDATE site_page_sections SET content_json = ?, updated_at = NOW() WHERE section_key = 'home_curated_suite'",
      [JSON.stringify(curatedData.content)]
    );
    console.log("Updated home_curated_suite in DB");
  }

  await conn.end();
}

main().catch(console.error);
