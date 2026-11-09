import test from "node:test";
import assert from "node:assert/strict";
import mysql from "mysql2/promise";
import {
  CATALOG_CATEGORIES,
  CATEGORY_HANDLE_ALIASES,
  normalizeCategoryHandle,
  getCategoryByHandle,
  FURNITURE_SUBTYPES,
  getCategorySubTypes,
  resolveSubType,
  productMatchesSubType
} from "@san-furniture/types";

test("Taxonomy Handle Aliases and Canonical Resolution", () => {
  assert.equal(normalizeCategoryHandle("beds"), "bedroom");
  assert.equal(normalizeCategoryHandle("living-tables"), "living-room");
  assert.equal(normalizeCategoryHandle("dining-room"), "dining");
  assert.equal(normalizeCategoryHandle("sofas-seating"), "sofas");
  assert.equal(normalizeCategoryHandle("bedroom"), "bedroom");
  assert.equal(normalizeCategoryHandle("living-room"), "living-room");
  assert.equal(normalizeCategoryHandle("dining"), "dining");
  assert.equal(normalizeCategoryHandle("sofas"), "sofas");
  assert.equal(normalizeCategoryHandle("armchairs"), "living-room");
  assert.equal(normalizeCategoryHandle("accent-armchairs"), "living-room");
  assert.equal(normalizeCategoryHandle("home-office"), "office");
  assert.equal(normalizeCategoryHandle("office"), "office");
  assert.equal(normalizeCategoryHandle("desks"), "office");
  assert.equal(normalizeCategoryHandle("kids"), "kids");
  assert.equal(normalizeCategoryHandle("children"), "kids");
  assert.equal(normalizeCategoryHandle("bathroom"), "bathroom");
  assert.equal(normalizeCategoryHandle("bathroom-furniture"), "bathroom");

  // getCategoryByHandle should resolve both new and legacy handles
  const armchairCat = getCategoryByHandle("armchairs");
  assert.ok(armchairCat);
  assert.equal(armchairCat.id, "cat_living");
  const bedroomCat = getCategoryByHandle("bedroom");
  const bedsCat = getCategoryByHandle("beds");
  assert.ok(bedroomCat);
  assert.ok(bedsCat);
  assert.equal(bedroomCat.id, "cat_beds");
  assert.equal(bedsCat.id, "cat_beds");

  const officeCat = getCategoryByHandle("office");
  const homeOfficeCat = getCategoryByHandle("home-office");
  assert.ok(officeCat);
  assert.ok(homeOfficeCat);
  assert.equal(officeCat.id, "cat_office");
  assert.equal(homeOfficeCat.id, "cat_office");

  const kidsCat = getCategoryByHandle("kids");
  assert.ok(kidsCat);
  assert.equal(kidsCat.id, "cat_kids");

  const bathCat = getCategoryByHandle("bathroom");
  assert.ok(bathCat);
  assert.equal(bathCat.id, "cat_bathroom");

  const livingCat = getCategoryByHandle("living-room");
  const livingTablesCat = getCategoryByHandle("living-tables");
  assert.ok(livingCat);
  assert.ok(livingTablesCat);
  assert.equal(livingCat.id, "cat_living");
  assert.equal(livingTablesCat.id, "cat_living");
});

