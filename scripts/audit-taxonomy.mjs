import fs from "fs";
import mysql from "mysql2/promise";
import { CATALOG_CATEGORIES, FURNITURE_SUBTYPES, getCategorySubTypes, resolveSubType, productMatchesSubType } from "../packages/types/dist/taxonomy.js";

async function main() {
  const content = fs.readFileSync("apps/storefront/src/lib/cms-defaults.ts", "utf8");
  const match = content.match(/header_mega_menu:\s*\{[\s\S]*?\n  \},/);
  if (!match) {
    console.error("Could not find header_mega_menu");
    return;
  }

  // Parse links from the block
  const lines = match[0].split("\n");
  const links = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.includes("href:")) {
      const href = l.match(/href:\s*"([^"]+)"/)?.[1];
      const label = lines[i - 1]?.match(/label:\s*"([^"]+)"/)?.[1] || "";
      if (href) links.push({ label, href });
    }
  }

  console.log("Total Mega Menu links found:", links.length);

  // Connect to DB
  const conn = await mysql.createConnection("mysql://root:@127.0.0.1:3306/san_furniture");
  const [products] = await conn.execute("SELECT id, title, handle, category_id, price_pennies, status FROM products");
  console.log("Total DB products:", products.length);

  // Group products by category
  const byCat = {};
  for (const p of products) {
    byCat[p.category_id] = byCat[p.category_id] || [];
    byCat[p.category_id].push(p);
  }

  console.log("\n--- AUDITING MEGA MENU CATEGORY & TYPE LINKS ---");
  for (const item of links) {
    const url = new URL(item.href, "https://sanfurniture.com");
    const path = url.pathname;
    const typeParam = url.searchParams.get("type");
    const styleParam = url.searchParams.get("style");
    const fabricParam = url.searchParams.get("fabric");
    const filterParam = url.searchParams.get("filter");

    // Check if it's a category page
    if (path.startsWith("/categories/")) {
      const handle = path.replace("/categories/", "");
      const cat = CATALOG_CATEGORIES.find(c => c.handle === handle || c.id === handle);
      if (!cat) {
        console.warn(`[BROKEN CATEGORY HANDLE] "${item.label}" -> ${item.href} (No category with handle: ${handle})`);
        continue;
      }

      const catProds = byCat[cat.id] || [];
      const subTypeParam = typeParam || styleParam;
      if (subTypeParam) {
        const resolved = resolveSubType(cat.id, subTypeParam);
        if (!resolved) {
          console.warn(`[UNRESOLVED SUBTYPE] "${item.label}" -> ${item.href} (Subtype "${subTypeParam}" not found in ${cat.id}!)`);
        } else {
          const matching = catProds.filter(p => productMatchesSubType(p, resolved));
          console.log(`[OK SUBTYPE] "${item.label}" (${item.href}) -> Cat: ${cat.id}, SubType: ${resolved.id}, Matches: ${matching.length} products`);
          if (matching.length === 0) {
            console.warn(`   -> WARNING: 0 products match this subtype in ${cat.id}!`);
          }
        }
      } else {
        console.log(`[OK CATEGORY] "${item.label}" (${item.href}) -> Cat: ${cat.id}, Total in Category: ${catProds.length}`);
      }
    } else if (path === "/catalog") {
      console.log(`[CATALOG ROOT] "${item.label}" (${item.href})`);
    } else if (path.startsWith("/products/")) {
      const handle = path.replace("/products/", "");
      const prod = products.find(p => p.handle === handle);
      if (!prod) {
        console.warn(`[BROKEN PRODUCT LINK] "${item.label}" -> ${item.href} (Handle not in DB: ${handle})`);
      } else {
        console.log(`[OK PRODUCT LINK] "${item.label}" -> ${item.href} (Prod ID: ${prod.id}, Cat: ${prod.category_id})`);
      }
    }
  }

  await conn.end();
}

main().catch(console.error);
