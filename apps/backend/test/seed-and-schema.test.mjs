import test from "node:test";
import assert from "node:assert/strict";
import {
  SEED_CATEGORIES,
  SEED_FURNITURE_PRODUCTS,
  generateSeedSQL
} from "../dist/src/scripts/seed-furniture.js";
import {
  validateAllIndexPatterns,
  VERIFIED_INDEX_PATTERNS
} from "../dist/src/scripts/verify-query-indexes.js";
import { FurnitureSpecsSchema } from "@san-furniture/types";

test("Seed Data Integrity: Categories are properly defined", () => {
  assert.ok(SEED_CATEGORIES.length >= 5, "Must have at least 5 core furniture categories");
  for (const cat of SEED_CATEGORIES) {
    assert.ok(cat.id.startsWith("cat_"), `Category ID must start with cat_: ${cat.id}`);
    assert.ok(cat.handle.length > 2, `Category handle must be valid: ${cat.handle}`);
    assert.ok(cat.name.length > 3, `Category name must be valid: ${cat.name}`);
  }
});

test("Seed Products Schema: All products strictly validate against FurnitureSpecsSchema", () => {
  assert.ok(SEED_FURNITURE_PRODUCTS.length >= 20, "Should have a comprehensive seed product catalog");

  for (const product of SEED_FURNITURE_PRODUCTS) {
    // 1. Check product ID and prices
    assert.ok(product.id.startsWith("prod_"), `Invalid product ID format: ${product.id}`);
    assert.ok(Number.isInteger(product.pricePennies), `Price must be integer pennies: ${product.pricePennies}`);
    assert.ok(product.pricePennies > 0, `Price must be positive: ${product.pricePennies}`);
    assert.equal(product.vatRatePercent, 20.0, "Must be UK standard 20% VAT");

    // 2. Validate GTIN barcode (13 digits standard EAN)
    assert.match(product.gtinBarcode, /^\d{13}$/, `Product ${product.id} must have valid 13-digit UK GTIN barcode`);

    // 3. Validate Zod FurnitureSpecs schema
    const validationResult = FurnitureSpecsSchema.safeParse({
      dimensions: {
        width_cm: product.specs.width_cm,
        height_cm: product.specs.height_cm,
        depth_cm: product.specs.depth_cm,
        seat_height_cm: product.specs.seat_height_cm,
        seat_depth_cm: product.specs.seat_depth_cm,
        arm_height_cm: product.specs.arm_height_cm,
        weight_kg: product.specs.weight_kg,
        doorway_clearance_min_cm: product.specs.doorway_clearance_min_cm
      },
      packaged_boxes: [],
      material: product.specs.material,
      frame_material: product.specs.frame_material,
      color: product.specs.color,
      assembly_required: product.specs.assembly_required,
      assembly_time_mins: product.specs.assembly_time_mins,
      delivery_tier: product.specs.delivery_tier,
      fire_safety: product.specs.fire_safety,
      lead_time_days: product.specs.lead_time_days
    });

    assert.equal(
      validationResult.success,
      true,
      `Validation failed for ${product.id}: ${JSON.stringify(validationResult.error?.issues)}`
    );

    // 4. UK Furniture Fire Safety Regs 1988 Compliance check
    if (product.specs.material !== "none") {
      assert.equal(
        product.specs.fire_safety.compliant,
        true,
        `Upholstered item ${product.id} MUST be UK Fire Safety compliant`
      );
      assert.ok(
        product.specs.fire_safety.certificate_ref.length > 5,
        `Item ${product.id} must have a valid fire safety certificate reference`
      );
    }
  }
});

test("Database Indexing Architecture: ESR and partial indexes are verified", () => {
  assert.equal(validateAllIndexPatterns(), true);
  assert.equal(VERIFIED_INDEX_PATTERNS.length, 4);

  const esrFilterPattern = VERIFIED_INDEX_PATTERNS.find(
    (p) => p.targetIndex === "idx_products_cat_status_created_price"
  );
  assert.ok(esrFilterPattern);
  assert.deepEqual(esrFilterPattern.esrCompliance.equalityColumns, ["category_id", "status"]);
  assert.deepEqual(esrFilterPattern.esrCompliance.sortColumns, ["created_at DESC"]);
  assert.deepEqual(esrFilterPattern.esrCompliance.rangeColumns, ["price_pennies"]);
});

test("SQL Generator: Produces valid PostgreSQL migration statements", () => {
  const sql = generateSeedSQL();
  assert.ok(sql.includes("INSERT INTO product_categories"));
  assert.ok(sql.includes("INSERT INTO products"));
  assert.ok(sql.includes("INSERT INTO furniture_specs"));
  assert.ok(sql.includes("INSERT INTO supplier_feed_items"));
  assert.ok(sql.includes("cat_sofas"));
  assert.ok(sql.includes("kensington-3-seater-sofa-oat-boucle"));
});
