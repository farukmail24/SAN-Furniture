import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateNetAndVat,
  formatGBP,
  classifyUKPostcode,
  calculateRetailWithMarginGuard,
  FurnitureSpecsSchema,
  UKAddressSchema
} from "../dist/index.js";

test("UK VAT Engine: Calculates 20% VAT on gross integer pennies correctly", () => {
  // £600.00 (60000 pence) -> Net: £500.00 (50000), VAT: £100.00 (10000)
  const breakdown = calculateNetAndVat(60000);
  assert.equal(breakdown.grossPennies, 60000);
  assert.equal(breakdown.netPennies, 50000);
  assert.equal(breakdown.vatPennies, 10000);
  assert.equal(breakdown.vatRatePercentage, 20.0);
  assert.equal(breakdown.formattedGross, "£600.00");
  assert.equal(breakdown.formattedNet, "£500.00");
  assert.equal(breakdown.formattedVat, "£100.00");

  // Zero amount test
  const zeroBreakdown = calculateNetAndVat(0);
  assert.equal(zeroBreakdown.grossPennies, 0);
  assert.equal(zeroBreakdown.netPennies, 0);
  assert.equal(zeroBreakdown.vatPennies, 0);
});

test("Currency Formatter: Formats GBP pennies into UK currency string", () => {
  assert.equal(formatGBP(49900), "£499.00");
  assert.equal(formatGBP(125050), "£1,250.50");
  assert.equal(formatGBP(1000000), "£10,000.00");
  assert.equal(formatGBP(99), "£0.99");
});

test("Logistics: Classifies UK Postcodes into correct delivery surcharge zones", () => {
  // London / Mainland
  assert.equal(classifyUKPostcode("SW1A 1AA"), "zone_1_mainland");
  assert.equal(classifyUKPostcode("M1 1AE"), "zone_1_mainland");
  assert.equal(classifyUKPostcode("B1 1BB"), "zone_1_mainland");

  // Scottish Highlands
  assert.equal(classifyUKPostcode("IV1 1AA"), "zone_2_scottish_highlands");
  assert.equal(classifyUKPostcode("KW1 4YT"), "zone_2_scottish_highlands");
  assert.equal(classifyUKPostcode("PA34 4AB"), "zone_2_scottish_highlands");

  // Scottish Islands
  assert.equal(classifyUKPostcode("HS1 2XX"), "zone_3_scottish_islands");
  assert.equal(classifyUKPostcode("ZE1 0AA"), "zone_3_scottish_islands");

  // Northern Ireland
  assert.equal(classifyUKPostcode("BT1 5GS"), "zone_4_northern_ireland");

  // Channel Islands (Excluded from standard UK mainland service)
  assert.equal(classifyUKPostcode("GY1 1AA"), "zone_excluded");
  assert.equal(classifyUKPostcode("JE2 3RP"), "zone_excluded");
});

test("Dropshipping Margin Guard: Computes retail price and flags low margins", () => {
  // Supplier cost: £200.00 (20000p), Carriage: £20.00 (2000p) -> Total £220.00
  // Target 35% margin
  const result = calculateRetailWithMarginGuard(20000, 2000, 35.0, 20.0);
  assert.ok(result.retailGrossPennies > 22000);
  assert.ok(result.actualGrossMarginPercent >= 20.0);
  assert.equal(result.isBelowFloorMargin, false);
  assert.equal(result.alertTriggered, false);

  // If margin drops below floor (e.g. floor = 40% while target is 10%)
  const lowMarginResult = calculateRetailWithMarginGuard(20000, 2000, 10.0, 30.0);
  assert.equal(lowMarginResult.isBelowFloorMargin, true);
  assert.equal(lowMarginResult.alertTriggered, true);
});

test("Furniture Spec Schema: Validates realistic UK Sofa dimensions and fire safety", () => {
  const validSofa = {
    dimensions: {
      width_cm: 215.0,
      height_cm: 86.0,
      depth_cm: 94.0,
      seat_height_cm: 47.0,
      seat_depth_cm: 62.0,
      weight_kg: 64.0,
      doorway_clearance_min_cm: 75.0
    },
    packaged_boxes: [
      {
        box_number: 1,
        width_cm: 218.0,
        height_cm: 88.0,
        depth_cm: 96.0,
        weight_kg: 68.0
      }
    ],
    material: "boucle",
    frame_material: "solid_oak",
    color: "Warm Oat",
    assembly_required: false,
    delivery_tier: "two_man_white_glove",
    fire_safety: {
      compliant: true,
      standard: "BS 5852: Part 1: 1979",
      certificate_ref: "CERT-UK-2026-9921",
      label_attached: true
    },
    lead_time_days: 7
  };

  const parsed = FurnitureSpecsSchema.safeParse(validSofa);
  assert.equal(parsed.success, true);
});

test("UK Address Schema: Accepts valid UK postal formats and rejects malformed ones", () => {
  const validAddress = {
    recipient_name: "James Harrington",
    line_1: "Flat 4, Kensington Court",
    city: "London",
    postcode: "W8 5DL",
    country_code: "GB",
    phone: "07700900077"
  };

  const parsed = UKAddressSchema.safeParse(validAddress);
  assert.equal(parsed.success, true);

  const invalidAddress = {
    ...validAddress,
    postcode: "INVALID_POSTCODE_123"
  };
  const invalidParsed = UKAddressSchema.safeParse(invalidAddress);
  assert.equal(invalidParsed.success, false);
});
