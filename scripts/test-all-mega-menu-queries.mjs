import mysql from "mysql2/promise";
import {
  CATALOG_CATEGORIES,
  FURNITURE_SUBTYPES,
  getCategorySubTypes,
  resolveSubType,
  productMatchesSubType,
} from "@san-furniture/types";

async function main() {
  const conn = await mysql.createConnection("mysql://root:@127.0.0.1:3306/san_furniture");
  const [products] = await conn.execute(
    "SELECT id, title, handle, category_id, description FROM products"
  );
  await conn.end();

  console.log(`Testing all categories & sub-types against ${products.length} products:\n`);

  for (const cat of CATALOG_CATEGORIES) {
    const catProducts = products.filter((p) => p.category_id === cat.id);
    console.log(`=== ${cat.name} (${cat.handle}) - Total: ${catProducts.length} ===`);
    const subTypes = getCategorySubTypes(cat.id);

    for (const sub of subTypes) {
      const matches = catProducts.filter((p) =>
        productMatchesSubType(
          {
            title: p.title,
            handle: p.handle,
            categoryId: p.category_id,
            description: p.description,
          },
          sub
        )
      );

      // Also check if any products from OTHER categories falsely matched
      const otherMatches = products
        .filter((p) => p.category_id !== cat.id)
        .filter((p) =>
          productMatchesSubType(
            {
              title: p.title,
              handle: p.handle,
              categoryId: p.category_id,
              description: p.description,
            },
            sub
          )
        );

      console.log(
        `  - [${sub.id}] "${sub.label}": ${matches.length} products` +
          (otherMatches.length > 0 ? ` ⚠️ ${otherMatches.length} CROSS-CATEGORY POLLUTION!` : "")
      );
    }
    console.log("");
  }
}

main().catch(console.error);