test("Sub-Type Resolution & Aliases", () => {
  // Bedroom Sub-Types
  assert.equal(resolveSubType("cat_beds", "wardrobes")?.id, "wardrobes");
  assert.equal(resolveSubType("cat_beds", "wardrobe")?.id, "wardrobes");
  assert.equal(resolveSubType("cat_beds", "sliding-wardrobes")?.id, "sliding-wardrobes");
  assert.equal(resolveSubType("cat_beds", "sliding-wardrobe")?.id, "sliding-wardrobes");
  assert.equal(resolveSubType("cat_beds", "ottoman-beds")?.id, "ottoman-beds");

  assert.equal(resolveSubType("cat_beds", "chest-of-drawers")?.id, "chest-of-drawers");
  assert.equal(resolveSubType("cat_beds", "chest")?.id, "chest-of-drawers");
  assert.equal(resolveSubType("cat_beds", "drawers")?.id, "chest-of-drawers");

  assert.equal(resolveSubType("cat_beds", "bedside-tables")?.id, "bedside-tables");
  assert.equal(resolveSubType("cat_beds", "bedside")?.id, "bedside-tables");
  assert.equal(resolveSubType("cat_beds", "nightstand")?.id, "bedside-tables");

  assert.equal(resolveSubType("cat_beds", "storage-cupboards")?.id, "storage-cupboards");
  assert.equal(resolveSubType("cat_beds", "cupboard")?.id, "storage-cupboards");

  assert.equal(resolveSubType("cat_beds", "mirrors")?.id, "mirrors");
  assert.equal(resolveSubType("cat_beds", "mirror")?.id, "mirrors");

  // Living Room Seating & Accent Armchairs Sub-Types
  assert.equal(resolveSubType("cat_living", "armchairs")?.id, "armchairs");
  assert.equal(resolveSubType("cat_living", "swivel-chairs")?.id, "swivel-chairs");
  assert.equal(resolveSubType("cat_living", "lounge-chairs")?.id, "lounge-chairs");
  assert.equal(resolveSubType("cat_living", "fireside-chairs")?.id, "fireside-chairs");
  assert.equal(resolveSubType("cat_living", "stools-poufs")?.id, "stools-poufs");

  // Living Room Sub-Types

  assert.equal(resolveSubType("cat_living", "bookcases")?.id, "bookcases");
  assert.equal(resolveSubType("cat_living", "bookcase")?.id, "bookcases");
  assert.equal(resolveSubType("cat_living", "shelving")?.id, "bookcases");

  assert.equal(resolveSubType("cat_living", "tv-units")?.id, "tv-units");
  assert.equal(resolveSubType("cat_living", "tv")?.id, "tv-units");
  assert.equal(resolveSubType("cat_living", "media")?.id, "tv-units");

  assert.equal(resolveSubType("cat_living", "sideboards")?.id, "sideboards");
  assert.equal(resolveSubType("cat_living", "sideboard")?.id, "sideboards");

  assert.equal(resolveSubType("cat_living", "storage-cabinets")?.id, "storage-cabinets");
  assert.equal(resolveSubType("cat_living", "shoe")?.id, "storage-cabinets");

  // Dining Sub-Types
  assert.equal(resolveSubType("cat_dining", "dining-tables")?.id, "dining-tables");
  assert.equal(resolveSubType("cat_dining", "table")?.id, "dining-tables");
  assert.equal(resolveSubType("cat_dining", "dining-chairs")?.id, "dining-chairs");

  // Home Office Sub-Types
  assert.equal(resolveSubType("cat_office", "desks")?.id, "desks");
  assert.equal(resolveSubType("cat_office", "desk")?.id, "desks");
  assert.equal(resolveSubType("cat_office", "writing-desk")?.id, "writing-desks");
  assert.equal(resolveSubType("cat_office", "writing-desks")?.id, "writing-desks");
  assert.equal(resolveSubType("cat_office", "office-bookcases")?.id, "office-bookcases");

  // Bathroom Sub-Types
  assert.equal(resolveSubType("cat_bathroom", "vanity-units")?.id, "vanity-units");
  assert.equal(resolveSubType("cat_bathroom", "vanity")?.id, "vanity-units");
  assert.equal(resolveSubType("cat_bathroom", "bathroom-storage")?.id, "bathroom-storage");
  assert.equal(resolveSubType("cat_bathroom", "wall-cabinets")?.id, "wall-cabinets");

  // Kids Sub-Types
  assert.equal(resolveSubType("cat_kids", "kids-beds")?.id, "kids-beds");
  assert.equal(resolveSubType("cat_kids", "bunk-beds")?.id, "bunk-beds");
  assert.equal(resolveSubType("cat_kids", "bunk")?.id, "bunk-beds");
  assert.equal(resolveSubType("cat_kids", "kids-storage")?.id, "kids-storage");
  assert.equal(resolveSubType("cat_kids", "kids-desks")?.id, "kids-desks");
});

test("Database Published Products Sub-Type Coverage", async () => {
  const conn = await mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "san_furniture"
  });

  try {
    const [products] = await conn.execute(
      'SELECT id, title, handle, category_id FROM products WHERE status = "published"'
    );

    assert.ok(products.length >= 27, `Expected at least 27 published products, got ${products.length}`);

    let matchedCount = 0;
    for (const p of products) {
      const subTypes = getCategorySubTypes(p.category_id);
      const matched = subTypes.filter((sub) =>
        productMatchesSubType(
          {
            title: p.title,
            handle: p.handle,
            description: ""
          },
          sub
        )
      );

      if (matched.length > 0) {
        matchedCount++;
      } else {
        console.warn(`Unmatched product: [${p.category_id}] "${p.title}" (${p.handle})`);
      }
    }

    assert.equal(
      matchedCount,
      products.length,
      `All ${products.length} published products should match at least one sub-type`
    );
  } finally {
    await conn.end();
  }
});
