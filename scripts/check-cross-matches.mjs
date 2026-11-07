import mysql from "mysql2/promise";
import { FURNITURE_SUBTYPES, productMatchesSubType } from "../packages/types/dist/taxonomy.js";

async function main() {
  const conn = await mysql.createConnection("mysql://root:@127.0.0.1:3306/san_furniture");
  const [products] = await conn.execute("SELECT id, title, category_id, handle FROM products");

  const crossMatches = [];
  for (const p of products) {
    for (const st of FURNITURE_SUBTYPES) {
      if (st.categoryId !== p.category_id && productMatchesSubType(p, st)) {
        crossMatches.push({
          product: p.title,
          actualCat: p.category_id,
          matchedOtherCat: st.categoryId,
          otherSubType: st.id
        });
      }
    }
  }

  console.log("Total cross-category subtype false matches:", crossMatches.length);
  for (const cm of crossMatches) {
    console.log(`${cm.actualCat.padEnd(14)} -> ${cm.matchedOtherCat.padEnd(14)} [${cm.otherSubType.padEnd(18)}] : ${cm.product}`);
  }

  await conn.end();
}

main().catch(console.error);
