import mysql from "mysql2/promise";
import fs from "fs";

async function main() {
  const content = fs.readFileSync("apps/storefront/src/lib/cms-defaults.ts", "utf8");
  const match = content.match(/header_mega_menu:\s*\{[\s\S]*?\n  \},/);
  if (!match) throw new Error("No mega menu found in cms-defaults.ts");

  const objCode = "(" + match[0].replace(/^header_mega_menu:\s*/, "").replace(/,$/, "") + ")";
  const megaMenuData = eval(objCode);

  const conn = await mysql.createConnection("mysql://root:@127.0.0.1:3306/san_furniture");
  const [products] = await conn.execute("SELECT handle FROM products");
  const productHandles = new Set(products.map((p) => p.handle));

  const allHrefs = [];
  for (const tab of megaMenuData.content.tabs) {
    allHrefs.push(tab.href);
    if (tab.featured_promo?.cta_href) allHrefs.push(tab.featured_promo.cta_href);
    if (tab.featured_product?.href) allHrefs.push(tab.featured_product.href);
    for (const col of tab.columns) {
      for (const link of col.links) {
        allHrefs.push(link.href);
      }
    }
  }

  console.log(`Total links in Mega Menu: ${allHrefs.length}`);

  const brokenProductLinks = [];
  for (const href of allHrefs) {
    if (href.startsWith("/products/")) {
      const handle = href.replace("/products/", "").split("?")[0];
      if (!productHandles.has(handle)) {
        brokenProductLinks.push({ href, handle });
      }
    }
  }

  if (brokenProductLinks.length > 0) {
    console.log("Broken product links found:", brokenProductLinks);
  } else {
    console.log("All /products/... links in Mega Menu exist in the database!");
  }

  await conn.end();
}

main().catch(console.error);
