import mysql from "mysql2/promise";
import { classifyFurnitureProduct } from "./test-classifier.mjs";

async function main() {
  const conn = await mysql.createConnection("mysql://root:@127.0.0.1:3306/san_furniture");
  const [products] = await conn.execute("SELECT id, title, category_id, description FROM products");

  let matchCount = 0;
  let diffCount = 0;
  const differences = [];

  for (const p of products) {
    const res = classifyFurnitureProduct({ title: p.title, description: p.description });
    if (res.categoryId === p.category_id) {
      matchCount++;
    } else {
      diffCount++;
      differences.push({
        id: p.id,
        title: p.title,
        currentCat: p.category_id,
        suggestedCat: res.categoryId,
        subType: res.subTypeId,
        reason: res.reason
      });
    }
  }

  console.log(`Classified ${products.length} products:`);
  console.log(`  Current matches classifier: ${matchCount}`);
  console.log(`  Differences detected: ${diffCount}`);

  console.log("\n--- DIFFERENCES ---");
  for (const d of differences) {
    console.log(`[${d.currentCat} -> ${d.suggestedCat}] (${d.subType}) : ${d.title}`);
  }

  await conn.end();
}

main().catch(console.error);
