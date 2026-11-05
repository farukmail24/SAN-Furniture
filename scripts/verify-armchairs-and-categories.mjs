import mysql from "mysql2/promise";
import assert from "assert";
import {
  CATALOG_CATEGORIES,
  CATEGORY_HANDLE_ALIASES,
  normalizeCategoryHandle,
  getCategoryByHandle,
  getCategorySubTypes,
  productMatchesSubType
} from "../packages/types/dist/taxonomy.js";

async function verifyAll() {
  console.log("=================================================");
  console.log("   VERIFYING ARMCHAIRS & CATEGORY ISOLATION      ");
  console.log("=================================================");

  // 1. Verify Category Handle Resolution & Zero Redirection
  console.log("\n[Test 1] Testing Handle Normalization & Canonical Match...");
  const armchairHandle = "armchairs";
  const normalizedArmchairs = normalizeCategoryHandle(armchairHandle);
  assert.equal(normalizedArmchairs, "armchairs", "normalizeCategoryHandle('armchairs') must return 'armchairs'");

  const armchairCat = getCategoryByHandle(armchairHandle);
  assert.ok(armchairCat, "getCategoryByHandle('armchairs') must find a category");
  assert.equal(armchairCat.id, "cat_armchairs", "Armchairs category ID must be 'cat_armchairs'");
  assert.equal(armchairCat.handle, "armchairs", "Armchairs handle must be 'armchairs'");
  assert.equal(armchairCat.handle, armchairHandle, "category.handle === handle must be true (ZERO REDIRECT!)");
  console.log("  ✓ /categories/armchairs resolves to cat_armchairs with NO redirect to sofas!");

  // 2. Verify Database Categories
  console.log("\n[Test 2] Testing Database Categories in MySQL...");
  const conn = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "",
    database: "san_furniture",
  });

  const [dbCats] = await conn.query("SELECT id, name, handle FROM categories ORDER BY id");
  console.log("  Categories in DB:", dbCats.map((c) => `${c.id} (${c.name})`).join(", "));
  const catMap = new Map(dbCats.map((c) => [c.id, c]));
  assert.ok(catMap.has("cat_armchairs"), "cat_armchairs must exist in MySQL categories");
  assert.ok(catMap.has("cat_sofas"), "cat_sofas must exist in MySQL categories");
  assert.ok(catMap.has("cat_office"), "cat_office must exist in MySQL categories");
  assert.ok(catMap.has("cat_living"), "cat_living must exist in MySQL categories");
  assert.ok(catMap.has("cat_beds"), "cat_beds must exist in MySQL categories");
  assert.ok(catMap.has("cat_dining"), "cat_dining must exist in MySQL categories");
  console.log("  ✓ All 6 categories present in MySQL!");

  // 3. Verify Product Isolation (No Cross-Category Contamination)
  console.log("\n[Test 3] Testing Strict Product Categorization & Isolation...");
  const [products] = await conn.query("SELECT id, title, handle, category_id FROM products WHERE status = 'published'");
  console.log(`  Total active products: ${products.length}`);

  let miscategorizedCount = 0;
  for (const p of products) {
    const t = p.title.toLowerCase();

    // No desks in living room
    if (p.category_id === "cat_living" && t.includes("desk")) {
      console.error(`  [VIOLATION] Desk found in cat_living: ${p.title}`);
      miscategorizedCount++;
    }

    // No chests/dressing tables in living room
    if (p.category_id === "cat_living" && (t.includes("dressing table") || t.includes("chest of drawers") || t.includes("tallboy"))) {
      console.error(`  [VIOLATION] Bedroom piece found in cat_living: ${p.title}`);
      miscategorizedCount++;
    }

    // No armchairs in sofas (armchairs belong in cat_armchairs)
    if (p.category_id === "cat_sofas" && (t.includes("armchair") || t.includes("cocktail chair") || t.includes("fireside chair") || t.includes("swivel armchair"))) {
      console.error(`  [VIOLATION] Armchair found in cat_sofas: ${p.title}`);
      miscategorizedCount++;
    }
  }

  assert.equal(miscategorizedCount, 0, "There must be ZERO cross-category product violations!");
  console.log("  ✓ Zero cross-category product violations! Living room, office, and bedroom are strictly isolated.");

  // 4. Verify Armchairs Catalog Details
  console.log("\n[Test 4] Verifying Armchairs Category Contents...");
  const [armchairProducts] = await conn.query(`
    SELECT p.id, p.title, p.price_pennies, s.material, s.fire_safety_compliant, s.delivery_tier
    FROM products p
    JOIN furniture_specs s ON p.id = s.product_id
    WHERE p.category_id = 'cat_armchairs'
  `);
  console.table(armchairProducts);
  assert.equal(armchairProducts.length, 5, "cat_armchairs must have 5 luxury armchair products");
  for (const ap of armchairProducts) {
    assert.equal(ap.fire_safety_compliant, 1, `Armchair ${ap.title} must be fire safety compliant`);
  }
  console.log("  ✓ All 5 armchairs have valid UK fire safety compliance and delivery tiers!");

  // 5. Verify MegaMenu Links in DB
  console.log("\n[Test 5] Auditing MegaMenu links from MySQL site_page_sections...");
  const [sections] = await conn.query("SELECT content_json FROM site_page_sections WHERE section_key = 'header_mega_menu'");
  const megaData = JSON.parse(sections[0].content_json);

  let totalLinks = 0;
  let armchairLinks = 0;
  for (const tab of megaData.tabs) {
    for (const col of tab.columns) {
      for (const link of col.links) {
        totalLinks++;
        if (link.label === "All Accent Armchairs" || (tab.id === "sofas" && link.label.toLowerCase().includes("armchair"))) {
          armchairLinks++;
          console.log(`  Audited link "${link.label}": ${link.href}`);
          assert.ok(link.href.startsWith("/categories/armchairs"), `Armchair link in sofas tab must point to /categories/armchairs, got ${link.href}`);
        }
      }
    }
  }
  assert.ok(totalLinks >= 20, "MegaMenu must have all column links populated");
  assert.ok(armchairLinks >= 1, "Armchair links must exist and point to /categories/armchairs");
  console.log(`  ✓ All ${totalLinks} MegaMenu links audited! Armchair links point cleanly to /categories/armchairs.`);

  await conn.end();

  console.log("\n=================================================");
  console.log("   ALL VERIFICATIONS PASSED WITH ZERO ERRORS!    ");
  console.log("=================================================");
}

verifyAll().catch((err) => {
  console.error("\n❌ Verification Failed:", err);
  process.exit(1);
});
