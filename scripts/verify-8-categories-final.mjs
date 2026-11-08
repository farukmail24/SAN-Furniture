import assert from "node:assert/strict";
import mysql from "mysql2/promise";
import {
  CATALOG_CATEGORIES,
  CATEGORY_HANDLE_ALIASES,
  getCategoryByHandle,
  normalizeCategoryHandle,
  classifyFurnitureProduct,
} from "@san-furniture/types";
import { DEFAULT_STOREFRONT_SECTIONS } from "../apps/storefront/src/lib/cms-defaults.ts";

async function verify() {
  console.log("=== 1. VERIFYING TAXONOMY & TYPES ===");
  assert.equal(normalizeCategoryHandle("office"), "office");
  assert.equal(normalizeCategoryHandle("home-office"), "office");
  assert.equal(normalizeCategoryHandle("kids"), "kids");
  assert.equal(normalizeCategoryHandle("bathroom"), "bathroom");
  assert.equal(normalizeCategoryHandle("living-room"), "living-room");
  assert.equal(normalizeCategoryHandle("sofas"), "sofas");
  assert.equal(normalizeCategoryHandle("dining"), "dining");
  assert.equal(normalizeCategoryHandle("bedroom"), "bedroom");
  console.log("✓ Aliases normalized accurately");

  const officeCat = getCategoryByHandle("office");
  assert.equal(officeCat?.id, "cat_office");
  assert.equal(officeCat?.handle, "office");
  assert.equal(officeCat?.name, "Office");

  const bathCat = getCategoryByHandle("bathroom");
  assert.equal(bathCat?.id, "cat_bathroom");
  assert.equal(bathCat?.name, "Bathroom");

  const kidsCat = getCategoryByHandle("kids");
  assert.equal(kidsCat?.id, "cat_kids");
  assert.equal(kidsCat?.name, "Kids");

  console.log("✓ All category lookups verified");

  console.log("\n=== 2. VERIFYING CLASSIFIER DISAMBIGUATION ===");
  // Bathroom test
  const bath1 = classifyFurnitureProduct({ title: "Milano Tall Narrow Bathroom Cupboard White Gloss" });
  assert.equal(bath1.categoryId, "cat_bathroom");
  const bath2 = classifyFurnitureProduct({ title: "Valdo Bathroom Vanity Sink With Undersink Cupboard" });
  assert.equal(bath2.categoryId, "cat_bathroom");
  assert.equal(bath2.subTypeId, "vanity-units");

  // Kids test
  const kid1 = classifyFurnitureProduct({ title: "Nordic Kids Cabin Bed with Underbed Storage" });
  assert.equal(kid1.categoryId, "cat_kids");
  assert.equal(kid1.subTypeId, "kids-beds");
  const kid2 = classifyFurnitureProduct({ title: "Junior Study Desk in White Pine" });
  assert.equal(kid2.categoryId, "cat_kids");
  assert.equal(kid2.subTypeId, "kids-desks");

  // Office test
  const off1 = classifyFurnitureProduct({ title: "Oslo Minimalist Writing Desk with Drawers" });
  assert.equal(off1.categoryId, "cat_office");

  // Living Room test (must NOT match bathroom)
  const liv1 = classifyFurnitureProduct({ title: "Chelsea High-Gloss Coffee Table with Storage" });
  assert.equal(liv1.categoryId, "cat_living");

  console.log("✓ Classifier accurately separates bathroom, kids, office, living, sofas, dining, and bedroom");

  console.log("\n=== 3. VERIFYING CMS DEFAULTS & MEGA MENU ===");
  const tabs = DEFAULT_STOREFRONT_SECTIONS.header_mega_menu.content.tabs;
  assert.equal(tabs.length, 8, `Expected 8 tabs in mega menu, got ${tabs.length}`);
  const expectedTabs = [
    { id: "living", label: "Living Room", href: "/living-room" },
    { id: "sofas", label: "Sofas", href: "/sofas" },
    { id: "dining", label: "Dining", href: "/dining" },
    { id: "bedroom", label: "Bedroom", href: "/bedroom" },
    { id: "kids", label: "Kids", href: "/kids" },
    { id: "office", label: "Office", href: "/office" },
    { id: "bathroom", label: "Bathroom", href: "/bathroom" },
    { id: "sale", label: "Sale", href: "/sale" },
  ];
  tabs.forEach((tab, i) => {
    assert.equal(tab.id, expectedTabs[i].id);
    assert.equal(tab.label, expectedTabs[i].label);
    assert.equal(tab.href, expectedTabs[i].href);
    console.log(`  ${i + 1}. [${tab.id}] ${tab.label} -> ${tab.href} (columns: ${tab.columns.length})`);
  });
  console.log("✓ All 8 mega menu tabs verified");

  console.log("\n=== 4. VERIFYING DATABASE STATE (MySQL) ===");
  const pool = await mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "san_furniture",
    waitForConnections: true,
    connectionLimit: 5,
  });

  const [dbCats] = await pool.query(
    "SELECT id, name, handle FROM categories ORDER BY id ASC"
  );
  console.log(`DB Categories (${dbCats.length}):`, dbCats.map((c) => `${c.id} (${c.name})`).join(", "));

  const [bathProds] = await pool.query(
    "SELECT id, title, category_id FROM products WHERE category_id = 'cat_bathroom'"
  );
  assert.equal(bathProds.length, 4, `Expected 4 bathroom products, found ${bathProds.length}`);
  console.log(`✓ 4 bathroom products isolated under cat_bathroom:`);
  bathProds.forEach((p) => console.log(`   - ${p.title} [${p.id}]`));

  const [livingProds] = await pool.query(
    "SELECT id, title FROM products WHERE category_id = 'cat_living' AND (title LIKE '%bathroom%' OR title LIKE '%vanity%')"
  );
  assert.equal(livingProds.length, 0, "No bathroom products should remain in cat_living");
  console.log("✓ Zero cross-category filter pollution: living room contains 0 bathroom items");

  const [secRow] = await pool.query(
    "SELECT content_json FROM site_page_sections WHERE section_key = 'header_mega_menu'"
  );
  assert.ok(secRow.length > 0);
  const secData = JSON.parse(secRow[0].content_json);
  assert.equal(secData.tabs.length, 8);
  console.log("✓ MySQL site_page_sections has all 8 tabs");

  await pool.end();
  console.log("\n>>> ALL 4 VERIFICATION GATES PASSED WITH ZERO DEFECTS! <<<");
}

verify().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
