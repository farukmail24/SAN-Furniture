import mysql from "mysql2/promise";
import fs from "fs";

// Import the mega menu content from cms-defaults.ts using dynamic compilation or reading
async function run() {
  const cmsContent = fs.readFileSync("apps/storefront/src/lib/cms-defaults.ts", "utf8");
  const megaMatch = cmsContent.match(/header_mega_menu:\s*\{[\s\S]*?content:\s*(\{[\s\S]*?\n\s{4}\}),\n\s{2}\},/);

  if (!megaMatch) {
    console.error("Could not find header_mega_menu in cms-defaults.ts");
    process.exit(1);
  }

  // Parse the content object safely
  const contentSnippet = "const content = " + megaMatch[1] + "; export default content;";
  fs.writeFileSync("scripts/.temp-mega-menu.mjs", contentSnippet, "utf8");
  const { default: megaMenuData } = await import("./.temp-mega-menu.mjs");
  fs.unlinkSync("scripts/.temp-mega-menu.mjs");

  console.log(`Parsed ${megaMenuData.tabs.length} tabs for header_mega_menu:`);
  megaMenuData.tabs.forEach((t, i) => console.log(`  ${i + 1}. [${t.id}] ${t.label} -> ${t.href} (badge: ${t.badge || "none"})`));

  // 1. Update apps/backend/src/modules/content/default-sections.mjs
  const backendSectionsPath = "apps/backend/src/modules/content/default-sections.mjs";
  let backendContent = fs.readFileSync(backendSectionsPath, "utf8");
  const secStart = backendContent.indexOf('id: "sec_header_mega_menu",');
  const secEnd = backendContent.indexOf('id: "sec_home_hero",');

  if (secStart !== -1 && secEnd !== -1) {
    const replacement = `id: "sec_header_mega_menu",
    page_key: "header",
    section_key: "header_mega_menu",
    section_name: "Desktop & Mobile Mega Menu Navigation",
    is_enabled: 1,
    sort_order: 3,
    content_json: JSON.stringify(${JSON.stringify(megaMenuData, null, 6)}),
  },

  // ==========================================
  // 2. HOMEPAGE
  // ==========================================
  {
    `;
    const before = backendContent.substring(0, secStart);
    const after = backendContent.substring(secEnd);
    backendContent = before + replacement + after;
    fs.writeFileSync(backendSectionsPath, backendContent, "utf8");
    console.log("✓ Updated sec_header_mega_menu in apps/backend/src/modules/content/default-sections.mjs");
  } else {
    console.warn("Could not find delimiters in default-sections.mjs");
  }

  // 2. Update MySQL site_page_sections
  const pool = await mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "san_furniture",
    waitForConnections: true,
    connectionLimit: 5,
  });

  const [res] = await pool.query(
    `UPDATE site_page_sections
     SET content_json = ?, updated_at = NOW()
     WHERE section_key = 'header_mega_menu'`,
    [JSON.stringify(megaMenuData)]
  );
  console.log(`✓ Updated MySQL site_page_sections (affected: ${res.affectedRows})`);

  await pool.end();
}

run().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
