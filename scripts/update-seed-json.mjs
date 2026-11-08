import fs from "fs";

const seedPath = "apps/storefront/src/lib/products-seed-data.json";
const data = JSON.parse(fs.readFileSync(seedPath, "utf8"));

let updated = 0;
const BATHROOM_IDS = new Set([
  "prod_live_am_2480rz",
  "prod_live_am_2483rz",
  "prod_live_am_2608rz",
  "prod_live_am_2609rz",
]);

data.products.forEach((p) => {
  if (BATHROOM_IDS.has(p.id)) {
    p.category_id = "cat_bathroom";
    updated++;
  }
});

fs.writeFileSync(seedPath, JSON.stringify(data, null, 2), "utf8");
console.log(`Updated ${updated} products in products-seed-data.json`);
